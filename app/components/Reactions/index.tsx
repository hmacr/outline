import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import type { Reaction as TReaction } from "@shared/types";
import Flex from "../Flex";
import Reaction from "./components/Reaction";
import ReactionPicker from "./components/ReactionPicker";

type Props = {
  reactions: TReaction[];
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (emoji: string) => Promise<void>;
};

const Reactions: React.FC<Props> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
}) => (
  <Container align="center" gap={6} wrap>
    {reactions.map((reaction) => (
      <Reaction
        key={reaction.emoji}
        reaction={reaction}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    ))}
    <ReactionPicker onSelect={onAddReaction} />
  </Container>
);

const Container = styled(Flex)`
  margin-top: 5px;
`;

export default observer(Reactions);
