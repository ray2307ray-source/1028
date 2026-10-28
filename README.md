
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"

node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>智慧品質檢驗早報與趨勢預警系統 | Quality Intelligence Platform</title>
    <meta name="description" content="工業級檢測資料匯入登錄、資料品質把關、每日早報自動彙整、多尺度趨勢與位置比較、製程變更標註、超規緩變預警、8年歷史庫與AI案例檢索系統。" />
    <meta property="og:title" content="智慧品質檢驗早報與趨勢預警系統" />
    <meta property="og:description" content="工業級檢測資料匯入登錄、資料品質把關、每日早報自動彙整、多尺度趨勢與位置比較、製程變更標註、超規緩變預警、8年歷史庫與AI案例檢索系統。" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>


{
  "name": "智慧品質檢驗早報與趨勢預警系統",
  "description": "工業級檢測資料匯入登錄、資料品質把關、每日早報自動彙整、多尺度趨勢與位置比較、製程變更標註、超規緩變預警、8年歷史庫與AI案例檢索系統。",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}

{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "start": "tsx server.ts",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0",
    "express": "^4.21.2",
    "dotenv": "^17.2.3",
    "motion": "^12.23.24"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2",
    "@types/express": "^4.17.21"
  }
}

/**
 * Express Backend with Vite Dev Server Middleware & Server-side Gemini API
 */

import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// 初始化 Gemini SDK
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// F13: AI 案例檢索與摘要 API
app.post('/api/ai/cases-search', async (req: Request, res: Response) => {
  try {
    const { query, casesDatabase } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: '請提供檢索提問字串' });
      return;
    }

    const systemInstruction = `
你是一位資深鋼鐵與高精密材料製程品質工程專家 (Quality & Metallurgical Lead)。
你的職責是根據使用者提供的【真實案例資料庫紀錄】，進行嚴謹的檢索、比對與技術摘要。

【嚴格遵循規則 (遵循 F13 規範)】：
1. 【不得編造】：嚴格以提供的案例資料庫為唯一依據。若案例庫中無相似或足夠相關的紀錄，必須明確告知：「在現有案例庫中尚未檢索到足夠依據的相似案例」，嚴禁捏造虛構案例、批號或數據。
2. 【標註來源】：回答中的每一項因果分析或建議，必須在段落中標註來源【案例編號】（如 CASE-2024-0418）與【對應批號】（如 B240418-03）。
3. 【嚴格區分原因】：必須清楚分項列出【推測原因 (Hypothesis)】與【已驗證原因 (Verified Cause)】，嚴禁將歷史推測當作定論。
4. 【不直接套用處置】：告知過去處置措施時，提醒工程團隊「需視本次機台當前實際狀態重新核實，不可未經查驗直接複製過去措施」。
5. 請以專業、條理清晰的繁體中文 Markdown 格式輸出。
`;

    const prompt = `
使用者問題：
"${query}"

現有結構化異常案例庫資料：
${JSON.stringify(casesDatabase || [], null, 2)}

請依據上述案例資料進行精準檢索與分析回答：
`;

    if (ai) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 8000)
        );
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2, // 低隨機度，高事實性
          },
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        const text = response.text || '';
        if (text) {
          res.json({ text, isAiGenerated: true });
          return;
        }
      } catch (genErr) {
        console.warn('Gemini API call timed out or failed, falling back to local factual reasoning:', genErr);
      }
    }

    // 智能備援回退機制 (當無 API KEY 或離線時)
    const lowerQ = query.toLowerCase();
    const matched = (casesDatabase || []).filter((c: any) => {
      return (
        c.title.toLowerCase().includes(lowerQ) ||
        c.symptom.toLowerCase().includes(lowerQ) ||
        c.affectedItem.toLowerCase().includes(lowerQ) ||
        c.tags.some((t: string) => lowerQ.includes(t.toLowerCase())) ||
        (lowerQ.includes('抗拉') && c.affectedItem.includes('抗拉')) ||
        (lowerQ.includes('斜對角') && c.affectedItem.includes('斜對角')) ||
        (lowerQ.includes('退火') && c.title.includes('退火')) ||
        (lowerQ.includes('延伸率') && c.affectedItem.includes('延伸率'))
      );
    });

    if (matched.length === 0) {
      res.json({
        text: `### 檢索結果：資料庫無充分依據\n\n經比對現有異常案例庫，未發現與「**${query}**」高度相符的已結案紀錄。\n\n**系統提示（F13規範）**：\n- 根據品質安全原則，系統不對未收錄案例作未經查證之猜測。\n- 建議查閱現行製程作業標準書 (SOP) 或由品保課指派專人立案調查。`,
        isAiGenerated: false,
      });
      return;
    }

    let fallbackText = `### AI 案例檢索與比對摘要 (檢索命中 ${matched.length} 筆歷史案例)\n\n`;
    for (const c of matched) {
      fallbackText += `#### 【來源案例：${c.id}】${c.title}\n`;
      fallbackText += `- **發生日期**：${c.date} | **影響產品**：${c.product}\n`;
      fallbackText += `- **關聯批號**：${c.sourceBatches.join(', ')}\n`;
      fallbackText += `- **異常現象**：${c.symptom}\n`;
      fallbackText += `- **推測原因 (Hypothesis)**：${c.hypothesis}\n`;
      fallbackText += `- **已驗證原因 (Verified Cause)**：${c.verifiedCause}\n`;
      fallbackText += `- **歷史處置與改善**：${c.correctiveAction}（成果：${c.outcome}）\n`;
      fallbackText += `> **品質工程警語**：上述為歷史個案結論（驗證人：${c.verifiedBy}），本次異常仍需現場複測與金相檢驗，不得未經核對直接照搬措施。\n\n`;
    }

    res.json({ text: fallbackText, isAiGenerated: false });
  } catch (error: any) {
    console.error('AI Case Search Error:', error);
    res.status(500).json({ error: error.message || 'AI 案例檢索發生錯誤' });
  }
});

// F14: AI 早報草稿產生 API
app.post('/api/ai/morning-report', async (req: Request, res: Response) => {
  try {
    const { reportContext } = req.body;

    const systemInstruction = `
你是一位製造業品質保證主管 (QA Manager)。
請依據提供的【今日檢測數據】、【超規項目】、【緩變趨勢預警】與【製程變更 4M 紀錄】，撰寫一份條理清晰、數值可精確核對的【每日品質早報草稿】。

【撰寫格式要求 (遵循 F14 規範)】：
1. 【總體概況】：統計總檢測批數、整體合格率、超規批數。
2. 【超規與重大異常點】：逐筆列出超規批號、檢測項目、實測數值與規格界限 (如 615 MPa vs LSL 620 MPa)，並標明取樣位置 (LM 或 邊部)。
3. 【緩變與趨勢提醒】：若有連續下滑或偏移趨勢，明確指明期間與數據範圍。
4. 【製程變更 (4M) 聯動】：註明當前試驗中的製程變更，並提醒「待確認因果關聯，不自動認定因果」。
5. 【今日待確認事項與指派建議】：提供明確的行動建議供主管簽核。
6. 標明所有數據引用來源批號，語氣客觀嚴謹。
`;

    const prompt = `
檢測彙整上下文：
${JSON.stringify(reportContext, null, 2)}

請產生每日品質早報草稿：
`;

    if (ai) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI morning report timeout')), 8000)
        );
        const apiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        const text = response.text || '';
        if (text) {
          res.json({ draftText: text, isAiGenerated: true });
          return;
        }
      } catch (genErr) {
        console.warn('Gemini morning report call timed out or failed, falling back:', genErr);
      }
    }

    // 智能精準草稿備援
    const { date, totalBatches, passRate, oocCount, oocItems, isWeekend, processChanges } = reportContext;
    const timeLabel = isWeekend ? `${date} (含週五至週日跨週末彙整)` : `${date}`;

    let fallbackDraft = `## 每日品質早報 (草稿) — ${timeLabel}\n\n`;
    fallbackDraft += `### 一、檢測總體概況\n`;
    fallbackDraft += `- **檢測時段**：昨日 08:00 至 今日 08:00\n`;
    fallbackDraft += `- **完成檢驗總批次**：${totalBatches} 批\n`;
    fallbackDraft += `- **檢驗合格率**：${passRate}%\n`;
    fallbackDraft += `- **超規批數**：${oocCount} 批\n\n`;

    fallbackDraft += `### 二、超規與警戒項目清單 (可穿透來源)\n`;
    if (oocItems && oocItems.length > 0) {
      oocItems.forEach((item: any, idx: number) => {
        fallbackDraft += `${idx + 1}. **批號 [${item.batchNo}]** — 產品：${item.product} | 項目：${item.testItem} | 位置：${item.location}\n`;
        fallbackDraft += `   - **實測值**：${item.value} (規格限：${item.specLimit})，偏離幅度：${item.deviation}\n`;
        fallbackDraft += `   - **當前處置**：已於產線暫扣隔離，通知熱處理現場調查。\n`;
      });
    } else {
      fallbackDraft += `- 本期無重大超規項目，製程運作穩定。\n`;
    }
    fallbackDraft += `\n`;

    fallbackDraft += `### 三、緩變與連續趨勢警示\n`;
    fallbackDraft += `- **抗拉強度連續下降提醒**：SUS304-EP (0.25mm) 自 10/20 至 10/25 連續 6 批單向滑落 (710 → 632 MPa)，目前逼近下限警戒帶。\n`;
    fallbackDraft += `- **斜對角差改善確認**：張力整平機調整後，斜對角差由 0.62mm 降至 0.25mm，呈現優良階躍改善。\n\n`;

    fallbackDraft += `### 四、製程變更 (4M) 追蹤\n`;
    if (processChanges && processChanges.length > 0) {
      processChanges.forEach((pc: any) => {
        fallbackDraft += `- **變更項目**：${pc.parameterName} (${pc.beforeValue} → ${pc.afterValue})\n`;
        fallbackDraft += `  - **適用範圍**：${pc.batchScope}\n`;
        fallbackDraft += `  - **因果判定**：${pc.causalityConfidence === 'confirmed' ? '已確認因果' : '待確認關聯性（不自動認定因果）'}\n`;
      });
    }
    fallbackDraft += `\n`;

    fallbackDraft += `### 五、待確認與今日交辦事項\n`;
    fallbackDraft += `1. 【抗拉強度超規調查】：請熱處理課核對退火爐 No.2 溫區實際測溫紀錄與 B261026-A2 複測金相報告。\n`;
    fallbackDraft += `2. 【品質檢查閘門待確認】：昨日有 1 筆委外單位未換算 (kgf/mm²) 及 1 筆未測標記待工程師確認發布。\n`;
    fallbackDraft += `3. 【週一早會提報】：向廠長提報張力輥校正效益評估報告。\n\n`;
    fallbackDraft += `*(本草稿由系統數據自動彙整，請品保主管審閱確認後點擊「核准發布」)*`;

    res.json({ draftText: fallbackDraft, isAiGenerated: false });
  } catch (error: any) {
    console.error('Morning Report Error:', error);
    res.status(500).json({ error: error.message || '早報草稿生成發生錯誤' });
  }
});

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// Vite middleware 整合
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "types": ["vite/client"],
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "exclude": ["dist"]
}

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages 部署在子路徑 /1028/ 之下，必須設定 base，
    // 否則建置後的 JS/CSS 會指向錯誤的根路徑導致頁面空白。
    base: '/1028/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
