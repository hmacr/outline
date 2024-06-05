import { IconLibrary } from "./IconLibrary";

export type IconType = "outline" | "emoji";

const outlineIconNames = new Set(Object.keys(IconLibrary.mapping));

export const determineIconType = (
  icon?: string | null
): IconType | undefined => {
  if (!icon) {
    return;
  }
  return outlineIconNames.has(icon) ? "outline" : "emoji";
};
