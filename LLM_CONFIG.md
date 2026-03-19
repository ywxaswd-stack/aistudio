# LLM 配置说明

## 环境自动适配

本项目已实现 **环境感知的LLM适配器**，会自动根据环境选择合适的LLM服务：

### 🔹 沙箱/开发环境
- **自动使用**：内置LLM（豆包大模型）
- **无需配置**：开箱即用
- **适用场景**：本地开发、沙箱测试

### 🔹 生产环境
- **自动使用**：Google Gemini API
- **需要配置**：设置环境变量 `GEMINI_API_KEY`
- **适用场景**：线上部署、正式生产

---

## 配置方式

### 方式1：沙箱/开发环境（默认）
无需任何配置，代码会自动检测并使用内置LLM。

```bash
# 无需设置 GEMINI_API_KEY
# 代码会自动使用内置的豆包大模型
```

### 方式2：生产环境（使用Gemini）

#### 步骤1：获取Gemini API密钥
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录Google账号
3. 点击 "Get API Key"
4. 复制生成的API密钥

#### 步骤2：设置环境变量

**本地开发/测试：**
```bash
# .env.local 文件
GEMINI_API_KEY=你的API密钥
NODE_ENV=production
```

**生产部署：**
```bash
# 在部署平台设置环境变量
GEMINI_API_KEY=你的API密钥
NODE_ENV=production
```

---

## 环境判断逻辑

代码会按以下逻辑判断使用哪个LLM：

```typescript
// 当同时满足以下条件时，使用 Gemini API
const useGeminiAPI = !!process.env.GEMINI_API_KEY && 
                     process.env.NODE_ENV === 'production';
```

**判断规则：**
- ✅ 有 `GEMINI_API_KEY` 且 `NODE_ENV=production` → 使用Gemini
- ❌ 其他情况 → 使用内置LLM

---

## 功能对比

| 功能 | 内置LLM（沙箱） | Gemini API（生产） |
|------|----------------|-------------------|
| **需要API密钥** | ❌ 不需要 | ✅ 需要 |
| **需要外网访问** | ❌ 不需要 | ✅ 需要 |
| **支持流式输出** | ✅ 支持 | ❌ 暂不支持 |
| **支持多模态** | ✅ 支持 | ✅ 支持 |
| **模型** | doubao-seed-1-8-251228 | gemini-2.0-flash |
| **适用环境** | 开发/测试 | 生产环境 |

---

## 调试信息

代码会在控制台输出当前使用的LLM服务：

```
🏠 [Development/Sandbox] 使用内置LLM  # 沙箱环境
🚀 [Production] 使用 Google Gemini API  # 生产环境
```

---

## 切换LLM服务

### 临时切换（测试用）

如果你想在沙箱环境测试Gemini API：

```bash
# 设置环境变量
export GEMINI_API_KEY="你的密钥"
export NODE_ENV="production"

# 重启服务
coze dev
```

### 永久切换

修改 `src/lib/llm.ts` 中的判断逻辑：

```typescript
// 强制使用Gemini（不推荐，沙箱环境可能无法访问外网）
const useGeminiAPI = true;

// 强制使用内置LLM
const useGeminiAPI = false;
```

---

## 常见问题

### Q1: 沙箱环境能用Gemini吗？
**A:** 不能。沙箱环境有网络限制，无法访问外部API。代码会自动降级到内置LLM。

### Q2: 生产环境能用内置LLM吗？
**A:** 可以。只要不设置 `GEMINI_API_KEY`，代码就会使用内置LLM。但生产环境建议使用Gemini API，性能更稳定。

### Q3: 如何确认当前使用的是哪个LLM？
**A:** 查看控制台日志，会显示 `[Development/Sandbox]` 或 `[Production]` 标识。

### Q4: Gemini API 支持流式输出吗？
**A:** 当前实现暂不支持，会自动降级为非流式调用。如需流式输出，建议使用内置LLM。

---

## 技术实现

适配器位于 `src/lib/llm.ts`，提供统一的接口：

```typescript
// 非流式调用（推荐）
await callLLM(systemPrompt, userPrompt, customHeaders, options);

// 流式调用（仅沙箱环境）
await streamLLM(systemPrompt, userPrompt, customHeaders, onChunk, options);

// 构建 prompt
buildChatPrompt(systemPrompt, userPrompt);

// 获取 HeaderUtils（用于提取请求头）
import { HeaderUtils } from "@/lib/llm";
```

---

## 更新历史

- **2026-03-19**: 实现环境感知的LLM适配器
- **2026-03-19**: 添加 Gemini API 支持
- **2026-03-19**: 添加内置LLM支持（沙箱环境）
