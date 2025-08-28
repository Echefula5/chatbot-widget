import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasRegion: !!process.env.HW_AWS_REGION,
    hasAccessKey: !!process.env.HW_AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.HW_AWS_SECRET_ACCESS_KEY,
    hasBucket: !!process.env.HW_AWS_S3_HBX_BUCKET_NAME,
    region: process.env.HW_AWS_REGION, // Remove this after testing
  });
}
