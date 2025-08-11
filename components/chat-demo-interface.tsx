"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Send, ThumbsUp, ThumbsDown, ExternalLink, FileText } from "lucide-react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { sendUserMessage } from "@/graphql/mutations";
import { onCreateMessage } from "@/graphql/subscriptions";
import {
  askQuestionQuery,
  getConversation,
  listFeedback,
  listMessages,
} from "@/graphql/queries";
import { useChatDispatch } from "./context";
import {
  handleupdateWidgetFeedback,
  handleWidgetFeedback,
} from "./actions/assistant";

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
}

interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatDemoInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationid] = useState(null);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dispatch = useChatDispatch();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const client = generateClient();
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
    // Auto-scroll to bottom when new messages arrive or typing state changes
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput(""); // Clear input immediately for better UX
    const userMessage: Message = {
      newConversation: conversationId === null ? true : false,
      conversationId: conversationId,
      userId: `user_${sessionId}`,
      instructions: '{ "randomize_factor": "high" }',
      content: JSON.stringify({ query: text }),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      setIsTyping(true);
    }, 500);

    try {
      console.log(text);
      const data = await client.graphql({
        query: askQuestionQuery,
        variables: { query: text },
      });

      console.log("Message sent successfully:", data);
      if (data.data.askQuestion.success) {
        setIsTyping(false);

        const botMessage: Message = {
          newConversation: conversationId === null ? true : false,
          conversationId: conversationId,
          userId: `user_${sessionId}`,
          instructions: '{ "randomize_factor": "high" }',
          content: JSON.stringify({ response: data.data.askQuestion.response }),
          timestamp: new Date().toISOString(),
          citations: data.data.askQuestion.metadata.top_sources,
          isBot: true,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Hide typing animation on error
      setIsTyping(false);
      // Optionally show error message to user
      // You might want to add error handling UI here
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (message: Message) => {
    let contentText = "";

    try {
      const parsedContent = JSON.parse(message.content);
      contentText = message.isBot
        ? parsedContent.response
        : parsedContent.query;
    } catch (e) {
      console.error("Failed to parse content:", message.content);
      contentText = message.content;
    }

    let citations: { id: string }[] = [];

    try {
      const parsedCitations = message.citations;
      if (Array.isArray(parsedCitations)) {
        citations = parsedCitations;
      } else {
        citations = [];
      }
    } catch (e) {
      console.error("Failed to parse citations:", message.citations);
      citations = [];
    }

    if (!message.isBot) {
      return <div className="whitespace-pre-wrap">{contentText}</div>;
    }

    // Process citation references like [1], [2]
    citations?.forEach((citation, index) => {
      const citationNumber = index + 1;
      const citationRegex = new RegExp(`\\[${citationNumber}\\]`, "g");
      contentText = contentText.replace(
        citationRegex,
        `<sup class="citation-link cursor-pointer text-blue-600 hover:text-blue-800" data-citation="${citation.id}">[${citationNumber}]</sup>`
      );
    });

    return (
      <div
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: contentText }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("citation-link")) {
            const citationId = target.getAttribute("data-citation");
            setExpandedCitation(
              expandedCitation === citationId ? null : citationId
            );
          }
        }}
      />
    );
  };

  const mes = messages.sort((a, b) => {
    const timeDiff = new Date(a.timestamp) - new Date(b.timestamp);
    if (timeDiff !== 0) return timeDiff;

    if (a.isBot === b.isBot) {
      return 0;
    }

    // Assume user speaks first, bot responds after
    return a.isBot ? 1 : -1;
  });

  const parseCitations = (citations: string): any[] => {
    try {
      const parsed = citations;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Invalid citations JSON:", citations);
      return [];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  console.log(messages);
  return (
    <div className="flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="flex flex-col max-h-[360px] h-[380px] border rounded overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
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
                    </div>
                  </div>

                  {/* Citations */}
                  {message.isBot &&
                    parseCitations(message.citations)
                      .filter((src) =>
                        src.source.toLowerCase().includes(".pdf")
                      )
                      .map((citation) => (
                        <Card
                          key={citation.id}
                          className="hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => window.open(citation.source, "_blank")}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <FileText className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {citation.source
                                    .split("/")
                                    .pop()
                                    ?.replace(".pdf", "") || "PDF Document"}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">
                                  PDF Document
                                </p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                  {/* Feedback buttons for bot messages */}
                  {/* {message.isBot && (
                    <div className="flex items-center space-x-2 mt-2 ml-4 text-xs text-gray-500">
                      <span className="font-medium">Citation:</span>
                      {message.citations.metadata?.top_sources
                        ?.filter((src) =>
                          src.source.toLowerCase().includes(".pdf")
                        )
                        .map((src, index) => (
                          <a
                            key={index}
                            href={src.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {`Source ${index + 1}`}
                          </a>
                        ))}
                    </div>
                  )} */}
                </div>
              ))}

              {/* Typing animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1 items-center">
                      <span className="text-sm mr-2">AI is typing</span>
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
    </div>
  );
}
