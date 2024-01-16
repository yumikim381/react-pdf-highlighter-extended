import { GhostHighlight, Highlight, ViewportHighlight } from "../types";

type AllHighlights = Highlight | GhostHighlight | ViewportHighlight;

const groupHighlightsByPage = <T extends AllHighlights | null | undefined>(
  highlights: Array<T>
): Record<number, Array<NonNullable<T>>> => {
  const allHighlights = highlights.filter(Boolean) as Array<NonNullable<T>>;
  const groupedHighlights: Record<number, Array<NonNullable<T>>> = {};

  allHighlights.forEach((highlight) => {
    const pageNumbers = new Set<number>();
    pageNumbers.add(highlight.position.boundingRect.pageNumber);

    // Add page numbers of all associated rects
    // to deal with multi-page highlights
    highlight.position.rects.forEach((rect) => {
      if (rect.pageNumber) {
        pageNumbers.add(rect.pageNumber);
      }
    });

    // Push the highlight and right rects to all relevant pages
    pageNumbers.forEach((pageNumber) => {
      if (!groupedHighlights[pageNumber]) {
        groupedHighlights[pageNumber] = [];
      }

      const pageSpecificHighlight = {
        ...highlight,
        position: {
          ...highlight.position,
          rects: highlight.position.rects.filter(
            (rect) => pageNumber === rect.pageNumber
          ),
        },
      };

      groupedHighlights[pageNumber].push(pageSpecificHighlight);
    });
  });

  return groupedHighlights;
};

export default groupHighlightsByPage;
