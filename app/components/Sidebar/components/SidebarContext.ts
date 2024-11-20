import * as React from "react";

export type SidebarContextType =
  | "collections"
  | "archive"
  | "shared"
  | "starred"
  | `starred-col-${string}` // starred collection id
  | `group-${string}` // group id
  | undefined;

const SidebarContext = React.createContext<SidebarContextType>(undefined);

export const useSidebarContext = () => React.useContext(SidebarContext);

export const starredCollectionSidebarContext = (
  collectionId: string
): SidebarContextType => `starred-col-${collectionId}`;

export const groupSidebarContext = (groupId: string): SidebarContextType =>
  `group-${groupId}`;

export default SidebarContext;
