"use client";

import { useEffect, useState } from "react";
import { ChatWidget } from "@/components/chat-widget";

export default function WidgetPage() {
  const [config, setConfig] = useState({
    id: "default",
    theme: "default",
  });

  useEffect(() => {
    // Get configuration from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    setConfig({
      id: urlParams.get("id") || "default",
      theme: urlParams.get("theme") || "default",
    });

    // Notify parent that widget is ready
    const notifyReady = () => {
      window.parent.postMessage(
        {
          type: "WIDGET_READY",
          data: { widgetId: config.id },
        },
        "*"
      );
    };

    // Small delay to ensure iframe is fully loaded
    setTimeout(notifyReady, 100);

    // Handle messages from parent
    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data;

      switch (type) {
        case "OPEN_WIDGET":
          // Handle open command from parent
          break;
        case "CLOSE_WIDGET":
          // Handle close command from parent
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [config.id]);

  return (
    <div className=" h-full absolute bottom-0 w-full p-4 overflow-hidden bg-transparent">
      <ChatWidget widgetId={config.id} theme={config.theme} />
    </div>
  );
}
