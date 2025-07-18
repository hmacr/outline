import * as React from "react";
import {
  ContextMenu as ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuContent,
} from "~/components/primitives/ContextMenu";
import { actionV2ToMenuItem } from "~/actions";
import useActionContext from "~/hooks/useActionContext";
import useMobile from "~/hooks/useMobile";
import { ActionV2Variant, ActionV2WithChildren } from "~/types";
import { toContextMenuItems } from "./transformer";

type Props = {
  action: ActionV2WithChildren;
  children: React.ReactNode;
  ariaLabel: string;
};

export function ContextMenu({ action, children, ariaLabel }: Props) {
  const isMobile = useMobile();
  const contentRef =
    React.useRef<React.ElementRef<typeof ContextMenuContent>>(null);
  const context = useActionContext({
    isContextMenu: true,
  });
  const menuItems = (action.children as ActionV2Variant[]).map((childAction) =>
    actionV2ToMenuItem(childAction, context)
  );

  const enablePointerEvents = React.useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.pointerEvents = "auto";
    }
  }, []);

  const disablePointerEvents = React.useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.pointerEvents = "none";
    }
  }, []);

  if (isMobile) {
    return <>children</>;
  }

  const content = toContextMenuItems(menuItems);

  if (!content) {
    return <>children</>;
  }

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger aria-label={ariaLabel}>{children}</ContextMenuTrigger>
      <ContextMenuContent
        aria-label={ariaLabel}
        onAnimationStart={disablePointerEvents}
        onAnimationEnd={enablePointerEvents}
      >
        {content}
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}
