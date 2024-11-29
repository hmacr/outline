import { Transaction, Op, WhereOptions } from "sequelize";
import { Collection, Document, Event, User } from "@server/models";

type Props = {
  /** The collection to delete */
  collection: Collection;
  /** The actor who is deleting the collection */
  user: User;
  /** The database transaction to use */
  transaction: Transaction;
  /** The IP address of the current request */
  ip: string | null;
};

export default async function collectionDestroyer({
  collection,
  transaction,
  user,
  ip,
}: Props) {
  await collection.destroy({ transaction });

  const where: WhereOptions<Document> = {
    teamId: collection.teamId,
    collectionId: collection.id,
  };

  if (!collection.isArchived) {
    where.archivedAt = { [Op.is]: null };
  }

  await Document.update(
    {
      lastModifiedById: user.id,
      deletedAt: new Date(),
    },
    {
      transaction,
      where,
    }
  );

  await Event.create(
    {
      name: "collections.delete",
      collectionId: collection.id,
      teamId: collection.teamId,
      actorId: user.id,
      data: {
        name: collection.name,
      },
      ip,
    },
    { transaction }
  );
}
