import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconLibrary } from "@shared/utils/IconLibrary";
import Flex from "../Flex";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import ColorPicker from "./ColorPicker";

const iconNames = Object.keys(IconLibrary.mapping);

type Props = {
  initial: string;
  icon: string;
  color: string;
  onChange: (icon: string, color: string) => void;
};

const IconPanel = ({ initial, icon, color, onChange }: Props) => {
  const [query, setQuery] = React.useState("");
  const { t } = useTranslation();

  const delayPerIcon = 250 / iconNames.length;

  const filteredIcons = IconLibrary.findIcons(query);
  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value.toLowerCase());
  };

  return (
    <Flex column gap={12}>
      <ColorPicker activeColor={color} onChange={(c) => onChange(icon, c)} />
      <StyledInputSearch
        value={query}
        placeholder={`${t("Search icons")}…`}
        onChange={handleFilter}
        autoFocus
      />
      <IconsContainer gap={4} wrap>
        {iconNames.map((name, index) => (
          <IconButton
            key={name}
            onClick={() => onChange(name, color)}
            style={
              {
                opacity: query
                  ? filteredIcons.includes(name)
                    ? 1
                    : 0.3
                  : undefined,
                "--delay": `${Math.round(index * delayPerIcon)}ms`,
              } as React.CSSProperties
            }
          >
            <Icon as={IconLibrary.getComponent(name)} color={color} size={30}>
              {initial}
            </Icon>
          </IconButton>
        ))}
      </IconsContainer>
    </Flex>
  );
};

const StyledInputSearch = styled(InputSearch)`
  padding: 0px 12px;
`;

const IconsContainer = styled(Flex)`
  // border: 1px solid red;
  padding: 0px 12px;
`;

const IconButton = styled(NudeButton)`
  width: 30px;
  height: 30px;
  border-radius: 4px;
  // border: 1px solid green;
`;

const Icon = styled.svg`
  transition: color 150ms ease-in-out, fill 150ms ease-in-out;
  transition-delay: var(--delay);
`;

export default IconPanel;
