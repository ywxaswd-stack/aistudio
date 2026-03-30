"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, User, Zap } from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  title: string;
  subtitle?: string;
  gradient?: string;
}

interface UserInfo {
  id: string;
  phone: string;
  balance: number;
}

export function Header({ title, subtitle, gradient = "from-purple-600 to-pink-600" }: HeaderProps) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setUserInfo(data.user);
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUserInfo(null);
      toast.success("已退出登录");
      router.push("/login");
    } catch (error) {
      toast.error("退出失败");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧：返回 + 标题 */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{title}</h1>
                {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
              </div>
            </div>
          </div>

          {/* 右侧：余额 + 充值 */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : userInfo ? (
              <>
                {/* 余额 */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">{userInfo.seconds}秒</span>
                </div>
                {/* 头像 */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                {/* 充值 */}
                <Button
                  size="sm"
                  onClick={() => router.push("/recharge")}
                  className={`bg-gradient-to-r ${gradient} hover:opacity-90 border-0`}
                >
                  充值
                </Button>
              </>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className={`bg-gradient-to-r ${gradient} hover:opacity-90 border-0`}
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
