"use server";
import {
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
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
  timestamp: any
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
      UpdateExpression: "SET content.liked = :liked",
      ExpressionAttributeValues: marshall({
        ":liked": liked,
      }),
      // Optional: Create the item if it doesn't exist
      // Remove this line if you only want to update existing items
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
