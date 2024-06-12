import chunk from "lodash/chunk";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import styled from "styled-components";
import { s } from "@shared/styles";
import { IconLibrary } from "@shared/utils/IconLibrary";
import usePersistedState from "~/hooks/usePersistedState";
import { hover } from "~/styles";
import Flex from "../Flex";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import ColorPicker from "./ColorPicker";

const iconNames = Object.keys(IconLibrary.mapping);
const delayPerIcon = 250 / iconNames.length;

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
  width: number;
  initial: string;
  color: string;
  query: string;
  panelActive: boolean;
  onIconChange: (icon: string) => void;
  onColorChange: (icon: string) => void;
  onQueryChange: (query: string) => void;
};

const IconPanel = ({
  width,
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

  // 24px padding for the container
  // icon size is 24px by default; and we add 4px padding on all sides => 32px is the button size.
  const iconsPerRow = React.useMemo(
    () => Math.floor((width - 24) / 32),
    [width]
  );

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
    if (searchRef.current) {
      searchRef.current.focus();
    }
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
      <StyledVirtualList
        width={width}
        height={314}
        itemCount={dataChunks.length}
        itemSize={32}
        itemData={{ dataChunks }}
        style={{ padding: "0px 12px" }}
        outerRef={scrollableRef}
      >
        {DataRow}
      </StyledVirtualList>
    </Flex>
  );
};

type DataRowProps = {
  dataChunks: React.ReactNode[][];
};

const DataRow = ({
  index: rowIdx,
  style,
  data,
}: ListChildComponentProps<DataRowProps>) => {
  const { dataChunks } = data;
  const row = dataChunks[rowIdx];

  return <Flex style={style}>{row}</Flex>;
};

const StyledVirtualList = styled(FixedSizeList<DataRowProps>)`
  padding: 0px 12px;

  // Needed for the absolutely positioned children
  // to respect this list's padding
  & > div {
    position: relative;
  }
`;

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
