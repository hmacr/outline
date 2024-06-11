import rawData, { type EmojiMartData, Skin } from "@emoji-mart/data";
import { init } from "emoji-mart";
import FuzzySearch from "fuzzy-search";
import capitalize from "lodash/capitalize";

init({ rawData });

const data = rawData as EmojiMartData;

const searcher = new FuzzySearch(Object.values(data.emojis), ["search"], {
  caseSensitive: false,
  sort: true,
});

export enum EmojiCategory {
  People = "Smileys & People",
  Nature = "Animals & Nature",
  Foods = "Food & Drink",
  Activity = "Activity",
  Places = "Travel & Places",
  Objects = "Objects",
  Symbols = "Symbols",
  Flags = "Flags",
}

export enum EmojiSkin {
  Default = "Default",
  Light = "Light",
  MediumLight = "MediumLight",
  Medium = "Medium",
  MediumDark = "MediumDark",
  Dark = "Dark",
}

export type Emoji = {
  name: string;
  value: string;
};

export type EmojiVariants = {
  [EmojiSkin.Default]: Emoji;
  [EmojiSkin.Light]?: Emoji;
  [EmojiSkin.MediumLight]?: Emoji;
  [EmojiSkin.Medium]?: Emoji;
  [EmojiSkin.MediumDark]?: Emoji;
  [EmojiSkin.Dark]?: Emoji;
};

const SKIN_CODE_TO_ENUM = {
  "1f3fb": EmojiSkin.Light,
  "1f3fc": EmojiSkin.MediumLight,
  "1f3fd": EmojiSkin.Medium,
  "1f3fe": EmojiSkin.MediumDark,
  "1f3ff": EmojiSkin.Dark,
};

const getVariants = (name: string, skins: Skin[]): EmojiVariants =>
  skins.reduce((obj, skin) => {
    const skinCode = skin.unified.split("-")[1];
    const skinType = SKIN_CODE_TO_ENUM[skinCode] ?? EmojiSkin.Default;
    obj[skinType] = { name, value: skin.native };
    return obj;
  }, {} as EmojiVariants);

const EMOJI_ID_TO_VARIANTS = Object.entries(data.emojis).reduce(
  (obj, [id, emoji]) => {
    obj[id] = getVariants(emoji.name, emoji.skins);
    return obj;
  },
  {} as Record<string, EmojiVariants>
);

const CATEGORY_TO_EMOJI_IDS: Record<EmojiCategory, string[]> =
  data.categories.reduce((obj, { id, emojis: emojiIds }) => {
    const category = EmojiCategory[capitalize(id)] as EmojiCategory;
    if (!category) {
      return obj;
    }
    obj[category] = emojiIds;
    return obj;
  }, {} as Record<EmojiCategory, string[]>);

export const getEmojis = ({
  skin,
}: {
  skin: EmojiSkin;
}): Record<EmojiCategory, Emoji[]> =>
  Object.keys(CATEGORY_TO_EMOJI_IDS).reduce((obj, category: EmojiCategory) => {
    const emojiIds = CATEGORY_TO_EMOJI_IDS[category];
    const emojis = emojiIds.map(
      (emojiId) =>
        EMOJI_ID_TO_VARIANTS[emojiId][skin] ??
        EMOJI_ID_TO_VARIANTS[emojiId][EmojiSkin.Default]
    );
    obj[category] = emojis;
    return obj;
  }, {} as Record<EmojiCategory, Emoji[]>);

export const getEmojiVariants = ({ id }: { id: string }) =>
  EMOJI_ID_TO_VARIANTS[id];

export const search = ({ value, skin }: { value: string; skin: EmojiSkin }) => {
  const matchedEmojis = searcher.search(value);
  return matchedEmojis.map(
    (emoji) =>
      EMOJI_ID_TO_VARIANTS[emoji.id][skin] ??
      EMOJI_ID_TO_VARIANTS[emoji.id][EmojiSkin.Default]
  );
};
