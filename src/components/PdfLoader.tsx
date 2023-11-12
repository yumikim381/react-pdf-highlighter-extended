import React, { ReactNode, useEffect, useState } from "react";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf";
import type { PDFDocumentProxy, OnProgressParameters } from "pdfjs-dist";

interface Props {
  /**
   * URL for the PDF document.
   */
  url: string;

  /**
   * Callback function to render content before the PDF document is loaded.
   * @param {OnProgressParameters} progress - PDF.js progress status.
   */
  beforeLoad?: (progress: OnProgressParameters) => ReactNode;

  /**
   * Error message to display if there is an error loading the PDF document.
   */
  errorMessage?: ReactNode;

  /**
   * Callback function to use/render the loaded PDF document.
   * @param {PDFDocumentProxy} pdfDocument - The loaded PDF document.
   */
  children: (pdfDocument: PDFDocumentProxy) => ReactNode;

  /**
   * Callback function to handle errors when loading a PDF document.
   * @param error - The error object.
   */
  onError?: (error: Error) => void;

  /** See `GlobalWorkerOptionsType`. */
  workerSrc?: string;
  cMapUrl?: string;
  cMapPacked?: boolean;
}

const DEFAULT_BEFORE_LOAD = (progress: OnProgressParameters) => (
  <div style={{ color: "black" }}>
    Loading {Math.floor((progress.loaded / progress.total) * 100)}%
  </div>
);
const DEFAULT_ERROR_MESSAGE = (
  <div style={{ color: "black" }}>Oh no! An error has occurred.</div>
);
const DEFAULT_ON_ERROR = (error: Error) =>
  console.log(`Error loading PDF document: ${error.message}!`);
const DEFAULT_WORKER_SRC =
  "https://unpkg.com/pdfjs-dist@3.8.162/build/pdf.worker.min.js";

/**
 * A component for loading a PDF document and passing it to a child.
 *
 * @param {Props} props - The component's properties.
 */
const PdfLoader = ({
  url,
  beforeLoad = DEFAULT_BEFORE_LOAD,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  children,
  onError = DEFAULT_ON_ERROR,
  workerSrc = DEFAULT_WORKER_SRC,
  cMapUrl,
  cMapPacked,
}: Props) => {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] =
    useState<OnProgressParameters | null>(null);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = workerSrc;

    const pdfLoadingTask = getDocument({
      url,
      cMapUrl,
      cMapPacked,
    });

    pdfLoadingTask.promise
      .then((pdfDocument: PDFDocumentProxy) => {
        setPdfDocument(pdfDocument);
      })
      .catch((error: Error) => {
        setError(error);
        onError(error);
      })
      .finally(() => {
        setLoadingProgress(null);
      });

    pdfLoadingTask.onProgress = (progress: OnProgressParameters) => {
      setLoadingProgress(progress);
    };

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [url]);

  return (
    <div>
      {error
        ? errorMessage
        : loadingProgress
        ? beforeLoad(loadingProgress)
        : pdfDocument
        ? children(pdfDocument)
        : null}
    </div>
  );
};

export default PdfLoader;
