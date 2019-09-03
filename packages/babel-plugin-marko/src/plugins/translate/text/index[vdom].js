import { decode } from "he";
import * as t from "../../../definitions";
import withPreviousLocation from "../../../util/with-previous-location";
import write from "../../../util/vdom-out-write";

export default function(path) {
  const { node } = path;

  path.replaceWith(
    write("t", withPreviousLocation(t.stringLiteral(decode(node.value)), node))
  );
}
