_hello({
  other: {}
});

import { hydrate as _hello, template as _hello_template, walks as _hello_walks } from "./components/hello/index.marko";
import { createRenderFn as _createRenderFn } from "@marko/runtime-fluurt/src/dom";
export const template = `${_hello_template}`;
export const walks = `${_hello_walks}`;
export const apply = null;
export default _createRenderFn(template, walks, apply);