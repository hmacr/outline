import sortBy from "lodash/sortBy";
import { transparentize } from "polished";
import React, { PropsWithChildren } from "react";
import styled, { useTheme } from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { EditorStyleHelper } from "@shared/editor/styles/EditorStyleHelper";
import { depths, s } from "@shared/styles";

const StickyTopPosition = 90;
const BaseTranslateY = 90;
const InitialSpaceName = "initial";

type NamedDOMRect = {
  name: string;
  rect: DOMRect;
};

type SpaceBound = {
  name: string;
  top: number;
  bottom: number;
};

type Props = {
  headings: {
    title: string;
    level: number;
    id: string;
  }[];
  fullWidthElems: Element[];
};

const ContentsPositioner = ({
  headings,
  fullWidthElems,
  children,
}: PropsWithChildren<Props>) => {
  const theme = useTheme();

  const [visibleFullWidthElems, setVisibleFullWidthElems] = React.useState<
    HTMLElement[]
  >([]);

  const positionerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver>();
  const previousSpaceNameRef = React.useRef<string>();

  const handlePositioning = React.useCallback(() => {
    if (!positionerRef.current) {
      return;
    }

    const positionerRect = positionerRef.current.getBoundingClientRect();

    const filteredFullWidthsElemsNamedRect = sortBy<NamedDOMRect>(
      visibleFullWidthElems
        .map((elem) => ({
          name: elem.dataset.id ?? "",
          rect: elem.getBoundingClientRect(),
        }))
        .filter((namedRect) => namedRect.rect.bottom > StickyTopPosition),
      (namedRect) => namedRect.rect.top
    );

    const spacesBound = filteredFullWidthsElemsNamedRect
      .map((namedRect, idx) => {
        const bottom =
          idx !== filteredFullWidthsElemsNamedRect.length - 1
            ? filteredFullWidthsElemsNamedRect[idx + 1].rect.top - 1
            : window.innerHeight;
        return {
          name: namedRect.name,
          top: namedRect.rect.bottom + 1,
          bottom,
        } satisfies SpaceBound;
      })
      .filter((yBound) => yBound.top >= StickyTopPosition);

    if (
      !filteredFullWidthsElemsNamedRect.length ||
      filteredFullWidthsElemsNamedRect[0].rect.top > StickyTopPosition
    ) {
      const bottom = filteredFullWidthsElemsNamedRect.length
        ? filteredFullWidthsElemsNamedRect[0].rect.top - 1
        : window.innerHeight;
      spacesBound.unshift({
        name: InitialSpaceName,
        top: StickyTopPosition,
        bottom,
      });
    }

    let spaceToUse = spacesBound.find(
      (hole) => hole.bottom - hole.top + 1 >= positionerRect.height
    );

    if (!spaceToUse) {
      // descending sort based on size
      const sortedSpacesBound = spacesBound.sort((a, b) =>
        a.bottom - a.top + 1 >= b.bottom - b.top + 1 ? -1 : 1
      );
      if (
        sortedSpacesBound[0].bottom === window.innerHeight &&
        sortedSpacesBound.length > 1
      ) {
        spaceToUse = sortedSpacesBound[1];
      } else {
        spaceToUse = sortedSpacesBound[0];
      }
    }

    let translateY: number = 0;

    if (
      spaceToUse.top === StickyTopPosition &&
      window.scrollY < StickyTopPosition + BaseTranslateY
    ) {
      const spaceHeight = spaceToUse.bottom - spaceToUse.top + 1;
      const extraSpace = spaceHeight - positionerRect.height;

      let scrollAdjusted =
        extraSpace < BaseTranslateY - window.scrollY
          ? extraSpace
          : BaseTranslateY - window.scrollY;

      if (scrollAdjusted < 0) {
        scrollAdjusted = 0;
      }

      translateY = scrollAdjusted;
    } else {
      translateY = spaceToUse.top - StickyTopPosition;
    }

    positionerRef.current.style.transform = `translateY(${translateY}px)`;
    if (previousSpaceNameRef.current !== spaceToUse.name) {
      positionerRef.current.style.transition = `${theme["backgroundTransition"]}, transform 100ms ease-out`;
      setTimeout(() => {
        if (positionerRef.current) {
          positionerRef.current.style.transition =
            theme["backgroundTransition"];
        }
      }, 100);
    }
    previousSpaceNameRef.current = spaceToUse.name;
  }, [visibleFullWidthElems, theme]);

  React.useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        const visibleElems = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement);

        const allElemIds = entries
          .map((entry) => entry.target as HTMLElement)
          .map((elem) => elem.dataset.id);

        setVisibleFullWidthElems((prevElems) => {
          const filteredPrevElems = prevElems.filter(
            (elem) => !allElemIds.includes(elem.dataset.id)
          );
          return [...filteredPrevElems, ...visibleElems];
        });
      });
    }

    window.addEventListener("scroll", handlePositioning);
    return () => window.removeEventListener("scroll", handlePositioning);
  }, [handlePositioning]);

  React.useEffect(() => {
    const allElemIds = fullWidthElems.map(
      (elem) => (elem as HTMLElement).dataset.id
    );
    setVisibleFullWidthElems((prevElems) =>
      prevElems.filter((elem) => allElemIds.includes(elem.dataset.id))
    );

    fullWidthElems.forEach((elem) => observerRef.current?.observe(elem));
    return () => {
      observerRef.current?.disconnect();
    };
  }, [fullWidthElems]);

  React.useEffect(() => {
    handlePositioning();
  }, [headings, handlePositioning]);

  return <Positioner ref={positionerRef}>{children}</Positioner>;
};

const Positioner = styled.div`
  display: none;

  position: sticky;
  top: ${StickyTopPosition}px;
  max-height: calc(100vh - ${StickyTopPosition}px);
  width: ${EditorStyleHelper.tocWidth}px;
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
