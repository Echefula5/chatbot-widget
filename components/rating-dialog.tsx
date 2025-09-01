"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { handleWidgetFeedback } from "./actions/assistant";
import { setCookie } from "cookies-next/client";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  messages: any;
  setMessages: any;
}

export function RatingDialog({
  open,
  onOpenChange,
  sessionId,
  messages,
  setMessages,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const userId = `user_${sessionId}`;

      await handleWidgetFeedback(
        sessionId,
        userId,
        true,
        sessionId,
        "session",
        feedback,
        rating,
        null,
        null
      );

      onOpenChange(false);
      setRating(0);
      setMessages([]);
      setFeedback("");
      setEmail("");
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWithEmail = async () => {
    if (!email || rating === 0) return;

    setIsSubmitting(true);
    try {
      await handleWidgetFeedback(
        sessionId,
        `user_${sessionId}`,
        true,
        sessionId,
        "session",
        feedback,
        rating,
        null,
        null
      );
      setCookie(
        "metro_link_messages",
        JSON.stringify({
          messages,
        })
      );
      onOpenChange(false);
      setRating(0);
      setFeedback("");
      setEmail("");
    } catch (error) {
      console.error("Failed to save with email:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate this conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              How would you rate your experience with the Metro HBX Assistant?
            </p>

            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Any additional feedback? (Optional)
            </label>
            <Textarea
              placeholder="Tell us how we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {rating > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium block">
                Want to save your conversation permanently? Enter your email:
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <Button
                onClick={handleSaveWithEmail}
                disabled={!email || isSubmitting}
                className="w-full"
                variant="secondary"
              >
                {isSubmitting ? "Saving..." : "Save with Email"}
              </Button>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
