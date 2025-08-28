import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { MenuItem } from "@shared/editor/types";
import { s } from "@shared/styles";
import { TooltipProvider } from "~/components/TooltipContext";
import { useEditor } from "./EditorContext";
import { MediaDimension } from "./MediaDimension";
import ToolbarButton from "./ToolbarButton";
import ToolbarSeparator from "./ToolbarSeparator";
import Tooltip from "./Tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/primitives/Popover";
import {
  MenuButton,
  MenuIconWrapper,
  MenuLabel,
  MenuSeparator,
  SelectedIconWrapper,
} from "~/components/primitives/components/Menu";
import { CheckmarkIcon } from "outline-icons";
import { ActionV2Separator, createActionV2 } from "~/actions";
import { useMenuAction } from "~/hooks/useMenuAction";
import { DropdownMenu } from "~/components/Menu/DropdownMenu";

type Props = {
  items: MenuItem[];
};

/*
 * Renders a dropdown menu in the floating toolbar.
 */
function ToolbarDropdown(props: { active: boolean; item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const { commands, view } = useEditor();
  const { item } = props;
  const { state } = view;

  const closePopover = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClick = useCallback(
    (menuItem: MenuItem) => {
      setForceRender((prev) => prev + 1);
      closePopover();

      const { selection } = state;
      console.log("selection", selection.from, selection.to);

      if (!menuItem.name) {
        return;
      }

      commands[menuItem.name](
        typeof menuItem.attrs === "function"
          ? menuItem.attrs(state)
          : menuItem.attrs
      );
    },
    [commands, state, closePopover]
  );

  const actions = useMemo(
    () =>
      (item.children ?? []).map((child) => {
        if (child.name === "separator") {
          return ActionV2Separator;
        }

        return createActionV2({
          name: child.label,
          section: "ToolbarDropdown",
          icon: child.icon,
          visible: child.visible,
          selected:
            child.active !== undefined ? child.active(state) : undefined,
          dangerous: child.dangerous,
          perform: () => handleClick(child),
          // perform: () => console.log("perform", child.label),
        });
      }),
    [item.children, state, handleClick]
  );

  const rootAction = useMenuAction(actions);

  return (
    <DropdownMenu
      key={forceRender}
      action={rootAction}
      ariaLabel={item.label ?? ""}
    >
      <ToolbarButton hovering={open}>
        {item.label && <Label>{item.label}</Label>}
        {item.icon}
      </ToolbarButton>
    </DropdownMenu>
  );

  const items = useMemo(() => {
    const filteredItems = item.children ? filterMenuItems(item.children) : [];

    const showIcon = filteredItems.find(
      (item) => item.name !== "separator" && !!item.icon
    );

    return filteredItems.map((child, idx) => {
      if (child.name === "separator") {
        return <MenuSeparator key={`separator-${idx}`} />;
      }

      const icon = showIcon ? (
        <MenuIconWrapper aria-hidden>{child.icon}</MenuIconWrapper>
      ) : undefined;

      const selected =
        child.active !== undefined ? child.active(state) : undefined;

      return (
        <MenuButton
          key={child.label}
          $dangerous={child.dangerous}
          onMouseDown={(e) => {
            console.log("menu button mouse down", child.label);
            e.preventDefault();
            e.stopPropagation();
            handleClick(child);
          }}
        >
          {icon}
          <MenuLabel>{child.label}</MenuLabel>
          {selected !== undefined && (
            <StyledSelectedIconWrapper aria-hidden>
              {selected ? <CheckmarkIcon /> : null}
            </StyledSelectedIconWrapper>
          )}
        </MenuButton>
      );
    });
  }, [item.children, handleClick, state]);

  if (!items.length) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger onMouseDown={(e) => e.preventDefault()}>
        <ToolbarButton hovering={open}>
          {item.label && <Label>{item.label}</Label>}
          {item.icon}
        </ToolbarButton>
      </PopoverTrigger>
      <StyledPopoverContent
        aria-label={item.label}
        side="bottom"
        align="start"
        collisionPadding={6}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {items}
      </StyledPopoverContent>
    </Popover>
  );
}

function ToolbarMenu(props: Props) {
  const { commands, view } = useEditor();
  const { items } = props;
  const { state } = view;

  const handleClick = (item: MenuItem) => () => {
    if (!item.name) {
      return;
    }

    commands[item.name](
      typeof item.attrs === "function" ? item.attrs(state) : item.attrs
    );
  };

  return (
    <TooltipProvider>
      <FlexibleWrapper>
        {items.map((item, index) => {
          if (item.name === "separator" && item.visible !== false) {
            return <ToolbarSeparator key={index} />;
          }
          if (item.visible === false || (!item.skipIcon && !item.icon)) {
            return null;
          }
          const isActive = item.active ? item.active(state) : false;

          return (
            <Tooltip
              key={index}
              shortcut={item.shortcut}
              content={item.label === item.tooltip ? undefined : item.tooltip}
            >
              {item.name === "dimensions" ? (
                <MediaDimension key={index} />
              ) : item.children ? (
                <ToolbarDropdown active={isActive && !item.label} item={item} />
              ) : (
                <ToolbarButton
                  onClick={handleClick(item)}
                  active={isActive && !item.label}
                >
                  {item.label && <Label>{item.label}</Label>}
                  {item.icon}
                </ToolbarButton>
              )}
            </Tooltip>
          );
        })}
      </FlexibleWrapper>
    </TooltipProvider>
  );
}

function filterMenuItems(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => item.visible !== false)
    .reduce((acc, item) => {
      // trim separator when the previous item is also a separator.
      if (
        item.name === "separator" &&
        acc[acc.length - 1]?.name === "separator"
      ) {
        return acc;
      }
      return [...acc, item];
    }, [] as MenuItem[])
    .filter((item, index, arr) => {
      // trim when first or last item is a separator.
      if (
        item.name === "separator" &&
        (index === 0 || index === arr.length - 1)
      ) {
        return false;
      }
      return true;
    });
}

const FlexibleWrapper = styled.div`
  color: ${s("textSecondary")};
  overflow: hidden;
  display: flex;
  gap: 6px;

  ${breakpoint("mobile", "tablet")`
    justify-content: space-evenly;
    align-items: baseline;
  `}
`;

const Label = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${s("text")};
`;

const StyledPopoverContent = styled(PopoverContent)`
  width: auto;
  padding: 6px;
`;

const StyledSelectedIconWrapper = styled(SelectedIconWrapper)`
  margin-left: 6px;
`;

export default ToolbarMenu;
