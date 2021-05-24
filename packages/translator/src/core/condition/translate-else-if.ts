import { types as t } from "@marko/compiler";
import * as writer from "../../util/writer";
import { buildIfStatement, findPreviousIfStatement } from "./util";

export default {
  enter(tag: t.NodePath<t.MarkoTag>) {
    writer.start(tag);
  },

  exit(tag: t.NodePath<t.MarkoTag>) {
    writer.end(tag);
    const prev = findPreviousIfStatement(tag);
    prev.node.alternate = buildIfStatement(tag);
    tag.remove();
  }
};
