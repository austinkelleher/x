const _marko_template = _t(__filename);

export default _marko_template;
import _marko_class_merge from "marko/src/runtime/helpers/class-value";
import _marko_attr from "marko/src/runtime/html/helpers/attr";
import _marko_renderer from "marko/src/runtime/components/renderer";
import _marko_defineComponent from "marko/src/runtime/components/defineComponent";
import { t as _t } from "marko/src/runtime/html";
const _marko_componentType = "yBtxfRYN",
      _marko_component = {};
_marko_template._ = _marko_renderer(function (input, out, _component, component, state) {
  out.w(`<div class="shorthand"></div><div class="shorthand1 shorthand2"></div><div class="shorthand1 shorthand2 inline"></div><div${_marko_attr("class", _marko_class_merge(["shorthand1 shorthand2", dynamic1]))}></div><div${_marko_attr("class", _marko_class_merge([dynamic1, "inline"]))}></div><div${_marko_attr("class", _marko_class_merge([dynamic1, "shorthand2", "inline"]))}></div><div${_marko_attr("class", _marko_class_merge([dynamic1, "shorthand2", dynamic2]))}></div><div${_marko_attr("class", _marko_class_merge([dynamic2, dynamic3, dynamic1, "shorthand2"]))}></div><div${_marko_attr("class", _marko_class_merge([dynamic1, dynamic2, "shorthand"]))}></div><div${_marko_attr("class", _marko_class_merge(["partially-" + dynamic1, "shorthand2", dynamic2]))}></div>`);
}, {
  ___type: _marko_componentType,
  ___implicit: true
}, _marko_component);
_marko_template.meta = {
  id: _marko_componentType
};