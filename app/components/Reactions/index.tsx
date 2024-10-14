import { observer } from "mobx-react";
import React from "react";
import type { Reaction as TReaction } from "@shared/types";
import Flex from "../Flex";
import Reaction from "./components/Reaction";

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
  <Flex>
    {reactions.map((reaction) => (
      <Reaction
        key={reaction.emoji}
        reaction={reaction}
        onAddReaction={onAddReaction}
        onRemoveReaction={onRemoveReaction}
      />
    ))}
  </Flex>
);

export default observer(Reactions);
