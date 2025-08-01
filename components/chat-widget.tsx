"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Home, Book, X, Minus } from "lucide-react";
import { ChatInterface } from "./chat-interface";
import { WelcomeTab } from "./welcome-tab";
import { KnowledgeBaseTab } from "./knowledge-base-tab";
import { RatingDialog } from "./rating-dialog";
import { ChatProvider } from "./context";

interface ChatWidgetProps {
  widgetId: string;
  theme?: string;
}

export function ChatWidget({ widgetId, theme = "default" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const [showRating, setShowRating] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Notify parent window of state changes
  const notifyParent = (type: string, data?: any) => {
    window.parent.postMessage({ type, data }, "*");
  };

  // Handle messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data;

      switch (type) {
        case "OPEN_WIDGET":
          setIsOpen(true);
          break;
        case "CLOSE_WIDGET":
          setIsOpen(false);
          break;
        case "MINIMIZE_WIDGET":
          setIsOpen(false);
          notifyParent("WIDGET_MINIMIZE");
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    // Auto-show rating after 5 minutes of inactivity
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (isOpen) {
          setShowRating(true);
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    if (isOpen) {
      resetTimer();
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keypress", resetTimer);
    }

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    notifyParent("WIDGET_OPEN");
    notifyParent("TRACK_EVENT", {
      event: "widget_opened",
      properties: { widgetId, sessionId },
    });

    // Resize container to full widget size
    notifyParent("WIDGET_RESIZE", { width: 400, height: 600 });
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowRating(true);
    notifyParent("WIDGET_CLOSE");
    notifyParent("TRACK_EVENT", {
      event: "widget_closed",
      properties: { widgetId, sessionId },
    });

    // Resize container to button size
    notifyParent("WIDGET_RESIZE", { width: 64, height: 64 });
  };

  const handleMinimize = () => {
    setIsOpen(false);
    notifyParent("WIDGET_MINIMIZE");
    notifyParent("TRACK_EVENT", {
      event: "widget_minimized",
      properties: { widgetId, sessionId },
    });
  };

  // Apply theme styles
  const themeClass = theme === "dark" ? "" : "";

  if (!isOpen) {
    return (
      <div
        className={`w-full h-full flex items-end justify-end p-0 ${themeClass}`}
      >
        <Button
          onClick={handleOpen}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Open chat widget"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <ChatProvider>
      <div
        className={`w-full h-full bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col ${themeClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">DC HBX Assistant</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="text-white hover:bg-blue-700 w-8 h-8 p-0"
              aria-label="Minimize chat widget"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-blue-700 w-8 h-8 p-0"
              aria-label="Close chat widget"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger
              value="welcome"
              className="flex items-center space-x-1 text-xs"
            >
              <Home className="w-3 h-3" />
              <span>Welcome</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex items-center space-x-1 text-xs"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="flex items-center space-x-1 text-xs"
            >
              <Book className="w-3 h-3" />
              <span>Knowledge</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="welcome" className="h-full m-0">
              <WelcomeTab onStartChat={() => setActiveTab("chat")} />
            </TabsContent>

            <TabsContent value="chat" className="h-full m-0">
              <ChatInterface sessionId={sessionId} widgetId={widgetId} />
            </TabsContent>

            <TabsContent value="knowledge" className="h-full m-0">
              <KnowledgeBaseTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <RatingDialog
        open={showRating}
        onOpenChange={setShowRating}
        sessionId={sessionId}
        widgetId={widgetId}
      />
    </ChatProvider>
  );
}
