import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.HW_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.HW_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.HW_AWS_SECRET_ACCESS_KEY!,
  },
});

interface UploadRequestBody {
  fileName: string;
}

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ success: false, message: "Method not allowed" });
  }

  const body: UploadRequestBody = await req.json();

  const { fileName } = body;

  if (!fileName) {
    return NextResponse.json({
      success: false,
      message: "Missing fileName parameter",
    });
  }

  const bucketName =
    process.env.HW_AWS_S3_HBX_BUCKET_NAME || "hbx-widget-datascource-da";
  console.log(s3Client);
  const test = process.env.HW_AWS_ACCESS_KEY_ID;
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName as string,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    return NextResponse.json({ success: true, url: signedUrl });
  } catch (error: any) {
    console.error("Error getting signed URL:", error);
    return NextResponse.json({ success: false, error: error.message, test });
  }
}
