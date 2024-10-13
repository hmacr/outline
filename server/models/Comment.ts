import uniq from "lodash/uniq";
import { Node } from "prosemirror-model";
import {
  InferAttributes,
  InferCreationAttributes,
  Transaction,
} from "sequelize";
import {
  DataType,
  BelongsTo,
  ForeignKey,
  Column,
  Table,
  Length,
  DefaultScope,
} from "sequelize-typescript";
import type { ProsemirrorData } from "@shared/types";
import { ProsemirrorHelper } from "@shared/utils/ProsemirrorHelper";
import { CommentValidation } from "@shared/validations";
import { schema } from "@server/editor";
import { ValidationError } from "@server/errors";
import Document from "./Document";
import User from "./User";
import ParanoidModel from "./base/ParanoidModel";
import Fix from "./decorators/Fix";
import TextLength from "./validators/TextLength";

@DefaultScope(() => ({
  include: [
    {
      model: User,
      as: "createdBy",
      paranoid: false,
    },
    {
      model: User,
      as: "resolvedBy",
      paranoid: false,
    },
  ],
}))
@Table({ tableName: "comments", modelName: "comment" })
@Fix
class Comment extends ParanoidModel<
  InferAttributes<Comment>,
  Partial<InferCreationAttributes<Comment>>
> {
  @TextLength({
    max: CommentValidation.maxLength,
    msg: `Comment must be less than ${CommentValidation.maxLength} characters`,
  })
  @Length({
    max: CommentValidation.maxLength * 10,
    msg: `Comment data is too large`,
  })
  @Column(DataType.JSONB)
  data: ProsemirrorData;

  // associations

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  createdById: string;

  @Column(DataType.DATE)
  resolvedAt: Date | null;

  @BelongsTo(() => User, "resolvedById")
  resolvedBy: User | null;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  resolvedById: string | null;

  @BelongsTo(() => Document, "documentId")
  document: Document;

  @ForeignKey(() => Document)
  @Column(DataType.UUID)
  documentId: string;

  @BelongsTo(() => Comment, "parentCommentId")
  parentComment: Comment;

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  parentCommentId: string;

  /** Emoji -> UserId[] */
  @Column(DataType.JSONB)
  reactions: Record<string, string[]> | null;

  // methods

  /**
   * Resolve the comment. Note this does not save the comment to the database.
   *
   * @param resolvedBy The user who resolved the comment
   */
  public resolve(resolvedBy: User) {
    if (this.isResolved) {
      throw ValidationError("Comment is already resolved");
    }
    if (this.parentCommentId) {
      throw ValidationError("Cannot resolve a reply");
    }

    this.resolvedById = resolvedBy.id;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
  }

  /**
   * Unresolve the comment. Note this does not save the comment to the database.
   */
  public unresolve() {
    if (!this.isResolved) {
      throw ValidationError("Comment is not resolved");
    }

    this.resolvedById = null;
    this.resolvedBy = null;
    this.resolvedAt = null;
  }

  public updateReactions = async ({
    type,
    emoji,
    userId,
    transaction,
  }: {
    type: "add" | "remove";
    emoji: string;
    userId: string;
    transaction?: Transaction;
  }): Promise<boolean> => {
    const reactions = this.reactions || {};
    const existingUserIds = reactions[emoji] ?? [];

    const updatable =
      type === "add"
        ? !existingUserIds.includes(userId)
        : existingUserIds.includes(userId);
    if (!updatable) {
      return false;
    }

    let updatedUserIds: string[];
    if (type === "add") {
      updatedUserIds = [...existingUserIds, userId];
    } else {
      updatedUserIds = existingUserIds.filter((id) => id !== userId);
    }
    reactions[emoji] = uniq(updatedUserIds);

    this.reactions = reactions;
    this.changed("reactions", true);
    await this.save({ fields: ["reactions"], transaction });

    return true;
  };

  /**
   * Whether the comment is resolved
   */
  public get isResolved() {
    return !!this.resolvedAt;
  }

  /**
   * Convert the comment data to plain text
   *
   * @returns The plain text representation of the comment data
   */
  public toPlainText() {
    const node = Node.fromJSON(schema, this.data);
    return ProsemirrorHelper.toPlainText(node, schema);
  }
}

export default Comment;
