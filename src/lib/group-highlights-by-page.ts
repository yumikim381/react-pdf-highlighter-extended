import { GhostHighlight, Highlight, ViewportHighlight } from "../types";

const groupHighlightsByPage = <T extends GhostHighlight | ViewportHighlight>(
  highlights: Array<T>
): Record<number, Array<T>> =>
  highlights
    .filter(Boolean)
    .reduce<Record<number, Array<T>>>((acc, highlight) => {
      const pageNumbers = [
        highlight.position.boundingRect.pageNumber,
        ...highlight.position.rects.map((rect) => rect.pageNumber || 0),
      ];

      pageNumbers.forEach((pageNumber) => {
        acc[pageNumber] ||= [];
        const pageSpecificHighlight = {
          ...highlight,
          position: {
            ...highlight.position,
            rects: highlight.position.rects.filter(
              (rect) => pageNumber === rect.pageNumber
            ),
          },
        };
        acc[pageNumber].push(pageSpecificHighlight);
      });

      return acc;
    }, {});

export default groupHighlightsByPage;
