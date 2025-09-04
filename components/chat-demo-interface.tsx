"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  FileText,
  Brain,
  Globe,
  ChevronDown,
  X,
} from "lucide-react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { sendUserMessage } from "@/graphql/mutations";
import { onCreateMessage } from "@/graphql/subscriptions";
import {
  askQuestionQuery,
  getConversation,
  HbxlistFeedback,
  listFeedback,
  listMessages,
} from "@/graphql/queries";
import { useChatDispatch } from "./context";
import { v4 as uuidv4 } from "uuid";

import {
  handleupdateWidgetFeedback,
  handleWidgetFeedback,
} from "./actions/assistant";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCookie } from "cookies-next/client";

interface Message {
  id?: any;
  content: string;
  timestamp: String;
  newConversation: boolean;
  conversationId: any;
  userId: String;
  instructions: any;
  isBot?: any;
  citations?: any;
  confidence?: any;
  originalQuery?: string;
  intent?: string;
}

interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  messages: any;
  setMessages: any;
  setShowRating: any;
  isMaximized: any;
}
interface FeedbackItem {
  messageId: string;
  feedbackId: string;
  content: string; // JSON string with { liked: boolean }
  timestamp: string | number;
  textFeedback: any;
}
export function ChatDemoInterface({
  sessionId,
  messages,
  setMessages,
  setShowRating,
  isMaximized,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationid] = useState(null);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dispatch = useChatDispatch();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]); // <-- Define type
  const client = generateClient();
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    messageId: "",
    currentFeedback: null as "positive" | "negative" | null,
    textFeedback: "",
    existingFeedbackId: null as string | null,
    botResponse: "",
    originalQuery: "",
  });
  const openFeedbackModal = (
    messageId: string,
    feedbackType: "positive" | "negative",
    botResponse: string,
    originalQuery: string
  ) => {
    const existingFeedback = feedback.find(
      (f: any) => f.messageId === messageId
    );

    setFeedbackModal({
      isOpen: true,
      messageId,
      currentFeedback: feedbackType,
      textFeedback: existingFeedback?.textFeedback || "",
      existingFeedbackId: existingFeedback?.feedbackId || null,
      botResponse,
      originalQuery,
    });
  };
  Amplify.configure({
    API: {
      GraphQL: {
        endpoint: process.env.NEXT_PUBLIC_API_URI!,
        region: process.env.NEXT_PUBLIC_AWS_REGION!,
        defaultAuthMode: "apiKey",
        apiKey: process.env.NEXT_PUBLIC_API_KEY!,
      },
    },
  });

  useEffect(() => {
    const summaryData = JSON.parse(getCookie("metro_link_messages") || "{}");
    if (summaryData?.messages?.length > 0) {
      setMessages(summaryData?.messages);
    }
  }, []);

  const handleEndChat = () => {
    setShowRating(true);
  };

  const renderConfidenceIndicator = (message: any) => {
    const confidence = JSON.parse(message.content).confidence;
    const percentage = Math.round(confidence * 100);

    // Determine confidence level and styling
    let confidenceLevel = "Low";
    let badgeVariant: "destructive" | "secondary" | "default" = "destructive";
    let progressColor = "bg-red-500";

    if (confidence >= 0.8) {
      confidenceLevel = "High";
      badgeVariant = "default";
      progressColor = "bg-green-500";
    } else if (confidence >= 0.6) {
      confidenceLevel = "Medium";
      badgeVariant = "secondary";
      progressColor = "bg-yellow-500";
    }

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Confidence Rating
            </span>
          </div>
          <Badge variant={badgeVariant} className="text-xs">
            {confidenceLevel}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Accuracy Score</span>
            <span className="font-semibold text-gray-900">{percentage}%</span>
          </div>

          <div className="relative">
            <Progress value={percentage} className="h-2" />
            <div
              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {confidence >= 0.8
              ? "High confidence - Information is well-supported"
              : confidence >= 0.6
              ? "Medium confidence - Some uncertainty in the response"
              : "Low confidence - Please verify this information"}
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or typing state changes
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    };

    // Use setTimeout to ensure DOM is updated after accordion renders
    setTimeout(scrollToBottom, 100);
  }, [messages, isTyping]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || sending) return;
    const userId = `user_${sessionId}`;
    setSending(true);
    setInput(""); // Clear input immediately for better UX
    const userMessage: Message = {
      id: uuidv4(),
      newConversation: conversationId === null ? true : false,
      conversationId: conversationId,
      userId: userId,
      instructions: '{ "randomize_factor": "high" }',
      content: JSON.stringify({ query: text }),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev: any) => [...prev, userMessage]);

    setTimeout(() => {
      setIsTyping(true);
    }, 500);

    try {
      const is_new = messages.length <= 1 ? true : false;
      const result = await client.graphql({
        query: askQuestionQuery,
        variables: {
          input: {
            query: text,
            session_id: sessionId,
            user_id: userId,
            is_new,
          },
        },
      });
      console.log(result);
      if ("data" in result && result.data?.askQuestion?.success) {
        setIsTyping(false);
        const formatData = result.data.askQuestion.metadata.retrieved_docs;

        const contentMatches = formatData?.find((item: any) =>
          item.content.includes("Web Content Analysis Report")
        );
        const content = contentMatches?.content;
        // Extract sections by labels
        const extractSection = (label: any) => {
          const regex = new RegExp(
            `${label}\\s+(.*?)\\s+(?=(Scraping Method|Content Quality Score|Dynamic Content Detected|Source|Analysis Date|Content Items Found|Executive Summary|Key Themes Identified|Content Analysis|$))`,
            "s"
          );
          const match = content?.match(regex);
          return match ? match[1].trim() : null;
        };

        const structuredContent = {
          reportTitle: "Web Content Analysis Report", // static title
          scrapingMethod:
            extractSection("Scraping Method") || "DYNAMIC_ENHANCED",
          contentQuality: extractSection("Content Quality Score") || null,
          dynamicDetected: extractSection("Dynamic Content Detected") || null,
          source_url:
            (content?.match(/Source:\s*(https?:\/\/[^\s]+)/) || [])[1] || null,
          analysisDate: extractSection("Analysis Date") || null,
          executiveSummary: extractSection("Executive Summary") || null,
          keyThemes: (extractSection("Key Themes Identified") || "")
            .split("•")
            .map((t: any) => t.trim())
            .filter(Boolean),
          contentAnalysis: extractSection("Content Analysis") || null,
          source: formatData?.source,
        };
        const botMessage: Message = {
          id: result.data.askQuestion.metadata.messageId,
          newConversation: conversationId === null,
          conversationId,
          userId: `user_${sessionId}`,
          instructions: '{ "randomize_factor": "high" }',
          content: JSON.stringify({
            response: result.data.askQuestion.response,
            confidence: result.data.askQuestion.metadata.confidence,
          }),
          intent: result.data.askQuestion.metadata.intent_analysis,
          timestamp: new Date().toISOString(),
          citations: structuredContent,
          isBot: true,
          originalQuery: text,
        };

        setMessages((prev: any) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
    } finally {
      setSending(false);
    }
  };
  const renderMessageContent = (message: Message) => {
    let responseText = "";
    let confidenceValue = null;
    let citations: { id: string }[] = [];
    try {
      const parsedContent = JSON.parse(message.content);
      if (message.isBot) {
        responseText = parsedContent.response || "";
        confidenceValue = parsedContent.confidence || null;
        const parsedCitations = message.citations;
        if (Array.isArray(parsedCitations)) {
          citations = parsedCitations;
        } else {
          citations = [];
        }
      } else {
        responseText = parsedContent.query || "";
      }
    } catch (e) {
      console.error("Failed to parse content:", message.content);
      responseText = message.content;
      citations = [];
    }
    citations?.forEach((citation, index) => {
      const citationNumber = index + 1;
      const citationRegex = new RegExp(`\\[${citationNumber}\\]`, "g");
      responseText = responseText.replace(
        citationRegex,
        `<sup class="citation-link cursor-pointer text-blue-600 hover:text-blue-800" data-citation="${citation.id}">[${citationNumber}]</sup>`
      );
    });
    return (
      <div className="whitespace-pre-wrap">
        {responseText}
        {message.isBot && confidenceValue !== null && (
          <div className="text-xs text-gray-400 mt-1">
            {renderConfidenceIndicator(message)}
          </div>
        )}
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAllFeedbacks = async () => {
    try {
      const userId = `user_${sessionId}`;
      const data = await client.graphql({
        query: HbxlistFeedback,
        variables: {
          filter: {
            userId: { eq: userId },
          },
          limit: 100,
        },
      });
      if ("data" in data) {
        const feedbackItems =
          data.data?.HbxlistFeedback?.items.filter(Boolean) ?? [];
        setFeedback(feedbackItems);
        return feedbackItems;
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      return [];
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      const {
        messageId,
        currentFeedback,
        textFeedback,
        existingFeedbackId,
        botResponse,
        originalQuery,
      } = feedbackModal;

      if (!currentFeedback) return;

      const likedValue = currentFeedback === "positive" ? true : false;
      const userId = `user_${sessionId}`;

      if (existingFeedbackId) {
        // Update existing feedback
        await handleupdateWidgetFeedback(
          existingFeedbackId,
          userId,
          likedValue,
          Date.now(),
          textFeedback // Pass text feedback if your API supports it
        );
      } else {
        // Create new feedback
        await handleWidgetFeedback(
          messageId,
          userId,
          likedValue,
          sessionId,
          "message",
          textFeedback,
          null,
          botResponse,
          originalQuery
        );
      }

      getAllFeedbacks();
      setFeedbackModal({
        isOpen: false,
        messageId: "",
        currentFeedback: null,
        textFeedback: "",
        existingFeedbackId: null,
        botResponse: "",
        originalQuery: "",
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };
  return (
    <div className="flex flex-col relative">
      {/* Floating End Chat Button */}

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div
          className={
            isMaximized
              ? "flex flex-col max-h-[65vh] h-[65vh] border rounded overflow-hidden"
              : "flex flex-col max-h-[320px] h-[330px] border rounded overflow-hidden"
          }
        >
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message: any, index: any) => {
                console.log(message);
                return (
                  <div key={index}>
                    <div
                      className={`flex ${
                        !message.isBot ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.isBot
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {renderMessageContent(message)}
                        {message.isBot &&
                          !message.citations.source_url &&
                          !(
                            message.intent?.includes("greeting") ||
                            message.intent?.includes("closing")
                          ) && (
                            <a
                              href="https://metrohealthlink.com/contact" // <-- Change this to your actual support link
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                className="mt-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors rounded-md shadow-sm"
                              >
                                Connect with Support
                              </Button>
                            </a>
                          )}
                      </div>
                    </div>

                    {/* Citations Accordion */}
                    {message.isBot && message.citations.source_url && (
                      <div className="max-w-[80%] mt-3">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem
                            value={`citations-${message.id}`}
                            className="border rounded-lg"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <span>Citations (1)</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-3">
                              <div className="space-y-2">
                                <Card className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-blue-500">
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 mt-0.5">
                                        <Globe className="w-4 h-4 text-blue-500" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5
                                          className="text-sm max-w-[100px] font-medium text-gray-900 
    truncate whitespace-nowrap overflow-hidden group-hover:text-blue-600 transition-colors"
                                        >
                                          Web Content Analysis Report
                                        </h5>
                                        <a
                                          className="text-xs text-gray-500 mt-1"
                                          href={message.citations.source_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          Webpage • Click to view
                                        </a>
                                        {message.citations.executiveSummary && (
                                          <p className="text-xs text-gray-600 mt-2">
                                            {message.citations.executiveSummary}
                                          </p>
                                        )}
                                      </div>
                                      <a
                                        href={message.citations.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group"
                                      >
                                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                      </a>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}

                    {/* Feedback buttons for bot messages */}
                    {message.isBot && (
                      <div className="flex items-center space-x-2 mt-2 ml-4">
                        <span className="text-xs text-gray-500">
                          Was this helpful?
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            openFeedbackModal(
                              message.id,
                              "positive",
                              JSON.parse(message.content).response,
                              message.originalQuery
                            );
                          }}
                          className={`h-6 w-6 p-0 ${
                            feedback.find(
                              (f: any) =>
                                f.messageId === message.id &&
                                JSON.parse(f.content).liked
                            )
                              ? "text-green-600"
                              : ""
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            openFeedbackModal(
                              message.id,
                              "negative",
                              JSON.parse(message.content).response,
                              message.originalQuery
                            );
                          }}
                          className={`h-6 w-6 p-0 ${
                            feedback.find(
                              (f: any) =>
                                f.messageId === message.id &&
                                !JSON.parse(f.content).liked
                            )
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1 items-center">
                      <span className="text-sm mr-2">Thinking</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={sending || !input.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {isMaximized ? (
        <h2 className=" text-center">
          AI can make mistakes. Consider checking important information for
          accuracy.
        </h2>
      ) : (
        <p className=" text-xs text-center">
          {" "}
          AI can make mistakes. Consider checking important information for
          accuracy.
        </p>
      )}

      <Dialog
        open={feedbackModal.isOpen}
        onOpenChange={(open) =>
          setFeedbackModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-[20rem]">
          <DialogHeader>
            <DialogTitle>
              {feedbackModal.currentFeedback === "positive"
                ? "Positive"
                : "Negative"}{" "}
              Feedback
            </DialogTitle>
            <DialogDescription>
              {feedbackModal.existingFeedbackId
                ? "Edit your feedback for this response."
                : "Help us improve by sharing your thoughts about this response."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Rating:</span>
              <div className="flex space-x-1">
                <Button
                  variant={
                    feedbackModal.currentFeedback === "positive"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFeedbackModal((prev) => ({
                      ...prev,
                      currentFeedback: "positive",
                    }))
                  }
                  className="h-8"
                >
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Helpful
                </Button>
                <Button
                  variant={
                    feedbackModal.currentFeedback === "negative"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFeedbackModal((prev) => ({
                      ...prev,
                      currentFeedback: "negative",
                    }))
                  }
                  className="h-8"
                >
                  <ThumbsDown className="w-3 h-3 mr-1" />
                  Not Helpful
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Comments (Optional)
              </label>
              <Textarea
                placeholder="Tell us more about your experience with this response..."
                value={feedbackModal.textFeedback}
                onChange={(e) =>
                  setFeedbackModal((prev) => ({
                    ...prev,
                    textFeedback: e.target.value,
                  }))
                }
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setFeedbackModal((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit}>
              {feedbackModal.existingFeedbackId
                ? "Update Feedback"
                : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
