import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const AUDIO_DIR = "/tmp/veo_audio";
const VIDEO_DIR = "/tmp/veo_videos";

// 火山引擎配置
const VOLCENGINE_ACCESS_KEY = process.env.VOLCENGINE_ACCESS_KEY || "";
const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY || "";

// 动作风格映射
const MOTION_STYLES: Record<string, string> = {
  enthusiastic: "Enthusiastically walking towards camera, raising hand to show product, energetic smile",
  professional: "Stable posture, hand gestures for explanation, focused and serious expression",
  friendly: "Natural relaxed body language, slight nodding, friendly smile",
  surprise: "Exaggerated surprised expression, quick hand gestures, creating suspense",
  authoritative: "Confident upright posture, steady gestures, serious and professional expression"
};

// 声音风格映射
const VOICE_TYPES: Record<string, string> = {
  female_gentle: "BV700_V2_streaming",
  female_energetic: "BV700_V3_streaming",
  male_calm: "BV406_V2_streaming",
  male_professional: "BV407_V2_streaming"
};

/**
 * 数字人视频生成 API
 * POST /api/digital-human/generate
 * 
 * Body: {
 *   portraitImage: string,     // 人像图片URL或base64
 *   script: string,            // 口播文案
 *   voiceStyle: string,        // 声音风格
 *   motionStyle: string,       // 动作风格
 *   backgroundImage?: string,  // 背景图片URL（可选）
 *   aspectRatio?: "16:9" | "9:16"  // 视频比例
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      portraitImage,
      script,
      voiceStyle = "female_gentle",
      motionStyle = "friendly",
      backgroundImage,
      aspectRatio = "9:16"
    } = body;

    // 参数验证
    if (!portraitImage) {
      return NextResponse.json(
        { success: false, error: "请上传人像图片" },
        { status: 400 }
      );
    }

    if (!script || script.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "请提供口播文案" },
        { status: 400 }
      );
    }

    // 确保目录存在
    if (!existsSync(AUDIO_DIR)) {
      mkdirSync(AUDIO_DIR, { recursive: true });
    }
    if (!existsSync(VIDEO_DIR)) {
      mkdirSync(VIDEO_DIR, { recursive: true });
    }

    console.log(`[数字人] 开始生成，文案长度: ${script.length}`);

    // ==========================================
    // 第一步：调用TTS生成音频
    // ==========================================
    const voiceType = VOICE_TYPES[voiceStyle] || VOICE_TYPES.female_gentle;
    
    const ttsPayload = {
      app: {
        appid: process.env.VOLCENGINE_TTS_APP_ID || "",
        token: process.env.VOLCENGINE_TTS_TOKEN || "",
        cluster: "volcano_tts"
      },
      user: { uid: "digital_human_user" },
      audio: {
        voice_type: voiceType,
        encoding: "mp3",
        speed_ratio: 1.0,
        volume_ratio: 1.0,
      },
      request: {
        reqid: `req_${Date.now()}`,
        text: script.trim(),
        text_type: "plain",
        operation: "query",
        with_frontend: 1,
        frontend_type: "unitTson"
      }
    };

    const ttsResponse = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer; ${process.env.VOLCENGINE_TTS_TOKEN || ""}`
      },
      body: JSON.stringify(ttsPayload)
    });

    if (!ttsResponse.ok) {
      console.error("[TTS] API调用失败:", ttsResponse.status);
      return NextResponse.json(
        { success: false, error: "语音合成失败" },
        { status: 500 }
      );
    }

    const ttsData = await ttsResponse.json();
    
    if (ttsData.code !== 3000 || !ttsData.data) {
      console.error("[TTS] 合成失败:", ttsData);
      return NextResponse.json(
        { success: false, error: `语音合成失败: ${ttsData.message || ttsData.code}` },
        { status: 500 }
      );
    }

    // 保存音频文件
    const audioBuffer = Buffer.from(ttsData.data, "base64");
    const audioFilename = `audio_${Date.now()}.mp3`;
    const audioPath = join(AUDIO_DIR, audioFilename);
    writeFileSync(audioPath, audioBuffer);
    
    console.log(`[数字人] 音频已生成: ${audioPath}, 大小: ${audioBuffer.length} bytes`);

    // ==========================================
    // 第二步：调用火山引擎OmniHuman API
    // ==========================================
    
    // 获取动作提示词
    const motionPrompt = MOTION_STYLES[motionStyle] || MOTION_STYLES.friendly;
    
    // 构建OmniHuman请求
    // 注意：这是基于火山引擎API文档的结构，实际接入时需要根据最新文档调整
    const omniHumanPayload = {
      // 音频输入
      audio: {
        type: "url",  // 或 "base64"
        url: `/api/audio/${audioFilename}`  // 本地音频URL
      },
      // 人像图片输入
      image: {
        type: portraitImage.startsWith("data:") ? "base64" : "url",
        url: portraitImage.startsWith("data:") ? undefined : portraitImage,
        base64: portraitImage.startsWith("data:") ? portraitImage.split(",")[1] : undefined
      },
      // 背景图片（可选）
      background: backgroundImage ? {
        type: backgroundImage.startsWith("data:") ? "base64" : "url",
        url: backgroundImage.startsWith("data:") ? undefined : backgroundImage,
        base64: backgroundImage.startsWith("data:") ? backgroundImage.split(",")[1] : undefined
      } : undefined,
      // 动作控制
      motion_prompt: motionPrompt,
      // 视频参数
      video_config: {
        aspect_ratio: aspectRatio,
        fps: 25,
        quality: "high"
      }
    };

    // TODO: 实际调用火山引擎OmniHuman API
    // 目前返回模拟响应，等待实际API接入
    
    // 模拟任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log(`[数字人] 任务已提交: ${taskId}`);

    // ==========================================
    // 返回任务信息
    // ==========================================
    return NextResponse.json({
      success: true,
      task_id: taskId,
      audio_url: `/api/audio/${audioFilename}`,
      audio_duration: Math.ceil(script.length / 4.5),  // 预估时长
      status: "processing",
      message: "数字人视频生成任务已提交，请轮询查询状态"
    });

    /* 实际API调用示例（待接入时使用）
    const omniHumanResponse = await fetch("https://api.volcengine.com/omnihuman/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${VOLCENGINE_ACCESS_KEY}`,
        "X-Date": new Date().toISOString(),
      },
      body: JSON.stringify(omniHumanPayload)
    });

    if (!omniHumanResponse.ok) {
      console.error("[OmniHuman] API调用失败:", omniHumanResponse.status);
      return NextResponse.json(
        { success: false, error: "数字人生成失败" },
        { status: 500 }
      );
    }

    const omniData = await omniHumanResponse.json();
    
    return NextResponse.json({
      success: true,
      task_id: omniData.task_id,
      status: omniData.status || "processing",
      message: "数字人视频生成任务已提交"
    });
    */

  } catch (error) {
    console.error("[数字人] 生成异常:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
