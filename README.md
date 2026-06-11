# Sanders Intelligence Labs API

Sanders-1 系列大语言模型 API，兼容 OpenAI Chat Completions 与 Anthropic API 格式。

## 快速开始

### 本地运行（Node.js）

```bash
node server.js
```

服务启动在 `http://localhost:3000`

### 本地运行（Wrangler Pages Functions）

```bash
npx wrangler pages dev public --port 8788
```

服务启动在 `http://localhost:8788`，模拟 Cloudflare Pages 运行环境。

### 测试

```bash
# 获取模型列表
curl http://localhost:3000/v1/models

# 非流式对话
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"sanders-1-pro","messages":[{"role":"user","content":"你好"}]}'

# 流式对话
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"sanders-1-pro","messages":[{"role":"user","content":"你好"}],"stream":true}'

# 思考模式
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"sanders-1-pro","messages":[{"role":"user","content":"你好"}],"thinking":{"type":"enabled","budget_tokens":2000}}'
```

## API

### 模型列表

| 模型 | 上下文 | 输出速度 | 思考模式 |
|---|---|---|---|
| `sanders-1-flash` | 128K | 80–100 tps | — |
| `sanders-1-pro` | 1M | 40–80 tps | ≤4000 tokens |

### `GET /v1/models`

返回可用模型列表。

### `POST /v1/chat/completions`

| 参数 | 类型 | 说明 |
|---|---|---|
| `model` | string | `sanders-1-flash` 或 `sanders-1-pro` |
| `messages` | array | 标准 messages 格式 |
| `stream` | boolean | 是否流式输出 |
| `stream_options.include_usage` | boolean | 流式模式下是否返回 usage |
| `thinking.type` | string | 设为 `"enabled"` 开启思考模式（仅 Pro） |
| `thinking.budget_tokens` | number | ≤1000 浅层思考，>1000 深度推理 |

### Python SDK

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="your-key",
)

resp = client.chat.completions.create(
    model="sanders-1-pro",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
```

## 部署到 Cloudflare Pages

### Wrangler CLI

```bash
# 登录
npx wrangler login

# 创建项目
npx wrangler pages project create sanders-api

# 部署
npx wrangler pages deploy public

# 后续更新
npx wrangler pages deploy public --branch=master
```

> Cloudflare Pages Dashboard 拖拽上传不支持 Functions 目录，必须使用 Wrangler CLI 部署。

### Git 集成

1. 推送项目到 GitHub
2. Cloudflare Dashboard → Workers & Pages → 创建 → Pages → 连接 Git
3. 构建设置：
   - **构建命令**：留空（不要填写）
   - **构建输出目录**：`public`
4. 保存后自动触发首次部署，之后每次 push 自动部署

> **不要**在 Dashboard 中设置自定义 Deploy Command。Pages 会自动读取 `wrangler.toml` 中的 `pages_build_output_dir`。

### CORS

`_headers` 文件已配置：

```
/v1/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

## 项目结构

```
├── functions/            # Cloudflare Pages Functions
│   └── v1/
│       ├── models.js           # GET  /v1/models
│       └── chat/
│           └── completions.js  # POST /v1/chat/completions
├── src/                  # 共享模块
│   ├── kfc-copy.js       # 知识源拉取 & 思考内容生成
│   └── sse.js            # SSE 流式输出 & 打字节奏控制
├── public/               # 静态资源
│   └── index.html
├── server.js             # Node.js 本地运行入口
├── wrangler.toml         # Wrangler 配置
├── _headers              # CORS 配置
└── package.json
```

## 技术栈

- Node.js 原生 `http` 模块
- Cloudflare Pages Functions
- SSE (Server-Sent Events) 流式输出
- 令牌桶算法控制输出速率（40–100 tps）
