import RawData, { type EmojiMartData, Skin } from "@emoji-mart/data";
import FuzzySearch from "fuzzy-search";
import capitalize from "lodash/capitalize";

const Data = RawData as EmojiMartData;

const searcher = new FuzzySearch(Object.values(Data.emojis), ["search"], {
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
  id: string;
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

type GetVariantsProps = {
  id: string;
  name: string;
  skins: Skin[];
};

const getVariants = ({ id, name, skins }: GetVariantsProps): EmojiVariants =>
  skins.reduce((obj, skin) => {
    const skinCode = skin.unified.split("-")[1];
    const skinType = SKIN_CODE_TO_ENUM[skinCode] ?? EmojiSkin.Default;
    obj[skinType] = { id, name, value: skin.native } satisfies Emoji;
    return obj;
  }, {} as EmojiVariants);

const EMOJI_ID_TO_VARIANTS = Object.entries(Data.emojis).reduce(
  (obj, [id, emoji]) => {
    obj[id] = getVariants({
      id: emoji.id,
      name: emoji.name,
      skins: emoji.skins,
    });
    return obj;
  },
  {} as Record<string, EmojiVariants>
);

const CATEGORY_TO_EMOJI_IDS: Record<EmojiCategory, string[]> =
  Data.categories.reduce((obj, { id, emojis: emojiIds }) => {
    const category = EmojiCategory[capitalize(id)] as EmojiCategory;
    if (!category) {
      return obj;
    }
    obj[category] = emojiIds;
    return obj;
  }, {} as Record<EmojiCategory, string[]>);

export const getEmojis = ({
  ids,
  skin,
}: {
  ids: string[];
  skin: EmojiSkin;
}): Emoji[] =>
  ids.map(
    (id) =>
      EMOJI_ID_TO_VARIANTS[id][skin] ??
      EMOJI_ID_TO_VARIANTS[id][EmojiSkin.Default]
  );

export const getEmojisWithCategory = ({
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

export const search = ({ query, skin }: { query: string; skin: EmojiSkin }) => {
  const matchedEmojis = searcher.search(query);
  return matchedEmojis.map(
    (emoji) =>
      EMOJI_ID_TO_VARIANTS[emoji.id][skin] ??
      EMOJI_ID_TO_VARIANTS[emoji.id][EmojiSkin.Default]
  );
};
