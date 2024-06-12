import React from "react";
import { EmojiSkin } from "~/components/IconEmoji/emoji-data";
import usePersistedState from "./usePersistedState";

const STORAGE_KEYS = {
  Base: "icon-state",
  EmojiSkin: "emoji-skin",
  IconsFrequency: "icons-freq",
  EmojisFrequency: "emojis-freq",
  LastIcon: "last-icon",
  LastEmoji: "last-emoji",
};

const FREQUENTLY_USED_COUNT = {
  Get: 24,
  Track: 30,
};

type State = {
  emojiSkin: EmojiSkin;
  setEmojiSkin: (skin: EmojiSkin) => void;
  incrementIconCount: (icon: string) => void;
  incrementEmojiCount: (emoji: string) => void;
  getFrequentlyUsedIcons: () => string[];
  getFrequentlyUsedEmojis: () => string[];
};

export default function useIconState(): State {
  const [emojiSkin, setEmojiSkin] = usePersistedState<EmojiSkin>(
    getStorageKey(STORAGE_KEYS.EmojiSkin),
    EmojiSkin.Default
  );

  const [iconsFreq, setIconsFreq] = usePersistedState<Record<string, number>>(
    getStorageKey(STORAGE_KEYS.IconsFrequency),
    {}
  );

  const [emojisFreq, setEmojisFreq] = usePersistedState<Record<string, number>>(
    getStorageKey(STORAGE_KEYS.EmojisFrequency),
    {}
  );

  const [lastIcon, setLastIcon] = usePersistedState<string | undefined>(
    getStorageKey(STORAGE_KEYS.LastIcon),
    undefined
  );

  const [lastEmoji, setLastEmoji] = usePersistedState<string | undefined>(
    getStorageKey(STORAGE_KEYS.LastEmoji),
    undefined
  );

  const incrementIconCount = React.useCallback(
    (icon: string) => {
      iconsFreq[icon] = (iconsFreq[icon] ?? 0) + 1;
      setIconsFreq({ ...iconsFreq });
    },
    [iconsFreq, setIconsFreq]
  );

  const incrementEmojiCount = React.useCallback(
    (emoji: string) => {
      emojisFreq[emoji] = (emojisFreq[emoji] ?? 0) + 1;
      setEmojisFreq({ ...emojisFreq });
    },
    [emojisFreq, setEmojisFreq]
  );

  const getFrequentlyUsedIcons = React.useCallback(() => {
    const freqArr = sortAndTrimFrequencies(iconsFreq);
    setIconsFreq(Object.fromEntries(freqArr));
    return freqArr.splice(FREQUENTLY_USED_COUNT.Get).map(([icon, _]) => icon);
  }, [iconsFreq, setIconsFreq]);

  const getFrequentlyUsedEmojis = React.useCallback(() => {
    const freqArr = sortAndTrimFrequencies(emojisFreq);
    setEmojisFreq(Object.fromEntries(freqArr));
    return freqArr.splice(FREQUENTLY_USED_COUNT.Get).map(([emoji, _]) => emoji);
  }, [emojisFreq, setEmojisFreq]);

  return {
    emojiSkin,
    setEmojiSkin,
    incrementIconCount,
    incrementEmojiCount,
    getFrequentlyUsedIcons,
    getFrequentlyUsedEmojis,
  };
}

const getStorageKey = (key: string) => `${STORAGE_KEYS.Base}.${key}`;

// Sorts and trims the frequency data in case the tracked items are greater than the required items
const sortAndTrimFrequencies = (freq: Record<string, number>) =>
  Object.entries(freq)
    .sort((a, b) => (a[1] > b[1] ? -1 : 1))
    .splice(FREQUENTLY_USED_COUNT.Track);
