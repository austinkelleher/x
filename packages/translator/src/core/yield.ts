import { types as t } from "@marko/compiler";
import { assertNoVar, assertNoParams, Tag } from "@marko/babel-utils";
import * as writer from "../util/writer";
import { assertNoBodyContent, assertNoSpreadAttrs } from "../util/assert";
import { isOutputHTML } from "../util/marko-config";

const RETURN_IDENTIFIERS = new WeakMap<t.BabelFile, t.Identifier>();

export default {
  translate(tag) {
    assertNoVar(tag);
    assertNoParams(tag);
    assertNoBodyContent(tag);
    assertNoSpreadAttrs(tag);
    writer.flushBefore(tag);

    const {
      node,
      hub: { file },
    } = tag;
    const [defaultAttr, onNextAttr] = node.attributes;

    if (!t.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
      throw tag
        .get("name")
        .buildCodeFrameError(
          `The '<yield>' tag requires default attribute like '<yield=VALUE>'.`
        );
    }

    if (onNextAttr && (onNextAttr as t.MarkoAttribute).name === "onnext") {
      if (isOutputHTML()) {
        tag.get("attributes")[1].remove();
      }
    }

    if (node.attributes.length > 1) {
      const start = node.attributes[1].loc?.start;
      const end = node.attributes[node.attributes.length - 1].loc?.end;
      const msg = `The '<yield>' tag only supports a default attribute.`;

      if (start == null || end == null) {
        throw tag.get("name").buildCodeFrameError(msg);
      } else {
        throw tag.hub.buildError(
          { loc: { start, end } } as unknown as t.Node,
          msg,
          Error
        );
      }
    }

    let returnId = RETURN_IDENTIFIERS.get(file);

    if (!returnId) {
      const program = file.path;
      RETURN_IDENTIFIERS.set(
        file,
        (returnId = program.scope.generateDeclaredUidIdentifier("return"))
      );
      program.pushContainer("body", t.returnStatement(returnId))[0].skip();
    }

    if (isOutputHTML()) {
      tag
        .replaceWith(
          t.assignmentExpression("=", returnId, defaultAttr.value!)
        )[0]
        .skip();
    }
  },
  autocomplete: [
    {
      displayText: "yield=<value>",
      description: "Provides a value for use in a parent template.",
      snippet: "yield=${1:value}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#yield",
    },
  ],
} as Tag;
