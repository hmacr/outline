import chunk from "lodash/chunk";
import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { s } from "@shared/styles";
import { IconLibrary } from "@shared/utils/IconLibrary";
import usePersistedState from "~/hooks/usePersistedState";
import { hover } from "~/styles";
import Flex from "../Flex";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import ColorPicker from "./ColorPicker";
import Grid from "./Grid";

const iconNames = Object.keys(IconLibrary.mapping);
const delayPerIcon = 250 / iconNames.length;

/**
 * This is needed as a constant for react-window.
 * Calculated from the heights of TabPanel, ColorPicker and InputSearch.
 */
const GRID_HEIGHT = 314;
/**
 * Icon size is 24px by default; and we add 4px padding on all sides,
 */
const ICON_BUTTON_SIZE = 32;

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
  freqs.sort((a, b) => (a[1] > b[1] ? -1 : 1));

const useIconState = () => {
  const [iconsFreq, setIconsFreq] = usePersistedState<Record<string, number>>(
    getStorageKey(STORAGE_KEYS.IconsFrequency),
    {}
  );
  const [lastIcon, setLastIcon] = usePersistedState<string | undefined>(
    getStorageKey(STORAGE_KEYS.LastIcon),
    undefined
  );

  const incrementIconCount = React.useCallback(
    (icon: string) => {
      iconsFreq[icon] = (iconsFreq[icon] ?? 0) + 1;
      setIconsFreq({ ...iconsFreq });
      setLastIcon(icon);
    },
    [iconsFreq, setIconsFreq, setLastIcon]
  );

  const getFreqIcons = React.useCallback(() => {
    const freqs = Object.entries(iconsFreq);
    if (freqs.length > FREQUENTLY_USED_COUNT.Track) {
      sortFrequencies(freqs).splice(FREQUENTLY_USED_COUNT.Track);
      setIconsFreq(Object.fromEntries(freqs));
    }

    const icons = sortFrequencies(freqs)
      .slice(0, FREQUENTLY_USED_COUNT.Get)
      .map(([icon, _]) => icon);

    const isLastPresent = icons.includes(lastIcon ?? "");
    if (lastIcon && !isLastPresent) {
      icons.pop();
      icons.push(lastIcon);
    }

    return icons;
  }, [iconsFreq, setIconsFreq, lastIcon]);

  return {
    incrementIconCount,
    getFreqIcons,
  };
};

type Props = {
  gridWidth: number;
  initial: string;
  color: string;
  query: string;
  panelActive: boolean;
  onIconChange: (icon: string) => void;
  onColorChange: (icon: string) => void;
  onQueryChange: (query: string) => void;
};

const IconPanel = ({
  gridWidth,
  initial,
  color,
  query,
  panelActive,
  onIconChange,
  onColorChange,
  onQueryChange,
}: Props) => {
  const { t } = useTranslation();

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const scrollableRef = React.useRef<HTMLDivElement | null>(null);

  const { incrementIconCount, getFreqIcons } = useIconState();

  const freqIcons = React.useMemo(() => getFreqIcons(), [getFreqIcons]);

  const filteredIcons = React.useMemo(
    () => IconLibrary.findIcons(query),
    [query]
  );

  const handleFilter = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.target.value.toLowerCase());
    },
    [onQueryChange]
  );

  const handleIconClick = React.useCallback(
    (icon: string) => {
      onIconChange(icon);
      incrementIconCount(icon);
    },
    [onIconChange, incrementIconCount]
  );

  // 24px padding for the Grid
  const iconsPerRow = Math.floor((gridWidth - 24) / ICON_BUTTON_SIZE);

  const icons = filteredIcons.map((name, index) => (
    <IconButton
      key={name}
      onClick={() => handleIconClick(name)}
      delay={Math.round(index * delayPerIcon)}
    >
      <Icon as={IconLibrary.getComponent(name)} color={color}>
        {initial}
      </Icon>
    </IconButton>
  ));

  const dataChunks = chunk(icons, iconsPerRow);

  React.useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = 0;
    }
    searchRef.current?.focus();
  }, [panelActive]);

  return (
    <Flex column gap={8}>
      <ColorPicker activeColor={color} onSelect={(c) => onColorChange(c)} />
      <StyledInputSearch
        ref={searchRef}
        value={query}
        placeholder={`${t("Search icons")}…`}
        onChange={handleFilter}
      />
      <Grid
        ref={scrollableRef}
        width={gridWidth}
        height={GRID_HEIGHT}
        data={dataChunks}
        columns={iconsPerRow}
        itemWidth={ICON_BUTTON_SIZE}
      />
    </Flex>
  );
};

const StyledInputSearch = styled(InputSearch)`
  padding: 0px 12px;
`;

const IconButton = styled(NudeButton)<{ delay: number }>`
  width: 32px;
  height: 32px;
  padding: 4px;
  --delay: ${({ delay }) => `${delay}ms`};

  &: ${hover} {
    background: ${s("listItemHoverBackground")};
  }
`;

const Icon = styled.svg`
  transition: color 150ms ease-in-out, fill 150ms ease-in-out;
  transition-delay: var(--delay);
`;

export default IconPanel;
