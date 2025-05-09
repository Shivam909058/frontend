// constants
import { VARIANT } from "../constants";

// types
import type { Post } from "../../../types/post";

const isExpandedPost = (post: Post): boolean => {
  const totalCharacterCount =
    post.description.length + (post.title?.length ?? 0);
  if (post.image_url) {
    return post.title ? true : post.description.length > 50;
  }
  return totalCharacterCount > 128;
};

export type PositionLayoutState = {
  positionClassNames: string[];
  variants: VARIANT[];
  leftColumn: number;
  rightColumn: number;
};

export const calculatePostPositionAndVariant = ({
  posts,
  preCalculatedPositions = {
    positionClassNames: [] as string[],
    variants: [] as VARIANT[],
    leftColumn: 0,
    rightColumn: 0,
  },
}: {
  posts: Post[];
  preCalculatedPositions?: PositionLayoutState;
}): PositionLayoutState =>
  posts.reduce<PositionLayoutState>(
    (acc, post) => {
      const isExpanded = isExpandedPost(post);
      if (acc.leftColumn === acc.rightColumn) {
        return {
          leftColumn: acc.leftColumn + 1,
          rightColumn: isExpanded ? acc.rightColumn + 1 : acc.rightColumn,
          variants: [
            ...acc.variants,
            isExpanded ? VARIANT.HORIZONTAL_EXPANDED : VARIANT.NON_EXPANDED,
          ],
          positionClassNames: [
            ...acc.positionClassNames,
            isExpanded ? "col-span-2 row-span-1" : "col-span-1 row-span-1",
          ],
        };
      }

      if (acc.leftColumn < acc.rightColumn) {
        return {
          leftColumn: isExpanded ? acc.leftColumn + 2 : acc.leftColumn + 1,
          rightColumn: acc.rightColumn,
          variants: [
            ...acc.variants,
            isExpanded ? VARIANT.VERTICAL_EXPANDED : VARIANT.NON_EXPANDED,
          ],
          positionClassNames: [
            ...acc.positionClassNames,
            isExpanded ? "col-span-1 row-span-2" : "col-span-1 row-span-1",
          ],
        };
      }

      return {
        rightColumn: isExpanded ? acc.rightColumn + 2 : acc.rightColumn + 1,
        leftColumn: acc.leftColumn,
        variants: [
          ...acc.variants,
          isExpanded ? VARIANT.VERTICAL_EXPANDED : VARIANT.NON_EXPANDED,
        ],
        positionClassNames: [
          ...acc.positionClassNames,
          isExpanded ? "col-span-1 row-span-2" : "col-span-1 row-span-1",
        ],
      };
    },
    {
      ...preCalculatedPositions,
    }
  );
