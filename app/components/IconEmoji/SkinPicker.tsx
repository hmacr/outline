import React from "react";
import { useTranslation } from "react-i18next";
import { Menu, MenuButton, MenuItem, useMenuState } from "reakit";
import styled from "styled-components";
import { depths, s } from "@shared/styles";
import { hover } from "~/styles";
import Flex from "../Flex";
import NudeButton from "../NudeButton";
import { getEmojiVariants, EmojiSkin } from "./emoji-data";

const SkinPicker = ({
  skin,
  onChange,
}: {
  skin: EmojiSkin;
  onChange: (skin: EmojiSkin) => void;
}) => {
  const { t } = useTranslation();

  const handEmojiVariants = React.useMemo(
    () => getEmojiVariants({ id: "hand" }),
    []
  );

  const menu = useMenuState({
    placement: "bottom",
  });

  const handleSkinClick = React.useCallback(
    (emojiSkin) => {
      menu.hide();
      onChange(emojiSkin);
    },
    [menu, onChange]
  );

  const menuItems = React.useMemo(
    () =>
      Object.entries(handEmojiVariants).map(([eskin, emoji]) => (
        <MenuItem {...menu} key={emoji.value}>
          {(menuprops) => (
            <EmojiButton {...menuprops} onClick={() => handleSkinClick(eskin)}>
              <Emoji>{emoji.value}</Emoji>
            </EmojiButton>
          )}
        </MenuItem>
      )),
    [menu, handEmojiVariants, handleSkinClick]
  );

  return (
    <>
      <MenuButton {...menu}>
        {(props) => (
          <StyledMenuButton {...props} aria-label={t("Show Skin Selector")}>
            {handEmojiVariants[skin]!.value}
          </StyledMenuButton>
        )}
      </MenuButton>
      <Menu {...menu} aria-label={t("Skin Selector")}>
        {(props) => <MenuContainer {...props}>{menuItems}</MenuContainer>}
      </Menu>
    </>
  );
};

const MenuContainer = styled(Flex)`
  z-index: ${depths.menu};
  padding: 4px;
  border-radius: 4px;
  background: ${s("menuBackground")};
  box-shadow: ${s("menuShadow")};
`;

const StyledMenuButton = styled(NudeButton)`
  width: 32px;
  height: 32px;
  border: 1px solid ${s("inputBorder")};
  padding: 4px;

  &: ${hover} {
    border: 1px solid ${s("inputBorderFocused")};
  }
`;

const EmojiButton = styled(NudeButton)`
  width: 32px;
  height: 32px;
  padding: 4px;

  &: ${hover} {
    background: ${s("listItemHoverBackground")};
  }
`;

const Emoji = styled.span`
  width: 24px;
  height: 24px;
  font-family: ${s("fontFamilyEmoji")};
`;

export default SkinPicker;
