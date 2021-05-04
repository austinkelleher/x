import {
  walk,
  data,
  Loop,
  Scope,
  createRenderer,
  createRenderFn,
  staticNodeMethods
} from "../../../../src/dom/index";
import { get, next } from "../../utils/walks";

export const inputs = [
  {
    children: [
      {
        id: 1,
        text: "a"
      },
      {
        id: 2,
        text: "b"
      }
    ]
  },
  {
    children: [
      {
        id: 2,
        text: "c"
      },
      {
        id: 1,
        text: "d"
      }
    ]
  },
  {
    children: [
      {
        id: 1,
        text: "d"
      },
      {
        id: 2,
        text: "c"
      }
    ]
  }
];

type Input = typeof inputs[number];

export const template = `<div><!></div>`;
export const walks = next(1) + get + next(1);
export const hydrate = (scope: Scope, offset: number) => {
  scope[offset + 1] = new Loop(
    walk() as Comment,
    iter0,
    i => "" + (i as Input["children"][number]).id,
    iter0_execItem,
    null,
    null
  );
};

export const execInputChildren = (scope: Scope, offset: number) => {
  (scope[offset + 1] as Loop).setOf(scope[offset] as Input["children"]);
};

export const execDynamicInput = (
  input: Input,
  scope: Scope,
  offset: number
) => {
  scope[offset] = input.children;
  execInputChildren(scope, offset);
};

export default createRenderFn(template, walks, hydrate, 0, execDynamicInput);

const iter0 = createRenderer(
  " ",
  get + next(1),
  (scope: Scope) => {
    scope[3] = walk();
  },
  0,
  staticNodeMethods
);

const iter0_execItem = (scope: Scope) => {
  data(scope[3] as Text, (scope[0] as Input["children"][number]).text);
};
