import * as React from "react";
import { useTranslation } from "react-i18next";
import { MenuItem } from "reakit";
import styled, { useTheme } from "styled-components";
import { IconLibrary } from "@shared/utils/IconLibrary";
import { colorPalette } from "@shared/utils/collections";
import lazyWithRetry from "~/utils/lazyWithRetry";
import DelayedMount from "../DelayedMount";
import Flex from "../Flex";
import InputSearch from "../InputSearch";
import NudeButton from "../NudeButton";
import Text from "../Text";

const TwitterPicker = lazyWithRetry(
  () => import("react-color/lib/components/twitter/Twitter")
);

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
  const theme = useTheme();

  const delayPerIcon = 250 / iconNames.length;

  const filteredIcons = IconLibrary.findIcons(query);
  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value.toLowerCase());
  };

  const styles = React.useMemo(
    () => ({
      default: {
        body: {
          padding: 0,
          marginRight: -8,
        },
        hash: {
          color: theme.text,
          background: theme.inputBorder,
        },
        swatch: {
          cursor: "var(--cursor-pointer)",
        },
        input: {
          color: theme.text,
          boxShadow: `inset 0 0 0 1px ${theme.inputBorder}`,
          background: "transparent",
        },
      },
    }),
    [theme]
  );

  return (
    <Wrapper column gap={12}>
      <InputSearch
        value={query}
        placeholder={`${t("Filter")}…`}
        onChange={handleFilter}
        autoFocus
      />
      <div>
        {iconNames.map((name, index) => (
          <MenuItem key={name} onClick={() => onChange(name, color)}>
            {(props) => (
              <IconButton
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
                {...props}
              >
                <Icon
                  as={IconLibrary.getComponent(name)}
                  color={color}
                  size={30}
                >
                  {initial}
                </Icon>
              </IconButton>
            )}
          </MenuItem>
        ))}
      </div>
      <Flex>
        <React.Suspense
          fallback={
            <DelayedMount>
              <Text>{t("Loading")}…</Text>
            </DelayedMount>
          }
        >
          <ColorPicker
            color={color}
            onChange={(c) => onChange(icon, c.hex)}
            colors={colorPalette}
            triangle="hide"
            styles={styles}
          />
        </React.Suspense>
      </Flex>
    </Wrapper>
  );
};

const Wrapper = styled(Flex)`
  padding: 12px; // same as emoji-mart picker's padding
`;

const Icon = styled.svg`
  transition: color 150ms ease-in-out, fill 150ms ease-in-out;
  transition-delay: var(--delay);
`;

const IconButton = styled(NudeButton)`
  vertical-align: top;
  border-radius: 4px;
  margin: 0px 6px 6px 0px;
  width: 30px;
  height: 30px;
`;

const ColorPicker = styled(TwitterPicker)`
  box-shadow: none !important;
  background: transparent !important;
  width: 100% !important;
`;

export default IconPanel;
