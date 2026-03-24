import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync } from "fs";
import { join } from "path";

const VIDEO_DIR = "/tmp/veo_videos";

/**
 * 数字人任务状态查询 API
 * GET /api/digital-human/status?task_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("task_id");

    if (!taskId) {
      return NextResponse.json(
        { error: "缺少 task_id 参数" },
        { status: 400 }
      );
    }

    // TODO: 实际查询火山引擎OmniHuman任务状态
    // 目前返回模拟响应，等待实际API接入

    // 模拟：检查是否有对应生成的视频文件
    // 视频文件命名格式：digital_human_{taskId}.mp4
    const videoFilename = `digital_human_${taskId.replace("task_", "")}.mp4`;
    const videoPath = join(VIDEO_DIR, videoFilename);
    
    if (existsSync(videoPath)) {
      const stat = statSync(videoPath);
      return NextResponse.json({
        success: true,
        status: "completed",
        task_id: taskId,
        video_url: `/api/videos/${videoFilename}`,
        file_size: stat.size,
        progress: 100
      });
    }

    // 模拟进度（实际应从API获取）
    // 假设任务正在处理中
    const mockProgress = Math.min(90, Math.floor(Math.random() * 100));
    
    return NextResponse.json({
      success: true,
      status: mockProgress >= 90 ? "almost_done" : "processing",
      task_id: taskId,
      progress: mockProgress,
      message: mockProgress >= 90 ? "即将完成" : "正在生成中..."
    });

    /* 实际API调用示例（待接入时使用）
    const response = await fetch(
      `https://api.volcengine.com/omnihuman/v1/status?task_id=${taskId}`,
      {
        headers: {
          "Authorization": `Bearer ${VOLCENGINE_ACCESS_KEY}`,
        }
      }
    );

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: data.status,
      task_id: taskId,
      video_url: data.video_url,
      progress: data.progress || 0
    });
    */

  } catch (error) {
    console.error("[数字人状态] 查询异常:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
