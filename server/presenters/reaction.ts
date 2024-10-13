import Reaction from "@server/models/Reaction";
import presentUser from "./user";

export default function present(reaction: Reaction) {
  return {
    id: reaction.id,
    commentId: reaction.commentId,
    user: presentUser(reaction.user),
    userId: reaction.userId,
    createdAt: reaction.createdAt,
    updatedAt: reaction.updatedAt,
  };
}
