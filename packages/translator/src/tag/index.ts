import { types as t } from "@marko/compiler";
import { assertNoArgs, getTagDef, isNativeTag } from "@marko/babel-utils";
import { TagNameTypes } from "../analyze/util/tag-name-type";
import { isOutputHTML } from "../util/marko-config";
import * as hooks from "../util/plugin-hooks";
import * as NativeTag from "./native-tag";
import * as CustomTag from "./custom-tag";
import * as DynamicTag from "./dynamic-tag";
import * as AttributeTag from "./attribute-tag";

export default {
  enter(tag: t.NodePath<t.MarkoTag>) {
    const tagDef = getTagDef(tag);
    const extra = tag.node.extra;

    assertNoArgs(tag);

    if (tagDef?.translator) {
      if (tagDef.translator.path) {
        tag.hub.file.metadata.marko.watchFiles.push(tagDef.translator.path);
      }
      hooks.enter(tagDef.translator.hook, tag);
      return;
    }

    for (const attr of tag.get("attributes")) {
      if (attr.isMarkoAttribute()) {
        if (attr.node.arguments) {
          throw attr.buildCodeFrameError(
            `Unsupported arguments on the "${attr.node.name}" attribute.`
          );
        }

        if (attr.node.modifier) {
          if (isNativeTag(attr.parentPath as t.NodePath<t.MarkoTag>)) {
            attr.node.name += `:${attr.node.modifier}`;
          } else {
            throw attr.buildCodeFrameError(
              `Unsupported modifier "${attr.node.modifier}".`
            );
          }
        }
      }
    }

    let { tagNameType } = extra;

    if (extra.tagNameDynamic) {
      if (extra.tagNameNullable && !tag.get("name").isIdentifier()) {
        const tagNameId = tag.scope.generateUidIdentifier("tagName");
        const [tagNameVarPath] = tag.insertBefore(
          t.variableDeclaration("const", [
            t.variableDeclarator(tagNameId, tag.node.name),
          ])
        );

        tagNameVarPath.skip();
        tag.set("name", tagNameId);
      }

      if (tagNameType !== TagNameTypes.DynamicTag && !isOutputHTML(tag)) {
        // DOM implementation requires non strings actually be a dynamic tag call.
        tagNameType = TagNameTypes.DynamicTag;
      }
    }

    switch (tagNameType) {
      case TagNameTypes.NativeTag:
        NativeTag.enter(tag);
        break;
      case TagNameTypes.CustomTag:
        CustomTag.enter(tag);
        break;
      case TagNameTypes.DynamicTag:
        DynamicTag.enter(tag);
        break;
      case TagNameTypes.AttributeTag:
        AttributeTag.enter(tag);
        break;
    }
  },

  exit(tag: t.NodePath<t.MarkoTag>) {
    const translator = getTagDef(tag)?.translator;

    if (translator) {
      hooks.exit(translator.hook, tag);
      return;
    }

    const { extra } = tag.node;
    let { tagNameType } = extra;

    if (
      extra.tagNameDynamic &&
      tagNameType !== TagNameTypes.DynamicTag &&
      !isOutputHTML(tag)
    ) {
      // DOM implementation requires non strings actually be a dynamic tag call.
      tagNameType = TagNameTypes.DynamicTag;
    }

    switch (tagNameType) {
      case TagNameTypes.NativeTag:
        NativeTag.exit(tag);
        break;
      case TagNameTypes.CustomTag:
        CustomTag.exit(tag);
        break;
      case TagNameTypes.DynamicTag:
        DynamicTag.exit(tag);
        break;
      case TagNameTypes.AttributeTag:
        AttributeTag.exit(tag);
        break;
    }
  },
};
