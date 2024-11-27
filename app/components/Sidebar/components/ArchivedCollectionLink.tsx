import * as React from "react";
import Collection from "~/models/Collection";
import { useLocationSidebarContext } from "~/hooks/useLocationSidebarContext";
import useStores from "~/hooks/useStores";
import CollectionLink from "./CollectionLink";
import CollectionLinkChildren from "./CollectionLinkChildren";
import Relative from "./Relative";
import { useSidebarContext } from "./SidebarContext";

type Props = {
  collection: Collection;
  depth?: number;
};

export function ArchivedCollectionLink({ collection, depth }: Props) {
  const { documents, ui } = useStores();
  const sidebarContext = useSidebarContext();
  const locationSidebarContext = useLocationSidebarContext();
  const [expanded, setExpanded] = React.useState(
    collection.id === ui.activeCollectionId &&
      sidebarContext === locationSidebarContext
  );

  const handleDisclosureClick = React.useCallback((ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setExpanded((e) => !e);
  }, []);

  const handleClick = React.useCallback(() => {
    setExpanded(true);
  }, []);

  // If the current collection is active and relevant to the sidebar section we
  // are in then expand it automatically
  React.useEffect(() => {
    if (
      collection.id === ui.activeCollectionId &&
      sidebarContext === locationSidebarContext
    ) {
      setExpanded(true);
    }
  }, [
    collection.id,
    ui.activeCollectionId,
    sidebarContext,
    locationSidebarContext,
  ]);

  return (
    <>
      <CollectionLink
        depth={depth ? depth : 0}
        collection={collection}
        expanded={expanded}
        activeDocument={documents.active}
        onDisclosureClick={handleDisclosureClick}
        onClick={handleClick}
      />
      <Relative>
        <CollectionLinkChildren
          collection={collection}
          expanded={expanded}
          prefetchDocument={documents.prefetchDocument}
        />
      </Relative>
    </>
  );
}
