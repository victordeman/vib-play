/*  public/monaco-editor/min/html.worker.bundle.js  */
// This file is loaded by Monaco as the HTML language worker.
// It simply forwards all messages to the generic Monaco worker implementation.

self.importScripts(
  // You can point to a CDN or to the local copy of Monaco’s worker script.
  // Example using the CDN (adjust the version if needed):
  "https://cdnjs.cloudflare.com/ajax-embed/0.33.0/min/vs/base/worker/workerMain.js"
);
