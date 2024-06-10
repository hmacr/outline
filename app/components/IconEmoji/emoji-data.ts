import data, { type EmojiMartData, Emoji, Skin } from "@emoji-mart/data";
import { init, SearchIndex } from "emoji-mart";
import { capitalize } from "lodash";

init({ data });

const emojiMartData = data as EmojiMartData;

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

const activeSkin = EmojiSkin.Default;

const skinToEnum = Object.keys(EmojiSkin).reduce((obj, skin: EmojiSkin) => {
  const val = EmojiSkin[skin];
  obj[val] = skin;
  return obj;
}, {} as Record<string, EmojiSkin>);

const mapSkinsToNativeEmojis = (skins: Skin[]): Record<EmojiSkin, string> =>
  skins.reduce((obj, skin) => {
    const parts = skin.unified.split("-");
    const skinType = skinToEnum[parts[1]] ?? EmojiSkin.Default;
    obj[skinType] = skin.native;
    return obj;
  }, {} as Record<EmojiSkin, string>);

type EmojiToVariants = Record<string, Record<EmojiSkin, string>>;

// emoji id => variants of emoji
const emojiIdToVariants = Object.entries(emojiMartData.emojis).reduce(
  (obj, [id, emoji]) => {
    const mappedEmojis = mapSkinsToNativeEmojis(emoji.skins);
    obj[id] = mappedEmojis;
    return obj;
  },
  {} as EmojiToVariants
);

const getEmoji = ({ id, skin }: { id: string; skin: EmojiSkin }) =>
  emojiIdToVariants[id][skin] ?? emojiIdToVariants[id][EmojiSkin.Default];

// category name to emojis
export const emojiData = emojiMartData.categories.reduce(
  (obj, { id, emojis }) => {
    const category = EmojiCategory[capitalize(id)];
    if (!category) {
      return obj;
    }
    const mappedEmojis = emojis.map((emojiId) =>
      getEmoji({ id: emojiId, skin: activeSkin })
    );
    obj[category] = mappedEmojis;
    return obj;
  },
  {} as Record<EmojiCategory, string[]>
);
