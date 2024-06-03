import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import * as React from "react";
import styled, { useTheme } from "styled-components";
import { s } from "@shared/styles";
import { toRGB } from "@shared/utils/color";
import useStores from "~/hooks/useStores";
import useUserLocale from "~/hooks/useUserLocale";

/* Locales supported by emoji-mart */
const supportedLocales = [
  "en",
  "ar",
  "be",
  "cs",
  "de",
  "es",
  "fa",
  "fi",
  "fr",
  "hi",
  "it",
  "ja",
  "ko",
  "nl",
  "pl",
  "pt",
  "ru",
  "sa",
  "tr",
  "uk",
  "vi",
  "zh",
];

/**
 * React hook to derive emoji picker's theme from UI theme
 *
 * @returns {string} Theme to use for emoji picker
 */
function usePickerTheme(): string {
  const { ui } = useStores();
  const { theme } = ui;

  if (theme === "system") {
    return "auto";
  }

  return theme;
}

type Props = {
  onChange: (emoji: string | null) => void | Promise<void>;
};

const EmojiPanel = ({ onChange }: Props) => {
  const pickerRef = React.useRef<HTMLDivElement>(null);

  const theme = useTheme();
  const pickerTheme = usePickerTheme();
  const locale = useUserLocale(true) ?? "en";

  const handleEmojiChange = React.useCallback(
    async (emoji) => {
      await onChange(emoji ? emoji.native : null);
    },
    [onChange]
  );

  return (
    <PickerStyles ref={pickerRef}>
      <Picker
        data={data}
        locale={supportedLocales.includes(locale) ? locale : "en"}
        onEmojiSelect={handleEmojiChange}
        theme={pickerTheme}
        previewPosition="none"
      />
    </PickerStyles>
  );
};

const PickerStyles = styled.div`
  em-emoji-picker {
    width: 100%;
    --shadow: none;
    --font-family: ${s("fontFamily")};
    --rgb-background: ${(props) => toRGB(props.theme.menuBackground)};
    --rgb-accent: ${(props) => toRGB(props.theme.accent)};
    --border-radius: 6px;
  }
`;

export default EmojiPanel;
