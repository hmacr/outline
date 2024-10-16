import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import type { Reaction as TReaction } from "@shared/types";
import useHover from "~/hooks/useHover";
import { ReactionData } from "~/types";
import Logger from "~/utils/Logger";
import Flex from "../Flex";
import Reaction from "./components/Reaction";

type Props = {
  reactions: TReaction[];
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (emoji: string) => Promise<void>;
  fetchReactionData: () => Promise<ReactionData[]>;
};

type ReactedUsers = Record<string, ReactionData["user"][]>;

const Reactions: React.FC<Props> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  fetchReactionData,
}) => {
  const [reactedUsers, setReactedUsers] = React.useState<ReactedUsers>({});
  const { hovered, onMouseEnter, onMouseLeave } = useHover({
    duration: 100,
  });

  React.useEffect(() => {
    const loadReactionData = async () => {
      try {
        const reactionData = await fetchReactionData();

        const transformedData = reactionData.reduce((acc, data) => {
          const emoji = data.emoji;
          const users = (acc[emoji] ?? []) as ReactedUsers[number];
          users.push(data.user);
          acc[emoji] = users;
          return acc;
        }, {} as ReactedUsers);

        setReactedUsers(transformedData);
      } catch (err) {
        Logger.warn("Could not prefetch reaction data");
      }
    };

    if (hovered) {
      void loadReactionData();
    }
  }, [hovered, setReactedUsers, fetchReactionData]);

  return (
    <Container
      align="center"
      gap={6}
      wrap
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {reactions.map((reaction) => (
        <Reaction
          key={reaction.emoji}
          reaction={reaction}
          reactedUsers={reactedUsers[reaction.emoji] ?? []}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
        />
      ))}
    </Container>
  );
};

const Container = styled(Flex)`
  margin-top: 5px;
`;

export default observer(Reactions);
