import chunk from "lodash/chunk";
import compact from "lodash/compact";
import concat from "lodash/concat";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { s } from "@shared/styles";
import Flex from "~/components/Flex";
import usePersistedState from "~/hooks/usePersistedState";
import { hover } from "~/styles";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import Text from "../Text";
import Grid from "./Grid";
import SkinPicker from "./SkinPicker";
import {
  EmojiCategory,
  getEmojisWithCategory,
  search,
  EmojiSkin,
  getEmojis,
} from "./emoji-data";

/**
 * This is needed as a constant for react-window.
 * Calculated from the heights of TabPanel and InputSearch.
 */
const GRID_HEIGHT = 362;
/**
 * Emoji size is 24px by default; and we add 4px padding on all sides,
 */
const EMOJI_BUTTON_SIZE = 32;

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
  gridWidth: number;
  query: string;
  panelActive: boolean;
  onEmojiChange: (emoji: string) => void | Promise<void>;
  onQueryChange: (query: string) => void;
};

const EmojiPanel = ({
  gridWidth,
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

  // 24px padding for the Grid
  const emojisPerRow = Math.floor((gridWidth - 24) / EMOJI_BUTTON_SIZE);

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
      <Grid
        ref={scrollableRef}
        width={gridWidth}
        height={GRID_HEIGHT}
        data={dataChunks}
        columns={emojisPerRow}
        itemWidth={EMOJI_BUTTON_SIZE}
      />
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

const UserInputContainer = styled(Flex)`
  height: 48px;
  padding: 6px 12px 0px;
`;

const StyledInputSearch = styled(InputSearch)`
  flex-grow: 1;
`;

const CategoryName = styled(Text)`
  grid-column: 1 / -1;
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
