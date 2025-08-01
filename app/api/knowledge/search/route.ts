import { type NextRequest, NextResponse } from "next/server"

const mockKnowledgeBase = [
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
  {
    id: "4",
    title: "Network Providers and Coverage",
    snippet: "Understanding in-network vs out-of-network providers and how it affects your costs.",
    url: "https://dchbx.gov/networks",
    category: "Coverage",
  },
  {
    id: "5",
    title: "Medicaid Eligibility in DC",
    snippet: "Requirements and application process for Medicaid coverage in Washington DC.",
    url: "https://dchbx.gov/medicaid",
    category: "Medicaid",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // Simple search implementation
    const results = mockKnowledgeBase.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.snippet.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    )

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(results)
  } catch (error) {
    console.error("Knowledge search API error:", error)
    return NextResponse.json({ error: "Failed to search knowledge base" }, { status: 500 })
  }
}
