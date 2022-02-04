import { types as t } from "@marko/compiler";
import { getSectionId, createSectionState } from "../util/sections";
import { isOutputHTML } from "./marko-config";
import { callRuntime } from "./runtime";
import toTemplateOrStringLiteral, {
  appendLiteral,
} from "./to-template-string-or-literal";
import { getWalkString } from "./walks";
import { getDefaultApply } from "./apply-hydrate";

const [getRenderer] = createSectionState<t.Identifier>("renderer", () =>
  t.identifier("")
);

export { getRenderer };

const [getWrites] = createSectionState<(string | t.Expression)[]>(
  "writes",
  () => [""]
);

export function writeTo(path: t.NodePath<any>) {
  const sectionId = getSectionId(path);
  return (
    strs: TemplateStringsArray,
    ...exprs: Array<string | t.Expression>
  ): void => {
    const exprsLen = exprs.length;
    const writes = getWrites(sectionId);
    appendLiteral(writes, strs[0]);

    for (let i = 0; i < exprsLen; i++) {
      writes.push(exprs[i], strs[i + 1]);
    }
  };
}

export function consumeHTML(path: t.NodePath<any>) {
  const writes = getWrites(getSectionId(path));
  const result = toTemplateOrStringLiteral(writes);

  writes.length = 0;
  writes[0] = "";

  if (result) {
    return t.expressionStatement(callRuntime("write", result));
  }
}

export function hasPendingHTML(
  path: t.NodePath<t.MarkoTag> | t.NodePath<t.Program>
) {
  const writes = getWrites(getSectionId(path));
  return Boolean(writes.length > 1 || writes[0]);
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
  const target = path.isProgram() ? path : path.get("body");
  const expr = consumeHTML(target);
  if (expr) {
    target.pushContainer("body", expr)[0].skip();
  }
}

export function getSectionMeta(sectionId: number) {
  const writes = getWrites(sectionId);
  return {
    apply: getDefaultApply(sectionId),
    walks: getWalkString(sectionId),
    writes: toTemplateOrStringLiteral(writes) || t.stringLiteral(""),
  };
}

export function getSectionDeclarator(
  path: t.NodePath,
  sectionId: number,
  name: string
) {
  const dummyIdentifier = path.scope.generateUidIdentifier(name);
  const identifier = getRenderer(sectionId);
  identifier.name = dummyIdentifier.name;
  const { writes, walks, apply } = getSectionMeta(sectionId);
  return t.variableDeclarator(
    identifier,
    callRuntime("createRenderer", writes, walks, apply)
  );
}
