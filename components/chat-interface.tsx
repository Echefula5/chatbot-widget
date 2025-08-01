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
import { getConversation } from "@/graphql/queries";
import { useChatDispatch } from "./context";

interface Message {
  id?: any; // Optional
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
  console.log(
    process.env.NEXT_PUBLIC_API_URI,
    process.env.NEXT_PUBLIC_AWS_REGION,
    process.env.NEXT_PUBLIC_API_KEY
  );
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
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
  // const handleSendMessage = async () => {
  //   const text = messageText || input.trim();
  //   if (!text) return;
  //   setSending(true);
  //   setModalOpened(true); // Open modal when processing starts

  //   const input = {
  //     newConversation: !selectedChat?.id,
  //     conversationId: selectedChat?.id || undefined,
  //     userId: capitalizedUserId,
  //     instructions: '{ "randomize_factor": "high" }',
  //     content: JSON.stringify({ query: message }),
  //     timestamp: new Date().toISOString(),
  //   };
  //   console.log(input);
  //   try {
  //     const data = await client.graphql({
  //       query: sendUserMessage,
  //       variables: { input },
  //     });
  //     console.log(data);
  //     if (data?.data?.sendUserMessage) {
  //       if (selectedChat?.id === undefined) {
  //         dispatch({ type: "SENT_NEW_MESSAGE", payload: true });
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //   } finally {
  //     setSending(false);
  //     setModalOpened(false); // Close modal when done
  //     setMessage("");
  //   }
  // };
  console.log("test");
  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = {
      newConversation: conversationId === null ? true : false,
      conversationId: conversationId,
      userId: `user_${sessionId}`,
      instructions: '{ "randomize_factor": "high" }',
      content: JSON.stringify({ query: text }),
      timestamp: new Date().toISOString(),
    };

    try {
      const data = await client.graphql({
        query: sendUserMessage,
        variables: { input: userMessage },
      });
      setInput("");

      console.log(data);
      // if (data?.data?.sendUserMessage) {
      //   if (selectedChat?.id === undefined) {
      //     dispatch({ type: "SENT_NEW_MESSAGE", payload: true });
      //   }
      // }
    } catch (error) {
      console.error("Error sending message:", error);
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
        console.log(data);
        setConversationid(data?.onCreateMessage?.conversationId);
        setMessages((prevMessages) => {
          const exists = prevMessages.some(
            (msg) => msg?.id === data.onCreateMessage.id
          );
          if (exists) return prevMessages;
          return [...prevMessages, data.onCreateMessage];
        });
        if (data?.onCreateMessage?.isBot) {
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
            // setNewMessageId(data.onCreateMessage.id);
          } catch (error) {
            console.error("Error fetching conversation:", error);
          }
        }
      },
      error: (error: any) => console.warn(error),
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
      contentText = message.content; // fallback
    }

    let citations: { id: string }[] = [];

    try {
      const parsedCitations = JSON.parse(message.citations || "[]");

      if (Array.isArray(parsedCitations)) {
        citations = parsedCitations;
      } else {
        citations = []; // fallback if it's an object like {}
      }
    } catch (e) {
      console.error("Failed to parse citations:", message.citations);
      citations = [];
    }

    if (!message.isBot) {
      return <div className="whitespace-pre-wrap">{contentText}</div>;
    }
    console.log(citations);
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
  const parseCitations = (citations: string): any[] => {
    try {
      const parsed = JSON.parse(citations || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Invalid citations JSON:", citations);
      return [];
    }
  };
  console.log(messages);

  return (
    <div className="flex flex-col ">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="flex flex-col max-h-[360px] h-[380px] border rounded overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {" "}
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
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

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>{" "}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isTyping}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isTyping || !input.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
