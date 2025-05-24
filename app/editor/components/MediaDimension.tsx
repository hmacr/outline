import { NodeSelection } from "prosemirror-state";
import React from "react";
import styled from "styled-components";
import Flex from "@shared/components/Flex";
import Text from "@shared/components/Text";
import { extraArea } from "@shared/styles";
import Input, { NativeInput, Outline } from "~/components/Input";
import { useEditor } from "./EditorContext";

type Dimension = {
  width: number;
  height: number;
  changed: "width" | "height" | "none";
};

export function MediaDimension() {
  const { view, commands } = useEditor();
  const { state } = view;
  const { selection } = state;

  // This component will be rendered only when the selection is image or video (NodeSelection types).
  const node = (selection as NodeSelection).node;
  const nodeType = node.type.name,
    width = node.attrs.width as number,
    height = node.attrs.height as number;

  const [localDimension, setLocalDimension] = React.useState<Dimension>(() => ({
    width,
    height,
    changed: "none",
  }));

  const handleChange = React.useCallback(
    (type: "width" | "height") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const parsedValue = parseInt(value, 10);

      if (isNaN(parsedValue)) {
        return;
      }

      setLocalDimension((prev) => {
        if (type === "width") {
          return { ...prev, width: parsedValue, changed: "width" };
        }
        return { ...prev, height: parsedValue, changed: "height" };
      });
    },
    []
  );

  const handleBlur = React.useCallback(() => {
    console.log("local dimension", localDimension);
    console.log("width", width, "height", height);

    if (localDimension.width === width && localDimension.height === height) {
      console.log("no change");
      return;
    }

    const aspectRatio =
      localDimension.changed === "width" ? height / width : width / height;

    const finalWidth =
      localDimension.changed === "width"
        ? localDimension.width
        : aspectRatio * localDimension.height;
    const finalHeight =
      localDimension.changed === "height"
        ? localDimension.height
        : aspectRatio * localDimension.width;

    if (nodeType === "image") {
      commands["resizeImage"]({
        width: finalWidth,
        height: finalHeight,
      });
    }
  }, [commands, localDimension, width, height, nodeType]);

  React.useEffect(() => {
    if (width !== localDimension.width || height !== localDimension.height) {
      setLocalDimension({ width, height, changed: "none" }); // Sync drag resize updates
    }
  }, [width, height]);

  return (
    <StyledFlex align="center">
      <StyledInput
        value={localDimension.width ?? width}
        onChange={handleChange("width")}
        onBlur={handleBlur}
        margin={0}
      />
      <Text weight="bold">x</Text>
      <StyledInput
        value={localDimension.height ?? height}
        onChange={handleChange("height")}
        onBlur={handleBlur}
        margin={0}
      />
    </StyledFlex>
  );
}

const StyledFlex = styled(Flex)`
  pointer-events: all;
  position: relative;

  ${extraArea(4)}
`;

const StyledInput = styled(Input)`
  width: 50px;
  z-index: 1;

  ${Outline} {
    background: transparent;
    border: none;
  }

  ${NativeInput} {
    height: 24px;
    padding: 0;
    text-align: center;
  }
`;
