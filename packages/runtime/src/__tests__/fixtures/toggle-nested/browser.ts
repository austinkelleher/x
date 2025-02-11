import {
  data,
  setConditionalRenderer,
  createRenderer,
  createRenderFn,
  dynamicFragment,
  write,
  read,
  queue,
  readInOwner,
  queueInBranch,
} from "../../../dom/index";
import { next, over, get, open, close, skip } from "../../utils/walks";

export const inputs = [
  {
    show: false,
    value1: "Hello",
    value2: "World",
  },
  {
    show: true,
    value1: "Hello",
    value2: "World",
  },
  {
    show: true,
    value1: false,
    value2: "World",
  },
  {
    show: true,
    value1: "Goodbye",
    value2: "World",
  },
  {
    show: false,
    value1: "Goodbye",
    value2: "World",
  },
];

type Input = typeof inputs[number];

const enum Index {
  COMMENT = 0,
  CONDITIONAL = 0,
  INPUT_SHOW = 4,
  INPUT_VALUE1 = 5,
  INPUT_VALUE2 = 6,
}

type scope = {
  [Index.COMMENT]: Comment;
  [Index.CONDITIONAL]: Comment;
  [Index.INPUT_SHOW]: Input["show"];
  [Index.INPUT_VALUE1]: Input["value1"];
  [Index.INPUT_VALUE2]: Input["value2"];
};

// <div>
//   <if=input.show>
//     <if=input.value1><span>${input.value1}</span></if>
//     <if=input.value2><span>${input.value2}</span></if>
//   </if>
// </div>

export const template = `<div><!></div>`;
export const walks = open(7) + next(1) + get + over(1) + close;

export const execInputShow = () => {
  setConditionalRenderer(
    Index.CONDITIONAL,
    read<scope, Index.INPUT_SHOW>(Index.INPUT_SHOW) ? branch0 : undefined,
    dynamicFragment
  );
};

export const execInputValue1 = () => {
  queueInBranch(
    Index.CONDITIONAL,
    branch0,
    execInputValue1Branch0,
    Branch0Index.CLOSURE_VALUE1
  );
};

export const execInputValue1Branch0 = () => {
  setConditionalRenderer(
    Branch0Index.CONDITIONAL1,
    readInOwner<scope, Index.INPUT_VALUE1>(Index.INPUT_VALUE1)
      ? branch0_0
      : undefined
  );
  queueInBranch(
    Branch0Index.CONDITIONAL1,
    branch0_0,
    execInputValue1Branch0_0,
    Branch0_0Index.CLOSURE_VALUE1
  );
};

export const execInputValue2 = () => {
  queueInBranch(
    Index.CONDITIONAL,
    branch0,
    execInputValue2Branch0,
    Branch0Index.CLOSURE_VALUE2
  );
};

export const execInputValue2Branch0 = () => {
  setConditionalRenderer(
    Branch0Index.CONDITIONAL2,
    readInOwner<scope, Index.INPUT_VALUE2>(Index.INPUT_VALUE2)
      ? branch0_1
      : undefined
  );
  queueInBranch(
    Branch0Index.CONDITIONAL2,
    branch0_1,
    execInputValue2Branch0_1,
    Branch0_1Index.CLOSURE_VALUE2
  );
};

const execInputValue1Branch0_0 = () => {
  data(
    Branch0_0Index.TEXT,
    readInOwner<scope, Index.INPUT_VALUE1>(Index.INPUT_VALUE1, 2)
  );
};

const execInputValue2Branch0_1 = () => {
  data(
    Branch0_1Index.TEXT,
    readInOwner<scope, Index.INPUT_VALUE2>(Index.INPUT_VALUE2, 2)
  );
};

export const execDynamicInput = (input: Input) => {
  write(Index.INPUT_SHOW, input.show) && execInputShow();
  write(Index.INPUT_VALUE1, input.value1) && execInputValue1();
  write(Index.INPUT_VALUE2, input.value2) && execInputValue2();
};

export default createRenderFn(template, walks, undefined, 0, execDynamicInput);

const enum Branch0Index {
  CLOSURE_VALUE1 = -2,
  CLOSURE_VALUE2 = -1,
  COMMENT1 = 0,
  CONDITIONAL1 = 0,
  COMMENT2 = 4,
  CONDITIONAL2 = 4,
}

// type Branch0Scope = {
//   [Branch0Index.COMMENT1]: Comment;
//   [Branch0Index.CONDITIONAL1]: Comment;
//   [Branch0Index.COMMENT2]: Comment;
//   [Branch0Index.CONDITIONAL2]: Comment;
// };

const branch0 = createRenderer(
  "<!><!>",
  open(8) + get + over(1) + skip(3) + get + over(1) + close,
  () => {
    queue(execInputValue1Branch0, Branch0Index.CLOSURE_VALUE1);
    queue(execInputValue2Branch0, Branch0Index.CLOSURE_VALUE2);
  },
  0,
  0,
  0,
  4
);

const enum Branch0_0Index {
  CLOSURE_VALUE1 = -1,
  TEXT = 0,
}

// type Branch0_0Scope = {
//   [Branch0_0Index.TEXT]: Text;
// };

const branch0_0 = createRenderer(
  "<span> </span>",
  open(1) + next(1) + get + next(1) + close,
  undefined,
  0
);

const enum Branch0_1Index {
  CLOSURE_VALUE2 = -1,
  TEXT = 0,
}

// type Branch0_1Scope = {
//   [Branch0_1Index.TEXT]: Text;
// };

// OPTIMIZATION: these two branches have the same renderer arguments
// so they could share the same renderer instance
const branch0_1 = createRenderer(
  "<span> </span>",
  open(1) + next(1) + get + next(1) + close,
  undefined,
  0
);
