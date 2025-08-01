import { type NextRequest, NextResponse } from "next/server"

// Mock RAG responses with citations
const mockResponses = [
  {
    content:
      "You may qualify for a Special Enrollment Period if you've had a qualifying life event like losing health coverage[1]. You can find the full list of qualifying life events on the official information page[2]. Special Enrollment Periods typically last 60 days from the date of your qualifying event.",
    citations: [
      {
        id: "cite-1",
        title: "Special Enrollment Periods - DC Health Benefit Exchange",
        url: "https://dchbx.gov/sep",
        snippet:
          "A Special Enrollment Period (SEP) is a time outside the yearly Open Enrollment Period when you can sign up for health insurance if you have certain qualifying life events.",
      },
      {
        id: "cite-2",
        title: "Qualifying Life Events - DC HBX",
        url: "https://dchbx.gov/qualifying-events",
        snippet:
          "Qualifying life events include losing health coverage, getting married, having a baby, moving to a new area, and changes in income.",
      },
    ],
  },
  {
    content:
      "When comparing health insurance plans, consider the monthly premium, deductible, and out-of-pocket maximum[1]. Bronze plans have lower premiums but higher deductibles, while Gold plans have higher premiums but lower deductibles[2]. You should also check if your doctors are in the plan's network.",
    citations: [
      {
        id: "cite-3",
        title: "Understanding Health Plan Categories",
        url: "https://dchbx.gov/plan-categories",
        snippet:
          "Health plans are categorized as Bronze, Silver, Gold, and Platinum based on how much of your medical costs they cover on average.",
      },
      {
        id: "cite-4",
        title: "Choosing the Right Plan - DC HBX",
        url: "https://dchbx.gov/choosing-plans",
        snippet: "Consider your budget, health needs, and preferred doctors when selecting a health insurance plan.",
      },
    ],
  },
]

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, messageId } = await request.json()

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Store message in mock database (in real implementation, this would be DynamoDB)
    const chatHistory = JSON.parse(localStorage.getItem(`chat_${sessionId}`) || "[]")

    // Add user message
    chatHistory.push({
      id: messageId,
      author: "user",
      content: message,
      timestamp: new Date().toISOString(),
    })

    // Generate bot response (in real implementation, this would call Bedrock)
    const responseIndex = Math.floor(Math.random() * mockResponses.length)
    const mockResponse = mockResponses[responseIndex]

    const botMessageId = crypto.randomUUID()
    const botMessage = {
      id: botMessageId,
      author: "bot",
      content: mockResponse.content,
      timestamp: new Date().toISOString(),
      citations: mockResponse.citations,
    }

    chatHistory.push(botMessage)

    // Store updated history
    if (typeof window !== "undefined") {
      localStorage.setItem(`chat_${sessionId}`, JSON.stringify(chatHistory))
    }

    return NextResponse.json({
      messageId: botMessageId,
      content: mockResponse.content,
      citations: mockResponse.citations,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
