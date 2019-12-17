import nodePath from "path";
import resolveFrom from "resolve-from";

const startOffset = "module-code".length;

export default function parse(path) {
  const {
    hub,
    node: { rawValue, start }
  } = path;
  const dirname = nodePath.dirname(hub.filename);
  const relativeRequire = entry => require(resolveFrom(dirname, entry));
  const fn = eval(rawValue.slice(startOffset));
  const source = fn(relativeRequire);
  const program = hub.parse(source, start + startOffset);
  hub.moduleCode = program.body;
}
