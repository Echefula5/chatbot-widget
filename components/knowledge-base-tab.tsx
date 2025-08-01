"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, FileText } from "lucide-react"

interface KnowledgeItem {
  id: string
  title: string
  snippet: string
  url: string
  category: string
}

export function KnowledgeBaseTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const popularArticles = [
    {
      id: "1",
      title: "Understanding Special Enrollment Periods",
      snippet: "Learn about qualifying life events that allow you to enroll outside the open enrollment period.",
      url: "https://dchbx.gov/sep",
      category: "Enrollment",
    },
    {
      id: "2",
      title: "Comparing Health Insurance Plans",
      snippet: "A comprehensive guide to understanding different plan types and choosing the right coverage.",
      url: "https://dchbx.gov/plans",
      category: "Plans",
    },
    {
      id: "3",
      title: "Premium Tax Credits and Subsidies",
      snippet: "How to qualify for and calculate premium tax credits to reduce your monthly costs.",
      url: "https://dchbx.gov/subsidies",
      category: "Financial Assistance",
    },
  ]

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
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} size="sm">
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {searchResults.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 text-sm">Search Results</h3>
            {searchResults.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{item.snippet}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
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
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 text-sm">Popular Articles</h3>
            {popularArticles.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{item.snippet}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
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
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
