import { Op, WhereOptions } from "sequelize";
import isUUID from "validator/lib/isUUID";
import { NavigationNode } from "@shared/types";
import { UrlHelper } from "@shared/utils/UrlHelper";
import {
  AuthorizationError,
  InvalidRequestError,
  NotFoundError,
} from "@server/errors";
import { Collection, Document, Share, User } from "@server/models";
import { authorize } from "@server/policies";

type Props = {
  id?: string;
  collectionId?: string;
  documentId?: string;
  includeTree?: boolean;
  includeParentShare?: boolean;
  teamId?: string;
  user?: User;
};

type Result = {
  share: Share;
  parentShare: Share | null;
  sharedTree: NavigationNode | null;
};

export async function loadShare({
  id,
  collectionId,
  documentId,
  includeTree,
  teamId,
  user,
}: Props): Promise<Result> {
  if (!id && !((collectionId || documentId) && user)) {
    throw new Error(
      "Either id (or) collectionId/documentId with user must be provided"
    );
  }

  const urlId =
    id && !isUUID(id) && UrlHelper.SHARE_URL_SLUG_REGEX.test(id)
      ? id
      : undefined;

  if (urlId && !teamId) {
    throw new Error("teamId required for fetching share using urlId");
  }

  let share: Share | null = null;
  let parentShare: Share | null = null;
  let sharedTree: NavigationNode | null = null;

  if (id) {
    const where: WhereOptions<Share> = {
      revokedAt: {
        [Op.is]: null,
      },
      published: true,
    };

    if (urlId) {
      where.urlId = urlId;
      where.teamId = teamId;
    } else {
      where.id = id;
    }

    share = await Share.findOne({
      where,
      include: [
        {
          model: Document.scope("withDrafts"),
          as: "document",
        },
        {
          model: Collection.scope("withDocumentStructure"),
          as: "collection",
        },
      ],
      rejectOnEmpty: true,
    });

    if (share.team.suspendedAt) {
      throw NotFoundError();
    }

    if (!share.team.sharing) {
      throw AuthorizationError();
    }

    if (!!share.collection?.archivedAt || !!share.document?.archivedAt) {
      throw InvalidRequestError("Share could not be found.");
    }

    const collection =
      share.collection ??
      (share.document?.collectionId
        ? await Collection.findByPk(share.document.collectionId, {
            includeDocumentStructure: true,
          })
        : undefined);

    if (!collection?.sharing) {
      throw AuthorizationError();
    }

    if (includeTree) {
      if (share.collection) {
        sharedTree = collection.toNavigationNode();
      } else if (share?.document) {
        sharedTree = collection.getDocumentTree(share.document.id) ?? null;
      }
    }
  } else {
    // Here, we're sure that collectionId or documentId is provided with user.
    const where: WhereOptions<Share> = {
      revokedAt: {
        [Op.is]: null,
      },
      teamId: user!.teamId,
    };

    if (collectionId) {
      where.collectionId = collectionId;
    } else if (documentId) {
      where.documentId = documentId;
    }

    share = await Share.scope({
      method: ["withCollectionPermissions", user!.id],
    }).findOne({ where });

    authorize(user!, "read", share);

    if (collectionId) {
      authorize(user!, "read", share.collection);
    }

    // Load the parent shares and return one (needed for share toggle in UI).
    // For collections, we don't have parent shares.
    if (documentId) {
      authorize(user!, "read", share.document);

      // Prioritize the document's collection share if it exists.
      parentShare = share.document.collectionId
        ? await Share.scope({
            method: ["withCollectionPermissions", user!.id],
          }).findOne({
            where: {
              collectionId: share.document.collectionId,
              teamId: user!.teamId,
              revokedAt: {
                [Op.is]: null,
              },
              published: true,
            },
          })
        : null;

      // If no collection share, check for parent document shares.
      if (!parentShare) {
        const collection = share.document.collectionId
          ? await Collection.findByPk(share.document.collectionId, {
              userId: user!.id,
              includeDocumentStructure: true,
            })
          : undefined;
        const parentIds = collection?.getDocumentParents(documentId!);
        parentShare = parentIds
          ? await Share.scope({
              method: ["withCollectionPermissions", user!.id],
            }).findOne({
              where: {
                documentId: parentIds,
                teamId: user!.teamId,
                revokedAt: {
                  [Op.is]: null,
                },
                includeChildDocuments: true,
                published: true,
              },
            })
          : null;
      }

      if (parentShare) {
        authorize(user!, "read", parentShare);
      }
    }
  }

  return {
    share,
    parentShare,
    sharedTree,
  };
}
