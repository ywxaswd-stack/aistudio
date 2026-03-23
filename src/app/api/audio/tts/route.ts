import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const AUDIO_DIR = "/tmp/veo_audio";

// 火山引擎豆包 TTS 配置
const TTS_API_URL = "https://openspeech.bytedance.com/api/v1/tts";
const APP_ID = process.env.VOLCENGINE_TTS_APP_ID || "";
const ACCESS_TOKEN = process.env.VOLCENGINE_TTS_TOKEN || "";

/**
 * 文字转语音 API
 * POST /api/audio/tts
 * 
 * Body: {
 *   text: "要合成的台词文字",
 *   voiceType?: "BV700_V2_streaming" | "BV700_V3_streaming" | "BV406_V2_streaming", // 可选，默认中文女声
 *   speedRatio?: number,  // 可选，语速 0.5-2.0，默认 1.0
 *   volumeRatio?: number  // 可选，音量 0.5-2.0，默认 1.0
 * }
 * 
 * Response: {
 *   success: boolean,
 *   audio_url: "/api/audio/xxx.mp3",  // 音频文件URL
 *   duration: number,  // 预估时长（秒）
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      text, 
      voiceType = "BV700_V2_streaming", 
      speedRatio = 1.0, 
      volumeRatio = 1.0 
    } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "缺少要合成的文字内容" },
        { status: 400 }
      );
    }

    if (!APP_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        { success: false, error: "TTS服务未配置，请检查环境变量 VOLCENGINE_TTS_APP_ID 和 VOLCENGINE_TTS_TOKEN" },
        { status: 500 }
      );
    }

    // 确保目录存在
    if (!existsSync(AUDIO_DIR)) {
      mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // 构建请求payload
    const payload = {
      app: {
        appid: APP_ID,
        token: ACCESS_TOKEN,
        cluster: "volcano_tts"
      },
      user: { 
        uid: "user_001" 
      },
      audio: {
        voice_type: voiceType,
        encoding: "mp3",
        speed_ratio: speedRatio,
        volume_ratio: volumeRatio,
      },
      request: {
        reqid: `req_${Date.now()}`,
        text: text.trim(),
        text_type: "plain",
        operation: "query",
        with_frontend: 1,
        frontend_type: "unitTson"
      }
    };

    console.log(`[TTS] 开始合成，文字长度: ${text.length}`);

    // 调用火山引擎 TTS API
    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer; ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] API调用失败:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `TTS API调用失败: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 检查返回结果
    if (data.code !== 3000) {
      console.error("[TTS] 合成失败:", data);
      return NextResponse.json(
        { success: false, error: `TTS合成失败: ${data.message || data.code}` },
        { status: 500 }
      );
    }

    if (!data.data) {
      return NextResponse.json(
        { success: false, error: "TTS返回数据为空" },
        { status: 500 }
      );
    }

    // 解码base64音频数据
    const audioBase64 = data.data;
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // 保存音频文件
    const timestamp = Date.now();
    const filename = `tts_${timestamp}.mp3`;
    const filepath = join(AUDIO_DIR, filename);

    writeFileSync(filepath, audioBuffer);
    console.log(`[TTS] 音频已保存: ${filepath}, 大小: ${audioBuffer.length} bytes`);

    // 预估时长：MP3 128kbps 约 16KB/s，中文语速约 3-4 字/秒
    const estimatedDuration = Math.max(1, Math.ceil(text.length / 3.5));

    return NextResponse.json({
      success: true,
      audio_url: `/api/audio/${filename}`,
      duration: estimatedDuration,
      text_length: text.length,
      file_size: audioBuffer.length,
      message: `语音合成完成，预估时长 ${estimatedDuration} 秒`
    });

  } catch (error) {
    console.error("[TTS] 异常:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 查询TTS服务状态
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: APP_ID && ACCESS_TOKEN ? "configured" : "not_configured",
    app_id_configured: !!APP_ID,
    token_configured: !!ACCESS_TOKEN,
    supported_voices: [
      { id: "BV700_V2_streaming", name: "中文女声", description: "温柔女声" },
      { id: "BV700_V3_streaming", name: "中文女声2", description: "活力女声" },
      { id: "BV406_V2_streaming", name: "中文男声", description: "沉稳男声" }
    ]
  });
}
