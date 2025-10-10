import { NextRequest, NextResponse } from "next/server";

const SALESFORCE_LOGIN_URL =
  "https://login.salesforce.com/services/oauth2/token";
const CLIENT_ID = process.env.HW_SALESFORCE_CLIENT_ID;
const CLIENT_SECRET = process.env.HW_SALESFORCE_CLIENT_SECRET;
const USERNAME = process.env.HW_SALESFORCE_USERNAME;
const PASSWORD = process.env.HW_SALESFORCE_PASSWORD; // + Security Token

async function getSalesforceAccessToken() {
  // Validate environment variables
  if (!CLIENT_ID || !CLIENT_SECRET || !USERNAME || !PASSWORD) {
    throw new Error(
      "Missing Salesforce credentials. Please check your .env.local file."
    );
  }

  const response = await fetch(SALESFORCE_LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: USERNAME,
      password: PASSWORD, // Include security token
    }),
  });

  const data = await response.json();

  console.log("📥 Salesforce Response:", JSON.stringify(data, null, 2));

  // Check for authentication errors
  if (!response.ok) {
    // Provide specific error messages
    if (data.error === "invalid_grant") {
      throw new Error(
        "❌ Invalid Salesforce credentials (invalid_grant):\n" +
          "• Wrong username or password\n" +
          "• Security token missing or incorrect (must be appended to password)\n" +
          "• IP address not trusted\n\n" +
          "Full error: " +
          data.error_description
      );
    } else if (data.error === "invalid_client_id") {
      throw new Error(
        "❌ Invalid Client ID. Your Consumer Key is wrong.\n" +
          "Go to Setup → App Manager → Your Connected App → View → Copy Consumer Key"
      );
    } else if (data.error === "invalid_client") {
      throw new Error(
        "❌ Invalid Client Secret. Your Consumer Secret is wrong.\n" +
          "Go to Setup → App Manager → Your Connected App → Manage Consumer Details"
      );
    }

    throw new Error(
      `❌ Salesforce authentication failed: ${data.error}\n` +
        `Description: ${data.error_description || "No description provided"}`
    );
  }

  return {
    access_token: data.access_token,
    instance_url: data.instance_url,
  };
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, first_name, last_name, email, phone } = body;

    if (!user_id || !first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { access_token, instance_url } = await getSalesforceAccessToken();

    // 1️⃣ Query Lead by your custom field
    const queryRes = await fetch(
      `${instance_url}/services/data/v58.0/query?q=${encodeURIComponent(
        `SELECT Id FROM Lead WHERE user_id__c='${user_id}'`
      )}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const queryData = await queryRes.json();
    if (!queryData.records?.length) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }
    const leadId = queryData.records[0].Id;
    console.log(leadId);

    // 2️⃣ Create the custom object linked to the Lead
    const updateRes = await fetch(
      `${instance_url}/services/data/v58.0/sobjects/Lead/${leadId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FirstName: first_name,
          LastName: last_name,
          Email: email,
          Phone: phone,
          // You can also update your custom fields here
          user_id__c: user_id,
        }),
      }
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Custom object created and linked to Lead",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
