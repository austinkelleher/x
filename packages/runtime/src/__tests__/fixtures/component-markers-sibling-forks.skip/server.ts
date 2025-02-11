import { write, fork } from "../../../html/index";
import { resolveAfter } from "../../utils/resolve";

const renderer = () => {
  firstComponent();
  secondComponent();
  thirdComponent();
};

const firstComponent = () => {
  fork(resolveAfter("a", 3), write);
};

const secondComponent = () => {
  fork(resolveAfter("b", 2), write);
};

const thirdComponent = () => {
  fork(resolveAfter("c", 1), write);
};

export default renderer;
