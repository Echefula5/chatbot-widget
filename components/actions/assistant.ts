"use server";
import {
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";
interface FeedbackResponse {
  success: boolean;
  feedbackId?: string;
  error?: Error;
}

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS!,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET!,
  },
});
type ReviewerFeedbackResult = {
  success: boolean;
  item?: FeedbackResponse;
  error?: any;
};
export async function handleWidgetFeedback(
  messageId: string,
  userId: string,
  liked: boolean,
  conversationId: string,
  feedbackType: string,
  feedback: any,
  rating: any,
  response: any,
  query: any
): Promise<FeedbackResponse> {
  // Generate a unique ID for the feedback document
  const feedbackId = uuidv4();

  const item = {
    feedbackId,
    modelId: process.env.NEXT_PUBLIC_MODEL_ID,
    messageId,
    conversationId,
    feedbackType,
    feedback,
    response,
    userId,
    rating,
    entityType: "feedback",
    type: "sentiment",
    query,
    content: {
      liked,
      comment: "",
    },
    timestamp: new Date().toISOString(),
  };
  const params = {
    TableName: "HBX_FEEDBACK",
    Item: marshall(item),
  };

  try {
    await client.send(new PutItemCommand(params));
    return { success: true, feedbackId };
  } catch (error: any) {
    console.error("Error saving feedback:", error);
    return { success: false, error };
  }
}
export async function handleupdateWidgetFeedback(
  feedbackId: any,
  userId: any,
  liked: any,
  timestamp: any,
  feedback: any
) {
  const hasFeedback = liked === true || liked === false;
  if (!hasFeedback) {
    // No feedback (null or undefined) — delete the feedback record
    await client.send(
      new DeleteItemCommand({
        TableName: "HBX_FEEDBACK",
        Key: marshall({
          feedbackId,
          timestamp,
        }),
      })
    );

    return { success: true };
  }

  await client.send(
    new UpdateItemCommand({
      TableName: "HBX_FEEDBACK",
      Key: marshall({
        feedbackId,
        timestamp,
      }),
      UpdateExpression:
        "SET content.liked = :liked, content.feedback = :feedback",
      ExpressionAttributeValues: marshall({
        ":liked": liked,
        ":feedback": feedback, // <-- new value you want to update
      }),
      ReturnValues: "UPDATED_NEW",
    })
  );

  return { success: true };
}
export async function fetchAllKnowledgeSources(
  page: number,
  limit: number,
  lastEvaluatedKey?: any
) {
  let currentPage = 1;
  let currentLastKey = lastEvaluatedKey;

  while (currentPage < page) {
    const response = await client.send(
      new QueryCommand({
        TableName: "scraping-jobs",
        Limit: limit,
        ExclusiveStartKey: currentLastKey,
        IndexName: "app-created_at-index",
        KeyConditionExpression: "#app = :val",
        ExpressionAttributeNames: {
          "#app": "app",
        },
        ExpressionAttributeValues: {
          ":val": { S: "hbx" },
        },
      })
    );

    currentLastKey = response.LastEvaluatedKey;
    if (!currentLastKey) break; // No more pages
    currentPage++;
  }

  const result = await client.send(
    new QueryCommand({
      TableName: "scraping-jobs",
      IndexName: "app-created_at-index",
      KeyConditionExpression: "#app = :val",
      FilterExpression: "#status = :statusVal",
      ExpressionAttributeNames: {
        "#app": "app",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":val": { S: "hbx" },
        ":statusVal": { S: "COMPLETED" },
      },
      ExclusiveStartKey: currentLastKey,
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return {
    items: result.Items?.map((item) => unmarshall(item)) || [],
    lastEvaluatedKey: result.LastEvaluatedKey || null,
  };
}

export async function updateLeadByUserId(
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  email: string
) {
  try {
    console.log("Updating lead for:", userId);

    // Step 1: Find the item with this user_id using GSI
    const queryResult = await client.send(
      new QueryCommand({
        TableName: process.env.HW_AWS_S3_DYNAMODB_LEADS_TABLE_NAME,
        IndexName: "user_id-timestamp-index", // 👈 your GSI
        KeyConditionExpression: "user_id = :uid",
        ExpressionAttributeValues: {
          ":uid": { S: userId }, // low-level needs {S: "value"}
        },
        Limit: 1,
      })
    );
    console.log(queryResult);
    if (!queryResult.Items || queryResult.Items.length === 0) {
      throw new Error(`No lead found with user_id = ${userId}`);
    }

    const item = unmarshall(queryResult.Items[0]);

    // Step 2: Update the record by PK + SK
    const updateResult = await client.send(
      new UpdateItemCommand({
        TableName: process.env.HW_AWS_S3_DYNAMODB_LEADS_TABLE_NAME,
        Key: {
          leads: { S: item.leads }, // partition key
          timestamp: { S: item.timestamp }, // sort key
        },
        UpdateExpression:
          "SET #fn = :firstName, #ln = :lastName, #ph = :phone, #em = :email",
        ExpressionAttributeNames: {
          "#fn": "firstName",
          "#ln": "lastName",
          "#ph": "phone",
          "#em": "email",
        },
        ExpressionAttributeValues: {
          ":firstName": { S: firstName },
          ":lastName": { S: lastName },
          ":phone": { S: phone },
          ":email": { S: email },
        },
        ReturnValues: "ALL_NEW",
      })
    );

    console.log("Update success:", updateResult.Attributes);
    return updateResult.Attributes ? unmarshall(updateResult.Attributes) : null;
  } catch (error) {
    console.error("Error updating lead by user_id:", error);
    throw error;
  }
}
