# KFC Crazy Thursday API - Design Spec

## [S1] Problem
创建一个恶搞LLM API站点，无论用户输入什么内容，都只输出KFC疯狂星期四文案。需要支持OpenAI兼容协议，可部署为纯静态站点。

## [S2] Solution Overview
使用Cloudflare Pages + Edge Functions部署，提供OpenAI兼容的API接口。预置KFC文案库，支持流式SSE响应，模拟真实LLM体验。

## [S3] Architecture

```
kfcapi/
├── public/
│   └── index.html          # 说明页面
├── functions/
│   └── api/
│       └── v1/
│           ├── models.js       # 模型列表
│           └── chat/
│               └── completions.js  # Chat Completions API
├── src/
│   ├── kfc-copy.js         # KFC文案库
│   └── sse.js              # SSE流式响应工具
├── _headers                # CORS配置
└── package.json
```

## [S4] API Specification

### Endpoints

1. `GET /v1/models` - 返回可用模型列表
2. `POST /v1/chat/completions` - Chat Completions API

### Request Format

```json
POST /v1/chat/completions
{
  "model": "kfc-crazy-thursday",
  "messages": [
    {"role": "user", "content": "任何内容"}
  ],
  "stream": true,
  "stream_options": {"include_usage": true}
}
```

### Response Format (Streaming SSE)

```
data: {"id":"kfc-xxx","object":"chat.completion.chunk","model":"kfc-crazy-thursday","choices":[{"index":0,"delta":{"role":"assistant","content":"今天是疯狂星期四"},"finish_reason":null}]}

data: {"id":"kfc-xxx","object":"chat.completion.chunk","model":"kfc-crazy-thursday","choices":[{"index":0,"delta":{"content":"，谁请我吃KFC"},"finish_reason":null}]}

data: {"id":"kfc-xxx","object":"chat.completion.chunk","model":"kfc-crazy-thursday","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Response Format (Non-streaming)

```json
{
  "id": "kfc-xxx",
  "object": "chat.completion",
  "model": "kfc-crazy-thursday",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "完整KFC文案"},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 10, "completion_tokens": 50, "total_tokens": 60}
}
```

## [S5] KFC Copy Library

- 预置50+条疯狂星期四文案
- 混合风格：搞笑、感人、励志、悬疑、反转
- 支持根据prompt长度调整文案长度
- 每次请求随机选取，避免重复

## [S6] SSE Implementation

- 实现OpenAI兼容的SSE流式格式
- 模拟token-by-token输出，随机延迟(10-50ms)营造真实感
- 支持 `stream: true/false` 参数
- 处理 `stream_options.include_usage` 返回token统计

## [S7] CORS Configuration

`_headers` 文件配置：
```
/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

## [S8] Frontend Page

简单说明页面，包含：
- 项目介绍和使用说明
- API Base URL配置
- 可用模型列表
- 一键复制功能
- 示例请求代码

## [S9] Deployment

1. 推送到GitHub仓库
2. 在Cloudflare Pages连接仓库
3. 构建命令：留空
4. 输出目录：`public`
5. Functions自动部署到 `/functions` 目录

## [S10] Usage

1. 访问 `https://your-site.pages.dev` 查看说明
2. 将OpenAI客户端API Base URL设置为 `https://your-site.pages.dev/v1`
3. 无需API Key（或任意字符串）
4. 发送任何消息，收到KFC疯狂星期四文案
