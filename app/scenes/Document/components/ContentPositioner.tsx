import sortBy from "lodash/sortBy";
import { transparentize } from "polished";
import React, { PropsWithChildren } from "react";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { EditorStyleHelper } from "@shared/editor/styles/EditorStyleHelper";
import { depths, s } from "@shared/styles";

const StickyTopPosition = 90;
const BaseTranslateY = 90;

type YBound = {
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
  const [visibleFullWidthElems, setVisibleFullWidthElems] = React.useState<
    HTMLElement[]
  >([]);
  const positionerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver>();

  const handlePositioning = React.useCallback(() => {
    if (!positionerRef.current) {
      return;
    }

    const positionerRect = positionerRef.current.getBoundingClientRect();

    const filteredFullWidthsElemsRect = sortBy(
      visibleFullWidthElems
        .map((elem) => elem.getBoundingClientRect())
        .filter((elemRect) => elemRect.bottom > StickyTopPosition),
      (elemRect) => elemRect.top
    );

    const spacesYBound = filteredFullWidthsElemsRect
      .map((elemRect, idx) => {
        const bottom =
          idx !== filteredFullWidthsElemsRect.length - 1
            ? filteredFullWidthsElemsRect[idx + 1].top - 1
            : window.innerHeight;
        return {
          top: elemRect.bottom + 1,
          bottom,
        } as YBound;
      })
      .filter((yBound) => yBound.top >= StickyTopPosition);

    if (
      !filteredFullWidthsElemsRect.length ||
      filteredFullWidthsElemsRect[0].top > StickyTopPosition
    ) {
      const bottom = filteredFullWidthsElemsRect.length
        ? filteredFullWidthsElemsRect[0].top - 1
        : window.innerHeight;
      spacesYBound.unshift({
        top: StickyTopPosition,
        bottom,
      });
    }

    let spaceToUse = spacesYBound.find(
      (hole) => hole.bottom - hole.top + 1 >= positionerRect.height
    );

    if (!spaceToUse) {
      const sortedSpacesYBound = spacesYBound.sort((a, b) =>
        a.bottom - a.top + 1 >= b.bottom - b.top + 1 ? -1 : 1
      );
      if (
        sortedSpacesYBound[0].bottom === window.innerHeight &&
        sortedSpacesYBound.length > 1
      ) {
        spaceToUse = sortedSpacesYBound[1];
      } else {
        spaceToUse = sortedSpacesYBound[0];
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

    if (translateY < 0) {
      translateY = 0;
    }

    positionerRef.current.style.transform = `translateY(${translateY}px)`;
  }, [visibleFullWidthElems]);

  React.useEffect(() => {
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
  }, []);

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
    window.addEventListener("scroll", handlePositioning);
    return () => window.removeEventListener("scroll", handlePositioning);
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
