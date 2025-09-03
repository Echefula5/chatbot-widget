"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowRight } from "lucide-react";

interface WelcomeTabProps {
  onStartChat: () => void;
  isMaximized: any;
}

export function WelcomeTab({ onStartChat, isMaximized }: WelcomeTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Store the query for the chat tab
      sessionStorage.setItem("initialQuery", searchQuery);
      onStartChat();
    }
  };

  const quickTopics = [
    "Special Enrollment Periods",
    "Plan Comparison",
    "Premium Tax Credits",
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome to Metro HealthLink Assistant!
        </h2>
        <p className="text-gray-600 text-sm">
          How can I help you today? Ask me anything about health insurance and
          enrollment.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Ask me anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 pr-12"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-gray-900 text-sm">Popular Topics:</h3>
        {quickTopics.map((topic, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{topic}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Powered by Perceptive AI • RAG Technology
        </p>
      </div>
    </div>
  );
}
