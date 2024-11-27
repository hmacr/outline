import * as React from "react";
import { useHistory } from "react-router-dom";
import { isInternalUrl } from "@shared/utils/urls";
import {
  determineSidebarContext,
  SidebarContextType,
} from "~/components/Sidebar/components/SidebarContext";
import { useLocationState } from "~/components/Sidebar/hooks/useLocationState";
import { isModKey } from "~/utils/keyboard";
import { sharedDocumentPath } from "~/utils/routeHelpers";
import { isHash } from "~/utils/urls";
import useCurrentUser from "./useCurrentUser";
import useStores from "./useStores";

type Params = {
  /** The share ID of the document being viewed, if any */
  shareId?: string;
};

export default function useEditorClickHandlers({ shareId }: Params) {
  const { documents } = useStores();
  const history = useHistory();
  const user = useCurrentUser({ rejectOnEmpty: false });
  const locationSidebarContext = useLocationState();

  const handleClickLink = React.useCallback(
    (href: string, event: MouseEvent) => {
      // on page hash
      if (isHash(href)) {
        window.location.href = href;
        return;
      }

      let navigateTo = href;

      if (isInternalUrl(href)) {
        // probably absolute
        if (href[0] !== "/") {
          try {
            const url = new URL(href);
            navigateTo = url.pathname + url.hash;
          } catch (err) {
            navigateTo = href;
          }
        }

        // Link to our own API should be opened in a new tab, not in the app
        if (navigateTo.startsWith("/api/")) {
          window.open(href, "_blank");
          return;
        }

        // If we're navigating to an internal document link then prepend the
        // share route to the URL so that the document is loaded in context
        if (
          shareId &&
          navigateTo.includes("/doc/") &&
          !navigateTo.includes(shareId)
        ) {
          navigateTo = sharedDocumentPath(shareId, navigateTo);
        }

        // If we're navigating to a share link from a non-share link then open it in a new tab
        if (!shareId && navigateTo.startsWith("/s/")) {
          window.open(href, "_blank");
          return;
        }

        if (!isModKey(event) && !event.shiftKey) {
          let sidebarContext: SidebarContextType = "collections";
          if (navigateTo.includes("/doc/")) {
            const document = documents.getByUrl(navigateTo);
            if (document) {
              sidebarContext = determineSidebarContext({
                document,
                user,
                currentContext: locationSidebarContext,
              });
            }
          }

          history.push(navigateTo, { sidebarContext });
        } else {
          window.open(navigateTo, "_blank");
        }
      } else {
        window.open(href, "_blank");
      }
    },
    [documents, user, history, shareId, locationSidebarContext]
  );

  return { handleClickLink };
}
