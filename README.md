# KFC Crazy Thursday API

模拟 OpenAI Chat Completions API 的恶搞服务，无论问什么，都回 KFC 疯狂星期四文案。

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
  -d '{"model":"kfc-crazy-thursday","messages":[{"role":"user","content":"你好"}]}'

# 流式对话
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"kfc-crazy-thursday","messages":[{"role":"user","content":"你好"}],"stream":true}'

# 带思考输出（thinking）
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"kfc-crazy-thursday","messages":[{"role":"user","content":"你好"}],"thinking":{"type":"enabled","budget_tokens":500}}'
```

## API

兼容 OpenAI Chat Completions API 格式。

### `GET /v1/models`

返回可用模型列表。

### `POST /v1/chat/completions`

| 参数 | 类型 | 说明 |
|---|---|---|
| `model` | string | 固定为 `kfc-crazy-thursday` |
| `messages` | array | 标准 messages 格式 |
| `stream` | boolean | 是否流式输出 |
| `stream_options.include_usage` | boolean | 流式模式下是否返回 usage |
| `thinking.type` | string | 设为 `"enabled"` 开启思考模式 |
| `thinking.budget_tokens` | number | 思考深度：≤1000 浅层，>1000 深度 |

### 对接 OpenAI 客户端

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="any",  # 不需要真实 key
)

resp = client.chat.completions.create(
    model="kfc-crazy-thursday",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
```

## 部署到 Cloudflare Pages

### 方式一：Wrangler CLI（推荐）

> **注意**：Cloudflare Pages 的 Dashboard 拖拽上传不支持 `functions/` 目录，部署 Functions 必须使用 Wrangler CLI。

**1. 登录**

```bash
npx wrangler login
```

**2. 创建 Pages 项目**

```bash
npx wrangler pages project create kfcapi
```

按提示输入项目名称和生产分支（如 `master`）。项目将部署到 `<PROJECT_NAME>.pages.dev`。

**3. 部署**

```bash
npx wrangler pages deploy public
```

Wrangler 会自动检测并上传 `functions/` 目录中的 Pages Functions。部署完成后即可通过 `https://<PROJECT_NAME>.pages.dev/v1/models` 访问 API。

**4. 后续部署**

```bash
npx wrangler pages deploy public --branch=master
```

### 方式二：Git 集成

1. 将项目推送到 GitHub / GitLab
2. 在 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → 创建 → Pages → 连接到 Git
3. 构建配置：
   - **构建命令**：留空（无需构建）
   - **构建输出目录**：`public`
4. 部署后自动关联分支，每次 push 自动部署

### CORS 配置

项目根目录的 `_headers` 文件已配置 CORS 头：

```
/v1/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
```

部署后自动生效。

### 查看日志

```bash
npx wrangler pages deployment tail
```

## 项目结构

```
├── functions/          # Cloudflare Pages Functions（文件路径即 URL 路由）
│   └── v1/
│       ├── models.js           # GET  /v1/models
│       └── chat/
│           └── completions.js  # POST /v1/chat/completions
├── src/                # 共享模块
│   ├── kfc-copy.js     # 文案拉取 & 思考内容生成
│   └── sse.js          # SSE 流式输出 & 打字节奏
├── public/             # 静态资源
│   └── index.html
├── server.js           # Node.js 独立运行入口
├── wrangler.toml       # Wrangler 配置
├── _headers            # Cloudflare Pages CORS 配置
└── package.json
```

### 文案来源

启动时从 [vikiboss/v50](https://github.com/vikiboss/v50) 仓库拉取（424+ 条真实网络文案），失败时自动 fallback 到本地备用文案。首次请求触发加载，后续复用缓存。

## 技术栈

- Node.js 原生 `http` 模块
- Cloudflare Pages Functions
- SSE (Server-Sent Events) 流式输出
- 令牌桶算法控制打字速度（40~100 tps 随机，模拟真实打字节奏）
