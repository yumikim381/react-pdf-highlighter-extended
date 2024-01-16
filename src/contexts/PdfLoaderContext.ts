import { PDFDocumentProxy } from "pdfjs-dist";
import { createContext, useContext } from "react";

export type PdfLoaderUtils = {
  pdfDocument: PDFDocumentProxy;
}

export const PdfLoaderContext = createContext<PdfLoaderUtils | undefined>(
  undefined,
);

export const usePdfLoaderContext = () => {
  const pdfLoaderUtils = useContext(PdfLoaderContext);

  if (pdfLoaderUtils === undefined) {
    throw new Error(
      "usePdfLoaderContext must be used within a correctly configured PdfLoader component!",
    );
  }

  return pdfLoaderUtils;
};
