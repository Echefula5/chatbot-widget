import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, company } = body;

    // Basic validation
    if (!first_name || !last_name || !email || !company) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: first_name, last_name, email, company",
        },
        { status: 400 }
      );
    }

    // Prepare form data for Salesforce (no reCAPTCHA needed)
    const formData = new URLSearchParams();
    formData.append("oid", "00Dd3000004Ai2H");
    formData.append("first_name", first_name);
    formData.append("last_name", last_name);
    formData.append("email", email);
    formData.append("company", company);

    // Optional fields

    // Enable debug mode
    formData.append("debug", "1");
    formData.append("debugEmail", "echendu0803@gmail.com");

    // Set return URL (from your original form)
    formData.append("retURL", "https://www.metrohealthlink.com/blog");

    console.log("📤 Submitting to Salesforce:");
    console.log("Form data:", formData.toString());

    // Submit to Salesforce Web-to-Lead
    const salesforceResponse = await fetch(
      "https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (compatible; ChatBot/1.0)",
        },
        body: formData,
      }
    );

    const responseText = await salesforceResponse.text();
    const responseHeaders = Object.fromEntries(
      salesforceResponse.headers.entries()
    );

    console.log("📥 Salesforce Response:");
    console.log("Status:", salesforceResponse.status);
    console.log("Headers:", responseHeaders);
    console.log("Body:", responseText);

    // Salesforce Web-to-Lead usually returns 200 even for errors
    // Check the response text for error messages
    if (responseText.includes("ERROR") || responseText.includes("error")) {
      console.error("❌ Salesforce error detected in response:", responseText);

      return NextResponse.json(
        {
          success: false,
          error: "Salesforce rejected the submission",
          details: responseText,
          debugInfo: {
            status: salesforceResponse.status,
            headers: responseHeaders,
          },
        },
        { status: 400 }
      );
    }

    // Success case
    console.log("✅ Lead submitted successfully");

    return NextResponse.json({
      success: true,
      message: "Lead submitted to Salesforce successfully",
      leadData: { first_name, last_name, email, company },
      debugInfo: {
        status: salesforceResponse.status,
        message: "Check your email for debug confirmation",
      },
    });
  } catch (error) {
    console.error("💥 API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
