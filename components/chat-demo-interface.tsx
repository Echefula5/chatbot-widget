import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Amplify } from "aws-amplify";
import { getCookie, setCookie } from "cookies-next/client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { v4 as uuidv4 } from "uuid";
import { generateClient } from "aws-amplify/api";
import {
  askQuestionQuery,
  getConversation,
  HbxlistFeedback,
  listFeedback,
  listMessages,
} from "@/graphql/queries";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Brain,
  ChevronDown,
  Globe,
  X,
  Mail,
  MessageSquare,
  Star,
} from "lucide-react";
interface LeadData {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  city?: string;
  country_code?: string;
  state_code?: string;
}

interface LeadResponse {
  success: boolean;
  message?: string;
  error?: string;
  leadData?: LeadData;
}
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
  session_id: string;
}

interface ContactInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  consent: boolean;
}

interface ChatWrapUpData {
  conversationId: string;
  endedAt: string;
  endedReason: "user_end" | "timeout" | "handoff";
  userFeedback: {
    helpful: boolean;
    comment: string;
  };
  handoff: {
    needsHandoff: boolean;
    reason: string;
    preferredTopic: string;
  };
  contact: ContactInfo;
  transcriptUrl: string;
  metrics: {
    durationSec: number;
    turns: number;
    avgConfidence: number;
  };
  kbCitations: Array<{
    url: string;
    title: string;
    chunks: number[];
  }>;
}
interface FeedbackItem {
  messageId: string;
  feedbackId: string;
  content: string; // JSON string with { liked: boolean }
  timestamp: string | number;
  textFeedback: any;
}
interface ChatInterfaceProps {
  sessionId: string;
  messages: any;
  setMessages: any;
  setShowRating: any;
  isMaximized: any;
  showWrapUp: any;
  setShowWrapUp: any;
  setIsOpen: any;
}
type Language = "english" | "spanish" | "amharic" | "french";

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: "english", name: "English", flag: "🇺🇸" },
  { code: "spanish", name: "Español", flag: "🇪🇸" },
  { code: "amharic", name: "አማርኛ", flag: "🇪🇹" },
  { code: "french", name: "Français", flag: "🇫🇷" },
];

// Language Selector Component
function LanguageSelector({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
}) {
  const [open, setOpen] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === language);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          {currentLanguage?.flag}
          {currentLanguage?.name}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        {languages.map((lang) => (
          <div
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setOpen(false); // close after selection
            }}
            className={`px-3 py-2 cursor-pointer flex items-center gap-2 rounded ${
              lang.code === language
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-gray-50"
            }`}
          >
            {lang.flag} {lang.name}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
export function ChatDemoInterface({
  sessionId,
  messages,
  setMessages,
  setShowRating,
  isMaximized,
  showWrapUp,
  setShowWrapUp,
  setIsOpen,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]); // <-- Define type
  // Salesforce Integration State
  const [wrapUpStep, setWrapUpStep] = useState<
    "feedback" | "contact" | "confirmation"
  >("feedback");
  const [needsHandoff, setNeedsHandoff] = useState(false);
  const [userFeedback, setUserFeedback] = useState({
    helpful: true,
    comment: "",
  });
  const [language, setLanguage] = useState<Language>("english");

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    consent: false,
  });
  const [wantsCopy, setWantsCopy] = useState(false);
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [preferredTopic, setPreferredTopic] = useState("");
  const [chatStartTime] = useState(new Date());
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
  // Auto-close conditions
  useEffect(() => {
    if (messages && messages.length > 0) {
      setCookie("metro_link_messages", JSON.stringify({ messages }), {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "none", // allow cross-site cookie
        secure: true, // required when SameSite=None
      });
    }
  }, [messages]);
  useEffect(() => {
    const summaryData = JSON.parse(getCookie("metro_link_messages") || "{}");
    if (summaryData?.messages?.length > 0) {
      setMessages(summaryData?.messages);
    }
  }, []);
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleAutoClose("timeout");
      }, 10 * 60 * 1000); // 10 minutes of inactivity
    };

    // Reset timer on any user activity
    resetTimer();

    return () => clearTimeout(inactivityTimer);
  }, [messages]);

  // Check for handoff conditions based on confidence
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isBot) {
      try {
        const content = JSON.parse(lastMessage.content);
        const confidence = content.confidence || 1;

        // Auto-trigger handoff for low confidence responses
        if (confidence < 0.4) {
          setNeedsHandoff(true);
        }
      } catch (e) {
        console.error("Error parsing message content:", e);
      }
    }
  }, [messages]);

  const handleAutoClose = (reason: "timeout" | "handoff") => {
    setShowWrapUp(true);
  };

  const handleEndChat = () => {
    setShowWrapUp(true);
  };

  const calculateMetrics = () => {
    const endTime = new Date();
    const durationSec = Math.floor(
      (endTime.getTime() - chatStartTime.getTime()) / 1000
    );

    let totalConfidence = 0;
    let confidenceCount = 0;

    messages.forEach((msg: Message) => {
      if (msg.isBot) {
        try {
          const content = JSON.parse(msg.content);
          if (content.confidence) {
            totalConfidence += content.confidence;
            confidenceCount++;
          }
        } catch (e) {
          // Skip messages with parsing errors
        }
      }
    });

    const avgConfidence =
      confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const userTurns = messages.filter((msg: Message) => !msg.isBot).length;

    return {
      durationSec,
      turns: userTurns,
      avgConfidence,
    };
  };

  const extractCitations = () => {
    const citations: Array<{ url: string; title: string; chunks: number[] }> =
      [];

    messages.forEach((msg: Message) => {
      if (msg.isBot && msg.citations?.source_url) {
        citations.push({
          url: msg.citations.source_url,
          title: msg.citations.reportTitle || "Web Content Analysis Report",
          chunks: [1], // Simplified - you'd want to track actual chunk IDs
        });
      }
    });

    return citations;
  };
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
  // const submitToSalesforce = async (wrapUpData: ChatWrapUpData) => {
  //   try {
  //     // This would be your actual Salesforce integration endpoint
  //     const response = await fetch("/api/salesforce/create-lead", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(wrapUpData),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to submit to Salesforce");
  //     }

  //     const result = await response.json();
  //     console.log("Successfully submitted to Salesforce:", result);

  //     return result;
  //   } catch (error) {
  //     console.error("Error submitting to Salesforce:", error);
  //     throw error;
  //   }
  // };
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
  const handleWrapUpComplete = async () => {
    const metrics = calculateMetrics();
    const citations = extractCitations();

    const wrapUpData: ChatWrapUpData = {
      conversationId: sessionId,
      endedAt: new Date().toISOString(),
      endedReason: needsHandoff ? "handoff" : "user_end",
      userFeedback,
      handoff: {
        needsHandoff,
        reason: needsHandoff ? "low_confidence" : "",
        preferredTopic,
      },
      contact: contactInfo,
      transcriptUrl: `https://your-domain.com/transcripts/${sessionId}.pdf`,
      metrics,
      kbCitations: citations,
    };

    try {
      // await submitToSalesforce(wrapUpData);
      setShowWrapUp(false);
      setShowRating(true); // Show final rating/thank you
    } catch (error) {
      console.error("Failed to complete wrap-up:", error);
      // Handle error appropriately
    }
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
  const renderWrapUpDialog = () => {
    return (
      <Dialog open={showWrapUp} onOpenChange={setShowWrapUp}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chat Summary</DialogTitle>
            <DialogDescription>
              Thank you for using our chat assistant. We'd love to get your
              feedback!
            </DialogDescription>
          </DialogHeader>

          {wrapUpStep === "feedback" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="helpful"
                    checked={userFeedback.helpful}
                    onChange={(e) =>
                      setUserFeedback((prev) => ({
                        ...prev,
                        helpful: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <label htmlFor="helpful" className="text-sm font-medium">
                    This conversation was helpful
                  </label>
                </div>

                <Textarea
                  placeholder="Any additional feedback? (optional)"
                  value={userFeedback.comment}
                  onChange={(e) =>
                    setUserFeedback((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Would you like:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <input
                      type="checkbox"
                      id="email-copy"
                      checked={wantsCopy}
                      onChange={(e) => setWantsCopy(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="email-copy" className="text-sm">
                      A copy of this conversation emailed to you?
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <input
                      type="checkbox"
                      id="follow-up"
                      checked={wantsFollowUp}
                      onChange={(e) => setWantsFollowUp(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="follow-up" className="text-sm">
                      A human to follow up with you?
                    </label>
                  </div>
                </div>
              </div>

              {needsHandoff && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      We noticed you might need additional help
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Our support team can provide more detailed assistance.
                  </p>
                </div>
              )}
            </div>
          )}

          {wrapUpStep === "contact" &&
            (wantsCopy || wantsFollowUp || needsHandoff) && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) =>
                        setContactInfo((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={contactInfo.firstName}
                        onChange={(e) =>
                          setContactInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={contactInfo.lastName}
                        onChange={(e) =>
                          setContactInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {wantsFollowUp && (
                    <div>
                      <label className="text-sm font-medium">
                        Phone (optional)
                      </label>
                      <Input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) =>
                          setContactInfo((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  )}

                  {needsHandoff && (
                    <div>
                      <label className="text-sm font-medium">
                        Preferred Topic
                      </label>
                      <select
                        value={preferredTopic}
                        onChange={(e) => setPreferredTopic(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select a topic</option>
                        <option value="eligibility">Eligibility</option>
                        <option value="billing">Billing</option>
                        <option value="plan_selection">Plan Selection</option>
                        <option value="technical">Technical</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={contactInfo.consent}
                      onChange={(e) =>
                        setContactInfo((prev) => ({
                          ...prev,
                          consent: e.target.checked,
                        }))
                      }
                      className="rounded mt-1"
                    />
                    <label htmlFor="consent" className="text-xs text-gray-600">
                      I agree to be contacted about this inquiry.
                    </label>
                  </div>
                </div>
              </div>
            )}

          <DialogFooter>
            {wrapUpStep === "feedback" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWrapUp(false);
                    setIsOpen(false);
                  }}
                >
                  Close Chat
                </Button>
                <Button
                  onClick={() => {
                    if (wantsCopy || wantsFollowUp || needsHandoff) {
                      setWrapUpStep("contact");
                    } else {
                      handleWrapUpComplete();
                    }
                  }}
                >
                  {wantsCopy || wantsFollowUp || needsHandoff
                    ? "Next"
                    : "Complete"}
                </Button>
              </>
            )}

            {wrapUpStep === "contact" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setWrapUpStep("feedback")}
                >
                  Back
                </Button>
                <Button
                  onClick={handleWrapUpComplete}
                  disabled={!contactInfo.email || !contactInfo.consent}
                >
                  Submit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Add end chat button to your existing UI
  const renderEndChatButton = () => (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEndChat}
        className="bg-white/90 backdrop-blur-sm hover:bg-white"
      >
        End Chat
      </Button>
    </div>
  );
  // const submitLead = async (leadData: LeadData): Promise<LeadResponse> => {
  //   try {
  //     const response = await fetch("/api/create-lead", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(leadData),
  //     });

  //     const result: LeadResponse = await response.json();

  //     if (result.success) {
  //       console.log("✅ Lead created successfully:", result.leadData);
  //     } else {
  //       console.error("❌ Failed to create lead:", result.error);
  //     }

  //     return result;
  //   } catch (error) {
  //     console.error("Network error:", error);
  //     return {
  //       success: false,
  //       error: "Network error occurred while submitting lead",
  //     };
  //   }
  // };
  // Placeholder for your existing methods - you'll need to integrate these
  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || sending) return;
    const userId = `user_${sessionId}`;

    setSending(true);
    const existingSessionId =
      messages?.length > 0 ? messages[0]?.session_id : sessionId;
    setInput(""); // Clear input immediately for better UX
    const userMessage: Message = {
      id: uuidv4(),
      newConversation: conversationId === null ? true : false,
      conversationId: conversationId,
      userId: userId,
      instructions: '{ "randomize_factor": "high" }',
      content: JSON.stringify({ query: text }),
      timestamp: new Date().toISOString(),
      session_id: existingSessionId,
    };
    setMessages((prev: any) => [...prev, userMessage]);

    try {
      setIsTyping(true);
      const data = {
        first_name: "Eche",
        last_name: "Ndukwe",
        email: "eche@nimbussp.com",
        company: "Nimbus Solutions Provider",
      };
      // submitLead(data);
      const is_new = messages.length === 0 ? true : false;
      const result = await client.graphql({
        query: askQuestionQuery,
        variables: {
          input: {
            query: text,
            session_id: existingSessionId,
            user_id: userId,
            is_new,
            language,
          },
        },
      });
      if ("data" in result && result.data?.askQuestion?.success) {
        setIsTyping(false);
        const formatData = result.data.askQuestion.excerpts;
        const contentMatches = formatData?.find((item: any) =>
          item?.text?.includes("source_url")
        );

        const content = contentMatches?.text;

        const sourceUrlMatch = content.match(/"source_url":\s*"([^"]+)"/);
        const summaryMatch = content.match(/"summary":\s*"([^"]+)"/);
        const scrapingMethodMatch = content.match(
          /"scraping_method":\s*"([^"]+)"/
        );
        const extractionDateMatch = content.match(
          /"extraction_date":\s*"([^"]+)"/
        );

        const structuredContent = {
          reportTitle: "Web Content Analysis Report", // static title
          scrapingMethod: scrapingMethodMatch
            ? scrapingMethodMatch[1]
            : "DYNAMIC_ENHANCED",
          contentQuality: null, // not in raw string
          dynamicDetected: null, // not in raw string
          source_url: sourceUrlMatch ? sourceUrlMatch[1] : null,
          analysisDate: extractionDateMatch ? extractionDateMatch[1] : null,
          executiveSummary: summaryMatch ? summaryMatch[1] : null, // ✅ summary → executiveSummary
          keyThemes: [],
          contentAnalysis: null,
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
            confidence: result.data.askQuestion.confidence,
          }),
          intent: result.data.askQuestion.intent_analysis.intent,
          session_id: result.data.askQuestion.metadata.session_id,
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
        {message.isBot &&
          confidenceValue !== null &&
          !(
            message.intent?.includes("greeting") ||
            message.intent?.includes("closing") ||
            (message.intent?.includes("out_of_domain") &&
              !message.citations?.url)
          ) && (
            <div className="text-xs text-gray-400 mt-1">
              {renderConfidenceIndicator(message)}
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector language={language} setLanguage={setLanguage} />
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div
          className={
            isMaximized
              ? "flex flex-col max-h-[52vh] h-[52vh] border rounded overflow-hidden"
              : "flex flex-col max-h-[280px] h-[290px] border rounded overflow-hidden"
          }
        >
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message: any, index: any) => (
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
              ))}

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

      {/* Disclaimer */}
      {isMaximized ? (
        <h2 className="text-center text-sm">
          Smart Assistant can make mistakes. Consider checking important
          information for accuracy.{" "}
          <a
            className="font-bold"
            target="_blank"
            href="https://metrohealthlink.com/blog-single/why-smart-assistants-can-make-mistakes"
          >
            Learn more
          </a>
        </h2>
      ) : (
        <p className="text-xs text-center">
          Smart Assistant can make mistakes. Consider checking important
          information for accuracy.{" "}
          <a
            className="font-bold"
            target="_blank"
            href="https://metrohealthlink.com/blog-single/why-smart-assistants-can-make-mistakes"
          >
            Learn more
          </a>
        </p>
      )}

      {renderWrapUpDialog()}
    </div>
  );
}
