import styled from "styled-components";
import { hover } from "~/styles";
import NudeButton from "../NudeButton";

export const PopoverButton = styled(NudeButton)`
  &: ${hover},
  &:active,
  &[aria-expanded= "true"] {
    opacity: 1 !important;
  }
`;
