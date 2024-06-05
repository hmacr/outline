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
import styled, { useTheme } from "styled-components";
import { IconLibrary } from "@shared/utils/IconLibrary";
import { IconType, determineIconType } from "@shared/utils/icon";
import useOnClickOutside from "~/hooks/useOnClickOutside";
import Button from "../Button";
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
  onChange,
  onOpen,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  const iconType = determineIconType(icon);
  const defaultTab = iconType ? tabIds[iconType] : tabIds["outline"];

  const popover = usePopoverState({
    placement: "right",
    modal: true,
    unstable_offset: [0, 0],
  });
  const tab = useTabState({ selectedId: defaultTab });

  const handleOutlineIconChange = (
    outlineIcon: string | null,
    iconColor: string
  ) => {
    onChange(outlineIcon, iconColor);
  };

  const handleEmojiChange = (emoji: string | null) => {
    onChange(emoji, null);
  };

  const handleRemove = () => {
    onChange(null, null);
  };

  React.useEffect(() => {
    if (popover.visible) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [onOpen, onClose, popover.visible]);

  // Custom click outside handling rather than using `hideOnClickOutside` from reakit so that we can
  // prevent event bubbling.
  useOnClickOutside(
    popover.unstable_popoverRef,
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
            aria-label={t("Show menu")}
            className={className}
            style={{ width: "32px", height: "32px" }}
            {...props}
          >
            <DisclosureIcon
              iconType={iconType}
              icon={icon}
              color={color}
              size={size}
            />
          </NudeButton>
        )}
      </PopoverDisclosure>
      <Popover {...popover} width={352} shrink aria-label={t("Choose an icon")}>
        <>
          <Flex justify="space-between" align="center">
            <StyledTabList {...tab}>
              <Tab {...tab} id={tabIds.outline}>
                {(props) => (
                  <Button aria-label={t("Icons Tab")} {...props}>
                    Icons
                  </Button>
                )}
              </Tab>
              <Tab {...tab} id={tabIds.emoji}>
                {(props) => (
                  <Button aria-label={t("Emojis Tab")} {...props}>
                    Emojis
                  </Button>
                )}
              </Tab>
            </StyledTabList>
            <NudeButton width="fit-content" onClick={handleRemove}>
              Remove
            </NudeButton>
          </Flex>
          <StyledTabPanel {...tab}>
            <IconPanel
              initial={initial ?? ""}
              color={color}
              icon={icon ?? "collection"}
              onChange={handleOutlineIconChange}
            />
          </StyledTabPanel>
          <StyledTabPanel {...tab}>
            <EmojiPanel onChange={handleEmojiChange} />
          </StyledTabPanel>
        </>
      </Popover>
    </>
  );
};

type DisclosureIconProps = {
  iconType?: IconType;
  icon: string | null;
  color: string | null;
  size: number;
};

const DisclosureIcon = ({
  iconType,
  icon,
  color,
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
        c
      </Component>
    );
  }

  return <EmojiIcon emoji={icon!} size={32} />;
};

// const IconDisclosure = ({ icon, color }: { icon?: string; color: string }) => {
//   const Component = IconLibrary.getComponent(icon || "collection");
//   return <Component color={color}>c</Component>;
// };

// const EmojiDisclosure = ({
//   emoji,
//   color,
// }: {
//   emoji?: string | null;
//   color: string;
// }) =>
//   emoji ? <EmojiIcon emoji={emoji} /> : <StyledSmileyIcon color={color} />;

const StyledSmileyIcon = styled(SmileyIcon)`
  flex-shrink: 0;

  @media print {
    display: none;
  }
`;

const StyledTabList = styled(TabList)`
  display: flex;
`;

const StyledTabPanel = styled(TabPanel)`
  height: 450px;
  overflow-y: auto;
`;

export default IconEmoji;
