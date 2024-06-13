import chunk from "lodash/chunk";
import compact from "lodash/compact";
import concat from "lodash/concat";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import styled from "styled-components";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import usePersistedState from "~/hooks/usePersistedState";
import { hover } from "~/styles";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import Text from "../Text";
import SkinPicker from "./SkinPicker";
import {
  EmojiCategory,
  getEmojisWithCategory,
  search,
  EmojiSkin,
  getEmojis,
} from "./emoji-data";

const FREQUENTLY_USED_COUNT = {
  Get: 24,
  Track: 30,
};

const STORAGE_KEYS = {
  Base: "icon-state",
  EmojiSkin: "emoji-skin",
  IconsFrequency: "icons-freq",
  EmojisFrequency: "emojis-freq",
  LastIcon: "last-icon",
  LastEmoji: "last-emoji",
};

const getStorageKey = (key: string) => `${STORAGE_KEYS.Base}.${key}`;

const sortFrequencies = (freqs: [string, number][]) =>
  freqs.sort((a, b) => (a[1] >= b[1] ? -1 : 1));

const useEmojiState = () => {
  const [emojiSkin, setEmojiSkin] = usePersistedState<EmojiSkin>(
    getStorageKey(STORAGE_KEYS.EmojiSkin),
    EmojiSkin.Default
  );
  const [emojisFreq, setEmojisFreq] = usePersistedState<Record<string, number>>(
    getStorageKey(STORAGE_KEYS.EmojisFrequency),
    {}
  );
  const [lastEmoji, setLastEmoji] = usePersistedState<string | undefined>(
    getStorageKey(STORAGE_KEYS.LastEmoji),
    undefined
  );

  const incrementEmojiCount = React.useCallback(
    (emoji: string) => {
      emojisFreq[emoji] = (emojisFreq[emoji] ?? 0) + 1;
      setEmojisFreq({ ...emojisFreq });
      setLastEmoji(emoji);
    },
    [emojisFreq, setEmojisFreq, setLastEmoji]
  );

  const getFreqEmojis = React.useCallback(() => {
    const freqs = Object.entries(emojisFreq);
    if (freqs.length > FREQUENTLY_USED_COUNT.Track) {
      sortFrequencies(freqs).splice(FREQUENTLY_USED_COUNT.Track);
      setEmojisFreq(Object.fromEntries(freqs));
    }

    const emojis = sortFrequencies(freqs)
      .slice(0, FREQUENTLY_USED_COUNT.Get)
      .map(([emoji, _]) => emoji);

    const isLastPresent = emojis.includes(lastEmoji ?? "");
    if (lastEmoji && !isLastPresent) {
      emojis.pop();
      emojis.push(lastEmoji);
    }

    return emojis;
  }, [emojisFreq, setEmojisFreq, lastEmoji]);

  return {
    emojiSkin,
    setEmojiSkin,
    incrementEmojiCount,
    getFreqEmojis,
  };
};

type Props = {
  width: number;
  query: string;
  panelActive: boolean;
  onEmojiChange: (emoji: string) => void | Promise<void>;
  onQueryChange: (query: string) => void;
};

const EmojiPanel = ({
  width,
  query,
  panelActive,
  onEmojiChange,
  onQueryChange,
}: Props) => {
  const { t } = useTranslation();

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const scrollableRef = React.useRef<HTMLDivElement | null>(null);

  const {
    emojiSkin: skin,
    setEmojiSkin,
    incrementEmojiCount,
    getFreqEmojis,
  } = useEmojiState();

  const freqEmojis = React.useMemo(() => getFreqEmojis(), [getFreqEmojis]);

  const handleFilter = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.target.value.toLowerCase());
    },
    [onQueryChange]
  );

  const handleSkinChange = React.useCallback(
    (emojiSkin: EmojiSkin) => {
      setEmojiSkin(emojiSkin);
    },
    [setEmojiSkin]
  );

  const handleEmojiClick = React.useCallback(
    (id: string, emoji: string) => {
      void onEmojiChange(emoji);
      incrementEmojiCount(id);
    },
    [onEmojiChange, incrementEmojiCount]
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
        onClick: handleEmojiClick,
      })
    : getAllEmojis({
        skin,
        emojisPerRow,
        freqEmojis,
        onClick: handleEmojiClick,
      });

  React.useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = 0;
    }
    searchRef.current?.focus();
  }, [panelActive]);

  return (
    <Flex column>
      <UserInputContainer align="center" gap={12}>
        <StyledInputSearch
          ref={searchRef}
          value={query}
          placeholder={`${t("Search emoji")}…`}
          onChange={handleFilter}
        />
        <SkinPicker skin={skin} onChange={handleSkinChange} />
      </UserInputContainer>
      <StyledVirtualList
        width={width}
        height={358}
        itemCount={dataChunks.length}
        itemSize={32}
        itemData={{ dataChunks }}
        outerRef={scrollableRef}
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
  onClick: (id: string, emoji: string) => void | Promise<void>;
}) => {
  const emojis = search({ query, skin });

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
    <EmojiButton key={emoji.id} onClick={() => onClick(emoji.id, emoji.value)}>
      <Emoji>{emoji.value}</Emoji>
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
  freqEmojis,
  onClick,
}: {
  skin: EmojiSkin;
  emojisPerRow: number;
  freqEmojis: string[];
  onClick: (id: string, emoji: string) => void | Promise<void>;
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

    const emojis = getEmojisWithCategory({ skin })[emojiCategory];
    const emojiButtons = emojis.map((emoji) => (
      <EmojiButton
        key={emoji.id}
        onClick={() => onClick(emoji.id, emoji.value)}
      >
        <Emoji>{emoji.value}</Emoji>
      </EmojiButton>
    ));

    const emojiChunks = chunk(emojiButtons, emojisPerRow);

    const data: React.ReactNode[][] = [];
    data.push([category]);
    emojiChunks.forEach((emojiChunk) => data.push(emojiChunk));
    return data;
  };

  const getFrequentEmojis = () => {
    if (freqEmojis.length === 0) {
      return;
    }

    const category = (
      <CategoryName
        key={"frequently_used"}
        type="tertiary"
        size="xsmall"
        weight="bold"
      >
        Frequently Used
      </CategoryName>
    );

    const emojis = getEmojis({ ids: freqEmojis, skin });
    const emojiButtons = emojis.map((emoji) => (
      <EmojiButton
        key={emoji.id}
        onClick={() => onClick(emoji.id, emoji.value)}
      >
        <Emoji>{emoji.value}</Emoji>
      </EmojiButton>
    ));

    const emojiChunks = chunk(emojiButtons, emojisPerRow);

    const data: React.ReactNode[][] = [];
    data.push([category]);
    emojiChunks.forEach((emojiChunk) => data.push(emojiChunk));
    return data;
  };

  return compact(
    concat(
      getFrequentEmojis(),
      getCategoryData(EmojiCategory.People),
      getCategoryData(EmojiCategory.Nature),
      getCategoryData(EmojiCategory.Foods),
      getCategoryData(EmojiCategory.Activity),
      getCategoryData(EmojiCategory.Places),
      getCategoryData(EmojiCategory.Objects),
      getCategoryData(EmojiCategory.Symbols),
      getCategoryData(EmojiCategory.Flags)
    )
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

export default EmojiPanel;
