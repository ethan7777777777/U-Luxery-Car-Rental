import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing file upload." }, { status: 400 });
  }

  if (file.size > 8_000_000) {
    return NextResponse.json(
      { message: "File exceeds max size of 8MB." },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop() || "bin";
  const filename = `licenses/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json(
      {
        message:
          "Upload failed. Confirm BLOB_READ_WRITE_TOKEN is configured in environment variables.",
      },
      { status: 500 },
    );
  }
}
