const _marko_template = _t(__filename);

export default _marko_template;
import { r as _marko_renderer, c as _marko_defineComponent, rc as _marko_registerComponent } from "marko/src/runtime/components/helpers";
import { t as _t } from "marko/src/runtime/vdom";

const _marko_componentType = _marko_registerComponent("yxFtiAwF", () => _marko_template),
      _marko_component = {};

_marko_template._ = _marko_renderer(function (input, out, _component2, component, state) {
  const _component = "test";
  out.be("div", null, "0", component, 0, 0);
  out.ee();
}, {
  ___type: _marko_componentType,
  ___implicit: true
}, _marko_component);
_marko_template.Component = _marko_defineComponent(_marko_component, _marko_template._);
_marko_template.meta = {
  id: _marko_componentType
};