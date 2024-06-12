import { SmileyIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  PopoverDisclosure,
  Tab,
  TabList,
  TabPanel,
  usePopoverState,
  useTabState,
} from "reakit";
import styled, { css, useTheme } from "styled-components";
import { s } from "@shared/styles";
import { IconLibrary } from "@shared/utils/IconLibrary";
import { IconType, determineIconType } from "@shared/utils/icon";
import useOnClickOutside from "~/hooks/useOnClickOutside";
import { hover } from "~/styles";
import Flex from "../Flex";
import EmojiIcon from "../Icons/EmojiIcon";
import NudeButton from "../NudeButton";
import Popover from "../Popover";
import EmojiPanel from "./EmojiPanel";
import IconPanel from "./IconPanel";

const tabIds = {
  outline: "outline",
  emoji: "emoji",
} satisfies Record<IconType, string>;

type Props = {
  icon: string | null;
  color: string;
  size?: number;
  initial?: string;
  className?: string;
  popoverPosition: "bottom-start" | "right";
  allowDelete?: boolean;
  onChange: (icon: string | null, color: string | null) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

const IconEmoji = ({
  icon,
  color,
  size = 24,
  initial,
  className,
  popoverPosition,
  allowDelete,
  onChange,
  onOpen,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  const [query, setQuery] = React.useState("");
  const [chosenColor, setChosenColor] = React.useState(color);

  const iconType = determineIconType(icon);
  const defaultTab = React.useMemo(
    () => (iconType ? tabIds[iconType] : tabIds["outline"]),
    [iconType]
  );

  const popover = usePopoverState({
    placement: popoverPosition,
    modal: true,
    unstable_offset: [0, 0],
  });
  const tab = useTabState({ selectedId: defaultTab });

  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const resetDefaultTab = React.useCallback(() => {
    tab.select(defaultTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTab]);

  const handleIconChange = React.useCallback(
    (ic: string) => {
      popover.hide();
      onChange(ic, chosenColor);
    },
    [popover, onChange, chosenColor]
  );

  const handleIconColorChange = React.useCallback(
    (c: string) => setChosenColor(c),
    []
  );

  const handleIconRemove = React.useCallback(() => {
    onChange(null, null);
    popover.hide();
  }, [popover, onChange]);

  const handleQueryChange = React.useCallback(
    (q: string) => setQuery(q),
    [setQuery]
  );

  const handlePopoverButtonClick = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.stopPropagation();
      if (popover.visible) {
        popover.hide();
      } else {
        popover.show();
      }
    },
    [popover]
  );

  // Popover open effect
  React.useEffect(() => {
    if (popover.visible) {
      onOpen?.();
    }
  }, [popover.visible, onOpen]);

  // Popover close effect
  React.useEffect(() => {
    if (popover.visible) {
      return;
    }

    if (icon !== null && color !== chosenColor) {
      onChange(icon, chosenColor);
    }
    onClose?.();
    setQuery("");
    resetDefaultTab();
  }, [
    popover.visible,
    color,
    chosenColor,
    icon,
    onClose,
    onChange,
    resetDefaultTab,
  ]);

  // Custom click outside handling rather than using `hideOnClickOutside` from reakit so that we can
  // prevent event bubbling.
  useOnClickOutside(
    contentRef,
    (event) => {
      if (popover.visible) {
        event.stopPropagation();
        event.preventDefault();
        popover.hide();
      }
    },
    { capture: true }
  );

  return (
    <>
      <PopoverDisclosure {...popover}>
        {(props) => (
          <NudeButton
            {...props}
            aria-label={t("Show menu")}
            className={className}
            size={size}
            onClick={handlePopoverButtonClick}
          >
            <DisclosureIcon
              iconType={iconType}
              icon={icon ?? undefined}
              color={chosenColor}
              initial={initial ?? "?"}
              size={size}
            />
          </NudeButton>
        )}
      </PopoverDisclosure>
      <Popover
        {...popover}
        ref={contentRef}
        width={408}
        shrink
        aria-label={t("Icon Picker")}
        onClick={(e) => e.stopPropagation()}
        hideOnClickOutside={false}
      >
        <>
          <TabActionsWrapper justify="space-between" align="center">
            <StyledTabList {...tab}>
              <StyledTab
                {...tab}
                id={tabIds.outline}
                aria-label={t("Icons Tab")}
                active={tab.selectedId === tabIds.outline}
              >
                Icons
              </StyledTab>
              <StyledTab
                {...tab}
                id={tabIds.emoji}
                aria-label={t("Emojis Tab")}
                active={tab.selectedId === tabIds.emoji}
              >
                Emojis
              </StyledTab>
            </StyledTabList>
            {allowDelete && icon && (
              <RemoveButton onClick={handleIconRemove}>Remove</RemoveButton>
            )}
          </TabActionsWrapper>
          <StyledTabPanel {...tab}>
            <IconPanel
              width={408}
              initial={initial ?? "?"}
              color={chosenColor}
              query={query}
              panelActive={popover.visible && tab.selectedId === tabIds.outline}
              onIconChange={handleIconChange}
              onColorChange={handleIconColorChange}
              onQueryChange={handleQueryChange}
            />
          </StyledTabPanel>
          <StyledTabPanel {...tab}>
            {tab.selectedId === tabIds.emoji && (
              <EmojiPanel
                width={408}
                query={query}
                panelActive={popover.visible && tab.selectedId === tabIds.emoji}
                onEmojiChange={handleIconChange}
                onQueryChange={handleQueryChange}
              />
            )}
          </StyledTabPanel>
        </>
      </Popover>
    </>
  );
};

type DisclosureIconProps = {
  iconType?: IconType;
  icon?: string;
  color: string;
  initial: string;
  size: number;
};

const DisclosureIcon = ({
  iconType,
  icon,
  color,
  initial,
  size,
}: DisclosureIconProps) => {
  const theme = useTheme();

  if (!iconType) {
    return <StyledSmileyIcon color={theme.textTertiary} size={size} />;
  }

  if (iconType === "outline") {
    const Component = IconLibrary.getComponent(icon || "collection");
    return (
      <Component color={color!} size={size}>
        {initial}
      </Component>
    );
  }

  return <EmojiIcon emoji={icon!} size={size} />;
};

const StyledSmileyIcon = styled(SmileyIcon)`
  flex-shrink: 0;

  @media print {
    display: none;
  }
`;

const RemoveButton = styled(NudeButton)`
  width: auto;
  height: 36px;
  font-weight: 500;
  font-size: 14px;
  color: ${s("textTertiary")};
  padding: 8px 12px;
  transition: color 100ms ease-in-out;
  &: ${hover} {
    color: ${s("textSecondary")};
  }
`;

const TabActionsWrapper = styled(Flex)`
  padding: 0px 6px;
  border-bottom: 1px solid ${s("inputBorder")};
`;

const StyledTabList = styled(TabList)`
  display: flex;
  height: 36px;
`;

const StyledTab = styled(Tab)<{ active: boolean }>`
  position: relative;
  font-weight: 500;
  font-size: 14px;
  cursor: var(--pointer);
  background: none;
  border: 0;
  padding: 8px 12px;
  user-select: none;
  color: ${({ active }) => (active ? s("textSecondary") : s("textTertiary"))};
  transition: color 100ms ease-in-out;

  &: ${hover} {
    color: ${s("textSecondary")};
  }

  ${({ active }) =>
    active &&
    css`
      &:after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: ${s("textSecondary")};
      }
    `}
`;

const StyledTabPanel = styled(TabPanel)`
  height: 410px;
  overflow-y: auto;
`;

export default IconEmoji;