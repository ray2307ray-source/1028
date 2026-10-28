import React, { useState } from 'react';
import { AnomalyCase } from '../types';
import {
  Sparkles,
  Send,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Search,
  BookOpen,
} from 'lucide-react';

interface AiAssistantViewProps {
  cases: AnomalyCase[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ cases }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(true);

  // 常見提問快捷按鈕
  const samplePrompts = [
    '過去抗拉強度低於規格時，有哪些已驗證的製程主因？',
    '斜對角差與邊部翹曲過大，過去張力整平機有哪些排查經驗？',
    '銅箔延伸率虛假偏低是否曾發生過試驗機夾爪打滑？',
    '是否發生過高溫高濕導致光學膜黃變的案例？（測試無依據情境）',
  ];

  const handleSearch = async (promptText: string) => {
    const q = promptText || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setResponseResult(null);

    try {
      const res = await fetch('/api/ai/cases-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          casesDatabase: cases,
        }),
      });

      if (!res.ok) {
        throw new Error('AI 檢索伺服器回應異常');
      }

      const data = await res.json();
      setResponseResult(data.text);
      setIsAiGenerated(data.isAiGenerated);
    } catch (err: any) {
      console.error(err);
      setResponseResult('檢索發生異常，請確認伺服器連線狀態。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題與 F13 規範說明卡片 */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              AI 異常案例智慧檢索與知識摘要助理 (F13)
            </h3>
            <p className="text-xs text-slate-400">
              支援自然語言查詢。嚴格依據收錄案例回答，明確標註案例與批號來源，絕不憑空編造。
            </p>
          </div>
        </div>

        {/* 系統規範警語 */}
        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">品質安全與防幻覺宣告 (F13 防護機制)：</span>
            <ul className="list-disc list-inside mt-1 text-slate-400 text-[11px] space-y-0.5">
              <li>若案例庫無足夠依據，系統將明確告知「無足夠依據」，絕不胡亂捏造。</li>
              <li>嚴格區分「推測原因 (Hypothesis)」與「已驗證原因 (Verified Cause)」。</li>
              <li>提醒工程人員不可將過去處置直接當成此次定論，需現場查核機台現狀。</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 查詢輸入框與快捷 Prompt */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="以自然語言提問，例如：抗拉強度連續下降且晶粒粗化時過去驗證過哪些原因？"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? '檢索比對中...' : '送出提問'}</span>
          </button>
        </div>

        {/* 快捷範例 */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5">或點選常見技術提問範本：</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(p);
                  handleSearch(p);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-[11px] border border-slate-700 transition cursor-pointer text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 回答展示區 */}
      {isLoading && (
        <div className="p-10 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">正在比對歷史異常案例資料庫與冶金因果模型...</p>
        </div>
      )}

      {responseResult && !isLoading && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-100">AI 技術比對分析報告</h4>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                isAiGenerated
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isAiGenerated ? 'Gemini 3.8 Flash 分析' : '本機案例庫結構化比對'}
            </span>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {responseResult}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>遵循 F13 規範：每筆建議需對照當前生產機台複核，不直接將歷史當作結論。</span>
            <span>比對案例庫包含 2018~2026 年完整紀錄</span>
          </div>
        </div>
      )}
    </div>
  );
};
