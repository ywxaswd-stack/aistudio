import { NextRequest, NextResponse } from "next/server";
import { existsSync, createReadStream, statSync } from "fs";
import { join } from "path";

const AUDIO_DIR = "/tmp/veo_audio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.includes("..")) {
      return NextResponse.json({ error: "无效文件名" }, { status: 400 });
    }

    const filepath = join(AUDIO_DIR, filename);
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const stat = statSync(filepath);
    const fileSize = stat.size;

    // 音频文件通常较小，直接流式返回
    const stream = createReadStream(filepath);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(fileSize),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
