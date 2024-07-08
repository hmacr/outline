import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { s } from "@shared/styles";
import Text from "~/components/Text";
import useWindowScrollPosition from "~/hooks/useWindowScrollPosition";

const HEADING_OFFSET = 20;

type Props = {
  /** The headings to render in the contents. */
  headings: {
    title: string;
    level: number;
    id: string;
  }[];
};

const Contents = (
  { headings }: Props,
  ref: React.RefObject<HTMLDivElement>
) => {
  const [activeSlug, setActiveSlug] = React.useState<string>();
  const scrollPosition = useWindowScrollPosition({
    throttle: 100,
  });

  React.useEffect(() => {
    for (let key = 0; key < headings.length; key++) {
      const heading = headings[key];
      const element = window.document.getElementById(
        decodeURIComponent(heading.id)
      );

      if (element) {
        const bounding = element.getBoundingClientRect();

        if (bounding.top > HEADING_OFFSET) {
          const last = headings[Math.max(0, key - 1)];
          setActiveSlug(last.id);
          return;
        }
      }
    }
  }, [scrollPosition, headings]);

  // calculate the minimum heading level and adjust all the headings to make
  // that the top-most. This prevents the contents from being weirdly indented
  // if all of the headings in the document start at level 3, for example.
  const minHeading = headings.reduce(
    (memo, heading) => (heading.level < memo ? heading.level : memo),
    Infinity
  );
  const headingAdjustment = minHeading - 1;
  const { t } = useTranslation();

  return (
    <div ref={ref}>
      <Heading>{t("Contents")}</Heading>
      {headings.length ? (
        <List>
          {headings
            .filter((heading) => heading.level < 4)
            .map((heading) => (
              <ListItem
                key={heading.id}
                level={heading.level - headingAdjustment}
                active={activeSlug === heading.id}
              >
                <Link href={`#${heading.id}`}>{heading.title}</Link>
              </ListItem>
            ))}
        </List>
      ) : (
        <Empty>{t("Headings you add to the document will appear here")}</Empty>
      )}
    </div>
  );
};

const Heading = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${s("textTertiary")};
  letter-spacing: 0.03em;
  margin-top: 10px;
`;

const Empty = styled(Text)`
  font-size: 14px;
`;

const ListItem = styled.li<{ level: number; active?: boolean }>`
  margin-left: ${(props) => (props.level - 1) * 10}px;
  margin-bottom: 8px;
  line-height: 1.3;
  word-break: break-word;

  a {
    font-weight: ${(props) => (props.active ? "600" : "inherit")};
    color: ${(props) => (props.active ? props.theme.accent : props.theme.text)};
  }
`;

const Link = styled.a`
  color: ${s("text")};
  font-size: 14px;

  &:hover {
    color: ${s("accent")};
  }
`;

const List = styled.ol`
  padding: 0;
  list-style: none;
`;

export default React.forwardRef<HTMLDivElement, Props>(Contents);
