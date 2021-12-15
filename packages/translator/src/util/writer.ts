import { types as t } from "@marko/compiler";
import {
  compareReferences,
  References,
  Binding,
} from "../analyze/util/references";
import type { Reserve } from "../analyze/util/reserves";
import * as sorted from "../util/sorted-arr";
import { isOutputHTML } from "./marko-config";
import { callRuntime } from "./runtime";
import toTemplateOrStringLiteral from "./to-template-string-or-literal";

export enum WalkCodes {
  Get = 32,
  Before = 33,
  After = 35,
  Inside = 36,
  Replace = 37,
  Close = 38,

  Skip = 40,
  SkipEnd = 46,

  Open = 47,
  OpenEnd = 66,

  Next = 67,
  NextEnd = 91,

  Over = 97,
  OverEnd = 106,

  Out = 107,
  OutEnd = 116,

  Multiplier = 117,
  MultiplierEnd = 126,
}

export enum WalkRangeSizes {
  Skip = 7, // 40 through 46
  Open = 20, // 47 through 66
  Next = 20, // 67 through 91
  Over = 10, // 97 through 106
  Out = 10, // 107 through 116
  Multiplier = 10, // 117 through 126
}

enum Step {
  enter,
  exit,
}

interface ReferenceGroup {
  identifier: t.Identifier;
  references: References;
  statements: t.Statement[];
}

interface Section {
  parent: Section | undefined;
  apply: ReferenceGroup[];
  hydrate: ReferenceGroup[];
  writes: (string | t.Expression)[];
  walks: (string | t.Expression)[];
  steps: Step[];
}

type VisitCodes =
  | WalkCodes.Get
  | WalkCodes.Before
  | WalkCodes.After
  | WalkCodes.Inside
  | WalkCodes.Replace;

export function start(path: t.NodePath<any>) {
  const parent = path.state.section;
  if (parent && isOutputHTML(path)) {
    flushBefore(path);
  }

  path.state.section = {
    parent,
    apply: [],
    hydrate: [],
    writes: [""],
    walks: [""],
    steps: [],
  } as Section;
}

export function end(path: t.NodePath<any>) {
  const section = path.state.section as Section;
  visit(path);

  if (isOutputHTML(path)) {
    flushInto(path);
  } else {
    writeApplyGroups(path, section.apply);
    writeHydrateGroups(path, section.hydrate);
  }

  path.state.section = section.parent;
  return {
    apply: section.apply[0]?.identifier,
    walks: toTemplateOrStringLiteral(section.walks),
    writes: toTemplateOrStringLiteral(section.writes),
  };
}

export function enter(path: t.NodePath<any>) {
  (path.state.section as Section).steps.push(Step.enter);
}

export function exit(path: t.NodePath<any>) {
  (path.state.section as Section).steps.push(Step.exit);
}

export function enterShallow(path: t.NodePath<any>) {
  (path.state.section as Section).steps.push(Step.enter, Step.exit);
}

export function injectWalks(path: t.NodePath<any>, expr: t.Expression) {
  (path.state.section as Section).walks.push(expr, "");
}

export function visit(
  path: t.NodePath<t.MarkoTag | t.MarkoPlaceholder>,
  code?: VisitCodes
) {
  const { visitIndex } = path.node.extra;
  if (visitIndex !== undefined) {
    const section = path.state.section as Section;
    if (isOutputHTML(path)) {
      section.writes.push(
        callRuntime(path, "markScopeOffset", t.numericLiteral(visitIndex))
      );
    } else {
      let walkString = "";

      if (section.steps.length) {
        const walks: WalkCodes[] = [];
        let depth = 0;

        for (const step of section.steps) {
          if (step === Step.enter) {
            depth++;
            walks.push(WalkCodes.Next);
          } else {
            depth--;
            if (depth >= 0) {
              // delete back to and including previous NEXT
              walks.length = walks.lastIndexOf(WalkCodes.Next);
              walks.push(WalkCodes.Over);
            } else {
              // delete back to previous OUT
              walks.length = walks.lastIndexOf(WalkCodes.Out) + 1;
              walks.push(WalkCodes.Out);
              depth = 0;
            }
          }
        }

        let current = walks[0];
        let count = 0;

        for (const walk of walks) {
          if (walk !== current) {
            walkString += nCodeString(current, count);
            current = walk;
            count = 1;
          } else {
            count++;
          }
        }

        walkString += nCodeString(current, count);
        section.steps = [];
      }

      if (code !== undefined) {
        walkString += String.fromCharCode(code);
      }

      section.walks[section.walks.length - 1] += walkString;
    }
  }

  return visitIndex;
}

export function writeTo(path: t.NodePath<any>) {
  return (
    strs: TemplateStringsArray,
    ...exprs: Array<string | t.Expression>
  ): void => {
    const exprsLen = exprs.length;
    const { writes } = path.state.section as Section;
    writes[writes.length - 1] += strs[0];

    for (let i = 0; i < exprsLen; i++) {
      writes.push(exprs[i], strs[i + 1]);
    }
  };
}

export function consumeHTML(path: t.NodePath<any>) {
  const section = path.state.section as Section;
  const result = toTemplateOrStringLiteral(section.writes);
  section.writes = [""];

  if (result) {
    return t.expressionStatement(callRuntime(path, "write", result));
  }
}

export function hasPendingHTML(
  path: t.NodePath<t.MarkoTag> | t.NodePath<t.Program>
) {
  const section = path.state.section as Section;
  return Boolean(section.writes.length > 1 || section.writes[0]);
}

export function flushBefore(path: t.NodePath<any>) {
  const expr = consumeHTML(path);
  if (expr) {
    path.insertBefore(expr)[0].skip();
  }
}

export function flushInto(
  path: t.NodePath<t.MarkoTag> | t.NodePath<t.Program>
) {
  const expr = consumeHTML(path);
  if (expr) {
    if (path.isMarkoTag()) {
      path.get("body").pushContainer("body", expr)[0].skip();
    } else {
      path.pushContainer("body", expr)[0].skip();
    }
  }
}

export function addStatement(
  type: "apply" | "hydrate",
  path: t.NodePath<any>,
  references: References,
  statement: t.Statement | t.Statement[]
) {
  const section = path.state.section as Section;
  const groups = section[type];
  const groupIndex = sorted.findIndex(compareReferenceGroups, groups, {
    references,
  } as ReferenceGroup);

  if (groupIndex === -1) {
    const identifier = t.identifier(
      generateReferenceGroupName(type, path, references)
    );
    sorted.insert(compareReferenceGroups, groups, {
      identifier,
      references,
      statements: Array.isArray(statement) ? statement : [statement],
    });

    if (type === "hydrate") {
      addStatement(
        "apply",
        path,
        references,
        t.expressionStatement(t.callExpression(identifier, []))
      );
    }

    if (Array.isArray(references)) {
      for (const binding of references) {
        addStatement(
          type,
          path,
          binding,
          t.expressionStatement(
            callRuntime(
              path,
              "queue",
              identifier,
              t.numericLiteral(bindingToScopeId(path, binding))
            )
          )
        );
      }
    }
  } else {
    const group = groups[groupIndex];

    if (Array.isArray(statement)) {
      group.statements = group.statements.concat(statement);
    } else {
      group.statements.push(statement);
    }
  }
}

export function getApplyId(path: t.NodePath<any>, binding: Binding) {
  const section = path.state.section as Section;
  const groupIndex = sorted.findIndex(compareReferenceGroups, section.apply, {
    references: [binding],
  } as ReferenceGroup);

  if (groupIndex === -1) {
    const identifier = t.identifier(
      generateReferenceGroupName("apply", path, binding)
    );
    sorted.insert(compareReferenceGroups, section.apply, {
      identifier,
      references: binding,
      statements: [],
    });
    return identifier;
  } else {
    return section.apply[groupIndex]!.identifier;
  }
}

function writeApplyGroups(path: t.NodePath<any>, groups: ReferenceGroup[]) {
  const program = path.hub.file.path;
  for (const { identifier, references, statements } of groups) {
    let params: (t.Identifier | t.RestElement | t.Pattern)[];
    let body: t.BlockStatement;

    if (references) {
      if (Array.isArray(references)) {
        params = references.map((binding) =>
          t.assignmentPattern(
            t.identifier(binding.name),
            callRuntime(
              path,
              "read",
              t.numericLiteral(bindingToScopeId(path, binding))
            )
          )
        );
        body = t.blockStatement(statements);
      } else {
        const param = t.identifier(references.name);
        params = [param];
        body = t.blockStatement([
          t.ifStatement(
            callRuntime(
              path,
              "write",
              t.numericLiteral(bindingToScopeId(path, references)),
              param
            ),
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

    const [result] = program.pushContainer(
      "body",
      t.functionDeclaration(identifier, params, body)
    );

    result.traverse(bindFunctionsVisitor, { root: result });
  }
}

function writeHydrateGroups(path: t.NodePath<any>, groups: ReferenceGroup[]) {
  const program = path.hub.file.path;
  for (const { identifier, references, statements } of groups) {
    const params = references
      ? (Array.isArray(references) ? references : [references]).map((binding) =>
          t.assignmentPattern(
            t.identifier(binding.name),
            callRuntime(
              path,
              "read",
              t.numericLiteral(bindingToScopeId(path, binding))
            )
          )
        )
      : [];

    program.pushContainer(
      "body",
      t.functionDeclaration(identifier, params, t.blockStatement(statements))
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
            const compareResult = compareReferences(a[i], b[i]);
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
        return compareReferences(a, b);
      }
    } else {
      return 1;
    }
  } else {
    return b ? -1 : 0;
  }
}

function nCodeString(code: WalkCodes, number: number) {
  switch (code) {
    case WalkCodes.Next:
      return toCharString(number, code, WalkRangeSizes.Next);
    case WalkCodes.Over:
      return toCharString(number, code, WalkRangeSizes.Over);
    case WalkCodes.Out:
      return toCharString(number, code, WalkRangeSizes.Out);
    case WalkCodes.Open:
      return toCharString(number, code, WalkRangeSizes.Open);
    case WalkCodes.Skip:
      return toCharString(number, code, WalkRangeSizes.Skip);
  }
}

function toCharString(number: number, startCode: number, rangeSize: number) {
  let result = "";

  if (number >= rangeSize) {
    const multiplier = Math.floor(number / rangeSize);
    result += toCharString(
      multiplier,
      WalkCodes.Multiplier,
      WalkRangeSizes.Multiplier
    );
    number -= multiplier * rangeSize;
  }

  result += String.fromCharCode(startCode + number);
  return result;
}

export function bindingToScopeId(
  path: t.NodePath<any>,
  { sectionIndex, bindingIndex }: Binding
) {
  return (
    path.hub.file.path.node.extra.sections![sectionIndex].visits + bindingIndex
  );
}

export function reserveToScopeId(
  path: t.NodePath<any>,
  { sectionIndex, reserveIndex }: Reserve
) {
  const section = path.hub.file.path.node.extra.sections![sectionIndex];
  return section.visits + section.bindings + reserveIndex;
}

function generateReferenceGroupName(
  type: "apply" | "hydrate",
  path: t.NodePath,
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

  return path.hub.file.path.scope.generateUid(name);
}

const bindFunctionsVisitor: t.Visitor<{ root: t.NodePath<any> }> = {
  FunctionExpression: bindFunction,
  ArrowFunctionExpression: bindFunction,
};

function bindFunction(
  fn: t.NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
  state: { root: t.NodePath<any> }
) {
  const { node } = fn;
  const { extra } = node;
  const references = extra?.references;
  if (references) {
    const program = fn.hub.file.path;
    const id = program.scope.generateUidIdentifier(extra.name);
    fn.replaceWith(callRuntime(fn, "bind", id));
    state.root.insertBefore(
      t.variableDeclaration("const", [t.variableDeclarator(id, node)])
    );
  }
}
