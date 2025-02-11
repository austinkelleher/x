import { write, fork } from "../../../html/index";
import { resolveAfter } from "../../utils/resolve";

const renderer = () => {
  firstComponent();
  secondComponent();
};

const firstComponent = () => {
  write("x");
  write("y");
  write("z");
};

const secondComponent = () => {
  write("a");
  fork(resolveAfter("b", 1), write);
  fork(resolveAfter("c", 2), write);
};

export default renderer;
