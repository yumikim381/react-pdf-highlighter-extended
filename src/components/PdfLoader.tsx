import React, { ReactNode, useEffect, useState } from "react";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf";
import type { PDFDocumentProxy, OnProgressParameters } from "pdfjs-dist";
import {
  DocumentInitParameters,
  TypedArray,
} from "pdfjs-dist/types/src/display/api";
import { PdfLoaderContext } from "../contexts/PdfLoaderContext";

interface PdfLoaderProps {
  /**
   * The document to be loaded by PDF.js.
   * If you need to pass HTTP headers, auth parameters,
   * or other pdf settings, do it through here.
   */
  document: string | URL | TypedArray | ArrayBuffer | DocumentInitParameters;
  /**
   * Callback function to render content before the PDF document is loaded.
   * @param progress - PDF.js progress status.
   */
  beforeLoad?: (progress: OnProgressParameters) => ReactNode;
  errorMessage?: ReactNode;
  /**
   * Child components to use/render the loaded PDF document.
   * @param pdfDocument - The loaded PDF document.
   */
  children: ReactNode;
  onError?: (error: Error) => void;
  /**
   * NOTE: This will be applied to all PdfLoader instances.
   * If you want to only apply a source to this instance, use the document parameters.
   */
  workerSrc?: string;
}

const DEFAULT_BEFORE_LOAD = (progress: OnProgressParameters) => (
  <div style={{ color: "black" }}>
    Loading {Math.floor((progress.loaded / progress.total) * 100)}%
  </div>
);

const DEFAULT_ERROR_MESSAGE = (
  <div style={{ color: "black" }}>Oh no! An error has occurred.</div>
);

const DEFAULT_ON_ERROR = (error: Error) => {
  throw new Error(`Error loading PDF document: ${error.message}!`);
};

const DEFAULT_WORKER_SRC =
  "https://unpkg.com/pdfjs-dist@3.8.162/build/pdf.worker.min.js";

/**
 * A component for loading a PDF document and passing it to a child.
 */
const PdfLoader = ({
  document,
  beforeLoad = DEFAULT_BEFORE_LOAD,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  children,
  onError = DEFAULT_ON_ERROR,
  workerSrc = DEFAULT_WORKER_SRC,
}: PdfLoaderProps) => {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] =
    useState<OnProgressParameters | null>(null);

  // Intitialise document
  useEffect(() => {
    GlobalWorkerOptions.workerSrc = workerSrc;

    const pdfLoadingTask = getDocument(document);

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
      setLoadingProgress(progress.loaded >= progress.total ? null : progress);
    };

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [document]);

  return error
    ? errorMessage
    : loadingProgress
    ? beforeLoad(loadingProgress)
    : pdfDocument && (
        <PdfLoaderContext.Provider value={pdfDocument} children={children} />
      );
};

export default PdfLoader;
