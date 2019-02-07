import * as t from "../definitions";

/**
 * Applies custom transformers on tags.
 */
export const visitor = {
  Program(path) {
    const [renderBlock] = path.pushContainer("body", t.blockStatement([]));
    path.hub._componentDefIdentifier = path.scope.generateUidIdentifier(
      "component"
    );

    path.hub._renderBlock = renderBlock;
  },
  MarkoTag(path) {
    const { hub, node } = path;
    const { lookup, macros } = hub;
    const { name } = node;
    let tagName = name.value;
    const isDynamicTag = !t.isStringLiteral(name);
    const isAttributeTag = !isDynamicTag && tagName[0] === "@";
    const isTagDefOptional = isDynamicTag || isAttributeTag;

    if (isDynamicTag) {
      tagName = undefined;
    } else if (isAttributeTag && t.isMarkoTag(path.parent)) {
      tagName = `${path.parent.name.value}:${tagName.slice(1)}`;
    }

    if (macros[tagName]) {
      return;
    }

    const tagDef = (node.tagDef = tagName && lookup.getTag(tagName));

    if (!isTagDefOptional && !tagDef) {
      throw path
        .get("name")
        .buildCodeFrameError(`Could not find custom tag "${tagName}".`);
    }

    const transformers = [
      ...(tagDef ? Object.values(tagDef.transformers) : []),
      ...Object.values(lookup.getTag("*").transformers)
    ].sort(comparePriority);

    for (const transformer of transformers) {
      const module = require(transformer.path);
      const { default: fn = module } = module;
      const node = path.node;
      fn(path);
      if (node !== path.node) break; // Stop if node is replaced.
    }
  }
};

function comparePriority(a, b) {
  a = a.priority;
  b = b.priority;

  if (a == null) {
    a = Number.MAX_VALUE;
  }

  if (b == null) {
    b = Number.MAX_VALUE;
  }

  return a - b;
}
