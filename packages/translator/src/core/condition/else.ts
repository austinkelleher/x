import type { types as t } from "@marko/compiler";
import { Tag, assertNoParams, assertNoVar } from "@marko/babel-utils";
import { setQueueBuilder } from "../../util/apply-hydrate";
import { exitBranch, queueBranchBuilder } from "./if";

export default {
  translate: {
    enter(tag) {
      const { node } = tag;
      const [testAttr] = node.attributes;

      assertNoVar(tag);
      assertNoParams(tag);

      if (
        node.attributes.length > 1 ||
        (testAttr && (testAttr as t.MarkoAttribute).name !== "if")
      ) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<else>' tag only supports an if attribute.`;

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

      setQueueBuilder(tag, queueBranchBuilder);
    },
    exit(tag) {
      exitBranch(tag);
    },
  },
  attributes: {},
  autocomplete: [
    {
      description:
        "Use after an <if> or <else-if> tag to display content if those conditions do not match.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#if-else-if-else",
    },
  ],
} as Tag;
