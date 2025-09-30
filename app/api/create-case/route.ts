import { NextRequest, NextResponse } from "next/server";

// You'll need these for Salesforce REST API
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

async function findOrCreateContact(
  instanceUrl: string,
  accessToken: string,
  email: string,
  name: string,
  phone?: string
) {
  // Check if Contact exists
  const searchResponse = await fetch(
    `${instanceUrl}/services/data/v57.0/query?q=SELECT+Id,AccountId+FROM+Contact+WHERE+Email='${email}'`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const searchData = await searchResponse.json();

  if (searchData.totalSize > 0) {
    // Contact exists
    return {
      contactId: searchData.records[0].Id,
      accountId: searchData.records[0].AccountId,
    };
  }

  // Create new Contact
  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  const contactData = {
    FirstName: firstName,
    LastName: lastName || ".",
    Email: email,
    Phone: phone,
  };

  const createResponse = await fetch(
    `${instanceUrl}/services/data/v57.0/sobjects/Contact`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    }
  );

  const createData = await createResponse.json();
  return {
    contactId: createData.id,
    accountId: null,
  };
}

async function createCaseWithContact(
  instanceUrl: string,
  accessToken: string,
  caseData: any,
  contactId: string,
  accountId?: string
) {
  const caseRecord = {
    Subject: caseData.subject,
    Description:
      caseData.description || `Case created from web form by ${caseData.name}`,
    Origin: "Web",
    ContactId: contactId,
    AccountId: accountId,
    SuppliedEmail: caseData.email,
    SuppliedPhone: caseData.phone,
  };

  const response = await fetch(
    `${instanceUrl}/services/data/v57.0/sobjects/Case`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(caseRecord),
    }
  );

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, description } = body;

    // Basic validation
    if (!name || !email || !subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, email, subject",
        },
        { status: 400 }
      );
    }

    console.log("🔐 Getting Salesforce access token...");
    const { access_token, instance_url } = await getSalesforceAccessToken();

    console.log("👤 Finding or creating Contact...");
    const { contactId, accountId } = await findOrCreateContact(
      instance_url,
      access_token,
      email,
      name,
      phone
    );

    console.log("📋 Creating Case with Contact link...");
    const caseResult = await createCaseWithContact(
      instance_url,
      access_token,
      { name, email, phone, subject, description },
      contactId,
      accountId
    );

    if (caseResult.success === false) {
      throw new Error(
        caseResult.errors?.[0]?.message || "Failed to create case"
      );
    }

    return NextResponse.json({
      success: true,
      message: "Case created successfully with Contact link",
      caseId: caseResult.id,
      contactId,
      accountId,
    });
  } catch (error) {
    console.error("💥 API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create case",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
