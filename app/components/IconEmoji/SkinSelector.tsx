import React from "react";
import { useTranslation } from "react-i18next";
import { PopoverDisclosure, usePopoverState } from "reakit";
import styled from "styled-components";
import { s } from "@shared/styles";
import useOnClickOutside from "~/hooks/useOnClickOutside";
import { hover } from "~/styles";
import NudeButton from "../NudeButton";
import Popover from "../Popover";
import { getEmojiVariants, EmojiSkin } from "./emoji-data";

const SkinSelector = ({
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
  const popoverWidth = React.useMemo(
    () => 32 * Object.keys(handEmojiVariants).length,
    [handEmojiVariants]
  );

  const popover = usePopoverState({
    placement: "bottom",
    modal: true,
    unstable_offset: [0, 0],
  });
  const contentRef = React.useRef<HTMLDivElement | null>(null);

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
          <StyledDisclosure {...props} aria-label={t("Show Skin Selector")}>
            {handEmojiVariants[skin]!.value}
          </StyledDisclosure>
        )}
      </PopoverDisclosure>
      <Popover
        {...popover}
        ref={contentRef}
        width={popoverWidth}
        shrink
        aria-label={t("Skin Selector")}
        onClick={(e) => e.stopPropagation()}
        hideOnClickOutside={false}
      >
        <div>
          {Object.entries(handEmojiVariants).map(([eskin, emoji]) => (
            <EmojiButton
              key={eskin}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                event.preventDefault();
                console.log("emoji button clicked", eskin);
                // onChange(eskin as EmojiSkin);
              }}
            >
              <Emoji>{emoji.value}</Emoji>
            </EmojiButton>
          ))}
        </div>
      </Popover>
    </>
  );
};

const StyledDisclosure = styled(NudeButton)`
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
  border: 1px solid red;

  &: ${hover} {
    background: ${s("listItemHoverBackground")};
  }
`;

const Emoji = styled.span`
  width: 24px;
  height: 24px;
  font-family: ${s("fontFamilyEmoji")};
`;

export default SkinSelector;
