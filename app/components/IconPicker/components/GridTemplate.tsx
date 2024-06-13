import chunk from "lodash/chunk";
import compact from "lodash/compact";
import React from "react";
import styled from "styled-components";
import { s } from "@shared/styles";
import { IconLibrary } from "@shared/utils/IconLibrary";
import NudeButton from "~/components/NudeButton";
import Text from "~/components/Text";
import { hover } from "~/styles";
import Grid from "./Grid";

/**
 * icon/emoji size is 24px by default; and we add 4px padding on all sides,
 */
const BUTTON_SIZE = 32;

type OutlineNode = {
  type: "outline";
  name: string;
  color: string;
  initial: string;
  onClick: (icon: string) => void;
  delay: number;
};

type EmojiNode = {
  type: "emoji";
  id: string;
  value: string;
  onClick: ({ id, value }: { id: string; value: string }) => void;
};

export type DataNode = {
  category: string;
  icons: (OutlineNode | EmojiNode)[];
};

type Props = {
  width: number;
  height: number;
  nodes: DataNode[];
};

const GridTemplate = (
  { width, height, nodes }: Props,
  ref: React.Ref<HTMLDivElement>
) => {
  // 24px padding for the Grid Container
  const itemsPerRow = Math.floor((width - 24) / BUTTON_SIZE);

  const gridItems = compact(
    nodes.flatMap((node) => {
      const category = (
        <CategoryName
          key={node.category}
          type="tertiary"
          size="xsmall"
          weight="bold"
        >
          {node.category}
        </CategoryName>
      );

      const items = node.icons.map((item) => {
        if (item.type === "outline") {
          return (
            <Button
              key={item.name}
              onClick={() => item.onClick(item.name)}
              delay={item.delay}
            >
              <Icon as={IconLibrary.getComponent(item.name)} color={item.color}>
                {item.initial}
              </Icon>
            </Button>
          );
        }

        return (
          <Button
            key={item.id}
            onClick={() => item.onClick({ id: item.id, value: item.value })}
          >
            <Emoji>{item.value}</Emoji>
          </Button>
        );
      });

      if (items.length === 0) {
        return [];
      }

      const chunks = chunk(items, itemsPerRow);
      return [[category], ...chunks];
    })
  );

  return (
    <Grid
      ref={ref}
      width={width}
      height={height}
      data={gridItems}
      columns={itemsPerRow}
      itemWidth={BUTTON_SIZE}
    />
  );
};

const CategoryName = styled(Text)`
  grid-column: 1 / -1;
  padding-left: 6px;
`;

const Button = styled(NudeButton)<{ delay?: number }>`
  width: ${BUTTON_SIZE}px;
  height: ${BUTTON_SIZE}px;
  padding: 4px;
  --delay: ${({ delay }) => delay && `${delay}ms`};

  &: ${hover} {
    background: ${s("listItemHoverBackground")};
  }
`;

const Icon = styled.svg`
  transition: color 150ms ease-in-out, fill 150ms ease-in-out;
  transition-delay: var(--delay);
`;

const Emoji = styled.span`
  font-family: ${s("fontFamilyEmoji")};
  width: 24px;
  height: 24px;
`;

export default React.forwardRef(GridTemplate);
