import { Op, WhereOptions } from "sequelize";
import documentMover from "@server/commands/documentMover";
import { Collection, Document, User } from "@server/models";
import { sequelize } from "@server/storage/database";
import BaseTask from "./BaseTask";

type Props = {
  collectionId: string;
  actorId: string;
  ip: string;
};

export default class DetachDraftsFromCollectionTask extends BaseTask<Props> {
  async perform(props: Props) {
    const [collection, actor] = await Promise.all([
      Collection.findByPk(props.collectionId, {
        paranoid: false,
      }),
      User.findByPk(props.actorId),
    ]);

    if (
      !actor ||
      !collection ||
      !(collection.isArchived || collection.isDeleted)
    ) {
      return;
    }

    // Detach drafts and archived documents when an unarchived collection is deleted.
    // Otherwise detach drafts only.
    const additionalOpts: WhereOptions<Document> =
      collection.isDeleted && !collection.isArchived
        ? {
            [Op.or]: [
              { publishedAt: { [Op.is]: null } },
              { archivedAt: { [Op.not]: null } },
            ],
          }
        : {
            publishedAt: { [Op.is]: null },
          };

    const documents = await Document.unscoped().findAll({
      where: {
        collectionId: props.collectionId,
        template: false,
        ...additionalOpts,
      },
      paranoid: false,
    });

    return sequelize.transaction(async (transaction) => {
      for (const document of documents) {
        await documentMover({
          document,
          user: actor,
          ip: props.ip,
          collectionId: null,
          transaction,
        });
      }
    });
  }
}
