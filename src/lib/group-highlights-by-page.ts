import { IHighlight, ScaledPosition } from "src/types";

// TODO: Type overhaul
type T_HT = {
  position: ScaledPosition;
};

const groupHighlightsByPage = (
  highlights: Array<T_HT>
): Record<number, Array<T_HT>> => {
  const allHighlights = highlights.filter(Boolean) as Array<T_HT>; // TODO: Check if we need falsey validation
  const groupedHighlights: Record<number, Array<T_HT>> = {};

  allHighlights.forEach((highlight) => {
    const pageNumbers = new Set<number>();
    pageNumbers.add(highlight.position.pageNumber);

    // Add page numbers of all associated rects
    // to deal with multi-page highlights
    highlight.position.rects.forEach((rect) => {
      if (rect.pageNumber !== undefined) {
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
          pageNumber,
          rects: highlight.position.rects.filter(
            (rect) =>
              pageNumber === (rect.pageNumber || highlight.position.pageNumber)
          ),
        } as ScaledPosition,
      };

      groupedHighlights[pageNumber].push(pageSpecificHighlight);
    });
  });

  return groupedHighlights;
};

export default groupHighlightsByPage;
