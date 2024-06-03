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
import Button from "../Button";
import Flex from "../Flex";
import EmojiIcon from "../Icons/EmojiIcon";
import NudeButton from "../NudeButton";
import Popover from "../Popover";
import EmojiPanel from "./EmojiPanel";
import IconPanel from "./IconPanel";

const outlineIconNames = new Set(Object.keys(IconLibrary.mapping));

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

type IconType = "outline" | "emoji";

const determineIconType = (icon: string | null): IconType => {
  if (!icon) {
    return "outline";
  }
  return outlineIconNames.has(icon) ? "outline" : "emoji";
};

const tabIds = {
  outline: "outline",
  emoji: "emoji",
} satisfies Record<IconType, string>;

const IconEmoji = () => {
  const [icon, setIcon] = React.useState<string | null>("😃");
  const [color, setColor] = React.useState<string | null>(null);

  const theme = useTheme();
  const { t } = useTranslation();

  const iconType = determineIconType(icon);
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
    setIcon(outlineIcon);
    setColor(iconColor);
  };

  const handleEmojiChange = (emoji: string | null) => {
    setIcon(emoji);
    setColor(null);
  };

  return (
    <>
      <PopoverDisclosure {...popover}>
        {(props) => (
          <NudeButton aria-label={t("Show menu")} {...props}>
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
              initial="c"
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
