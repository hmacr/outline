import sortBy from "lodash/sortBy";
import { transparentize } from "polished";
import React, { PropsWithChildren } from "react";
import styled, { useTheme } from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { EditorStyleHelper } from "@shared/editor/styles/EditorStyleHelper";
import { depths, s } from "@shared/styles";

const STICKY_TOP_POSITION = 90;

type YBound = {
  top: number;
  bottom: number;
};

type HoleYBound = YBound & { idx?: number };

type Props = {
  contentsRef: React.RefObject<HTMLDivElement>;
  fullWidthElems: Element[];
};

const ContentsPositioner = ({
  fullWidthElems,
  children,
}: PropsWithChildren<Props>) => {
  const theme = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    console.log(">>>> START");

    // const contentsRect = containerRef.current.getBoundingClientRect();
    // console.log("contentsRect.top", contentsRect.top);
    // console.log("window.scrollY", window.scrollY);

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
      top: 90,
      bottom: allItemsYBound[0]?.top ?? window.innerHeight,
    });

    console.log("allHolesYBound", allHolesYBound);

    const sortedVisiblesYBound: YBound[] = sortBy(
      fullWidthElems
        .map((elem) => elem.getBoundingClientRect())
        .filter((rect) => rect.top <= window.innerHeight && rect.bottom >= 0)
        .map((rect) => ({ top: rect.top, bottom: rect.bottom })),
      (yBound) => yBound.top
    );

    const holesYBound: YBound[] = sortedVisiblesYBound.map((yBound, index) => {
      const nextYBound = sortedVisiblesYBound[index + 1] ?? {
        top: window.innerHeight, // intentionally setting the window height
        bottom: window.innerHeight,
      };
      return {
        top: yBound.bottom,
        bottom: nextYBound.top,
      };
    });

    if (sortedVisiblesYBound[0]?.top > 90) {
      holesYBound.unshift({
        top: 90,
        bottom: sortedVisiblesYBound[0].top,
      });
    }

    // console.log("holesYBound", holesYBound);

    const contentsHeight = containerRef.current.offsetHeight;
    const freespaceToUse = holesYBound
      .filter((yBound) => yBound.bottom - yBound.top + 1 >= contentsHeight)
      .at(0);

    // console.log("freespaceToUse", freespaceToUse);

    const isInInitialHole = !freespaceToUse || freespaceToUse.top === 90;

    if (isInInitialHole) {
      const transformDistance = window.scrollY <= 90 ? 90 - window.scrollY : 0;
      // console.log("transformDistance - initialHole", transformDistance);
      containerRef.current.style.transform = `translateY(${transformDistance}px)`;
      // containerRef.current.style.transition =
      //   transformDistance > 100
      //     ? `${theme["backgroundTransition"]}, transform 50ms ease-in-out`
      //     : theme["backgroundTransition"];
    } else if (freespaceToUse) {
      const transformDistance =
        freespaceToUse.top - 90 > 0 ? freespaceToUse.top - 90 : 0;
      // console.log("transformDistance - freespace", transformDistance);
      containerRef.current.style.transform = `translateY(${transformDistance}px)`;
      // containerRef.current.style.transition =
      //   transformDistance > 100
      //     ? `${theme["backgroundTransition"]}, transform 100ms ease-in-out`
      //     : theme["backgroundTransition"];
    }

    console.log(">>>> END");
  }, [fullWidthElems, theme]);

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
  transform: translateY(90px);
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
