const _marko_template = _t(__filename);

export default _marko_template;
import _marko_dynamic_tag from "marko/src/runtime/helpers/dynamic-tag";
import _marko_renderer from "marko/src/runtime/components/renderer";
import _marko_defineComponent from "marko/src/runtime/components/defineComponent";
import { t as _t } from "marko/src/runtime/dom";
import { r as _marko_registerComponent } from "marko/runtime/components/registry-browser";

const _marko_componentType = _marko_registerComponent("keKtSvbK", () => _marko_template),
      _marko_component = {};

_marko_template._ = _marko_renderer(function (input, out, _component, component, state) {
  _marko_dynamic_tag(out, input.x, () => ({
    "header": {
      "class": "my-header",
      "renderBody": out => {
        out.t("Header content");
      }
    },
    "footer": {
      "class": "my-footer",
      "renderBody": out => {
        out.t("Footer content");
      }
    }
  }), out => {
    out.t("Body content");
  }, null, null, _component, "0");
}, {
  ___type: _marko_componentType,
  ___implicit: true
}, _marko_component);
_marko_template.Component = _marko_defineComponent(_marko_component, _marko_template._);
_marko_template.meta = {
  id: _marko_componentType
};