import * as t from "../../../definitions";
import withPreviousLocation from "../../../util/with-previous-location";

export default translate;
translate.options = {
  html: { relaxRequireCommas: true },
  rawOpenTag: true
};

// WIP
function translate(path) {
  const program = path.parent;
  if (!t.isProgram(program)) {
    throw path.buildCodeFrameError(
      "Import's must be at the root of your Marko template."
    );
  }

  const {
    node,
    hub: {
      file: {
        ast: { parse }
      }
    }
  } = path;
  const { startTag } = node;
  const { rawValue } = startTag;

  try {
    const [importNode] = parse(rawValue, 0).body;
    path.replaceWith(withPreviousLocation(importNode, node));
  } catch (err) {
    // TODO: move parsing error handling somewhere else.
    // Also could be improved with better location info.
    throw path.buildCodeFrameError(err.message);
  }
}
