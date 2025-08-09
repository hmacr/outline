import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { MenuItem } from "@shared/editor/types";
import { s } from "@shared/styles";
import { TooltipProvider } from "~/components/TooltipContext";
import { DropdownMenu } from "~/components/Menu/DropdownMenu";
import { useEditor } from "./EditorContext";
import { MediaDimension } from "./MediaDimension";
import ToolbarButton from "./ToolbarButton";
import ToolbarSeparator from "./ToolbarSeparator";
import Tooltip from "./Tooltip";
import { ActionV2Separator, createActionV2 } from "~/actions";
import { useMenuAction } from "~/hooks/useMenuAction";
import { useTranslation } from "react-i18next";

type Props = {
  items: MenuItem[];
};

/*
 * Renders a dropdown menu in the floating toolbar.
 */
function ToolbarDropdown(props: { active: boolean; item: MenuItem }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { commands, view } = useEditor();
  const { item } = props;
  const { state } = view;

  const handleOpen = useCallback(() => setOpen(true), []);

  const handleClose = useCallback(() => setOpen(false), []);

  const actions = useMemo(() => {
    const handleClick = (menuItem: MenuItem) => () => {
      if (!menuItem.name) {
        return;
      }

      commands[menuItem.name](
        typeof menuItem.attrs === "function"
          ? menuItem.attrs(state)
          : menuItem.attrs
      );
    };

    return item.children
      ? item.children.map((child) => {
          if (child.name === "separator") {
            return ActionV2Separator;
          }

          return createActionV2({
            name: child.label,
            section: "Toolbar",
            icon: child.icon,
            dangerous: child.dangerous,
            visible: child.visible,
            selected:
              child.active !== undefined ? child.active(state) : undefined,
            perform: handleClick(child),
          });
        })
      : [];
  }, [item.children, commands, state]);

  const rootAction = useMenuAction(actions);

  return (
    <DropdownMenu
      action={rootAction}
      ariaLabel={item.label ?? t("Show menu")}
      onOpen={handleOpen}
      onClose={handleClose}
    >
      <ToolbarButton hovering={open}>
        {item.label && <Label>{item.label}</Label>}
        {item.icon}
      </ToolbarButton>
    </DropdownMenu>
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

export default ToolbarMenu;
