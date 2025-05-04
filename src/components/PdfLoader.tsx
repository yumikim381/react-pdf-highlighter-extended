import React, { ReactNode, useEffect, useRef, useState } from "react";
// import { version as pdfjsVersion } from "pdfjs-dist";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

import {
  OnProgressParameters,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import {
  DocumentInitParameters,
  TypedArray,
} from "pdfjs-dist/types/src/display/api";

const DEFAULT_BEFORE_LOAD = (progress: OnProgressParameters) => (
  <div style={{ color: "black" }}>
    Loading {Math.floor((progress.loaded / progress.total) * 100)}%
  </div>
);

const DEFAULT_ERROR_MESSAGE = (error: Error) => (
  <div style={{ color: "black" }}>{error.message}</div>
);

const DEFAULT_ON_ERROR = (error: Error) => {
  throw new Error(`Error loading PDF document: ${error.message}!`);
};

// const pdfjsVersion = "4.8.69"; // HARD_CODED CAUSE react-pdf requires it
// const DEFAULT_WORKER_SRC = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

// const DEFAULT_WORKER_SRC =
//   "https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";

/**
 * The props type for {@link PdfLoader}.
 *
 * @category Component Properties
 */
export interface PdfLoaderProps {
  /**
   * The document to be loaded by PDF.js.
   * If you need to pass HTTP headers, auth parameters,
   * or other pdf settings, do it through here.
   */
  document: string | URL | TypedArray | DocumentInitParameters;

  /**
   * Callback to render content before the PDF document is loaded.
   *
   * @param progress - PDF.js progress status.
   * @returns - Component to be rendered in space of the PDF document while loading.
   */
  beforeLoad?(progress: OnProgressParameters): ReactNode;

  /**
   * Component to render in the case of any PDF loading errors.
   *
   * @param error - PDF loading error.
   * @returns - Component to be rendered in space of the PDF document.
   */
  errorMessage?(error: Error): ReactNode;

  /**
   * Child components to use/render the loaded PDF document.
   *
   * @param pdfDocument - The loaded PDF document.
   * @returns - Component to render once PDF document is loaded.
   */
  children(pdfDocument: PDFDocumentProxy): ReactNode;

  /**
   * Callback triggered whenever an error occurs.
   *
   * @param error - PDF Loading error triggering the event.
   * @returns - Component to be rendered in space of the PDF document.
   */
  onError?(error: Error): void;
}

/**
 * A component for loading a PDF document and passing it to a child.
 *
 * @category Component
 */
export const PdfLoader = ({
  document,
  beforeLoad = DEFAULT_BEFORE_LOAD,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  children,
  onError = DEFAULT_ON_ERROR,
}: PdfLoaderProps) => {
  const pdfLoadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);

  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] =
    useState<OnProgressParameters | null>(null);

  // Intitialise document
  useEffect(() => {
    // GlobalWorkerOptions.workerSrc = workerUrl;
    pdfLoadingTaskRef.current = getDocument(document);
    pdfLoadingTaskRef.current.onProgress = (progress: OnProgressParameters) => {
      setLoadingProgress(progress.loaded > progress.total ? null : progress);
    };

    pdfLoadingTaskRef.current.promise
      .then((pdfDocument: PDFDocumentProxy) => {
        pdfDocumentRef.current = pdfDocument;
      })
      .catch((error: Error) => {
        if (error.message != "Worker was destroyed") {
          setError(error);
          onError(error);
        }
      })
      .finally(() => {
        setLoadingProgress(null);
      });

    return () => {
      if (pdfLoadingTaskRef.current) {
        pdfLoadingTaskRef.current.destroy();
      }

      if (pdfDocumentRef.current) {
        pdfDocumentRef.current.destroy();
      }
    };
  }, [document]);

  return error
    ? errorMessage(error)
    : loadingProgress
    ? beforeLoad(loadingProgress)
    : pdfDocumentRef.current && children(pdfDocumentRef.current);
};
