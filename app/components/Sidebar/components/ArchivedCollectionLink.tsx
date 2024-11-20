import { observer } from "mobx-react";
import * as React from "react";
import Collection from "~/models/Collection";
import useStores from "~/hooks/useStores";
import CollectionLink from "./CollectionLink";
import CollectionLinkChildren from "./CollectionLinkChildren";
import Relative from "./Relative";
import { useSidebarContext } from "./SidebarContext";

type Props = {
  collection: Collection;
  depth?: number;
};

export const ArchivedCollectionLink = observer(
  ({ collection, depth }: Props) => {
    const { documents, ui } = useStores();
    const sidebarContext = useSidebarContext();
    const [expanded, setExpanded] = React.useState(
      collection.id === ui.activeCollectionId &&
        sidebarContext === ui.activeSidebarContext
    );

    const handleDisclosureClick = React.useCallback((ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      setExpanded((e) => !e);
    }, []);

    const handleClick = React.useCallback(() => {
      setExpanded(true);
    }, []);

    React.useEffect(() => {
      if (
        collection.id === ui.activeCollectionId &&
        sidebarContext === ui.activeSidebarContext
      ) {
        setExpanded(true);
      }
    }, [
      collection.id,
      sidebarContext,
      ui.activeCollectionId,
      ui.activeSidebarContext,
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
);
