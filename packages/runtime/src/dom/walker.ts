import { ScopeOffsets } from "../common/types";

export const walker = document.createTreeWalker(document);

// Laws of the walks string:
//  - Always prefer Get to Before to After, Inside, or Replace
//    - Get must always be used to get a static node from clonable template if possible
//    - Replace must only be used to insert between two static text nodes
//    - Inside must only be used to insert into elements with no static children
//    - After must only be used to insert a last child or immediately following another action (if it makes the walks string smaller)
//  - Adjacent actions must always be in source order (Before* Get* Inside* After* || Before* Replace)
//    - When an element is both walked into and needs to insert After, you must walk in first (Next) and then walk Out before After
//  - Unless the inserted node is Text, Inside, After, & Replace must be followed by Out/Over to skip over unknown children
//  - Out must always be followed by After or Over
//    - Before must be done before walking into the node
//    - Next would walk back in the node we just walked Out of
//  - A component must assume the walker is on its first node, and include instructions for walking to its assumed nextSibling

// Reserved Character Codes
// 0-31 [control characters]
// 34 " [double quote]
// 39 ' [single quote]
// 92 \ [backslash]
// 96 ` [backtick]
export const enum WalkCodes {
  Get = 32,
  Before = 33,
  After = 35,
  Inside = 36,
  Replace = 37,
  Close = 38,

  Skip = 40,
  SkipEnd = 46,

  Open = 47,
  OpenEnd = 66,

  Next = 67,
  NextEnd = 91,

  Over = 97,
  OverEnd = 106,

  Out = 107,
  OutEnd = 116,

  Multiplier = 117,
  MultiplierEnd = 126,
}

export const enum WalkRangeSizes {
  Skip = 7, // 40 through 46
  Open = 20, // 47 through 66
  Next = 20, // 67 through 91
  Over = 10, // 97 through 106
  Out = 10, // 107 through 116
  Multiplier = 10, // 117 through 126
}

export function trimWalkString(walkString: string): string {
  let end = walkString.length;
  while (walkString.charCodeAt(--end) > WalkCodes.Replace);
  return walkString.slice(0, end + 1);
}

let currentWalkIndex = 0;

export function walk(startNode: Node, walkCodes: string, scope: unknown[]) {
  walker.currentNode = startNode;
  currentWalkIndex = 0;
  walkInternal(walkCodes, scope);
  walker.currentNode = document.documentElement;
}

function walkInternal(
  walkCodes: string,
  scope: unknown[],
  currentScopeIndex = ScopeOffsets.BEGIN_DATA,
  childScopeIndex = ScopeOffsets.BEGIN_DATA
) {
  let value: number;
  let storedMultiplier = 0;
  let currentMultiplier = 0;

  while ((value = walkCodes.charCodeAt(currentWalkIndex++))) {
    currentMultiplier = storedMultiplier;
    storedMultiplier = 0;
    if (value >= WalkCodes.Multiplier) {
      storedMultiplier =
        currentMultiplier * WalkRangeSizes.Multiplier +
        value -
        WalkCodes.Multiplier;
    } else if (value >= WalkCodes.Out) {
      value = WalkRangeSizes.Over * currentMultiplier + value - WalkCodes.Over;
      while (value--) {
        walker.parentNode();
      }
    } else if (value >= WalkCodes.Over) {
      value = WalkRangeSizes.Over * currentMultiplier + value - WalkCodes.Over;
      while (value--) {
        if (!walker.nextSibling() && !walker.nextNode() && "MARKO_DEBUG") {
          throw new Error("No more nodes to walk");
        }
      }
    } else if (value >= WalkCodes.Next) {
      value = WalkRangeSizes.Next * currentMultiplier + value - WalkCodes.Next;
      while (value--) {
        walker.nextNode();
      }
    } else if (value >= WalkCodes.Open) {
      value = WalkRangeSizes.Open * currentMultiplier + value - WalkCodes.Open;
      childScopeIndex = walkInternal(
        walkCodes,
        scope,
        childScopeIndex,
        childScopeIndex + value
      )!;
    } else if (value >= WalkCodes.Skip) {
      currentScopeIndex +=
        WalkRangeSizes.Skip * currentMultiplier + value - WalkCodes.Skip;
    } else if (value === WalkCodes.Close) {
      return childScopeIndex;
    } else if (value === WalkCodes.Get) {
      scope[currentScopeIndex++] = walker.currentNode;
    } else {
      const newNode = (scope[currentScopeIndex++] =
        document.createTextNode(""));
      const current = walker.currentNode;
      const parentNode = current.parentNode!;

      if (value === WalkCodes.Before) {
        parentNode.insertBefore(newNode, current);
      } else {
        if (value === WalkCodes.After) {
          parentNode.insertBefore(newNode, current.nextSibling);
        } else {
          if ("MARKO_DEBUG" && value !== WalkCodes.Replace) {
            throw new Error(`Unknown walk code: ${value}`);
          }
          parentNode.replaceChild(newNode, current);
        }

        walker.currentNode = newNode;
      }
    } /* else {
      if ("MARKO_DEBUG" && value !== WalkCodes.Replace) {
        throw new Error(`Unknown walk code: ${value}`);
      }
      const current = walker.currentNode;
      current.parentNode!.replaceChild(walker.currentNode = scope[currentScopeIndex++] = document.createTextNode(""), current);
    } */
  }
}
