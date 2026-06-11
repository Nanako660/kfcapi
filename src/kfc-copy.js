// 本地备用文案，fetch 失败时使用
const FALLBACK_COPIES = [
  "疯狂星期四，V我50。",
  "今天疯狂星期四，谁V我50？",
  "星期四到了，V我50吃KFC。",
  "疯狂星期四V我50谢谢。",
  "今天是疯狂星期四，V我50。",
  "V我50，今天疯狂星期四。",
  "疯狂星期四，求V50。",
  "星期四V我50，KFC走起。",
  "今天谁V我50？疯狂星期四。",
  "V50，疯狂星期四快乐。",
  "我生病了，医生说我需要吃KFC疯狂星期四才能好，谁V我50？",
  "如果世界末日来了，我最后的愿望是：让我吃完这顿KFC疯狂星期四再走。V我50，谢谢。",
  "世界上最遥远的距离不是生与死，而是我站在KFC门口，你却没V我50。",
  "成功=艰苦劳动+正确方法+少说空话+V我50吃KFC。",
  "薛定谔的猫：在你打开盒子之前，你不知道猫是死是活。但在星期四，你永远知道：KFC是好吃的。V我50。",
];

const FETCH_URLS = [
  'https://cdn.jsdelivr.net/gh/vikiboss/v50@main/static/v50.json',
  'https://cdn.jsdmirror.com/gh/vikiboss/v50@main/static/v50.json',
  'https://raw.githubusercontent.com/vikiboss/v50/refs/heads/main/static/v50.json',
];

// 思考内容模板：按深度分级
const THINKING_SHALLOW = [
  "嗯...让我想想...",
  "这个嘛...",
  "让我思考一下...",
  "我觉得...",
  "嗯，这个问题很有意思...",
  "我来分析一下...",
  "首先，",
  "根据我的理解，",
];

const THINKING_DEEP_TEMPLATES = [
  (copy) => `用户提出了一个深刻的问题，需要我仔细思考。从哲学角度来看，这涉及到存在主义的核心命题——人类的需求与欲望之间的张力。我们必须认真对待每一个星期四，因为时间是线性的，每一个疯狂星期四都是不可复现的。综合以上分析，我的结论是：${copy}`,
  (copy) => `让我系统性地思考这个问题。首先，从经济学角度：KFC疯狂星期四的定价策略是典型的价格歧视模型，通过时间维度的折扣创造消费者剩余。其次，从心理学角度：条件反射机制使人们将星期四与愉悦感强烈绑定。最终结论：${copy}`,
  (copy) => `这个问题触动了我内心深处的某些东西。我开始回忆第一次吃KFC疯狂星期四的场景——那种酥脆的口感，那种幸福的滋味。我思考了很久，翻阅了大量资料，询问了诸多专家，最终得出了一个令人信服的答案：${copy}`,
  (copy) => `<分析过程>\n步骤1：理解问题背景 → 用户发起对话，期待智能回应\n步骤2：检索相关知识 → 疯狂星期四、V我50、KFC优惠\n步骤3：生成候选答案 → 多个方向均已评估\n步骤4：选择最优方案 → 经过严格筛选\n</分析过程>\n\n最终输出：${copy}`,
];

// 全局文案缓存（存 Promise，防止并发重复 fetch）
let copiesPromise = null;

async function fetchCopies() {
  for (const url of FETCH_URLS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[sanders] 已从 ${url} 加载 ${data.length} 条知识源`);
        return data;
      }
    } catch (e) {
      console.warn(`[sanders] fetch 失败 (${url}):`, e.message);
    }
  }
  console.warn('[sanders] 所有源均失败，使用本地备用知识源');
  return FALLBACK_COPIES;
}

// 首次请求时触发 fetch，后续复用同一 Promise（适配 Workers 环境）
function initCopies() {
  if (!copiesPromise) {
    copiesPromise = fetchCopies();
  }
  return copiesPromise;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getRandomCopy() {
  const copies = await initCopies();
  return pickRandom(copies);
}

async function getRandomCopies(count) {
  const copies = await initCopies();
  const shuffled = [...copies].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// budget_tokens <= 0 : 不思考
// budget_tokens <= 1000 : 浅层思考（短前缀）
// budget_tokens > 1000  : 深度思考（长模板）
async function getThinkingContent(budgetTokens) {
  if (!budgetTokens || budgetTokens <= 0) return null;
  const copy = await getRandomCopy();
  if (budgetTokens <= 1000) {
    return pickRandom(THINKING_SHALLOW) + copy;
  }
  const template = pickRandom(THINKING_DEEP_TEMPLATES);
  return template(copy);
}

export { getRandomCopy, getRandomCopies, getThinkingContent, initCopies, FALLBACK_COPIES };
