import { Share } from "@server/models";
import { presentUser } from ".";

export default function presentShare(share: Share, isAdmin = false) {
  const data = {
    id: share.id,
    collectionId: share.collectionId,
    documentId: share.documentId,
    documentTitle: share.collection?.name || share.document?.title,
    documentUrl: share.collection?.path || share.document?.path,
    published: share.published,
    url: share.canonicalUrl,
    urlId: share.urlId,
    createdBy: presentUser(share.user),
    includeChildDocuments: share.includeChildDocuments,
    allowIndexing: share.allowIndexing,
    showLastUpdated: share.showLastUpdated,
    lastAccessedAt: share.lastAccessedAt || undefined,
    views: share.views || 0,
    domain: share.domain,
    createdAt: share.createdAt,
    updatedAt: share.updatedAt,
  };

  if (!isAdmin) {
    delete data.lastAccessedAt;
  }

  return data;
}
