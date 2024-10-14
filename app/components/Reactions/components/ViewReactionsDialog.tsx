import groupBy from "lodash/groupBy";
import React from "react";
import { useTranslation } from "react-i18next";
import { Tab, TabPanel, useTabState } from "reakit";
import { toast } from "sonner";
import styled, { css } from "styled-components";
import { s } from "@shared/styles";
import Comment from "~/models/Comment";
import { Avatar, AvatarSize, type IAvatar } from "~/components/Avatar";
import { Emoji } from "~/components/Emoji";
import Flex from "~/components/Flex";
import Text from "~/components/Text";
import { hover } from "~/styles";

type Props = {
  comment: Comment;
};

type Reaction = {
  emoji: string;
  user: IAvatar & { name: string };
}[];

const ViewReactionsDialog: React.FC<Props> = ({ comment }) => {
  const { t } = useTranslation();
  const tab = useTabState();

  const [reactions, setReactions] = React.useState<Reaction>();

  React.useEffect(() => {
    const fetchReactions = async () => {
      try {
        const allReactions = await comment.fetchReactions();
        const mappedReactions: Reaction = allReactions.map(
          // @ts-expect-error reaction data from server
          (reaction) =>
            ({
              emoji: reaction.emoji,
              user: {
                name: reaction.user.name,
                color: reaction.user.color,
                avatarUrl: reaction.user.avatarUrl,
                initial: reaction.user.name
                  ? reaction.user.name[0].toUpperCase()
                  : "?",
              },
            } as Reaction[number])
        );

        setReactions(mappedReactions);
      } catch (err) {
        toast.error(t("Could not load reactions"));
      }
    };

    void fetchReactions();
  }, [t, comment, setReactions]);

  if (!reactions) {
    return <div>No reactions info</div>;
  }

  const reactionGroups = groupBy(reactions, "emoji");
  const emojiUsers = Object.entries(reactionGroups).reduce(
    (acc, [emoji, group]) => {
      acc[emoji] = group.map((g) => g.user);
      return acc;
    },
    {} as Record<string, Reaction[number]["user"][]>
  );

  return (
    <>
      <TabActionsWrapper>
        {Object.keys(emojiUsers).map((emoji) => (
          <StyledTab
            {...tab}
            key={emoji}
            id={emoji}
            aria-label={t("Reaction")}
            $active={tab.selectedId === emoji}
          >
            <Emoji size={16}>{emoji}</Emoji>
          </StyledTab>
        ))}
      </TabActionsWrapper>
      {Object.entries(emojiUsers).map(([emoji, users]) => (
        <StyledTabPanel {...tab} key={emoji}>
          {users.map((user) => (
            <UserInfo key={user.name} align="center" gap={8}>
              <Avatar model={user} size={AvatarSize.Medium} />
              <Text size="medium">{user.name}</Text>
            </UserInfo>
          ))}
        </StyledTabPanel>
      ))}
    </>
  );
};

const TabActionsWrapper = styled(Flex)`
  border-bottom: 1px solid ${s("inputBorder")};
`;

const StyledTab = styled(Tab)<{ $active: boolean }>`
  position: relative;
  font-weight: 500;
  font-size: 14px;
  cursor: var(--pointer);
  background: none;
  border: 0;
  border-radius: 4px 4px 0 0;
  padding: 8px 12px 10px;
  user-select: none;
  transition: background-color 100ms ease;

  &: ${hover} {
    background-color: ${s("listItemHoverBackground")};
  }

  ${({ $active }) =>
    $active &&
    css`
      &:after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: ${s("textSecondary")};
      }
    `}
`;

const StyledTabPanel = styled(TabPanel)`
  height: 300px;
  padding: 5px 0;
  overflow-y: auto;
`;

const UserInfo = styled(Flex)`
  padding: 10px 8px;
`;

export default ViewReactionsDialog;
