"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Send, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { sendUserMessage } from "@/graphql/mutations";
import { onCreateMessage } from "@/graphql/subscriptions";
import { getConversation, listMessages } from "@/graphql/queries";
import { useChatDispatch } from "./context";

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

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationid] = useState(null);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dispatch = useChatDispatch();
  const [loading, setLoading] = useState(false);

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
    // Check for initial query from welcome tab
    const initialQuery = sessionStorage.getItem("initialQuery");
    if (initialQuery) {
      sessionStorage.removeItem("initialQuery");
      handleSendMessage(initialQuery);
    }

    // Load chat history
    loadChatHistory();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or typing state changes
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${sessionId}`);
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput(""); // Clear input immediately for better UX

    // Create user message and add it to the messages array immediately
    const userMessage: Message = {
      newConversation: conversationId === null ? true : false,
      conversationId: conversationId,
      userId: `user_${sessionId}`,
      instructions: '{ "randomize_factor": "high" }',
      content: JSON.stringify({ query: text }),
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);

    // Show typing animation after a brief delay for better UX
    setTimeout(() => {
      setIsTyping(true);
    }, 500);

    try {
      const data = await client.graphql({
        query: sendUserMessage,
        variables: { input: userMessage },
      });

      console.log("Message sent successfully:", data);
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

  const handleFeedback = async (
    messageId: string,
    feedback: "positive" | "negative"
  ) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          sessionId,
          feedback,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  useEffect(() => {
    const createSub = client.graphql({ query: onCreateMessage }).subscribe({
      next: async ({ data }) => {
        console.log("Received message:", data);

        // Hide typing animation when we receive a bot response
        if (data?.onCreateMessage?.isBot) {
          setIsTyping(false);
        }

        setConversationid(data?.onCreateMessage?.conversationId);

        if (data?.onCreateMessage?.isBot) {
          setMessages((prevMessages) => {
            const exists = prevMessages.some(
              (msg) => msg?.id === data.onCreateMessage.id
            );
            if (exists) return prevMessages;
            return [...prevMessages, data.onCreateMessage];
          });
          const conversationId = data?.onCreateMessage?.conversationId;
          if (!conversationId) {
            console.warn("No conversationId found in the message");
            return;
          }

          try {
            const conversationData = await client.graphql({
              query: getConversation,
              variables: { id: conversationId },
            });

            dispatch({
              type: "SET_SELECTED_CHAT",
              payload: conversationData?.data?.getConversation,
            });
          } catch (error) {
            console.error("Error fetching conversation:", error);
          }
        }
      },
      error: (error: any) => {
        console.warn("Subscription error:", error);
        setIsTyping(false); // Hide typing animation on error
      },
    });

    return () => createSub.unsubscribe();
  }, []);

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
      const parsedCitations = JSON.parse(message.citations || "[]");
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
  const getAllListMessages = async () => {
    setLoading(true);

    const variables = {
      filter: {
        userId: { eq: `user_${sessionId}` },
      },
    };

    const data = await client.graphql({
      query: listMessages,
      variables,
    });
    console.log(data);
    if (data?.data) {
      setLoading(false);
    }
    setMessages(data?.data?.listMessages?.items);
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

  useEffect(() => {
    if (sessionId) {
      getAllListMessages();
    }
  }, [sessionId]);
  const parseCitations = (citations: string): any[] => {
    try {
      const parsed = JSON.parse(citations || "[]");
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
                    Array.isArray(parseCitations(message.citations)) &&
                    parseCitations(message.citations).map(
                      (citation) =>
                        expandedCitation === citation.id && (
                          <Card key={citation.id} className="mt-2 ml-4 mr-16">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                                    {citation.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {citation.snippet}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(citation.url, "_blank")
                                    }
                                    className="text-xs"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View Source
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
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
                        onClick={() => handleFeedback(message.id, "positive")}
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(message.id, "negative")}
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
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
