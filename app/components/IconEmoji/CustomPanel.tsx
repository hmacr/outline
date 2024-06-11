import chunk from "lodash/chunk";
import concat from "lodash/concat";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import styled from "styled-components";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import { hover } from "~/styles";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import Text from "../Text";
import SkinSelector from "./SkinSelector";
import { EmojiCategory, getEmojis, search, EmojiSkin } from "./emoji-data";

type Props = {
  width: number;
  onChange: (emoji: string | null) => void | Promise<void>;
};

const CustomPanel = ({ width, onChange }: Props) => {
  const [query, setQuery] = React.useState("");
  const [skin, setSkin] = React.useState(EmojiSkin.Medium);
  const { t } = useTranslation();

  const handleFilter = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value.toLowerCase());
    },
    [setQuery]
  );

  // 24px padding for the container
  // icon size is 24px by default; and we add 4px padding on all sides => 32px is the button size.
  const emojisPerRow = React.useMemo(
    () => Math.floor((width - 24) / 32),
    [width]
  );

  const isSearch = query !== "";
  const dataChunks = isSearch
    ? getSearchResults({
        query,
        skin,
        emojisPerRow,
        onClick: onChange,
      })
    : getAllEmojis({ skin, emojisPerRow, onClick: onChange });

  return (
    <Flex column>
      <UserInputContainer align="center" gap={12}>
        <StyledInputSearch
          value={query}
          placeholder={`${t("Search emoji")}…`}
          onChange={handleFilter}
        />
        <SkinSelector
          skin={skin}
          onChange={(es: EmojiSkin) => {
            console.log("setSkin called");
            setSkin(es);
          }}
        />
      </UserInputContainer>
      <StyledVirtualList
        width={width}
        height={358}
        itemCount={dataChunks.length}
        itemSize={32}
        itemData={{ dataChunks }}
      >
        {DataRow}
      </StyledVirtualList>
    </Flex>
  );
};

const getSearchResults = ({
  query,
  skin,
  emojisPerRow,
  onClick,
}: {
  query: string;
  skin: EmojiSkin;
  emojisPerRow: number;
  onClick: (emoji: string | null) => void | Promise<void>;
}) => {
  const emojis = search({ value: query, skin }).map((emoji) => emoji.value);

  const category = (
    <CategoryName
      key={"search_results"}
      type="tertiary"
      size="xsmall"
      weight="bold"
    >
      Search Results
    </CategoryName>
  );

  const emojiButtons = emojis.map((emoji) => (
    <EmojiButton key={emoji} onClick={() => onClick(emoji)}>
      <Emoji>{emoji}</Emoji>
    </EmojiButton>
  ));

  const emojiChunks = chunk(emojiButtons, emojisPerRow);

  const data: React.ReactNode[][] = [];
  data.push([category]);
  emojiChunks.forEach((emojiChunk) => data.push(emojiChunk));
  return data;
};

const getAllEmojis = ({
  skin,
  emojisPerRow,
  onClick,
}: {
  skin: EmojiSkin;
  emojisPerRow: number;
  onClick: (emoji: string | null) => void | Promise<void>;
}): React.ReactNode[][] => {
  const getCategoryData = (emojiCategory: EmojiCategory) => {
    const category = (
      <CategoryName
        key={emojiCategory}
        type="tertiary"
        size="xsmall"
        weight="bold"
      >
        {emojiCategory}
      </CategoryName>
    );

    const emojiButtons = getEmojis({ skin })[emojiCategory].map((emoji) => (
      <EmojiButton key={emoji.value} onClick={() => onClick(emoji.value)}>
        <Emoji>{emoji.value}</Emoji>
      </EmojiButton>
    ));

    const emojiChunks = chunk(emojiButtons, emojisPerRow);

    const data: React.ReactNode[][] = [];
    data.push([category]);
    emojiChunks.forEach((emojiChunk) => data.push(emojiChunk));
    return data;
  };

  return concat(
    getCategoryData(EmojiCategory.People),
    getCategoryData(EmojiCategory.Nature),
    getCategoryData(EmojiCategory.Foods),
    getCategoryData(EmojiCategory.Activity),
    getCategoryData(EmojiCategory.Places),
    getCategoryData(EmojiCategory.Objects),
    getCategoryData(EmojiCategory.Symbols),
    getCategoryData(EmojiCategory.Flags)
  );
};

type DataRowProps = {
  dataChunks: React.ReactNode[][];
};

const DataRow = ({
  index: rowIdx,
  style,
  data,
}: ListChildComponentProps<DataRowProps>) => {
  const { dataChunks } = data;
  const row = dataChunks[rowIdx];

  return (
    <Flex style={style} align="center">
      {row}
    </Flex>
  );
};

const StyledVirtualList = styled(FixedSizeList<DataRowProps>)`
  padding: 0px 12px;

  // Needed for the absolutely positioned children
  // to respect the VirtualList's padding
  & > div {
    position: relative;
  }
`;

const UserInputContainer = styled(Flex)`
  height: 48px;
  padding: 6px 12px 0px;
`;

const StyledInputSearch = styled(InputSearch)`
  flex-grow: 1;
`;

const CategoryName = styled(Text)`
  padding-left: 6px;
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

export default CustomPanel;
