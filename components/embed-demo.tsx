"use client";

import { useEffect } from "react";

export function EmbedDemo() {
  useEffect(() => {
    // Simulate the widget loading script
    const script = document.createElement("script");
    script.src = "/widget-loader.js";
    script.setAttribute("data-id", "DC-HBX-DEMO");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(
        'script[src="/widget-loader.js"]'
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }

      // Remove widget if it exists
      const widget = document.getElementById("perceptive-ai-widget");
      if (widget) {
        document.body.removeChild(widget);
      }
    };
  }, []);

  return <div className="bg-transaparent rounded-lg shadow-lg p-20"></div>;
}
