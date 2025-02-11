import path from "path";
import { assertNoParams, assertNoVar, Tag } from "@marko/babel-utils";
import { assertNoSpreadAttrs } from "../util/assert";

export default {
  translate(tag) {
    const {
      hub: { file },
    } = tag;

    assertNoVar(tag);
    assertNoParams(tag);
    assertNoSpreadAttrs(tag);

    let type = "text/css";
    const attrs = tag.get("attributes");

    const base = path.basename(file.opts.sourceFileName as string);
    const typeAttr = attrs.find(
      (attr) => attr.isMarkoAttribute() && attr.node.name === "type"
    );

    if (typeAttr) {
      const typeValue = typeAttr.get("value");
      if (typeValue.isStringLiteral()) {
        type = typeValue.node.value;
      } else {
        throw typeValue.buildCodeFrameError(
          `<style> "type" attribute can only be a string literal.`
        );
      }
    }

    if (type === "text/css") {
      type = "css";
    }

    const body = tag.get("body").get("body");
    const markoText = body[0]!;

    if (body.length !== 1 || !markoText.isMarkoText()) {
      throw (markoText.isMarkoText() ? body[1] : body[0]).buildCodeFrameError(
        "The '<style>' tag currently only supports static content."
      );
    }

    file.metadata.marko.deps.push({
      type,
      code: markoText.node.value,
      startPos: markoText.node.start!,
      endPos: markoText.node.end!,
      path: `./${base}`,
      style: `./${base}.${type}`,
    } as unknown as typeof file.metadata.marko.deps[0]);

    tag.remove();
  },
  attributes: {
    type: { enum: ["css", "less", "scss", "text/css"] },
  },
} as Tag;
