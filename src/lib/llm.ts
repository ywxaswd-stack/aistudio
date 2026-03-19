/**
 * LLM 适配器 - 根据环境自动选择LLM服务
 * 
 * 环境配置：
 * - 沙箱环境：自动使用内置LLM（coze-coding-dev-sdk）
 * - 生产环境：使用Google Gemini API（需要设置GEMINI_API_KEY）
 * 
 * 使用方式：
 * 1. 沙箱/开发环境：无需配置，自动使用内置LLM
 * 2. 生产环境：设置环境变量 GEMINI_API_KEY=你的密钥
 */

import { LLMClient, Config, HeaderUtils as SDKHeaderUtils } from "coze-coding-dev-sdk";

// 判断是否使用Gemini API（生产环境）
const useGeminiAPI = !!process.env.GEMINI_API_KEY && 
                     process.env.NODE_ENV === 'production';

/**
 * Gemini API 调用（生产环境使用）
 */
async function callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 调用失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Gemini API 返回空结果");
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * 内置LLM调用（沙箱环境使用）
 */
async function callBuiltInLLM(
  systemPrompt: string,
  userPrompt: string,
  customHeaders?: Record<string, string>,
  options?: {
    temperature?: number;
    model?: string;
    thinking?: "enabled" | "disabled";
  }
): Promise<string> {
  const config = new Config();
  const client = new LLMClient(config, customHeaders);
  
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const response = await client.invoke(messages, {
    temperature: options?.temperature || 0.7,
    model: options?.model || "doubao-seed-1-8-251228",
    thinking: options?.thinking || "disabled",
  });

  return response.content;
}

/**
 * 统一的LLM调用接口
 * 自动根据环境选择使用Gemini或内置LLM
 * 
 * @param systemPrompt 系统提示词
 * @param userPrompt 用户提示词
 * @param customHeaders 自定义请求头（沙箱环境需要）
 * @param options 可选配置
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  customHeaders?: Record<string, string>,
  options?: {
    temperature?: number;
    model?: string;
    thinking?: "enabled" | "disabled";
  }
): Promise<string> {
  // 生产环境且设置了GEMINI_API_KEY：使用Gemini API
  if (useGeminiAPI) {
    console.log("🚀 [Production] 使用 Google Gemini API");
    return callGeminiAPI(systemPrompt, userPrompt);
  }
  
  // 沙箱/开发环境：使用内置LLM
  console.log("🏠 [Development/Sandbox] 使用内置LLM");
  return callBuiltInLLM(systemPrompt, userPrompt, customHeaders, options);
}

/**
 * 流式LLM调用
 */
export async function streamLLM(
  systemPrompt: string,
  userPrompt: string,
  customHeaders: Record<string, string> | undefined,
  onChunk: (chunk: string) => void,
  options?: {
    temperature?: number;
    model?: string;
    thinking?: "enabled" | "disabled";
  }
): Promise<string> {
  if (useGeminiAPI) {
    // Gemini暂不支持流式，降级为非流式
    console.log("⚠️ Gemini API 暂不支持流式输出");
    const result = await callGeminiAPI(systemPrompt, userPrompt);
    onChunk(result);
    return result;
  }

  // 沙箱环境：使用内置LLM流式
  const config = new Config();
  const client = new LLMClient(config, customHeaders);
  
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const stream = client.stream(messages, {
    temperature: options?.temperature || 0.7,
    model: options?.model || "doubao-seed-1-8-251228",
    thinking: options?.thinking || "disabled",
  });

  let fullContent = "";
  for await (const chunk of stream) {
    if (chunk.content) {
      const text = chunk.content.toString();
      fullContent += text;
      onChunk(text);
    }
  }

  return fullContent;
}

/**
 * 构建聊天格式的 prompt
 */
export function buildChatPrompt(systemPrompt: string, userPrompt: string): string {
  return `${systemPrompt}\n\n${userPrompt}`;
}

// 导出 HeaderUtils 供API路由使用
export { SDKHeaderUtils as HeaderUtils };

// 导出环境判断（供调试使用）
export const isUsingGemini = useGeminiAPI;
