const _marko_template = _t2(__filename);

export default _marko_template;
import _hello from "./components/hello/index.marko";
import { t as _t } from "marko/src/runtime/html/helpers";

const _hello_tag = _t(_hello);

import { r as _marko_renderer, c as _marko_defineComponent, rc as _marko_registerComponent } from "marko/src/runtime/components/helpers";
import { t as _t2 } from "marko/src/runtime/html";

const _marko_componentType = _marko_registerComponent("Mp8YE_db", () => _marko_template),
      _marko_component = {};

_marko_template._ = _marko_renderer(function (input, out, _component, component, state) {
  _hello_tag({
    "foo": {
      "renderBody": out => {
        out.w("Foo!");
      }
    }
  }, out, _component, "0");
}, {
  ___type: _marko_componentType,
  ___implicit: true
}, _marko_component);
_marko_template.Component = _marko_defineComponent(_marko_component, _marko_template._);
_marko_template.meta = {
  id: _marko_componentType,
  tags: ["./components/hello/index.marko"]
};