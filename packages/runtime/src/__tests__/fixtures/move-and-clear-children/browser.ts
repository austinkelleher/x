import {
  data,
  read,
  write,
  setLoopOf,
  createRenderer,
  createRenderFn,
} from "../../../dom/index";
import { open, close, get, next, over } from "../../utils/walks";

export const inputs = [
  {
    children: [
      {
        id: 1,
        text: "a",
      },
      {
        id: 2,
        text: "b",
      },
      {
        id: 3,
        text: "c",
      },
    ],
  },
  {
    children: [
      {
        id: 2,
        text: "b",
      },
      {
        id: 3,
        text: "c",
      },
      {
        id: 1,
        text: "a",
      },
    ],
  },
  {
    children: [],
  },
];

type Input = typeof inputs[number];

const enum Index {
  DIV = 0,
  LOOP = 0,
  INPUT_CHILDREN = 4,
}

type scope = {
  [Index.DIV]: HTMLDivElement;
  [Index.LOOP]: HTMLDivElement;
  [Index.INPUT_CHILDREN]: Input["children"];
};

// <div>
//   <for|child| of=input.children by(c) { return c.id }>
//     ${child.text}
//   </for>
// </div>

export const template = `<div></div>`;
export const walks = open(5) + get + over(1) + close;

export const execInputChildren = () => {
  setLoopOf(
    Index.LOOP,
    read<scope, Index.INPUT_CHILDREN>(Index.INPUT_CHILDREN),
    iter0,
    (i) => "" + (i as Input["children"][number]).id,
    iter0_execItem
  );
};

export const execDynamicInput = (input: Input) => {
  if (write(Index.INPUT_CHILDREN, input.children)) {
    execInputChildren();
  }
};

export default createRenderFn(template, walks, undefined, 0, execDynamicInput);

const enum Iter0Index {
  TEXT = 0,
  ITEM = 1,
}

// type iterScope = [Text, Input["children"][number]];

const iter0 = createRenderer(
  " ",
  open(5) + get + next(1) + close,
  undefined,
  0
);

const iter0_execItem = (item: Input["children"][number]) => {
  if (write(Iter0Index.ITEM, item)) {
    data(Iter0Index.TEXT, item.text);
  }
};
