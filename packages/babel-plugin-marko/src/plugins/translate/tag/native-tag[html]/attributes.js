import * as t from "../../../../definitions";
import normalizeTemplateString from "../../../../util/normalize-template-string";
import { xa as escapeXmlAttr } from "marko/src/runtime/html/helpers";

const basicTypes = ["string", "number", "boolean"];

export default function(attrs) {
  if (!attrs.length) {
    return t.stringLiteral("");
  }

  const quasis = [];
  const expressions = [];
  let curString = "";

  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    const {
      hub,
      node: { name, value }
    } = attr;

    if (!name) {
      quasis.push(curString);
      curString = "";
      expressions.push(
        t.callExpression(
          hub.importNamed(
            attr,
            "marko/src/runtime/html/helpers",
            "as",
            "marko_attrs"
          ),
          [value]
        )
      );
      continue;
    }

    const { confident, value: computed } = attr.get("value").evaluate();

    if (
      confident &&
      name !== "data-marko" &&
      basicTypes.includes(typeof computed)
    ) {
      if (computed == null || computed === false) {
        continue;
      }

      curString += ` ${name}`;

      if (computed !== true) {
        curString += `="${escapeXmlAttr(computed)}"`;
      }
    } else {
      const args = [t.stringLiteral(name), value];
      quasis.push(curString);
      curString = "";

      if (name === "data-marko") {
        args.push(t.booleanLiteral(false));
      }

      expressions.push(
        t.callExpression(
          hub.importNamed(
            attr,
            "marko/src/runtime/html/helpers",
            "a",
            "marko_attr"
          ),
          args
        )
      );
    }
  }

  quasis.push(curString);

  return normalizeTemplateString(quasis, expressions);
}
