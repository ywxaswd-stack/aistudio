"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Loader2, Upload, X, Download, Image, Wand2 } from "lucide-react";

export default function ImagePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片不能超过5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 删除参考图
  const removeImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 拖拽处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  // 生成图片
  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入图片描述");
      return;
    }

    setLoading(true);
    setImageUrl(null);
    setProgress(0);

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, referenceImage }),
      });
      const data = await res.json();

      clearInterval(progressInterval);

      if (!data.success) {
        toast.error(data.error || "生成失败");
        setLoading(false);
        return;
      }

      setImageUrl(data.image_url);
      setProgress(100);
      toast.success("图片生成成功！");

    } catch (error) {
      clearInterval(progressInterval);
      toast.error("生成失败");
    } finally {
      setLoading(false);
    }
  };

  // 下载图片
  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ai-image-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error("下载失败");
    }
  };

  // 重置
  const reset = () => {
    setPrompt("");
    setReferenceImage(null);
    setImageUrl(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header 
        title="文生图/图生图" 
        subtitle="AI 一句话生成精美图片"
        gradient="from-blue-600 to-cyan-600"
      />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* 生成区域 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-6">
                {/* 参考图上传 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-white">
                    <Image className="w-4 h-4" />
                    参考图（可选）
                    <span className="text-white/40 font-normal">上传参考图将使用图生图模式</span>
                  </label>
                  
                  {referenceImage ? (
                    <div className="relative inline-block">
                      <img
                        src={referenceImage}
                        alt="参考图"
                        className="max-h-48 rounded-lg border border-white/20"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 bg-black/50 hover:bg-red-500"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragOver
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/20 hover:border-white/40"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                      <p className="text-sm text-white/60">
                        点击或拖拽上传参考图（可选）
                      </p>
                      <p className="text-xs text-white/40 mt-1">支持 JPG/PNG，最大5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>

                {/* 描述输入 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    图片描述 <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="描述你想要的图片，支持中文，例如：一只可爱的猫咪坐在樱花树下，春天氛围，动漫风格"
                    className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none focus:ring-blue-500"
                    maxLength={300}
                  />
                  <div className="text-xs text-white/40 text-right">
                    {prompt.length}/300
                  </div>
                </div>

                {/* 生成按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={generate}
                    disabled={loading || !prompt.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中... {progress}%
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        {referenceImage ? "图生图" : "文生图"}
                      </>
                    )}
                  </Button>
                  {imageUrl && (
                    <Button 
                      variant="outline" 
                      onClick={reset}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      重新生成
                    </Button>
                  )}
                </div>

                {/* 进度条 */}
                {loading && <Progress value={progress} className="h-1" />}
              </CardContent>
            </Card>

            {/* 生成的图片 */}
            {imageUrl && !loading && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">生成结果</CardTitle>
                  <CardDescription className="text-white/50">点击下载按钮保存图片</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative group">
                    <img
                      src={imageUrl}
                      alt="生成的图片"
                      className="w-full rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={downloadImage}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
