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
import { randomElement } from "@shared/random";
import { IconLibrary } from "@shared/utils/IconLibrary";
import { colorPalette } from "@shared/utils/collections";
import useOnClickOutside from "~/hooks/useOnClickOutside";
import { IconType, determineIconType } from "~/utils/icon";
import Button from "../Button";
import Flex from "../Flex";
import EmojiIcon from "../Icons/EmojiIcon";
import NudeButton from "../NudeButton";
import Popover from "../Popover";
import EmojiPanel from "./EmojiPanel";
import IconPanel from "./IconPanel";

const IconDisclosure = ({ icon, color }: { icon?: string; color: string }) => {
  const Component = IconLibrary.getComponent(icon || "collection");
  return <Component color={color}>c</Component>;
};

const EmojiDisclosure = ({
  emoji,
  color,
}: {
  emoji?: string | null;
  color: string;
}) =>
  emoji ? <EmojiIcon emoji={emoji} /> : <StyledSmileyIcon color={color} />;

const StyledSmileyIcon = styled(SmileyIcon)`
  flex-shrink: 0;

  @media print {
    display: none;
  }
`;

const tabIds = {
  outline: "outline",
  emoji: "emoji",
} satisfies Record<IconType, string>;

type Props = {
  initial: string;
  icon: string | null;
  color: string | null;
  onChange: (icon: string | null, color: string | null) => void;
  onOpen?: () => void;
  onClose?: () => void;
  className?: string;
};

const IconEmoji = ({
  initial,
  icon,
  color,
  onChange,
  onOpen,
  onClose,
  className,
}: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const iconType = determineIconType(icon) ?? "outline";
  const defaultTab = tabIds[iconType];
  const randomColor = randomElement(colorPalette);

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
            {...props}
          >
            {iconType === "outline" ? (
              <IconDisclosure
                icon={icon || "collection"}
                color={color || randomColor}
              />
            ) : (
              <EmojiDisclosure emoji={icon} color={theme.textTertiary} />
            )}
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
            <NudeButton width="fit-content">Remove</NudeButton>
          </Flex>
          <StyledTabPanel {...tab}>
            <IconPanel
              initial={initial}
              color={color || randomColor}
              icon={icon || "collection"}
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

const StyledTabList = styled(TabList)`
  display: flex;
`;

const StyledTabPanel = styled(TabPanel)`
  height: 450px;
  overflow-y: auto;
`;

export default IconEmoji;
