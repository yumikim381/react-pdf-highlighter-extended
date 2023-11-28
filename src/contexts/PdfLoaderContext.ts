import { PDFDocumentProxy } from "pdfjs-dist";
import { createContext, useContext } from "react";

export const PdfLoaderContext = createContext<PDFDocumentProxy | undefined>(
  undefined,
);

export const usePdfDocument = () => {
  const pdfDocument = useContext(PdfLoaderContext);

  if (pdfDocument === undefined) {
    throw new Error(
      "usePdfDocument must be used within a correctly configured PdfLoader component!",
    );
  }

  return pdfDocument;
};
