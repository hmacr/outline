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
  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value.toLowerCase());
  };

  // 24px padding for the container
  // icon size is 24px by default; and we add 4px padding on all sides => 32px.
  const iconsPerRow = React.useMemo(
    () => Math.floor((width - 24) / 32),
    [width]
  );

  const icons = filteredIcons.map((name, index) => (
    <IconButton
      key={name}
      onClick={() => onChange(name, color)}
      opacity={query ? (filteredIcons.includes(name) ? 1 : 0.3) : 1}
      delay={Math.round(index * delayPerIcon)}
    >
      <Icon as={IconLibrary.getComponent(name)} color={color}>
        {initial}
      </Icon>
    </IconButton>
  ));

  const iconChunks = chunk(icons, iconsPerRow);

  return (
    <Container column gap={8}>
      <ColorPicker activeColor={color} onChange={(c) => onChange(icon, c)} />
      <StyledInputSearch
        value={query}
        placeholder={`${t("Search icons")}…`}
        onChange={handleFilter}
        autoFocus
      />
      <IconContainer>
        <FixedSizeList<{ iconChunks: React.ReactNode[][] }>
          width={width}
          height={314}
          itemCount={iconChunks.length}
          itemSize={32}
          itemData={{ iconChunks }}
        >
          {IconRow}
        </FixedSizeList>
      </IconContainer>
    </Container>
  );
};

const IconRow = ({
  index: rowIdx,
  style,
  data,
}: ListChildComponentProps<{ iconChunks: React.ReactNode[][] }>) => {
  const { iconChunks } = data;
  const icons = iconChunks[rowIdx];

  return <Flex style={style}>{icons}</Flex>;
};

const Container = styled(Flex)`
  position: relative;
`;

const StyledInputSearch = styled(InputSearch)`
  padding: 0px 12px;
`;

const IconContainer = styled.div`
  padding: 0px 12px;
  overflow-x: hidden;
`;

const IconButton = styled(NudeButton)<{ opacity: number; delay: number }>`
  width: auto;
  height: auto;
  padding: 4px;
  opacity: ${({ opacity }) => opacity};
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
