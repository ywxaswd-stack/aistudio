import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import crypto from "crypto";

// 火山引擎配置
const VOLCENGINE_ACCESS_KEY = process.env.VOLCENGINE_ACCESS_KEY || "";
const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY || "";

// 火山引擎 API 配置
const VOLCENGINE_SERVICE = "cv";
const VOLCENGINE_REGION = "cn-north-1";
const VOLCENGINE_HOST = "visual.volcengineapi.com";
const VOLCENGINE_VERSION = "2022-08-31";

/**
 * 火山引擎签名生成
 */
function generateVolcengineSignature(
  method: string,
  path: string,
  query: Record<string, string>,
  body: string,
  accessKey: string,
  secretKey: string
): { authorization: string; xDate: string } {
  const now = new Date();
  const xDate = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const shortDate = xDate.substring(0, 8);

  const hashedPayload = crypto.createHash("sha256").update(body).digest("hex");

  const sortedQuery = Object.keys(query)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join("&");

  const canonicalHeaders = `content-type:application/json\nhost:${VOLCENGINE_HOST}\nx-content-sha256:${hashedPayload}\nx-date:${xDate}\n`;
  const signedHeaders = "content-type;host;x-content-sha256;x-date";

  const canonicalRequest = [
    method.toUpperCase(),
    path,
    sortedQuery,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join("\n");

  const algorithm = "HMAC-SHA256";
  const credentialScope = `${shortDate}/${VOLCENGINE_REGION}/${VOLCENGINE_SERVICE}/request`;
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");
    
  const stringToSign = [
    algorithm,
    xDate,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  const kDate = crypto.createHmac("sha256", secretKey).update(shortDate).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(VOLCENGINE_REGION).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(VOLCENGINE_SERVICE).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("request").digest();
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { authorization, xDate };
}

/**
 * 调用火山引擎 API
 */
async function callVolcengineAPI(
  action: string,
  reqKey: string,
  payload: Record<string, any>
): Promise<any> {
  const path = "/";
  const query: Record<string, string> = {
    Action: action,
    Version: VOLCENGINE_VERSION,
  };
  const body = JSON.stringify({ req_key: reqKey, ...payload });

  const { authorization, xDate } = generateVolcengineSignature(
    "POST",
    path,
    query,
    body,
    VOLCENGINE_ACCESS_KEY,
    VOLCENGINE_SECRET_KEY
  );

  const searchParams = new URLSearchParams(query);
  const url = `https://${VOLCENGINE_HOST}/?${searchParams.toString()}`;

  const hashedBody = crypto.createHash("sha256").update(body).digest("hex");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Host": VOLCENGINE_HOST,
      "X-Date": xDate,
      "X-Content-Sha256": hashedBody,
      "Authorization": authorization,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`火山引擎API调用失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.ResponseMetadata?.Error) {
    throw new Error(
      `火山引擎API错误: ${data.ResponseMetadata.Error.Code} - ${data.ResponseMetadata.Error.Message}`
    );
  }

  return data;
}

/**
 * AI 文生图/图生图生成接口
 */
export async function POST(request: NextRequest) {
  try {
    // 登录验证
    const userInfo = getUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const { prompt, referenceImage } = await request.json();

    // 参数验证
    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "请输入图片描述" }, { status: 400 });
    }

    if (prompt.length > 300) {
      return NextResponse.json({ success: false, error: "描述不能超过300字" }, { status: 400 });
    }

    // 检查参考图大小
    if (referenceImage) {
      const base64Size = referenceImage.length * 0.75 / 1024 / 1024;
      if (base64Size > 5) {
        return NextResponse.json({ success: false, error: "参考图不能超过5MB" }, { status: 400 });
      }
    }

    // 构建请求参数
    const payload: Record<string, any> = {
      prompt: prompt.trim(),
      return_url: true,
      logo_info: { add_logo: false },
      width: 1024,
      height: 1024,
    };

    // 如果有参考图，使用图生图
    let reqKey: string;
    if (referenceImage) {
      // 图生图：使用参考图风格
      payload.binary_data_base64 = [referenceImage.replace(/^data:image\/\w+;base64,/, "")];
      reqKey = "high_aes_general_v30l_i2i";
    } else {
      // 纯文生图
      reqKey = "high_aes_general_v30l";
    }

    console.log(`[文生图] 模式: ${referenceImage ? "图生图" : "文生图"}, reqKey: ${reqKey}`);

    // 提交任务
    const result = await callVolcengineAPI("CVSubmitTask", reqKey, payload);
    const taskId = result.data?.task_id;

    if (!taskId) {
      throw new Error("任务提交失败");
    }

    console.log(`[文生图] 任务已提交: ${taskId}`);

    return NextResponse.json({
      success: true,
      task_id: taskId,
      mode: referenceImage ? "i2i" : "t2i"
    });

  } catch (error) {
    console.error("[文生图] 生成异常:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
