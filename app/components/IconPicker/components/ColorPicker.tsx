import React from "react";
import styled, { css } from "styled-components";
import { s } from "@shared/styles";
import { colorPalette } from "@shared/utils/collections";
import { validateColorHex } from "@shared/utils/color";
import Flex from "~/components/Flex";
import NudeButton from "~/components/NudeButton";
import Text from "~/components/Text";
import { hover } from "~/styles";

enum Panel {
  Builtin,
  Hex,
}

const colorWheel = `conic-gradient(
	rgb(235, 87, 87),
	rgb(242, 201, 76),
	rgb(76, 183, 130),
	rgb(78, 167, 252),
	rgb(250, 96, 122)
)`;

type Props = {
  activeColor: string;
  onSelect: (color: string) => void;
};

const ColorPicker = ({ activeColor, onSelect }: Props) => {
  const [panel, setPanel] = React.useState(
    colorPalette.includes(activeColor) ? Panel.Builtin : Panel.Hex
  );

  const handleSwitcherClick = React.useCallback(() => {
    setPanel(panel === Panel.Builtin ? Panel.Hex : Panel.Builtin);
  }, [panel, setPanel]);

  return (
    <Container justify="space-between" gap={12}>
      {panel === Panel.Builtin ? (
        <BuiltinColors activeColor={activeColor} onClick={onSelect} />
      ) : (
        <CustomColor value={activeColor} onValidHex={onSelect} />
      )}
      <PanelSwitcher justify="flex-end" align="center">
        <SwitcherButton panel={panel} onClick={handleSwitcherClick}>
          {panel === Panel.Builtin && "#"}
        </SwitcherButton>
      </PanelSwitcher>
    </Container>
  );
};

const BuiltinColors = ({
  activeColor,
  onClick,
}: {
  activeColor: string;
  onClick: (color: string) => void;
}) => (
  <Flex justify="space-between" align="center" auto>
    {colorPalette.map((color) => (
      <ColorButton
        key={color}
        color={color}
        active={color === activeColor}
        onClick={() => onClick(color)}
      >
        <Selected />
      </ColorButton>
    ))}
  </Flex>
);

const CustomColor = ({
  value,
  onValidHex,
}: {
  value: string;
  onValidHex: (color: string) => void;
}) => {
  const [localValue, setLocalValue] = React.useState(
    value.startsWith("#") ? value : `#${value}`
  );

  const hasHexChars = React.useCallback(
    (color: string) => /(^#[0-9A-F]{1,6}$)/i.test(color),
    []
  );

  const handleInputChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const val = ev.target.value;

      if (val === "" || val === "#") {
        setLocalValue("#");
        return;
      }

      const uppercasedVal = val.toUpperCase();

      if (hasHexChars(uppercasedVal)) {
        setLocalValue(val);
      }

      if (validateColorHex(uppercasedVal)) {
        onValidHex(val);
      }
    },
    [setLocalValue, hasHexChars, onValidHex]
  );

  return (
    <Flex align="center" gap={8}>
      <Text type="tertiary" size="small">
        HEX
      </Text>
      <CustomColorInput
        maxLength={7}
        value={localValue}
        onChange={handleInputChange}
      />
    </Flex>
  );
};

const Container = styled(Flex)`
  height: 48px;
  padding: 8px 12px;
  border-bottom: 1px solid ${s("inputBorder")};
`;

const Selected = styled.span`
  width: 8px;
  height: 4px;
  border-left: 1px solid white;
  border-bottom: 1px solid white;
  transform: translateY(-25%) rotate(-45deg);
`;

const ColorButton = styled(NudeButton)<{ color: string; active: boolean }>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ color }) => color};

  &: ${hover} {
    outline: 2px solid ${s("menuBackground")} !important;
    box-shadow: ${({ color }) => `0px 0px 3px 3px ${color}`};
  }

  & ${Selected} {
    display: ${({ active }) => (active ? "block" : "none")};
  }
`;

const PanelSwitcher = styled(Flex)`
  width: 40px;
  border-left: 1px solid ${s("inputBorder")};
`;

const SwitcherButton = styled(NudeButton)<{ panel: Panel }>`
  font-size: 14px;
  border: 1px solid ${s("inputBorder")};
  transition: all 100ms ease-in-out;

  ${({ panel }) =>
    panel === Panel.Builtin
      ? css`
          &: ${hover} {
            border-color: ${s("inputBorderFocused")};
          }
        `
      : css`
          border-radius: 50%;
          background: ${colorWheel};

          &: ${hover} {
            border-color: ${colorWheel} !important;
          }
        `}
`;

const CustomColorInput = styled.input.attrs(() => ({
  type: "text",
}))`
  font-size: 14px;
  color: ${s("textSecondary")};
  background: transparent;
  border: 0;
  outline: 0;
`;

export default ColorPicker;
