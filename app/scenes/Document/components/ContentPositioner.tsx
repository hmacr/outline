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
  headings: {
    title: string;
    level: number;
    id: string;
  }[];
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

    const contentsRect = containerRef.current.getBoundingClientRect();
    console.log(
      "top",
      contentsRect.top,
      "bottom",
      contentsRect.bottom,
      "height",
      contentsRect.height,
      "scroll",
      window.scrollY
    );

    const allItemsYBound: YBound[] = sortBy(
      fullWidthElems.map((elem) => {
        const rect = elem.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      }),
      (yBound) => yBound.top
    );

    const allHolesYBound: HoleYBound[] = allItemsYBound.map((yBound, idx) => {
      const bottom = allItemsYBound.at(idx + 1)?.top ?? window.innerHeight;
      return {
        idx: idx + 1,
        top: yBound.bottom,
        bottom,
      };
    });

    if (!allItemsYBound.length) {
      allHolesYBound.push({
        idx: 0,
        top: StickyTopPosition,
        bottom: window.innerHeight,
      });
    } else if (allItemsYBound[0].top > StickyTopPosition) {
      allHolesYBound.unshift({
        idx: 0,
        top: StickyTopPosition,
        bottom: allItemsYBound[0].top,
      });
    }

    const visibleHolesYBound: HoleYBound[] = allHolesYBound.filter(
      (rect) => rect.top >= 0 && rect.bottom <= window.innerHeight
    );

    const holeToUse = visibleHolesYBound
      .filter((yBound) => yBound.bottom - yBound.top + 1 >= contentsRect.height)
      .at(0);

    if (!holeToUse) {
      // TODO: handle overlap
      return;
    }

    const inInitialHole = holeToUse.top === StickyTopPosition;

    const transition = activeHoleIdx.current !== holeToUse.idx;
    activeHoleIdx.current = holeToUse.idx;

    let initialRenderComp = 0;

    if (inInitialHole) {
      const overlapItem = allItemsYBound.find(
        (yBound) => contentsRect.bottom > yBound.top
      );
      console.log("overlapItem", overlapItem);
      initialRenderComp = overlapItem
        ? contentsRect.bottom - overlapItem.top
        : 0;
    }

    console.log("initialRenderComp", initialRenderComp);

    const transformDist = inInitialHole
      ? BaseTranslateY - initialRenderComp - window.scrollY
      : holeToUse.top - StickyTopPosition;

    const transformDistance = transformDist > 0 ? transformDist : 0;

    containerRef.current.style.transform = `translateY(${transformDistance}px)`;

    // requestAnimationFrame(() => {
    //   if (containerRef.current) {
    //     containerRef.current.style.transform = `translateY(${transformDistance}px)`;
    //     // if (transition) {
    //     //   containerRef.current.style.transition = `${theme["backgroundTransition"]}, transform 50ms ease-out`;
    //     //   setTimeout(() => {
    //     //     if (containerRef.current) {
    //     //       containerRef.current.style.transition =
    //     //         theme["backgroundTransition"];
    //     //     }
    //     //   }, 100);
    //     // }
    //   }
    // });
  }, [fullWidthElems]);

  React.useEffect(() => {
    handlePositioning();
    window.addEventListener("scroll", handlePositioning, { passive: true });
    return () => window.removeEventListener("scroll", handlePositioning);
  }, [handlePositioning]);

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
