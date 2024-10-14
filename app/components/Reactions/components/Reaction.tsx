import { observer } from "mobx-react";
import { darken } from "polished";
import React from "react";
import styled, { css } from "styled-components";
import { s } from "@shared/styles";
import type { Reaction as TReaction } from "@shared/types";
import Flex from "~/components/Flex";
import NudeButton from "~/components/NudeButton";
import Text from "~/components/Text";
import useCurrentUser from "~/hooks/useCurrentUser";
import { hover } from "~/styles";

type Props = {
  reaction: TReaction;
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (emoji: string) => Promise<void>;
};

const Reaction: React.FC<Props> = ({
  reaction,
  onAddReaction,
  onRemoveReaction,
}) => {
  const user = useCurrentUser();
  const active = reaction.userIds.includes(user.id);

  const handleClick = React.useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      active
        ? void onRemoveReaction(reaction.emoji)
        : void onAddReaction(reaction.emoji);
    },
    [reaction, active, onAddReaction, onRemoveReaction]
  );

  return (
    <EmojiButton $active={active} onClick={handleClick}>
      <Flex gap={8} justify="center" align="center">
        <Emoji>{reaction.emoji}</Emoji>
        <Count weight="bold">{reaction.userIds.length}</Count>
      </Flex>
    </EmojiButton>
  );
};

const EmojiButton = styled(NudeButton)<{ $active: boolean }>`
  width: auto;
  height: 28px;
  padding: 8px;
  border: 1px solid ${s("buttonNeutralBorder")};
  border-radius: 12px;

  ${({ $active, theme }) =>
    $active
      ? css`
          background: ${darken(0, theme.accent)};
          border: 1px solid ${darken(0.15, theme.accent)};

          &: ${hover} {
            background: ${darken(0.24, theme.accent)};
          }
        `
      : css`
          &: ${hover} {
            background: ${s("listItemHoverBackground")};
          }
        `};
`;

const Emoji = styled.span`
  font-family: ${s("fontFamilyEmoji")};
  font-size: 13px;
`;

const Count = styled(Text)`
  font-size: 11px;
`;

export default observer(Reaction);
