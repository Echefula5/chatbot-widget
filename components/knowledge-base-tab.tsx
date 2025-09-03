"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, FileText } from "lucide-react";
import { fetchAllKnowledgeSources } from "./actions/assistant";

interface KnowledgeItem {
  job_id: string;
  url: string;
  summary: string;
  key_themes: any;
  category: string;
}
interface knowledgeSourceInterfaceProps {
  isMaximized: any;
}
export function KnowledgeBaseTab({
  isMaximized,
}: knowledgeSourceInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popularArticles, setpopularArticles] = useState<KnowledgeItem[]>([]);
  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const filtered = popularArticles.filter((item) => {
      const summaryMatch = item?.summary?.toLowerCase().includes(query);
      const urlMatch = item?.url?.toLowerCase().includes(query);
      const keyThemesMatch = item?.key_themes?.some((theme: any) =>
        theme.toLowerCase().includes(query)
      );

      return summaryMatch || urlMatch || keyThemesMatch;
    });
    console.log(filtered);
    setSearchResults(filtered);
    setIsSearching(false);
  };
  const getSignedUrl = async (pdf_s3_url: any) => {
    const pdfName = pdf_s3_url.split("/").pop();

    try {
      const response = await fetch(`/api/get-signed-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: `reports/${pdfName}`,
        }),
      });

      const data = await response.json();
      console.log(data);
      // setSignedUrl(data.url);
    } catch (error) {
      console.error("Error fetching signed URL:", error);
    }
  };

  const getAllListofSources = async () => {
    const res = await fetchAllKnowledgeSources(1 + 1, 101);
    setpopularArticles(res.items as any);
    // setKnowledgeSources(res.items as any);
    // setTotalPages(res.totalPages);
    console.log(res);
  };

  useEffect(() => {
    getAllListofSources();
  }, []);
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {searchResults.length > 0 || popularArticles.length > 0 ? (
        <ScrollArea
          className={
            isMaximized ? "flex-1 max-h-[660px] " : "flex-1 max-h-[350px]"
          }
        >
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 text-sm">
                Search Results
              </h3>
              {searchResults.map((item) => {
                const path = item?.url?.split("/").pop(); // "advisory-working-groups"

                // Replace all dashes with spaces
                const formattedPathName = path
                  ?.replace(/-/g, " ")
                  .toLowerCase();
                return (
                  <Card
                    key={item.job_id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <h4 className="font-medium text-sm capitalize text-gray-900">
                              {formattedPathName}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {item?.summary}
                          </p>
                          <div className="flex items-center justify-between">
                            {item?.key_themes ? (
                              <Badge variant="secondary" className="text-xs">
                                {item?.key_themes?.[0]}
                              </Badge>
                            ) : (
                              <div></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(item.url, "_blank")}
                              className="text-xs p-1 h-auto"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 text-sm">
                Popular Articles
              </h3>
              {popularArticles.slice(0, isMaximized ? 8 : 3).map((item) => {
                const path = item?.url?.split("/").pop(); // "advisory-working-groups"

                // Replace all dashes with spaces
                const formattedPathName = path
                  ?.replace(/-/g, " ")
                  .toLowerCase();
                return (
                  <Card
                    key={item.job_id}
                    className="cursor-pointer overflow-y-scroll max-h-[200px] hover:bg-gray-50 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <h4 className="font-medium text-sm capitalize text-gray-900">
                              {formattedPathName}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {item?.summary}
                          </p>
                          <div className="flex items-center justify-between">
                            {item?.key_themes ? (
                              <Badge variant="secondary" className="text-xs">
                                {item?.key_themes?.[0]}
                              </Badge>
                            ) : (
                              <div></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(item.url, "_blank")}
                              className="text-xs p-1 h-auto"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      ) : (
        <p>Loading....</p>
      )}
    </div>
  );
}
