import React from "react";
import { EmojiSkin } from "~/components/IconEmoji/emoji-data";
import usePersistedState from "./usePersistedState";

const STORAGE_KEY = "icon-state";
const FREQUENTLY_USED_COUNT = {
  Get: 24,
  Track: 30,
};

type State = {
  emojiSkin: EmojiSkin;
  iconsFrequency: Record<string, number>;
  emojisFrequency: Record<string, number>;
  lastUsedIcon?: string;
  lastUsedEmoji?: string;
};

type Actions = {
  getEmojiSkin: () => EmojiSkin;
  setEmojiSkin: (skin: EmojiSkin) => void;
  incrementIconCount: (icon: string) => void;
  incrementEmojiCount: (emoji: string) => void;
  getFrequentlyUsedIcons: () => string[];
  getFrequentlyUsedEmojis: () => string[];
};

export default function useIconState(): Actions {
  const [iconState, setIconState] = usePersistedState<State>(STORAGE_KEY, {
    emojiSkin: EmojiSkin.Default,
    iconsFrequency: {},
    emojisFrequency: {},
  });

  const getEmojiSkin = React.useCallback(
    () => iconState.emojiSkin,
    [iconState.emojiSkin]
  );

  const setEmojiSkin = React.useCallback(
    (skin: EmojiSkin) => {
      setIconState({ ...iconState, emojiSkin: skin });
    },
    [iconState, setIconState]
  );

  const incrementIconCount = React.useCallback(
    (icon: string) => {
      const iconsFrequency = iconState.iconsFrequency ?? {};
      iconsFrequency[icon] = (iconsFrequency[icon] ?? 0) + 1;
      setIconState({ ...iconState });
    },
    [iconState, setIconState]
  );

  const incrementEmojiCount = React.useCallback(
    (emoji: string) => {
      const emojisFrequency = iconState.emojisFrequency ?? {};
      emojisFrequency[emoji] = (emojisFrequency[emoji] ?? 0) + 1;
      setIconState({ ...iconState });
    },
    [iconState, setIconState]
  );

  const getFrequentlyUsedIcons = React.useCallback(() => {
    const freqArr = sortAndTrimFrequencies(iconState.iconsFrequency);

    setIconState({
      ...iconState,
      iconsFrequency: Object.fromEntries(freqArr),
    });

    return freqArr.splice(FREQUENTLY_USED_COUNT.Get).map(([icon, _]) => icon);
  }, [iconState, setIconState]);

  const getFrequentlyUsedEmojis = React.useCallback(() => {
    const freqArr = sortAndTrimFrequencies(iconState.emojisFrequency);

    setIconState({
      ...iconState,
      emojisFrequency: Object.fromEntries(freqArr),
    });

    return freqArr.splice(FREQUENTLY_USED_COUNT.Get).map(([emoji, _]) => emoji);
  }, [iconState, setIconState]);

  return {
    getEmojiSkin,
    setEmojiSkin,
    incrementIconCount,
    incrementEmojiCount,
    getFrequentlyUsedIcons,
    getFrequentlyUsedEmojis,
  };
}

// Sorts and trims the frequency data in case the tracked items are greater than the required items
const sortAndTrimFrequencies = (freq: Record<string, number>) =>
  Object.entries(freq)
    .sort((a, b) => (a[1] > b[1] ? -1 : 1))
    .splice(FREQUENTLY_USED_COUNT.Track);
