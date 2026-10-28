import React, { useState, useMemo } from 'react';
import { QualityRecord, AnomalyCase } from '../types';
import {
  History,
  Search,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  Tag,
  CheckCircle2,
  HelpCircle,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';

interface HistoricalQueryViewProps {
  records: QualityRecord[];
  cases: AnomalyCase[];
  onInspectRecord: (record: QualityRecord) => void;
  onNavigateToAiSearch: () => void;
}

export const HistoricalQueryView: React.FC<HistoricalQueryViewProps> = ({
  records,
  cases,
  onInspectRecord,
  onNavigateToAiSearch,
}) => {
  const [subTab, setSubTab] = useState<'history' | 'cases'>('history');

  // 8年歷史資料查詢條件 (F11)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState('ALL');

  // 案例庫搜尋條件 (F12)
  const [caseKeyword, setCaseKeyword] = useState('');

  // 篩選歷史檢測資料 (F11)
  const filteredHistoryRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedProduct !== 'ALL' && r.product !== selectedProduct) return false;
      if (selectedItem !== 'ALL' && r.testItem !== selectedItem) return false;
      if (selectedYear !== 'ALL' && !r.testTime.startsWith(selectedYear)) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          r.batchNo.toLowerCase().includes(q) ||
          r.operator.toLowerCase().includes(q) ||
          r.method.toLowerCase().includes(q) ||
          (r.remarks && r.remarks.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [records, selectedProduct, selectedItem, selectedYear, searchTerm]);

  // 篩選案例庫 (F12)
  const filteredCases = useMemo(() => {
    if (!caseKeyword) return cases;
    const q = caseKeyword.toLowerCase();
    return cases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.symptom.toLowerCase().includes(q) ||
        c.verifiedCause.toLowerCase().includes(q) ||
        c.hypothesis.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [cases, caseKeyword]);

  return (
    <div className="space-y-6">
      {/* 標籤導覽 (8年歷史資料查詢 vs 異常案例資料庫) */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setSubTab('history')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 text-xs font-medium cursor-pointer transition ${
            subTab === 'history'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>跨 8 年檢測歷史檢索 (F11 含方法差異警示)</span>
        </button>

        <button
          onClick={() => setSubTab('cases')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 text-xs font-medium cursor-pointer transition ${
            subTab === 'cases'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>異常案例資料庫 (F12 推測 vs 已驗證原因)</span>
        </button>
      </div>

      {subTab === 'history' ? (
        <div className="space-y-5">
          {/* F11 檢索過濾器面板 */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Search className="w-4 h-4 text-sky-400" />
                  <span>歷史檢測紀錄查詢 (支援約 8 年紀錄逐批回溯)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  檢索 2018 ~ 2026 年歷史大數據。若歷史資料存在方法/設備換代，系統將自動跳出「不可直接比對」警告標籤。
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋批號、檢驗人員或關鍵字..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">歷史年份區間</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="ALL">全部年份 (2018 ~ 2026)</option>
                  <option value="2026">2026 年 (當前年度)</option>
                  <option value="2025">2025 年</option>
                  <option value="2024">2024 年</option>
                  <option value="2023">2023 年</option>
                  <option value="2022">2022 年 (設備升級過渡年)</option>
                  <option value="2020">2020 年 (歷史舊機台)</option>
                  <option value="2018">2018 年 (歷史存檔)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">產品品名</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">全部產品</option>
                  <option value="SUS304-EP 精密鋼帶">SUS304-EP 精密鋼帶</option>
                  <option value="PET-OPT 光學級薄膜">PET-OPT 光學級薄膜</option>
                  <option value="C1100-HV 導電高韌銅箔">C1100-HV 導電高韌銅箔</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">測試項目</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">全部測試項目</option>
                  <option value="抗拉強度 Tensile Strength">抗拉強度 Tensile Strength</option>
                  <option value="斜對角差 Diagonal Difference">斜對角差 Diagonal Difference</option>
                  <option value="延伸率 Elongation">延伸率 Elongation</option>
                  <option value="表面粗糙度 Ra">表面粗糙度 Ra</option>
                </select>
              </div>
            </div>
          </div>

          {/* 歷史結果列表 (包含 F11 方法差異警語標記) */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span>檢索結果：共 {filteredHistoryRecords.length} 筆歷史紀錄</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">檢測時間</th>
                    <th className="py-2.5 px-3">批號</th>
                    <th className="py-2.5 px-3">產品</th>
                    <th className="py-2.5 px-3">取樣位置</th>
                    <th className="py-2.5 px-3">測試項目</th>
                    <th className="py-2.5 px-3">實測值</th>
                    <th className="py-2.5 px-3">檢驗方法 (Method)</th>
                    <th className="py-2.5 px-3">品質/方法差異警示 (F11)</th>
                    <th className="py-2.5 px-3 text-right">穿透詳情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistoryRecords.map((r) => {
                    const hasMethodDiff = r.qualityFlags?.includes('METHOD_DIFF_2022');
                    return (
                      <tr
                        key={r.id}
                        onClick={() => onInspectRecord(r)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition ${
                          hasMethodDiff ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-400">{r.testTime}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-sky-300">
                          {r.batchNo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">{r.product}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {r.samplingLocation}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-100">{r.testItem}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                          {r.value !== null ? `${r.value} ${r.unit}` : '未測/缺'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{r.method}</td>
                        <td className="py-2.5 px-3">
                          {hasMethodDiff ? (
                            <span className="px-2.5 py-1 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center space-x-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>不可直接比對 (機台升級差異)</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">現行標準一致</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button className="text-xs text-sky-400 hover:underline">檢視</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* F12: 異常案例資料庫 (Anomaly Cases KB) */
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>異常案例知識庫 (F12: 嚴格區分推測原因 vs 已驗證原因)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                保存歷史異常現象、製程背景、處置措施與改善結果，杜絕將假說當定論。
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="搜尋案例標題、現象或關鍵字..."
                value={caseKeyword}
                onChange={(e) => setCaseKeyword(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 w-64"
              />
              <button
                onClick={onNavigateToAiSearch}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                切換至 AI 自然語言檢索
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                      {c.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{c.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{c.date}</span>
                    <span>•</span>
                    <span className="text-indigo-300">{c.product}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-400 font-medium">製程背景與影響項目：</span>{' '}
                  <span className="text-slate-200">{c.affectedItem}</span> | {c.processContext}
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
                  <span className="text-rose-400 font-semibold block mb-0.5">異常現象 (Symptom)：</span>
                  <p className="text-slate-200">{c.symptom}</p>
                </div>

                {/* 雙欄：推測原因 vs 已驗證原因 (F12 核心驗收重點) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                    <span className="text-amber-400 font-bold flex items-center space-x-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>推測原因 (Hypothesis / 未驗證假說)：</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{c.hypothesis}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold flex items-center space-x-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已確認原因 (Verified Root Cause / 實驗證實)：</span>
                    </span>
                    <p className="text-slate-200 leading-relaxed">{c.verifiedCause}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs space-y-1">
                  <div>
                    <span className="text-slate-400 font-semibold">處置方式 (Corrective Action)：</span>{' '}
                    <span className="text-slate-200">{c.correctiveAction}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">改善結果 (Outcome)：</span>{' '}
                    <span className="text-emerald-400 font-semibold">{c.outcome}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div>
                    驗證簽核專家：<span className="text-slate-300 font-medium">{c.verifiedBy}</span> | 關聯批號：
                    <span className="text-sky-300 font-mono">{c.sourceBatches.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
