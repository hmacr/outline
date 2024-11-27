import * as React from "react";
import Document from "~/models/Document";
import User from "~/models/User";

export type SidebarContextType =
  | "collections"
  | "shared"
  | `group-${string}`
  | `starred-${string}`
  | undefined;

const SidebarContext = React.createContext<SidebarContextType>(undefined);

export const useSidebarContext = () => React.useContext(SidebarContext);

export const groupSidebarContext = (groupId: string): SidebarContextType =>
  `group-${groupId}`;

export const starredSidebarContext = (modelId: string): SidebarContextType =>
  `starred-${modelId}`;

export const determineSidebarContext = ({
  document,
  user,
  currentContext,
}: {
  document: Document;
  user: User;
  currentContext?: SidebarContextType;
}): SidebarContextType => {
  const isStarred = document.isStarred || !!document.collection?.isStarred;
  const preferStarred = !currentContext || currentContext.startsWith("starred");

  if (isStarred && preferStarred) {
    const currentlyInStarredCollection =
      currentContext === starredSidebarContext(document.collectionId ?? "");

    return document.isStarred && !currentlyInStarredCollection
      ? starredSidebarContext(document.id)
      : starredSidebarContext(document.collectionId!);
  }

  const membershipType = document.membershipType;

  // if (document.isStarred && preferStarred) {
  //   return starredSidebarContext(document.id);
  // } else if (document.collection?.isStarred && preferStarred) {
  //   return starredSidebarContext(document.collectionId!);
  // } else if (membershipType === "direct") {
  //   return "shared";
  // } else if (membershipType === "group") {
  //   const group = user.groupsWithDocumentMemberships.find(
  //     (g) => !!g.documentMemberships.find((m) => m.documentId === document.id)
  //   );
  //   return groupSidebarContext(group?.id ?? "");
  // }

  if (membershipType === "document") {
    return "shared";
  } else if (membershipType === "group") {
    const group = user.groupsWithDocumentMemberships.find(
      (g) => !!g.documentMemberships.find((m) => m.documentId === document.id)
    );
    return groupSidebarContext(group?.id ?? "");
  }

  return "collections";
};

export default SidebarContext;
