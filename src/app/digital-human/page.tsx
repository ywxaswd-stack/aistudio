"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Sparkles, ArrowLeft, Upload, Wand2, Play, Wallet, User, Zap,
  Mic, HandMetal, Check
} from "lucide-react";
import { toast } from "sonner";

// 声音选项
const VOICE_OPTIONS = [
  { id: "male_yunyang", name: "云阳男声", desc: "磁性低沉，专业可信" },
  { id: "female_yunxia", name: "云夏女声", desc: "温柔亲切，邻家姐姐" },
  { id: "male_dongchen", name: "东晨男声", desc: "年轻活力，阳光帅气" },
  { id: "female_ruolan", name: "若兰女声", desc: "知性优雅，成熟稳重" },
];

// 动作风格
const ACTION_STYLES = [
  { id: "professional", name: "专业站姿", desc: "双手自然下垂，稳重端庄" },
  { id: "gesture", name: "手势讲解", desc: "配合手势，自然表达" },
  { id: "light", name: "轻微晃动", desc: "轻微身体摆动，活力自然" },
  { id: "still", name: "静止模式", desc: "保持稳定，专注口播" },
];

export default function DigitalHumanPage() {
  const router = useRouter();
  const [selectedVoice, setSelectedVoice] = useState("male_yunyang");
  const [selectedAction, setSelectedAction] = useState("gesture");
  const [script, setScript] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("请上传图片文件");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("图片大小不能超过 10MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) {
      toast.error("请先上传人物照片");
      return;
    }
    if (!script.trim()) {
      toast.error("请输入口播脚本");
      return;
    }
    if (script.trim().length < 10) {
      toast.error("脚本内容太短，至少需要10个字");
      return;
    }

    setGenerating(true);
    toast.success("视频生成中，请稍候...");

    // TODO: 调用数字人生成 API
    setTimeout(() => {
      setGenerating(false);
      toast.success("视频生成完成！");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AI Studio</span>
              </Link>
            </div>

            {/* 右侧 */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Wallet className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">600秒</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">数字人口播</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              AI 数字人视频生成
            </h1>
            <p className="text-white/60">
              上传人物照片，输入口播脚本，AI 将为您生成专业的数字人口播视频
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：上传照片 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                上传人物照片
              </h2>
              <p className="text-white/60 text-sm mb-4">
                上传一张清晰的人物正面照片，建议使用证件照或职业照
              </p>

              <div
                className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                  imagePreview
                    ? "border-purple-500/50 bg-purple-500/5"
                    : "border-white/20 hover:border-purple-500/50 hover:bg-white/5"
                }`}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {imagePreview ? (
                  <div className="p-4">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="w-full h-48 object-contain rounded-xl"
                    />
                    <p className="text-center text-white/60 text-sm mt-3">
                      点击重新上传
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-white/80 font-medium mb-1">点击上传照片</p>
                    <p className="text-white/40 text-sm">支持 JPG、PNG，大小不超过 10MB</p>
                  </div>
                )}
              </div>

              {/* 示例图片 */}
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-2">参考示例：</p>
                <div className="flex gap-2">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white/40" />
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white/40" />
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white/40" />
                  </div>
                </div>
              </div>
            </Card>

            {/* 右侧：配置选项 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                视频配置
              </h2>

              {/* 声音选择 */}
              <div className="mb-6">
                <label className="text-white/80 font-medium mb-3 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  选择声音
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICE_OPTIONS.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedVoice === voice.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{voice.name}</span>
                        {selectedVoice === voice.id && (
                          <Check className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <p className="text-white/50 text-xs mt-1">{voice.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 动作风格 */}
              <div className="mb-6">
                <label className="text-white/80 font-medium mb-3 flex items-center gap-2">
                  <HandMetal className="w-4 h-4" />
                  动作风格
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTION_STYLES.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => setSelectedAction(action.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAction === action.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{action.name}</span>
                        {selectedAction === action.id && (
                          <Check className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <p className="text-white/50 text-xs mt-1">{action.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 口播脚本 */}
              <div>
                <label className="text-white/80 font-medium mb-3">口播脚本</label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="请输入您的口播脚本内容，AI 将根据脚本生成对应的数字人视频..."
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                />
                <p className="text-white/40 text-xs mt-2">
                  字数：{script.length} / 建议 50-500 字
                </p>
              </div>
            </Card>
          </div>

          {/* 生成按钮 */}
          <div className="mt-8 text-center">
            <Button
              onClick={handleGenerate}
              disabled={generating || !imageFile || !script.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 px-12 py-6 text-lg"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-3" />
                  开始生成视频
                </>
              )}
            </Button>
            <p className="text-white/40 text-sm mt-3">
              预计消耗 30 秒时长
            </p>
          </div>

          {/* 提示 */}
          <div className="mt-12">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                使用提示
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">清晰正面照</p>
                    <p className="text-white/50 text-sm">上传清晰的正脸照片效果最佳</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">精简脚本</p>
                    <p className="text-white/50 text-sm">建议 50-200 字，简短有力的表达</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">耐心等待</p>
                    <p className="text-white/50 text-sm">视频生成需要 1-3 分钟，请耐心等待</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* 底部装饰 */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
    </div>
  );
}
