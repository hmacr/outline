import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Flex from "~/components/Flex";
import InputSearch from "../InputSearch";
import { EmojiCategory, emojiData } from "./emoji-data";

const Emoji = ({ value }: { value: string }) => (
  <span
    style={{
      fontFamily:
        "EmojiMart, Segoe UI Emoji, Segoe UI Symbol, Segoe UI, Apple Color Emoji, Twemoji Mozilla, Noto Color Emoji, Android Emoji",
    }}
  >
    {value}
  </span>
);

const Section = ({ category }: { category: EmojiCategory }) => {
  const emojis = emojiData[category];
  return (
    <div>
      {category}
      <SectionGrid>
        {emojis.map((emoji) => (
          <Emoji key={emoji} value={emoji} />
        ))}
      </SectionGrid>
    </div>
  );
};

const SectionGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const CustomPanel = () => {
  const [query, setQuery] = React.useState("");
  const { t } = useTranslation();

  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value.toLowerCase());
  };

  return (
    <Wrapper column gap={12}>
      <InputSearch
        value={query}
        placeholder={`${t("Search emoji")}…`}
        onChange={handleFilter}
        autoFocus
      />
      <div>
        <Section category={EmojiCategory.People} />
        <Section category={EmojiCategory.Nature} />
        <Section category={EmojiCategory.Foods} />
        <Section category={EmojiCategory.Activity} />
        <Section category={EmojiCategory.Places} />
        <Section category={EmojiCategory.Objects} />
        <Section category={EmojiCategory.Symbols} />
        <Section category={EmojiCategory.Flags} />
      </div>
    </Wrapper>
  );
};

const Wrapper = styled(Flex)`
  padding: 12px; // same as emoji-mart picker's padding
`;

export default CustomPanel;
