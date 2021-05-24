import { data as _data, html as _html, register as _register, createRenderFn as _createRenderFn } from "@marko/runtime-fluurt/src/dom";
export const template = "Hello <!>! Hello <!>! Hello <!>!";
export const walks = ":&;&;&;";
export const hydrate = _register("packages/translator/test/fixtures/hello-dynamic/template.marko", input => {
  _data(input.name);

  _html(input.name);

  _html(input.missing);
});
export default _createRenderFn(template, walks, ["name", "missing"], hydrate);