import { types as t } from "@marko/compiler";
import type { References } from "../util/references";
import {
  getSectionId,
  createSectionState,
  forEachSectionIdReverse,
} from "../util/sections";
import { Reserve, compareReserves } from "../util/reserve";
import * as sorted from "../util/sorted-arr";
import { currentProgramPath } from "../visitors/program";
import { callRuntime, callRead } from "./runtime";

interface ReferenceGroup {
  identifier: t.Identifier;
  references: References;
  statements: t.Statement[];
}

export type queueBuilder = (
  binding: Reserve,
  functionIdentifier: t.Identifier,
  targetSectionId: number
) => t.Expression;

const [getApply] = createSectionState<ReferenceGroup[]>("apply", () => []);
const [getHydrate] = createSectionState<ReferenceGroup[]>("hydrate", () => []);
const [getQueueBuilder, _setQueueBuilder] =
  createSectionState<queueBuilder>("queue");

export function setQueueBuilder(
  tag: t.NodePath<t.MarkoTag>,
  builder: queueBuilder
) {
  _setQueueBuilder(getSectionId(tag.get("body")), builder);
}

export function addStatement(
  type: "apply" | "hydrate",
  targetSectionId: number,
  references: References,
  statement: t.Statement | t.Statement[]
) {
  const { statements } = bindingToGroup(type, references, targetSectionId);
  const isNewGroup = statements.length === 0;

  if (Array.isArray(statement)) {
    statements.push(...statement);
  } else {
    statements.push(statement);
  }

  return isNewGroup ? 1 : 0;
}

export function bindingToApplyId(binding: Reserve, sectionId: number) {
  return bindingToGroup("apply", binding, sectionId).identifier;
}

function bindingToGroup(
  type: "apply" | "hydrate",
  references: References,
  sectionId: number
) {
  const groups = type === "apply" ? getApply(sectionId) : getHydrate(sectionId);
  const groupIndex = sorted.findIndex(compareReferenceGroups, groups, {
    references,
  } as ReferenceGroup);

  if (groupIndex === -1) {
    const identifier = t.identifier(
      generateReferenceGroupName(type, references)
    );
    const group = {
      identifier,
      references,
      statements: [],
    };
    sorted.insert(compareReferenceGroups, groups, group);
    return group;
  } else {
    return groups[groupIndex];
  }
}

export function writeAllStatementGroups() {
  forEachSectionIdReverse((sectionId) => {
    writeHydrateGroups(sectionId);
    writeApplyGroups(sectionId);
  });
}

export function writeApplyGroups(sectionId: number) {
  const groups = getApply(sectionId);
  for (let i = groups.length; i--; ) {
    const { identifier, references, statements } = groups[i];
    let params: (t.Identifier | t.RestElement | t.Pattern)[];
    let body: t.BlockStatement;

    if (references) {
      if (Array.isArray(references)) {
        params = references.map((binding) =>
          t.assignmentPattern(
            t.identifier(binding.name),
            callRead(binding, sectionId)
          )
        );
        body = t.blockStatement(statements);

        for (const binding of references) {
          i += addStatement(
            "apply",
            sectionId,
            binding,
            t.expressionStatement(
              // TODO: might need to queue in a child scope
              callRuntime("queue", identifier, t.numericLiteral(binding.id))
            )
          );
        }
      } else if (references.sectionId !== sectionId) {
        params = [
          t.assignmentPattern(
            t.identifier(references.name),
            callRead(references, sectionId)
          ),
        ];
        body = t.blockStatement(statements);

        const factory = getQueueBuilder(sectionId);
        if (factory) {
          i += addStatement(
            "apply",
            references.sectionId,
            references,
            t.expressionStatement(factory(references, identifier, sectionId))
          );
        }
      } else {
        const param = t.identifier(references.name);
        params = [param];
        body = t.blockStatement([
          t.ifStatement(
            callRuntime("write", t.numericLiteral(references.id), param),
            statements.length === 1
              ? statements[0]
              : t.blockStatement(statements)
          ),
        ]);
      }
    } else {
      params = [];
      body = t.blockStatement(statements);
    }

    const [result] = currentProgramPath.pushContainer(
      "body",
      t.functionDeclaration(identifier, params, body)
    );

    if (references) {
      // result.scope.crawl();
      result.traverse(bindFunctionsVisitor, { root: result, sectionId });
    }
  }
}

export function writeHydrateGroups(sectionId: number) {
  const groups = getHydrate(sectionId);
  for (let i = groups.length; i--; ) {
    const { identifier, references, statements } = groups[i];
    const params = references
      ? (Array.isArray(references) ? references : [references]).map((binding) =>
          t.assignmentPattern(
            t.identifier(binding.name),
            callRead(binding, sectionId)
          )
        )
      : [];

    currentProgramPath.pushContainer(
      "body",
      t.functionDeclaration(identifier, params, t.blockStatement(statements))
    );

    i += addStatement(
      "apply",
      sectionId,
      references,
      t.expressionStatement(t.callExpression(identifier, []))
    );
  }
}

/**
 * reference group priority is sorted by number of references,
 * then if needed by reference order.
 */
function compareReferenceGroups(
  { references: a }: ReferenceGroup,
  { references: b }: ReferenceGroup
) {
  if (a) {
    if (b) {
      if (Array.isArray(a)) {
        if (Array.isArray(b)) {
          const len = a.length;
          const lenDelta = len - b.length;
          if (lenDelta !== 0) {
            return lenDelta;
          }

          for (let i = 0; i < len; i++) {
            const compareResult = compareReserves(a[i], b[i]);
            if (compareResult !== 0) {
              return compareResult;
            }
          }

          return 0;
        } else {
          return 1;
        }
      } else if (Array.isArray(b)) {
        return -1;
      } else {
        return compareReserves(a, b);
      }
    } else {
      return 1;
    }
  } else {
    return b ? -1 : 0;
  }
}

function generateReferenceGroupName(
  type: "apply" | "hydrate",
  references: References
) {
  let name = type;

  if (references) {
    if (Array.isArray(references)) {
      name += "With";
      for (const ref of references) {
        name += `_${ref.name}`;
      }
    } else {
      name += `_${references.name}`;
    }
  }

  return currentProgramPath.scope.generateUid(name);
}

const bindFunctionsVisitor: t.Visitor<{
  root: t.NodePath<any>;
  sectionId: number;
}> = {
  FunctionExpression: bindFunction,
  ArrowFunctionExpression: bindFunction,
};

function bindFunction(
  fn: t.NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
  { root, sectionId }: { root: t.NodePath<any>; sectionId: number }
) {
  const { node } = fn;
  const { extra } = node;
  const references = extra?.references;
  if (references) {
    const program = fn.hub.file.path;
    const id = program.scope.generateUidIdentifier(extra.name);

    if (node.body.type !== "BlockStatement") {
      node.body = t.blockStatement([t.returnStatement(node.body)]);
    }

    node.body.body.unshift(
      t.variableDeclaration(
        "const",
        (Array.isArray(references) ? references : [references]).map((binding) =>
          t.variableDeclarator(
            t.identifier(binding.name),
            callRead(binding, sectionId)
          )
        )
      )
    );

    root.insertBefore(
      t.variableDeclaration("const", [t.variableDeclarator(id, node)])
    );

    fn.replaceWith(callRuntime("bind", id));
  }
}

export function getDefaultApply(sectionId: number) {
  const [firstApply] = getApply(sectionId);
  const defaultApply =
    firstApply && !firstApply.references && firstApply.identifier;
  return defaultApply || t.nullLiteral();
}
