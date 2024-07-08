import sortBy from "lodash/sortBy";
import { transparentize } from "polished";
import React, { PropsWithChildren } from "react";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { EditorStyleHelper } from "@shared/editor/styles/EditorStyleHelper";
import { depths, s } from "@shared/styles";

const STICKY_TOP_POSITION = 90;

type YBound = {
  top: number;
  bottom: number;
};

type Props = {
  contentsRef: React.RefObject<HTMLDivElement>;
  fullWidthElems: Element[];
};

const ContentsPositioner = ({
  contentsRef,
  fullWidthElems,
  children,
}: PropsWithChildren<Props>) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const sortedVisibleYBounds: YBound[] = sortBy(
      fullWidthElems
        .map((elem) => elem.getBoundingClientRect())
        .filter((rect) => rect.top <= window.innerHeight && rect.bottom >= 0)
        .map((rect) => ({ top: rect.top, bottom: rect.bottom })),
      (yBound) => yBound.top
    );

    console.log("sortedVisibleYBounds", sortedVisibleYBounds);

    const freespaceYBounds: YBound[] = sortedVisibleYBounds.map(
      (yBound, index) => {
        const nextYBound = sortedVisibleYBounds[index + 1] ?? {
          top: window.innerHeight, // intentionally setting the window height
          bottom: window.innerHeight,
        };
        return {
          top: yBound.bottom,
          bottom: nextYBound.top,
        };
      }
    );

    if (sortedVisibleYBounds[0]?.top > 90) {
      freespaceYBounds.unshift({
        top: 90,
        bottom: sortedVisibleYBounds[0].top,
      });
    }

    console.log("freespaceYBounds", freespaceYBounds);

    const contentsHeight = containerRef.current.offsetHeight;
    const freespaceToUse = freespaceYBounds
      .filter((yBound) => yBound.bottom - yBound.top + 1 >= contentsHeight)
      .at(0);

    console.log("freespaceToUse", freespaceToUse);

    if (freespaceToUse) {
      const top = freespaceToUse.top < 90 ? 90 : freespaceToUse.top;
      containerRef.current.style.top = `${top}px`;
    }
  }, [fullWidthElems]);

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll); // TODO: passive
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <Container ref={containerRef}>{children}</Container>;
};

const Container = styled.div`
  display: none;

  position: sticky;
  top: ${STICKY_TOP_POSITION}px;
  max-height: calc(100vh - ${STICKY_TOP_POSITION}px);
  width: ${EditorStyleHelper.tocWidth}px;
  margin-top: calc(44px + 6vh);
  // transform: translateY(90px);

  padding: 0 16px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid red;

  background: ${s("background")};
  transition: ${s("backgroundTransition")};

  @supports (backdrop-filter: blur(20px)) {
    backdrop-filter: blur(20px);
    background: ${(props) => transparentize(0.2, props.theme.background)};
  }

  ${breakpoint("tablet")`
    display: block;
    z-index: ${depths.toc};
  `};
`;

export default ContentsPositioner;
