import chunk from "lodash/chunk";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import styled from "styled-components";
import { s } from "@shared/styles";
import { IconLibrary } from "@shared/utils/IconLibrary";
import { hover } from "~/styles";
import Flex from "../Flex";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import ColorPicker from "./ColorPicker";

const iconNames = Object.keys(IconLibrary.mapping);
const delayPerIcon = 250 / iconNames.length;

type Props = {
  width: number;
  initial: string;
  icon: string;
  color: string;
  onChange: (icon: string, color: string) => void;
};

const IconPanel = ({ width, initial, icon, color, onChange }: Props) => {
  const [query, setQuery] = React.useState("");
  const { t } = useTranslation();

  const filteredIcons = IconLibrary.findIcons(query);
  const handleFilter = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value.toLowerCase());
    },
    [setQuery]
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
      onClick={() => onChange(name, color)}
      delay={Math.round(index * delayPerIcon)}
    >
      <Icon as={IconLibrary.getComponent(name)} color={color}>
        {initial}
      </Icon>
    </IconButton>
  ));

  const dataChunks = chunk(icons, iconsPerRow);

  return (
    <Flex column gap={8}>
      <ColorPicker activeColor={color} onChange={(c) => onChange(icon, c)} />
      <StyledInputSearch
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
