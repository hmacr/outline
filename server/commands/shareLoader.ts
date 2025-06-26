import { Op, WhereOptions } from "sequelize";
import isUUID from "validator/lib/isUUID";
import { UrlHelper } from "@shared/utils/UrlHelper";
import { Document, Share, User } from "@server/models";

type Props = {
  id?: string;
  documentId?: string;
  teamId?: string;
  user?: User;
};

export async function loadShare({ id, documentId, teamId, user }: Props) {
  if (!id && !(documentId && user)) {
    throw new Error("Either id (or) documentId and user must be provided");
  }

  const urlId =
    id && !isUUID(id) && UrlHelper.SHARE_URL_SLUG_REGEX.test(id)
      ? id
      : undefined;

  if (urlId && !teamId) {
    throw new Error("teamId required for fetching share using urlId");
  }

  if (id) {
    const where: WhereOptions<Share> = {
      revokedAt: {
        [Op.is]: null,
      },
    };

    if (urlId) {
      where.urlId = urlId;
      where.teamId = teamId;
    } else {
      where.id = id;
    }

    const share = await Share.findOne({
      where,
      include: [
        {
          model: Document.scope("withDrafts"),
          required: true,
          as: "document",
        },
      ],
    });

    if (!share || share.document?.archivedAt) {
      throw InvalidRequestError("Document could not be found for shareId");
    }
  }
}
