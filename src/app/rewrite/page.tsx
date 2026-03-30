"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Upload, FileAudio, Copy, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function RewritePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [asrStatus, setAsrStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [originalText, setOriginalText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 处理文件选择
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 验证文件类型
      const validTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "video/mp4", "video/webm"];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|mp4|webm)$/i)) {
        setError("请上传音频或视频文件（支持 mp3/wav/m4a/mp4/webm）");
        return;
      }
      // 验证文件大小 100MB
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("文件不能超过100MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setOriginalText("");
      setRewrittenText("");
      setAsrStatus("idle");
    }
  }, []);

  // 上传并提交 ASR
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setAsrStatus("uploading");
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/asr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "上传失败");
      }

      setTaskId(data.task_id);
      setAsrStatus("processing");
      setProgress(10);

      // 开始轮询状态
      pollAsrStatus(data.task_id);
    } catch (err) {
      setError(String(err));
      setAsrStatus("error");
    } finally {
      setUploading(false);
    }
  }, [file]);

  // 轮询 ASR 状态
  const pollAsrStatus = useCallback(async (id: string) => {
    const maxAttempts = 60; // 最多等待60次 * 2秒 = 2分钟
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      setProgress(Math.min(10 + attempts * 1.5, 90));

      try {
        const res = await fetch(`/api/asr/status?taskId=${id}`);
        const data = await res.json();

        if (data.success) {
          if (data.status === "done") {
            clearInterval(interval);
            setOriginalText(data.text);
            setRewrittenText("");
            setAsrStatus("done");
            setProgress(100);
          } else if (data.status === "processing") {
            // 继续轮询
          }
        } else {
          clearInterval(interval);
          throw new Error(data.error || "查询失败");
        }
      } catch (err) {
        clearInterval(interval);
        setError(String(err));
        setAsrStatus("error");
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError("识别超时，请重试");
        setAsrStatus("error");
      }
    }, 2000);
  }, []);

  // 改写文案
  const handleRewrite = useCallback(async () => {
    if (!originalText.trim()) return;

    setRewriting(true);
    setError(null);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "改写失败");
      }

      setRewrittenText(data.rewritten_text);
    } catch (err) {
      setError(String(err));
    } finally {
      setRewriting(false);
    }
  }, [originalText]);

  // 复制文案
  const handleCopy = useCallback(() => {
    if (rewrittenText) {
      navigator.clipboard.writeText(rewrittenText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [rewrittenText]);

  // 重置
  const handleReset = useCallback(() => {
    setFile(null);
    setOriginalText("");
    setRewrittenText("");
    setAsrStatus("idle");
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header 
        title="文案提取" 
        subtitle="视频转文字一键洗稿改写"
        gradient="from-green-600 to-emerald-600"
      />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* 左侧：上传和原始文案 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="h-5 w-5" />
                  上传文件
                </CardTitle>
                <CardDescription className="text-white/50">支持 mp3/wav/m4a/mp4/webm，最大 100MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 文件上传区 */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    file ? "border-green-500/50 bg-green-500/5" : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading || asrStatus === "processing"}
                  />
                  {file ? (
                    <div className="space-y-2">
                      <FileAudio className="h-12 w-12 mx-auto text-green-400" />
                      <p className="font-medium text-white">{file.name}</p>
                      <p className="text-sm text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button variant="outline" size="sm" onClick={handleReset} className="border-white/20 text-white hover:bg-white/10">
                        重新选择
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-white/40" />
                        <p className="text-white/60">点击或拖拽文件到此处上传</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* 上传/识别按钮 */}
                {file && asrStatus === "idle" && (
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0" onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <FileAudio className="h-4 w-4 mr-2" />
                        上传并开始识别
                      </>
                    )}
                  </Button>
                )}

                {/* 识别进度 */}
                {(asrStatus === "uploading" || asrStatus === "processing") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white/70">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {asrStatus === "uploading" ? "上传中..." : "识别中..."}
                      </span>
                      <span className="text-white/70">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                )}

                {/* 识别结果 */}
                {asrStatus === "done" && (
                  <div className="space-y-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      识别完成
                    </Badge>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      重新上传
                    </Button>
                  </div>
                )}

                {/* 错误提示 */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* 原始文案 */}
                {originalText && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">原始文案</label>
                    <Textarea
                      value={originalText}
                      onChange={(e) => setOriginalText(e.target.value)}
                      placeholder="识别结果将显示在这里，您也可以手动输入或编辑文案..."
                      rows={8}
                      className="resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40">{originalText.length} 字</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 右侧：改写结果 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <RefreshCw className="h-5 w-5" />
                  改写结果
                </CardTitle>
                <CardDescription className="text-white/50">AI 智能改写，保持原意更加生动</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 改写按钮 */}
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0"
                  onClick={handleRewrite}
                  disabled={!originalText.trim() || rewriting}
                >
                  {rewriting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      改写中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      一键改写
                    </>
                  )}
                </Button>

                {/* 改写结果 */}
                {rewrittenText ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">改写后文案</label>
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="text-white/60 hover:text-white">
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={rewrittenText}
                      onChange={(e) => setRewrittenText(e.target.value)}
                      placeholder="改写结果将显示在这里..."
                      rows={12}
                      className="resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40">{rewrittenText.length} 字</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-white/40 border-2 border-dashed border-white/10 rounded-xl">
                    <RefreshCw className="h-12 w-12 mb-4" />
                    <p>上传文件并识别后，点击&quot;一键改写&quot;按钮</p>
                    <p className="text-sm">AI 将为您生成更加生动自然的文案</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
