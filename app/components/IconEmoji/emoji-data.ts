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
  Default = "default",
  Light = "1f3fb",
  MediumLight = "1f3fc",
  Medium = "1f3fd",
  MediumDark = "1f3fe",
  Dark = "1f3ff",
}

export type Emoji = {
  name: string;
  value: string;
};

export type EmojiVariants = Record<EmojiSkin, Emoji>;

const SKIN_TO_ENUM = Object.keys(EmojiSkin).reduce((obj, skin: EmojiSkin) => {
  const val = EmojiSkin[skin];
  obj[val] = skin;
  return obj;
}, {} as Record<string, EmojiSkin>);

const getVariants = (name: string, skins: Skin[]): EmojiVariants =>
  skins.reduce((obj, skin) => {
    const parts = skin.unified.split("-");
    const skinType = SKIN_TO_ENUM[parts[1]] ?? EmojiSkin.Default;
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

const EMOJI_CATEGORY_TO_EMOJI_IDS: Record<EmojiCategory, string[]> =
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
  Object.keys(EMOJI_CATEGORY_TO_EMOJI_IDS).reduce(
    (obj, category: EmojiCategory) => {
      const emojiIds = EMOJI_CATEGORY_TO_EMOJI_IDS[category];
      const emojis = emojiIds.map(
        (emojiId) => EMOJI_ID_TO_VARIANTS[emojiId][skin]
      );
      obj[category] = emojis;
      return obj;
    },
    {} as Record<EmojiCategory, Emoji[]>
  );

export const getEmojiVariants = ({ id }: { id: string }) =>
  EMOJI_ID_TO_VARIANTS[id];

export const search = ({ value, skin }: { value: string; skin: EmojiSkin }) => {
  const matchedEmojis = searcher.search(value);
  return matchedEmojis.map((emoji) => EMOJI_ID_TO_VARIANTS[emoji.id][skin]);
};
