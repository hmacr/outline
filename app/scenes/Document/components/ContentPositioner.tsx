import sortBy from "lodash/sortBy";
import { transparentize } from "polished";
import React, { PropsWithChildren } from "react";
import styled, { useTheme } from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { EditorStyleHelper } from "@shared/editor/styles/EditorStyleHelper";
import { depths, s } from "@shared/styles";

const StickyTopPosition = 90;
const BaseTranslateY = 90;

type YBound = {
  top: number;
  bottom: number;
};

type HoleYBound = YBound & { idx: number };

type Props = {
  fullWidthElems: Element[];
};

const ContentsPositioner = ({
  fullWidthElems,
  children,
}: PropsWithChildren<Props>) => {
  const theme = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeHoleIdx = React.useRef<number>(0);

  const handlePositioning = React.useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const allItemsYBound: YBound[] = sortBy(
      fullWidthElems.map((elem) => {
        const rect = elem.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      }),
      (yBound) => yBound.top
    );

    const allHolesYBound: HoleYBound[] = allItemsYBound.map((yBound, idx) => {
      const nextYBound = allItemsYBound[idx + 1] ?? {
        top: window.innerHeight, // intentionally setting the window height
        bottom: window.innerHeight,
      };
      return {
        idx: idx + 1,
        top: yBound.bottom,
        bottom: nextYBound.top,
      };
    });

    allHolesYBound.unshift({
      idx: 0,
      top: StickyTopPosition,
      bottom: allItemsYBound[0]?.top ?? window.innerHeight,
    });

    const visibleHolesYBound: HoleYBound[] = allHolesYBound.filter(
      (rect) => rect.top <= window.innerHeight && rect.bottom >= 0
    );

    const contentsHeight = containerRef.current.offsetHeight;
    const freespaceToUse = visibleHolesYBound
      .filter((yBound) => yBound.bottom - yBound.top + 1 >= contentsHeight)
      .at(0)!;

    const inInitialHole = freespaceToUse.idx === 0;

    const transition = activeHoleIdx.current !== freespaceToUse.idx;
    activeHoleIdx.current = freespaceToUse.idx;

    const transformDistance = inInitialHole
      ? window.scrollY <= BaseTranslateY
        ? BaseTranslateY - window.scrollY
        : 0
      : freespaceToUse.top - StickyTopPosition > 0
      ? freespaceToUse.top - StickyTopPosition
      : 0;

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${transformDistance}px)`;
        if (transition) {
          containerRef.current.style.transition = `${theme["backgroundTransition"]}, transform 50ms ease-out`;
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.transition =
                theme["backgroundTransition"];
            }
          }, 100);
        }
      }
    });
  }, [fullWidthElems, theme]);

  // const scrollPosition = useWindowScrollPosition({ throttle: 300 });

  // React.useEffect(
  //   () => handlePositioning(),
  //   [scrollPosition, handlePositioning]
  // );

  React.useEffect(() => {
    window.addEventListener("scroll", handlePositioning); // TODO: passive
    return () => window.removeEventListener("scroll", handlePositioning);
  }, [handlePositioning]);

  // React.useEffect(() => handlePositioning(), [handlePositioning]);

  return <Container ref={containerRef}>{children}</Container>;
};

const Container = styled.div`
  display: none;

  position: sticky;
  top: ${StickyTopPosition}px;
  max-height: calc(100vh - ${StickyTopPosition}px);
  width: ${EditorStyleHelper.tocWidth}px;
  transform: translateY(${BaseTranslateY}px);
  will-change: transform;

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
