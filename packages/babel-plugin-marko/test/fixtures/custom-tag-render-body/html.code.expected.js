import { t as _t2 } from "marko/src/runtime/html";
import { r as _marko_renderer, c as _marko_defineComponent } from "marko/src/components/helpers";
import { t as _t } from "marko/src/runtime/html/helpers";

const _testBodyFunction_tag = _t(_testBodyFunction);

import _testBodyFunction from "./tags/test-body-function/renderer.js";

const _marko_template = _t2(__filename),
      _marko_componentType = "2EFrUtzo";

_marko_template._ = _marko_renderer(function (input, out, __component, component, state) {
  _testBodyFunction_tag({
    "name": "World",
    "renderBody": out => {
      out.w("This is the body content");
    }
  }, out, "0")
}, {
  ___type: _marko_componentType,
  ___implicit: true
})
_marko_template.Component = _marko_defineComponent(null, _marko_template._)
_marko_template.meta = {
  id: _marko_componentType,
  tags: ["./tags/test-body-function/renderer.js"]
}
export default _marko_template;