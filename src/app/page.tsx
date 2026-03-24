"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, Sparkles, Lightbulb, Upload, FileText, Video, Film, Clock,
  CheckCircle2, Loader2, ChevronRight, ChevronLeft, RefreshCw,
  Play, Download, Trash2, Plus
} from "lucide-react";
import { toast } from "sonner";

// 类型定义
interface Project {
  id: string;
  industry: string;
  industry_analysis: any;
  selected_word_roots: any;
  status: string;
  created_at: string;
}

interface WordRoot {
  id: string;
  combination: {
    id: number;
    elements: string[];
    description: string;
    example: string;
    conflictIndex?: string;
    conflictAnalysis?: string;
  };
  is_selected: boolean;
}

interface Topic {
  id: string;
  title: string;
  conflict_point: string;
  emotion_hook: string;
  is_selected: boolean;
}

interface Material {
  id: string;
  type: string;
  url: string;
  description: string;
  shotIndex?: number;  // 关联的分镜索引
  category?: string;   // 素材分类（如：柜台场景、产品展示等）
}

interface Script {
  id: string;
  title: string;
  duration: number;
  persona: string;
  opening_hook: any;
  middle_content: any[];
  ending_guide: any;
  shot_list: any[];
  materialUsagePlan?: string;
  // 新增口播脚本字段
  script?: string;
  wordCount?: number;
  targetWordCount?: { min: number; max: number };
  estimatedDuration?: number;
  openingHook?: string;
  mainContent?: string;
  closingCTA?: string;
  usedHooks?: string[];
}

const STEPS = [
  { id: 1, title: "场景设定", icon: Target, description: "选择商户类型、行业和时长" },
  { id: 2, title: "脚本类型", icon: FileText, description: "选择口播脚本类型" },
  { id: 3, title: "爆款元素", icon: Sparkles, description: "选择爆款元素组合" },
  { id: 4, title: "爆款选题", icon: Lightbulb, description: "生成8个爆款选题" },
  { id: 5, title: "口播脚本", icon: FileText, description: "生成口播文案" },
  { id: 6, title: "数字人生成", icon: Video, description: "生成口播数字人视频" },
];

// 维度一：商户类型配置
const MERCHANT_TYPES = [
  {
    id: "ecommerce",
    title: "电商卖家",
    icon: "🛍️",
    examples: "淘宝/抖音小店、跨境电商",
    goal: "直接转化，展示产品卖点",
    recommendedDuration: [15, 45],
    recommendedElements: "成本+人群+最差",
    style: "快节奏、直击痛点、强转化导向"
  },
  {
    id: "local_business",
    title: "实体店商家",
    icon: "🏪",
    examples: "餐饮、美业、教育、本地生活",
    goal: "引流到店，展示环境/服务",
    recommendedDuration: [15, 30],
    recommendedElements: "人群+猎奇+怀旧",
    style: "生活化、真实感、引流导向"
  },
  {
    id: "brand_owner",
    title: "品牌主理人",
    icon: "💎",
    examples: "自有品牌、新消费品牌",
    goal: "建立品牌认知，讲情怀/故事",
    recommendedDuration: [35, 55],
    recommendedElements: "头牌效应+反差+荷尔蒙",
    style: "剧情化、情感丰富、品质感"
  },
  {
    id: "knowledge_blogger",
    title: "知识博主/干货",
    icon: "📚",
    examples: "教程、测评、科普",
    goal: "建立专业信任，收藏/复看",
    recommendedDuration: [45, 60],
    recommendedElements: "猎奇+成本+头牌效应",
    style: "专业、易懂、干货导向"
  },
  {
    id: "story_ip",
    title: "剧情/IP账号",
    icon: "🎬",
    examples: "搞笑、情感、剧情号",
    goal: "涨粉，建立人设",
    recommendedDuration: [35, 55],
    recommendedElements: "反差+荷尔蒙+怀旧",
    style: "剧情化、人设鲜明、情绪共鸣"
  }
];

// 维度二：行业领域
const INDUSTRIES = [
  "职场", "教育", "美妆", "母婴", "健身", "美食", 
  "情感", "科技", "搞笑", "穿搭", "家居", "宠物", 
  "汽车", "财经", "法律", "摄影", "旅行", "游戏"
];

// 脚本类型（步骤2选择）
const SCRIPT_TYPES = [
  {
    id: "teach",
    title: "教知识",
    icon: "📚",
    description: "问题→解决方案→效果",
    structure: "先抛出痛点，再给出方法，最后展示效果",
    example: "3个Excel技巧让你效率翻倍"
  },
  {
    id: "show",
    title: "晒过程",
    icon: "🎬",
    description: "场景→过程→结果",
    structure: "展示真实场景，记录操作过程，呈现最终结果",
    example: "带你看我的一天是怎么过的"
  },
  {
    id: "opinion",
    title: "聊观点",
    icon: "💬",
    description: "现象→观点→共鸣",
    structure: "描述社会现象，表达鲜明观点，引发情感共鸣",
    example: "为什么年轻人越来越不想结婚了？"
  },
  {
    id: "story",
    title: "讲故事",
    icon: "📖",
    description: "冲突→转折→结局",
    structure: "设置戏剧冲突，制造意外转折，给出圆满结局",
    example: "我被客户骂了3小时，结果反转了"
  }
];

// 8大爆款元素（步骤3选择）
const VIRAL_ELEMENTS = [
  {
    id: "cost",
    title: "成本维度",
    icon: "💰",
    coreLogic: "花小钱办大事，满足性价比心理",
    hooks: ["花小钱装大杯", "省时省钱省力", "平替", "白嫖", "一招搞定", "9.9元"],
    example: "9.9元改造出租屋"
  },
  {
    id: "crowd",
    title: "人群维度",
    icon: "👥",
    coreLogic: "锁定特定群体，引发共情归属",
    hooks: ["宝妈", "程序员", "打工人", "小个子", "巨蟹座", "处女座"],
    example: "宝妈必看的3个带娃神器"
  },
  {
    id: "curiosity",
    title: "猎奇维度",
    icon: "🔍",
    coreLogic: "反常识冷知识，打破认知惯性",
    hooks: ["反常识", "万万没想到", "揭秘", "黑科技", "冷知识", "据说"],
    example: "在葡萄上做医美？"
  },
  {
    id: "contrast",
    title: "反差维度",
    icon: "⚡",
    coreLogic: "制造戏剧冲突，产生记忆点",
    hooks: ["身份错位", "场景反差", "没想到你是这样的", "居然", "竟然"],
    example: "在菜市场卖奢侈品"
  },
  {
    id: "worst",
    title: "最差元素",
    icon: "👎",
    coreLogic: "利用负面情绪，引发讨论吐槽",
    hooks: ["最丢脸", "最没面子", "避坑", "千万别买", "全网最低分"],
    example: "大众点评评分最差的店，到底有多难吃？"
  },
  {
    id: "authority",
    title: "头牌效应",
    icon: "👑",
    coreLogic: "借势名人权威，建立信任认知",
    hooks: ["明星同款", "大佬揭秘", "爱马仕工艺", "CCTV报道", "首富思维"],
    example: "揭秘爱马仕的百年工艺"
  },
  {
    id: "nostalgia",
    title: "怀旧元素",
    icon: "📼",
    coreLogic: "激活集体记忆，触发情感共鸣",
    hooks: ["童年回忆", "20年前", "小时候", "老味道", "经典复刻", "爷青回"],
    example: "复刻小学门口的5毛钱零食"
  },
  {
    id: "hormone",
    title: "荷尔蒙驱动",
    icon: "💕",
    coreLogic: "满足情感好奇，驱动社交话题",
    hooks: ["找对象", "脱单", "渣男鉴别", "分手", "前任", "夫妻关系"],
    example: "找对象时，如何一眼识别PUA？"
  }
];

// 动作风格（步骤6选择）
const MOTION_STYLES = [
  {
    id: "enthusiastic",
    title: "热情推荐",
    icon: "🎉",
    description: "自信走向镜头，举手展示产品，充满活力",
    prompt: "Enthusiastically walking towards camera, raising hand to show product, energetic smile"
  },
  {
    id: "professional",
    title: "专业讲解",
    icon: "👔",
    description: "保持稳定姿态，手势配合讲解，专注认真",
    prompt: "Stable posture, hand gestures for explanation, focused and serious expression"
  },
  {
    id: "friendly",
    title: "亲切聊天",
    icon: "😊",
    description: "自然放松肢体，轻微点头，亲切微笑",
    prompt: "Natural relaxed body language, slight nodding, friendly smile"
  },
  {
    id: "surprise",
    title: "惊喜揭秘",
    icon: "😲",
    description: "夸张惊讶表情，配合快速手势，制造悬念",
    prompt: "Exaggerated surprised expression, quick hand gestures, creating suspense"
  },
  {
    id: "authoritative",
    title: "权威背书",
    icon: "🏛️",
    description: "挺拔自信站姿，稳重手势，严肃专业",
    prompt: "Confident upright posture, steady gestures, serious and professional expression"
  }
];

// 声音风格选项
const VOICE_STYLES = [
  { id: "female_gentle", title: "温柔女声", voiceType: "BV700_V2_streaming" },
  { id: "female_energetic", title: "活力女声", voiceType: "BV700_V3_streaming" },
  { id: "male_calm", title: "沉稳男声", voiceType: "BV406_V2_streaming" },
  { id: "male_professional", title: "专业男声", voiceType: "BV407_V2_streaming" }
];

// 时长对应字数
const DURATION_WORD_COUNT: Record<number, { min: number; max: number }> = {
  15: { min: 55, max: 75 },
  30: { min: 110, max: 140 },
  45: { min: 170, max: 210 }
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 维度一：商户类型
  const [selectedMerchantType, setSelectedMerchantType] = useState<string | null>(null);
  // 维度二：行业领域
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [customIndustry, setCustomIndustry] = useState<string>("");
  // 视频时长
  const [videoDuration, setVideoDuration] = useState<number>(30);
  
  // 新流程状态
  const [scriptType, setScriptType] = useState<string | null>(null); // 脚本类型
  const [selectedElements, setSelectedElements] = useState<string[]>([]); // 选中的爆款元素
  const [portraitImage, setPortraitImage] = useState<string | null>(null); // 人像图片
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null); // 背景图片
  const [motionStyle, setMotionStyle] = useState<string>("friendly"); // 动作风格
  const [voiceStyle, setVoiceStyle] = useState<string>("female_gentle"); // 声音风格
  const [digitalHumanTaskId, setDigitalHumanTaskId] = useState<string | null>(null); // 数字人任务ID
  const [digitalHumanVideo, setDigitalHumanVideo] = useState<string | null>(null); // 生成的数字人视频
  
  // 各步骤数据
  const [industryAnalysis, setIndustryAnalysis] = useState<any>(null);
  const [wordRoots, setWordRoots] = useState<WordRoot[]>([]);
  const [wordRootAnalysis, setWordRootAnalysis] = useState<any>(null); // 词根分析过程
  const [generatingWordRoots, setGeneratingWordRoots] = useState(false); // 词根生成中状态
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [script, setScript] = useState<Script | null>(null);
  const [shotScript, setShotScript] = useState<any>(null); // 分镜脚本
  const [optimizedShots, setOptimizedShots] = useState<any[]>([]); // 优化后的分镜
  const [videos, setVideos] = useState<any[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9"); // 视频宽高比
  const [mergedVideo, setMergedVideo] = useState<string | null>(null); // 合成后的视频URL
  
  // 追踪已访问的步骤，用于支持返回调整
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  
  // 更新当前步骤时记录已访问
  const setCurrentStepWithTrack = (step: number) => {
    setCurrentStep(step);
    setVisitedSteps(prev => new Set([...prev, step]));
  };

  // 获取实际行业值
  const getActualIndustry = () => customIndustry.trim() || selectedIndustry;
  
  // 获取选中的商户类型配置
  const getSelectedMerchantConfig = () => MERCHANT_TYPES.find(m => m.id === selectedMerchantType);

  // 创建项目并开始
  const handleStartProject = async () => {
    const actualIndustry = getActualIndustry();
    
    if (!actualIndustry) {
      toast.error("请选择或输入行业领域");
      return;
    }

    if (!selectedMerchantType) {
      toast.error("请选择商户类型");
      return;
    }

    setLoading(true);
    try {
      // 创建项目（包含商户类型和时长信息）
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          industry: actualIndustry,
          merchantType: selectedMerchantType,
          videoDuration,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setProject(data.project);
        toast.success("项目创建成功！");
        
        // 自动开始赛道分析
        await analyzeIndustry(data.project.id);
      } else {
        toast.error(data.error || "创建项目失败");
      }
    } catch (error) {
      toast.error("创建项目失败");
    } finally {
      setLoading(false);
    }
  };

  // 赛道分析
  const analyzeIndustry = async (projectId: string) => {
    setLoading(true);
    const actualIndustry = getActualIndustry();
    try {
      const res = await fetch("/api/industry/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId, 
          industry: actualIndustry,
          merchantType: selectedMerchantType,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        // 合并商户类型和时长信息到分析结果中
        const analysisWithMeta = {
          ...data.analysis,
          merchantType: selectedMerchantType,
          videoDuration: videoDuration,
        };
        setIndustryAnalysis(analysisWithMeta);
        
        // 先显示加载提示，再跳转到步骤2
        setGeneratingWordRoots(true);
        setCurrentStepWithTrack(2);
        toast.success("赛道分析完成！");
        
        // 自动生成词根组合
        await generateWordRoots(projectId, analysisWithMeta);
      } else {
        toast.error(data.error || "分析失败");
      }
    } catch (error) {
      toast.error("赛道分析失败");
    } finally {
      setLoading(false);
    }
  };

  // 生成词根组合
  const generateWordRoots = async (projectId: string, analysis: any) => {
    // 加载提示已在 analyzeIndustry 中提前设置
    const actualIndustry = getActualIndustry();
    try {
      const res = await fetch("/api/word-roots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId, 
          industry: actualIndustry,
          industryAnalysis: analysis 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        // 保存词根分析过程
        setWordRootAnalysis(data.analysis || null);
        
        setWordRoots(data.combinations.map((combo: any, idx: number) => ({
          id: `wr_${idx}`,
          combination: combo,
          is_selected: false,
        })));
        setCurrentStepWithTrack(2);
        toast.success("词根组合生成完成！");
      }
    } catch (error) {
      toast.error("词根组合生成失败");
    } finally {
      setGeneratingWordRoots(false);
    }
  };

  // 选择词根组合
  const [generatingTopicForWordRoot, setGeneratingTopicForWordRoot] = useState<string | null>(null);
  
  const selectWordRoot = async (wordRootId: string) => {
    // 如果正在生成中，不响应点击
    if (generatingTopicForWordRoot) return;
    
    setWordRoots(prev => prev.map(wr => ({
      ...wr,
      is_selected: wr.id === wordRootId,
    })));
    
    const selected = wordRoots.find(wr => wr.id === wordRootId);
    const actualIndustry = getActualIndustry();
    if (selected && project) {
      // 生成选题 - 设置具体哪个词根在生成中
      setGeneratingTopicForWordRoot(wordRootId);
      try {
        const res = await fetch("/api/topics/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            industry: actualIndustry,
            wordRootCombination: selected.combination,
            merchantType: selectedMerchantType,
            videoDuration: videoDuration,
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          setTopics(data.topics);
          setCurrentStepWithTrack(3);
          toast.success("选题生成完成！");
        }
      } catch (error) {
        toast.error("选题生成失败");
      } finally {
        setGeneratingTopicForWordRoot(null);
      }
    }
  };

  // 换一批选题
  // 生成口播脚本
  const generateScript = async () => {
    if (!project || !topics.some((t: any) => t.is_selected)) return;
    
    setLoading(true);
    try {
      const selectedTopic = topics.find((t: any) => t.is_selected);
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          topic: selectedTopic,
          duration: videoDuration,
          scriptType: scriptType,
          viralElements: selectedElements
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setScript(data.script);
        toast.success("脚本生成成功！");
      }
    } catch (error) {
      toast.error("生成脚本失败");
    } finally {
      setLoading(false);
    }
  };

  // 轮询数字人视频状态
  const pollDigitalHumanStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/digital-human/status?taskId=${taskId}`);
        const data = await res.json();
        
        if (data.status === "completed" && data.video_url) {
          clearInterval(pollInterval);
          setDigitalHumanVideo(data.video_url);
          toast.success("数字人视频生成完成！");
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          toast.error("数字人视频生成失败");
        }
      } catch (error) {
        clearInterval(pollInterval);
        toast.error("查询状态失败");
      }
    }, 5000);
  };

  const refreshTopics = async () => {
    if (!project) return;
    const selected = wordRoots.find(wr => wr.is_selected);
    if (!selected) return;
    const actualIndustry = getActualIndustry();

    setLoading(true);
    try {
      const res = await fetch("/api/topics/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          industry: actualIndustry,
          wordRootCombination: selected.combination,
          merchantType: selectedMerchantType,
          videoDuration: videoDuration,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTopics(data.topics);
        toast.success("已生成新选题！");
      }
    } catch (error) {
      toast.error("重新生成失败");
    } finally {
      setLoading(false);
    }
  };

  // 旧的生成选题函数（保留兼容）
  const generateTopics = async () => {
    if (!project || selectedElements.length === 0) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          industry: getActualIndustry(),
          viralElements: selectedElements,
          merchantType: selectedMerchantType,
          videoDuration: videoDuration,
          count: 8
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTopics(data.topics);
        toast.success("已生成8个爆款选题！");
      }
    } catch (error) {
      toast.error("生成选题失败");
    } finally {
      setLoading(false);
    }
  };

  // 选择选题
  const [generatingScript, setGeneratingScript] = useState(false);
  
  const selectTopic = async (topicId: string) => {
    setTopics(prev => prev.map(t => ({
      ...t,
      is_selected: t.id === topicId,
    })));
    
    // 自动进入脚本生成
    const selectedTopic = topics.find(t => t.id === topicId);
    const selectedWordRoot = wordRoots.find(wr => wr.is_selected);
    
    if (selectedTopic && selectedWordRoot && project) {
      setGeneratingScript(true);
      try {
        const res = await fetch("/api/scripts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            topic: selectedTopic,
            wordRoots: selectedWordRoot.combination,
            materials: [],
            merchantType: selectedMerchantType,
            videoDuration: videoDuration,
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          setScript(data.script);
          setCurrentStepWithTrack(4);
          toast.success("脚本生成完成！");
        }
      } catch (error) {
        toast.error("脚本生成失败");
      } finally {
        setGeneratingScript(false);
      }
    }
  };

  // 上传素材
  const handleUploadMaterial = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    shotIndex?: number, 
    category?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    const formData = new FormData();
    formData.append("projectId", project.id);
    formData.append("type", file.type.startsWith("image") ? "image" : "video");
    formData.append("file", file);
    if (shotIndex !== undefined) formData.append("shotIndex", String(shotIndex));
    if (category) formData.append("category", category);

    setLoading(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setMaterials(prev => [...prev, { ...data.material, shotIndex, category }]);
        toast.success(`${category || '素材'}上传成功！`);
      }
    } catch (error) {
      toast.error("上传失败");
    } finally {
      setLoading(false);
    }
  };

  // 生成脚本（旧版本，保留分镜脚本生成）
  const [materialAnalysis, setMaterialAnalysis] = useState<any[]>([]);
  
  const generateScriptWithMaterials = async () => {
    if (!project) return;
    const selectedTopic = topics.find(t => t.is_selected);
    const selectedWordRoot = wordRoots.find(wr => wr.is_selected);
    if (!selectedTopic || !selectedWordRoot) {
      toast.error("请先选择选题");
      return;
    }

    setLoading(true);
    try {
      // 准备素材数据
      const materialsData = materials.map(m => ({
        type: m.type,
        uri: m.url,
        description: m.description || '',
      }));

      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          topic: selectedTopic,
          wordRoots: selectedWordRoot.combination,
          materials: materialsData,
          merchantType: selectedMerchantType,
          videoDuration: videoDuration,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setScript(data.script);
        if (data.materialAnalysis && data.materialAnalysis.length > 0) {
          setMaterialAnalysis(data.materialAnalysis);
        }
        setCurrentStepWithTrack(5);
        toast.success("脚本生成完成！");
      }
    } catch (error) {
      toast.error("脚本生成失败");
    } finally {
      setLoading(false);
    }
  };

  // 生成分镜脚本（按8秒拆分）
  const generateShotScript = async () => {
    if (!script) {
      toast.error("请先生成基础脚本");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scripts/shots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id,
          script,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setShotScript(data.shotScript);
        // 生成分镜脚本后自动跳转到步骤5让用户查看和确认
        setCurrentStepWithTrack(5);
        toast.success(`分镜脚本生成完成！共 ${data.shotScript.shotCount} 个分镜，请查看确认`);
      } else {
        toast.error(data.error || "分镜脚本生成失败");
      }
    } catch (error) {
      toast.error("分镜脚本生成失败");
    } finally {
      setLoading(false);
    }
  };

  // 优化Veo提示词
  const optimizeVeoPrompts = async () => {
    if (!shotScript || !shotScript.shots) {
      toast.error("请先生成分镜脚本");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/veo/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shots: shotScript.shots,
          aspectRatio: "16:9",
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setOptimizedShots(data.shots);
        toast.success(`提示词优化完成！${data.shotCount} 个分镜已准备就绪`);
      } else {
        toast.error(data.error || "提示词优化失败");
      }
    } catch (error) {
      toast.error("提示词优化失败");
    } finally {
      setLoading(false);
    }
  };

  // 直接生成视频（从基础脚本）
  const generateVideos = async () => {
    if (!script || !project) {
      toast.error("请先生成基础脚本");
      return;
    }

    setLoading(true);
    try {
      // 将基础脚本转换为简化的分镜格式
      const shots: any[] = [];
      
      // 开头
      if (script.opening_hook) {
        shots.push({
          shotId: "opening",
          type: "opening",
          duration: 8,
          visual: script.opening_hook.visual,
          dialogue: script.opening_hook.script,
          veoPrompt: `${script.opening_hook.visual}, cinematic, professional camera movement, high quality`,
        });
      }
      
      // 中间内容
      if (script.middle_content) {
        script.middle_content.forEach((section: any, index: number) => {
          shots.push({
            shotId: `middle-${index}`,
            type: "content",
            duration: 8,
            visual: section.visual,
            dialogue: section.script,
            veoPrompt: `${section.visual}, cinematic, professional camera movement, high quality`,
          });
        });
      }
      
      // 结尾
      if (script.ending_guide) {
        shots.push({
          shotId: "ending",
          type: "ending",
          duration: 8,
          visual: script.ending_guide.visual,
          dialogue: script.ending_guide.cta,
          veoPrompt: `${script.ending_guide.visual}, cinematic, professional camera movement, high quality`,
        });
      }

      if (shots.length === 0) {
        toast.error("没有可生成的分镜");
        return;
      }

      // 提交批量生成
      const res = await fetch("/api/veo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          shots: shots,
          aspectRatio: "16:9",
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        // 初始化所有任务状态
        const newOperations = new Map(veoOperations);
        data.results.forEach((r: any) => {
          if (r.success && r.operationName) {
            newOperations.set(r.operationName, {
              status: "processing",
              progress: 5,
              shotId: r.shotId,
            });
            startPolling(r.operationName, r.shotId);
          }
        });
        
        setVeoOperations(newOperations);
        setCurrentStepWithTrack(7);
        toast.success(`已提交 ${shots.length} 个视频生成任务`);
      } else {
        toast.error(data.error || "提交失败");
      }
    } catch (error) {
      toast.error("视频生成提交失败");
    } finally {
      setLoading(false);
    }
  };

  // Veo 视频生成状态
  const [veoOperations, setVeoOperations] = useState<Map<string, { status: string; progress: number; videoUrl?: string; shotId?: string }>>(new Map());
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 提交 Veo 视频生成任务（批量）
  const submitVeoTasks = async () => {
    const shotsToGenerate = optimizedShots.length > 0 ? optimizedShots : shotScript?.shots;
    
    if (!project || !shotsToGenerate || shotsToGenerate.length === 0) {
      toast.error("没有可生成的分镜");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/veo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          shots: shotsToGenerate,
          materials: materials, // 传递用户上传的素材
          aspectRatio: aspectRatio, // 使用选择的视频比例
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        // 初始化所有任务状态
        const newOperations = new Map(veoOperations);
        data.results.forEach((r: any) => {
          if (r.success && r.operationName) {
            newOperations.set(r.operationName, {
              status: "processing",
              progress: 5,
              shotId: r.shotId,
            });
            startPolling(r.operationName, r.shotId);
          }
        });
        
        setVeoOperations(newOperations);
        setCurrentStepWithTrack(7);
        toast.success(data.message);
      } else {
        toast.error(data.error || "提交失败");
      }
    } catch (error) {
      toast.error("提交失败");
    } finally {
      setLoading(false);
    }
  };

  // 轮询任务状态
  const startPolling = (operationName: string, shotId?: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/veo/generate?operation_name=${encodeURIComponent(operationName)}`);
        const data = await res.json();
        
        setVeoOperations(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(operationName) || { status: "processing", progress: 5, shotId };
          
          if (data.done) {
            if (data.success) {
              newMap.set(operationName, {
                status: "completed",
                progress: 100,
                videoUrl: data.video_url || data.gcs_uri,
                shotId,
              });
              
              // 添加到视频列表（去重：检查operationName是否已存在）
              setVideos(v => {
                if (v.some(video => video.operationName === operationName)) {
                  return v; // 已存在，不重复添加
                }
                return [...v, {
                  shotId,
                  operationName,
                  videoUrl: data.video_url || data.gcs_uri,
                  success: true,
                }];
              });
              
              toast.success(`分镜 ${shotId} 视频生成完成`);
            } else {
              newMap.set(operationName, {
                status: "failed",
                progress: 0,
                shotId,
              });
              toast.error(`分镜 ${shotId} 生成失败: ${data.error}`);
            }
            
            // 停止轮询
            const timer = pollingRef.current.get(operationName);
            if (timer) {
              clearInterval(timer);
              pollingRef.current.delete(operationName);
            }
          } else {
            // 更新进度
            newMap.set(operationName, {
              ...current,
              progress: Math.min(current.progress + 4, 92),
            });
          }
          
          return newMap;
        });
      } catch (error) {
        console.error("轮询失败:", error);
      }
    };
    
    // 每8秒轮询一次
    const timer = setInterval(poll, 8000);
    pollingRef.current.set(operationName, timer);
    
    // 立即执行一次
    poll();
  };

  // 计算总体进度
  const totalProgress = veoOperations.size > 0
    ? Array.from(veoOperations.values()).reduce((sum, op) => sum + op.progress, 0) / veoOperations.size
    : 0;
  
  const completedCount = Array.from(veoOperations.values()).filter(op => op.status === "completed").length;
  const failedCount = Array.from(veoOperations.values()).filter(op => op.status === "failed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎬 爆款短视频智能生成
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                基于薛辉短视频架构方法论 · AI驱动创作
              </p>
            </div>
            {project && (
              <Badge variant="outline" className="text-sm">
                项目ID: {project.id.slice(0, 8)}...
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 步骤导航 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => visitedSteps.has(step.id) && setCurrentStep(step.id)}
                  disabled={!visitedSteps.has(step.id)}
                  className={`flex flex-col items-center ${
                    visitedSteps.has(step.id) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.id
                      ? "bg-green-500 border-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-purple-500 border-purple-500 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep >= step.id ? "text-gray-900 dark:text-white" : "text-gray-400"
                  }`}>
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 进度条 */}
        <Progress value={(currentStep / STEPS.length) * 100} className="mb-8 h-2" />

        {/* 步骤内容 */}
        <div className="max-w-4xl mx-auto">
          {/* 步骤1: 双维度设定 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* 维度一：商户类型 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    维度一：你的商户类型
                  </CardTitle>
                  <CardDescription>
                    选择你的商户类型，系统会推荐最合适的视频时长和内容策略
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MERCHANT_TYPES.map((merchant) => (
                      <div
                        key={merchant.id}
                        onClick={() => {
                          setSelectedMerchantType(merchant.id);
                          setVideoDuration(merchant.recommendedDuration[0]);
                        }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedMerchantType === merchant.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{merchant.icon}</span>
                          <h4 className="font-medium">{merchant.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{merchant.examples}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-purple-600 font-medium">
                            {merchant.recommendedDuration[0]}-{merchant.recommendedDuration[1]}秒
                          </span>
                        </div>
                        {selectedMerchantType === merchant.id && (
                          <div className="mt-2 pt-2 border-t border-purple-200">
                            <p className="text-xs text-purple-600">
                              <span className="font-medium">目标：</span>{merchant.goal}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 维度二：行业领域 + 时长设置 */}
              {selectedMerchantType && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      维度二：你的行业领域
                    </CardTitle>
                    <CardDescription>
                      选择或输入你的行业领域，系统将生成精准的内容方向
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 时长设置 */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">视频时长</span>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {videoDuration} 秒
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min={getSelectedMerchantConfig()?.recommendedDuration[0]}
                        max={getSelectedMerchantConfig()?.recommendedDuration[1]}
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{getSelectedMerchantConfig()?.recommendedDuration[0]}秒</span>
                        <span className="text-purple-600">预计 {Math.ceil(videoDuration / 8)} 个分镜</span>
                        <span>{getSelectedMerchantConfig()?.recommendedDuration[1]}秒</span>
                      </div>
                    </div>

                    {/* 预设行业 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">选择行业（点击选择）</label>
                      <div className="flex gap-2 flex-wrap">
                        {INDUSTRIES.map((ind) => (
                          <Badge
                            key={ind}
                            variant={selectedIndustry === ind ? "default" : "outline"}
                            className={`cursor-pointer transition-all ${
                              selectedIndustry === ind 
                                ? "bg-purple-600 hover:bg-purple-700" 
                                : "hover:bg-purple-100"
                            }`}
                            onClick={() => {
                              setSelectedIndustry(ind);
                              setCustomIndustry("");
                            }}
                          >
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 自定义行业 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">或自定义输入</label>
                      <Input
                        placeholder="输入你的行业领域..."
                        value={customIndustry}
                        onChange={(e) => {
                          setCustomIndustry(e.target.value);
                          setSelectedIndustry("");
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleStartProject()}
                        className="text-lg"
                      />
                    </div>

                    <Button
                      onClick={handleStartProject}
                      disabled={loading || !getActualIndustry()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          正在分析...
                        </>
                      ) : (
                        "开始智能分析"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 空状态提示 */}
              {!selectedMerchantType && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">请先选择你的商户类型</p>
                </div>
              )}

              {/* 赛道分析结果 */}
              {industryAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📊 赛道分析结果
                    </CardTitle>
                    <CardDescription>
                      基于你的商户类型和行业领域，系统为你生成以下分析
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <span className="text-purple-600">👥</span> 目标人群特征
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {industryAnalysis.targetAudience?.description || 
                           `${industryAnalysis.targetAudience?.age || "分析中..."}`}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-pink-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <span className="text-pink-600">💰</span> 适合的变现方式
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {industryAnalysis.monetizationMethods?.slice(0, 3).map((m: any, i: number) => (
                            <li key={i}>• {m.method || m}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-orange-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <span className="text-orange-600">🔥</span> 推荐爆款元素
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {industryAnalysis.recommendedElements || getSelectedMerchantConfig()?.recommendedElements}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 步骤2: 脚本类型选择 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    第2步：选择脚本类型
                  </CardTitle>
                  <CardDescription>
                    选择你想要的内容结构，AI会根据类型生成对应的口播脚本
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SCRIPT_TYPES.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setScriptType(type.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          scriptType === type.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{type.icon}</span>
                          <span className="text-lg font-semibold">{type.title}</span>
                          {scriptType === type.id && <CheckCircle2 className="w-5 h-5 text-purple-600 ml-auto" />}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{type.description}</p>
                        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          结构：{type.structure}
                        </div>
                        <div className="mt-2 text-xs text-purple-600">
                          示例：{type.example}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStepWithTrack(1)} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      返回场景设定
                    </Button>
                    <Button 
                      onClick={() => setCurrentStepWithTrack(3)} 
                      disabled={!scriptType}
                      className="flex-1"
                    >
                      下一步：选择爆款元素
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 步骤3: 爆款元素选择 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    第3步：选择爆款元素
                  </CardTitle>
                  <CardDescription>
                    选择1-3个爆款元素，系统会自动使用对应的钩子词根生成吸睛内容
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {VIRAL_ELEMENTS.map((element) => (
                      <div
                        key={element.id}
                        onClick={() => {
                          if (selectedElements.includes(element.id)) {
                            setSelectedElements(selectedElements.filter(e => e !== element.id));
                          } else if (selectedElements.length < 3) {
                            setSelectedElements([...selectedElements, element.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedElements.includes(element.id)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 hover:border-purple-300"
                        } ${selectedElements.length >= 3 && !selectedElements.includes(element.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{element.icon}</span>
                          <span className="font-semibold text-sm">{element.title}</span>
                          {selectedElements.includes(element.id) && <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto" />}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{element.coreLogic}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {element.hooks.slice(0, 3).map((hook, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{hook}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedElements.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700">
                        已选择 {selectedElements.length} 个元素，将使用以下钩子词根：
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedElements.map(el => 
                          VIRAL_ELEMENTS.find(e => e.id === el)?.hooks.map((hook, i) => (
                            <Badge key={`${el}-${i}`} variant="outline" className="text-xs">{hook}</Badge>
                          ))
                        ).flat()}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStepWithTrack(2)} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      返回脚本类型
                    </Button>
                    <Button 
                      onClick={() => setCurrentStepWithTrack(4)} 
                      disabled={selectedElements.length === 0}
                      className="flex-1"
                    >
                      下一步：生成选题
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 步骤4: 爆款选题 */}
          {currentStep === 4 && (
            <div className="space-y-6 relative">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    第4步：选择爆款选题
                  </CardTitle>
                  <CardDescription>
                    基于你选择的爆款元素，AI为你生成8个爆款选题
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      已选元素：{selectedElements.map(el => 
                        VIRAL_ELEMENTS.find(e => e.id === el)?.title
                      ).join('、')}
                    </div>
                    <Button
                      variant="outline"
                      onClick={refreshTopics}
                      disabled={loading}
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      换一批
                    </Button>
                  </div>

                  {topics.length === 0 && (
                    <div className="text-center py-8">
                      <Button onClick={generateTopics} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            生成8个爆款选题
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topics.map((topic: any, topicIndex: number) => (
                      <div
                        key={topic.id}
                        onClick={() => selectTopic(topic.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          topic.is_selected
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>选题 {topicIndex + 1}</Badge>
                          {topic.is_selected && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                        </div>
                        <h4 className="font-semibold mb-2">{topic.title}</h4>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>💥 {topic.conflict_point || topic.conflictPoint}</p>
                          <p>🎭 {topic.emotion_hook || topic.emotionHook}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStepWithTrack(3)} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      返回元素选择
                    </Button>
                    <Button 
                      onClick={() => setCurrentStepWithTrack(5)} 
                      disabled={!topics.some((t: any) => t.is_selected)}
                      className="flex-1"
                    >
                      下一步：生成口播脚本
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 步骤5: 口播脚本 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    第5步：口播脚本
                  </CardTitle>
                  <CardDescription>
                    根据时长生成口播文案，严格控制字数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 字数进度条 */}
                  {script && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>字数进度</span>
                        <span>{script.wordCount || 0} / {script.targetWordCount?.min || 0}-{script.targetWordCount?.max || 0} 字</span>
                      </div>
                      <Progress 
                        value={((script.wordCount || 0) / (script.targetWordCount?.max || 200)) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>预估时长：{script.estimatedDuration}秒</span>
                        <span>目标时长：{videoDuration}秒</span>
                      </div>
                    </div>
                  )}

                  {/* 脚本内容 */}
                  {script ? (
                    <div className="space-y-4">
                      {/* 开头钩子 */}
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                        <h4 className="font-medium text-red-700 mb-2">🎣 开头钩子（前3秒）</h4>
                        <p className="text-sm">{script.openingHook}</p>
                      </div>

                      {/* 中间内容 */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-medium text-blue-700 mb-2">📝 中间内容</h4>
                        <p className="text-sm whitespace-pre-wrap">{script.mainContent}</p>
                      </div>

                      {/* 结尾引导 */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                        <h4 className="font-medium text-green-700 mb-2">🎯 结尾行动号召</h4>
                        <p className="text-sm">{script.closingCTA}</p>
                      </div>

                      {/* 使用的钩子词根 */}
                      {script.usedHooks && script.usedHooks.length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">使用的钩子词根：</p>
                          <div className="flex flex-wrap gap-1">
                            {script.usedHooks.map((hook: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{hook}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 完整脚本 */}
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">📄 完整脚本</h4>
                        <Textarea 
                          value={script.script}
                          onChange={(e) => {
                            const newScript = e.target.value;
                            setScript({
                              ...script,
                              script: newScript,
                              wordCount: newScript.length,
                              estimatedDuration: Math.ceil(newScript.length / 4.5)
                            });
                          }}
                          className="min-h-[200px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Button onClick={generateScript} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            生成口播脚本
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStepWithTrack(4)} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      返回选题
                    </Button>
                    <Button 
                      onClick={() => setCurrentStepWithTrack(6)} 
                      disabled={!script}
                      className="flex-1"
                    >
                      下一步：生成数字人视频
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 步骤6: 数字人生成 */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-600" />
                    第6步：生成数字人视频
                  </CardTitle>
                  <CardDescription>
                    上传人像图片，选择声音和动作风格，生成口播数字人视频
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 人像上传 */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">👤 上传人像图片</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {portraitImage ? (
                        <div className="relative">
                          <img src={portraitImage} alt="人像" className="max-h-64 mx-auto rounded-lg" />
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setPortraitImage(null)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">点击或拖拽上传人像图片</p>
                          <Input
                            type="file"
                            accept="image/*"
                            className="mt-2"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setPortraitImage(ev.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 声音选择 */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">🎵 选择声音风格</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {VOICE_STYLES.map((voice) => (
                        <div
                          key={voice.id}
                          onClick={() => setVoiceStyle(voice.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                            voiceStyle === voice.id
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                        >
                          <span className="text-sm font-medium">{voice.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 动作风格选择 */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">🎭 选择动作风格</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {MOTION_STYLES.map((motion) => (
                        <div
                          key={motion.id}
                          onClick={() => setMotionStyle(motion.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            motionStyle === motion.id
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                        >
                          <div className="text-xl mb-1">{motion.icon}</div>
                          <div className="text-sm font-medium">{motion.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{motion.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 背景图片（可选） */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">🖼️ 背景图片（可选）</label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {backgroundImage ? (
                        <div className="relative">
                          <img src={backgroundImage} alt="背景" className="max-h-40 mx-auto rounded-lg" />
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setBackgroundImage(null)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setBackgroundImage(ev.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 生成按钮 */}
                  <Button
                    onClick={async () => {
                      if (!portraitImage || !script?.script) {
                        toast.error("请先上传人像图片并生成脚本");
                        return;
                      }

                      setLoading(true);
                      try {
                        const res = await fetch("/api/digital-human/generate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            portraitImage,
                            script: script.script,
                            voiceStyle,
                            motionStyle,
                            backgroundImage,
                            aspectRatio
                          })
                        });

                        const data = await res.json();
                        if (data.success) {
                          setDigitalHumanTaskId(data.task_id);
                          toast.success("数字人视频生成任务已提交");
                          // 开始轮询状态
                          pollDigitalHumanStatus(data.task_id);
                        } else {
                          toast.error(data.error || "生成失败");
                        }
                      } catch (error) {
                        toast.error("生成失败");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || !portraitImage || !script}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        生成数字人视频
                      </>
                    )}
                  </Button>

                  {/* 生成结果 */}
                  {digitalHumanVideo && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        数字人视频生成完成
                      </h4>
                      <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-xs mx-auto">
                        <video src={digitalHumanVideo} controls className="w-full h-full" />
                      </div>
                      <div className="mt-3 flex gap-2 justify-center">
                        <a
                          href={digitalHumanVideo}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Download className="w-4 h-4" />
                          下载视频
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setCurrentStepWithTrack(5)} className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      返回脚本
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
