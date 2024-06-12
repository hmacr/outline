import React from "react";
import { EmojiSkin } from "~/components/IconEmoji/emoji-data";
import usePersistedState from "./usePersistedState";

const STORAGE_KEY = "icon-state";

type IconState = {
  emojiSkin: EmojiSkin;
};

type IconStateUpdator = {
  setEmojiSkin: (skin: EmojiSkin) => void;
};

export default function useIconState(): [IconState, IconStateUpdator] {
  const [iconState, setIconState] = usePersistedState<IconState>(STORAGE_KEY, {
    emojiSkin: EmojiSkin.Default,
  });

  const setEmojiSkin = React.useCallback(
    (skin: EmojiSkin) => {
      setIconState({ emojiSkin: skin });
    },
    [setIconState]
  );

  return [iconState, { setEmojiSkin }];
}
