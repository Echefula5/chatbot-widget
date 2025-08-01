(() => {
  // Get the script tag that loaded this file
  const script =
    document.currentScript ||
    document.querySelector('script[src*="widget-loader.js"]');
  const widgetId = script.getAttribute("data-id") || "default";

  // Create iframe container
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "perceptive-ai-widget";
  widgetContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 2147483647;
    width: 100%;
    height: 100%;
    pointer-events: none;
  `;

  // Create iframe
  const iframe = document.createElement("iframe");
  iframe.src = `${window.location.origin}/widget?id=${widgetId}`;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    pointer-events: auto;
  `;

  widgetContainer.appendChild(iframe);
  document.body.appendChild(widgetContainer);

  // Handle messages from iframe
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === "WIDGET_RESIZE") {
      // Handle widget resize if needed
    }
  });
})();
