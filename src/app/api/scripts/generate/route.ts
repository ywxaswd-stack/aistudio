import { NextRequest, NextResponse } from "next/server";
import { callGemini, buildChatPrompt } from "@/lib/gemini";

// 商户类型配置
const MERCHANT_TYPE_CONFIG: Record<string, { 
  style: string; 
  tone: string;
  persona: string;
}> = {
  ecommerce: {
    style: "快节奏、直击痛点、强转化导向",
    tone: "口语化、有冲击力、紧迫感",
    persona: "懂产品的销售专家"
  },
  local_business: {
    style: "生活化、真实感、引流导向",
    tone: "亲切、热情、接地气",
    persona: "热情的本地老板/探店达人"
  },
  brand_owner: {
    style: "剧情化、情感丰富、品质感",
    tone: "有温度、有态度、有情怀",
    persona: "品牌创始人/品质生活家"
  },
  knowledge_blogger: {
    style: "专业、易懂、干货导向",
    tone: "专业但不枯燥、亲和但有干货",
    persona: "行业专家/知识分享者"
  },
  story_ip: {
    style: "剧情化、人设鲜明、情绪共鸣",
    tone: "有个性、有张力、有反转",
    persona: "有故事的人/情感主播"
  }
};

// 脚本类型配置
const SCRIPT_TYPE_CONFIG: Record<string, {
  structure: string;
  description: string;
}> = {
  teach: {
    structure: "问题 → 解决方案 → 效果",
    description: "先抛出痛点，再给出方法，最后展示效果"
  },
  show: {
    structure: "场景 → 过程 → 结果",
    description: "展示真实场景，记录操作过程，呈现最终结果"
  },
  opinion: {
    structure: "现象 → 观点 → 共鸣",
    description: "描述社会现象，表达鲜明观点，引发情感共鸣"
  },
  story: {
    structure: "冲突 → 转折 → 结局",
    description: "设置戏剧冲突，制造意外转折，给出圆满结局"
  }
};

// 36钩子词根数据
const HOOK_ELEMENTS: Record<string, string[]> = {
  cost: ["花小钱装大杯", "省时省钱省力", "平替", "白嫖", "一招搞定", "9.9元"],
  crowd: ["宝妈", "程序员", "打工人", "小个子", "巨蟹座", "处女座"],
  curiosity: ["反常识", "万万没想到", "揭秘", "黑科技", "冷知识", "据说"],
  contrast: ["身份错位", "场景反差", "没想到你是这样的", "居然", "竟然"],
  worst: ["最丢脸", "最没面子", "避坑", "千万别买", "全网最低分"],
  authority: ["明星同款", "大佬揭秘", "爱马仕工艺", "CCTV报道", "首富思维"],
  nostalgia: ["童年回忆", "20年前", "小时候", "老味道", "经典复刻", "爷青回"],
  hormone: ["找对象", "脱单", "渣男鉴别", "分手", "前任", "夫妻关系"]
};

// 时长对应字数
const DURATION_WORD_COUNT: Record<number, { min: number; max: number }> = {
  15: { min: 55, max: 75 },
  30: { min: 110, max: 140 },
  45: { min: 170, max: 210 }
};

const getSystemPrompt = (
  merchantType: string,
  scriptType: string,
  selectedElements: string[],
  videoDuration: number
) => {
  const merchantConfig = MERCHANT_TYPE_CONFIG[merchantType] || MERCHANT_TYPE_CONFIG.ecommerce;
  const scriptConfig = SCRIPT_TYPE_CONFIG[scriptType] || SCRIPT_TYPE_CONFIG.teach;
  const wordCount = DURATION_WORD_COUNT[videoDuration] || DURATION_WORD_COUNT[30];

  // 获取选中元素对应的钩子词根
  const selectedHooks = selectedElements.map(el => ({
    element: el,
    hooks: HOOK_ELEMENTS[el] || []
  }));

  return `你是一位专业的短视频口播脚本创作专家，精通薛辉短视频架构方法论。

【商户类型】
- 类型：${merchantType}
- 风格：${merchantConfig.style}
- 语气：${merchantConfig.tone}
- 人设：${merchantConfig.persona}

【脚本类型】
- 类型：${scriptType}
- 结构：${scriptConfig.structure}
- 展开方式：${scriptConfig.description}

【选中的爆款元素及钩子词根】
${selectedHooks.map(h => `- ${h.element}：${h.hooks.join('、')}`).join('\n')}

【时长与字数要求】
- 总时长：${videoDuration}秒
- 目标字数：${wordCount.min}-${wordCount.max}字
- 误差范围：±10字

【口播脚本结构要求】

1. **开头钩子（前3秒，约15-20字）**
   - 必须使用选中元素对应的钩子词根造句
   - 制造悬念或冲突，抓住观众注意力
   - 示例风格：用"9.9元"开头 → "9.9元就能做到大牌同款效果？"

2. **中间内容（占60%时长，约${Math.round(wordCount.min * 0.6)}-${Math.round(wordCount.max * 0.6)}字）**
   - 根据${scriptType}类型展开：
   ${scriptConfig.description}

3. **结尾引导（最后3-5秒，约15-20字）**
   - 明确的行动号召（点击/关注/来店/私信）
   - 制造紧迫感或利益点
   - 示例："点击下方链接，马上领取优惠"

【输出格式】
请严格按照以下JSON格式返回：

\`\`\`json
{
  "title": "选题标题（用钩子词根造句）",
  "script": "完整的口播文案（纯文本，不要分镜描述）",
  "wordCount": 实际字数,
  "estimatedDuration": 预估秒数,
  "openingHook": "开头钩子文案",
  "mainContent": "中间内容文案",
  "closingCTA": "结尾行动号召",
  "usedHooks": ["用到的钩子词根1", "用到的钩子词根2"]
}
\`\`\`

**重要提醒**：
- 开头第一句必须使用钩子词根
- 字数必须严格控制在${wordCount.min}-${wordCount.max}字之间
- 只输出纯口播文案，不需要分镜描述
- 结尾必须有明确的行动号召
`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      merchantType, 
      scriptType, 
      selectedElements, 
      videoDuration,
      topic 
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "缺少必要参数：projectId" },
        { status: 400 }
      );
    }

    const merchantKey = merchantType || "ecommerce";
    const scriptKey = scriptType || "teach";
    const duration = videoDuration || 30;
    const elements = selectedElements || [];

    // 构建用户输入
    const userPrompt = topic 
      ? `【选题信息】
标题：${topic.title}
冲突点：${topic.conflict_point || topic.conflictPoint}
情绪钩子：${topic.emotion_hook || topic.emotionHook}

请基于以上选题，生成口播脚本。`
      : `请根据商户类型"${merchantKey}"和脚本类型"${scriptKey}"，结合选中的爆款元素，生成一个口播脚本。`;

    // 调用Gemini
    const responseText = await callGemini(
      buildChatPrompt(
        getSystemPrompt(merchantKey, scriptKey, elements, duration), 
        userPrompt
      )
    );

    // 解析JSON
    let scriptData;
    try {
      const content = responseText;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      scriptData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON解析错误:", parseError);
      // 如果解析失败，使用原始文本
      scriptData = {
        title: "口播脚本",
        script: responseText,
        wordCount: responseText.length,
        estimatedDuration: Math.ceil(responseText.length / 4.5),
        openingHook: responseText.substring(0, 30),
        mainContent: responseText.substring(30),
        closingCTA: "",
        usedHooks: []
      };
    }

    // 验证字数
    const wordCount = DURATION_WORD_COUNT[duration] || DURATION_WORD_COUNT[30];
    const actualWordCount = scriptData.script?.length || 0;
    
    if (actualWordCount < wordCount.min || actualWordCount > wordCount.max) {
      console.warn(`字数不符合要求: ${actualWordCount} 目标: ${wordCount.min}-${wordCount.max}`);
    }

    return NextResponse.json({
      success: true,
      script: {
        id: `script_${Date.now()}`,
        title: scriptData.title || "口播脚本",
        script: scriptData.script || "",
        wordCount: actualWordCount,
        estimatedDuration: scriptData.estimatedDuration || Math.ceil(actualWordCount / 4.5),
        openingHook: scriptData.openingHook || "",
        mainContent: scriptData.mainContent || "",
        closingCTA: scriptData.closingCTA || "",
        usedHooks: scriptData.usedHooks || [],
        targetWordCount: wordCount
      }
    });

  } catch (error) {
    console.error("脚本生成失败:", error);
    return NextResponse.json(
      { error: "脚本生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}
