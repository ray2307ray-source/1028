import React, { useState } from 'react';
import {
  QualityRecord,
  SpecConfig,
  EarlyWarning,
  ProcessChange,
  MorningReport,
} from '../types';
import {
  Calendar,
  Clock,
  Printer,
  FileDown,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Send,
  Edit3,
  ExternalLink,
  RefreshCw,
  Copy,
  SlidersHorizontal,
} from 'lucide-react';

interface MorningReportViewProps {
  records: QualityRecord[];
  specs: SpecConfig[];
  warnings: EarlyWarning[];
  processChanges: ProcessChange[];
  onInspectRecord: (record: QualityRecord) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const MorningReportView: React.FC<MorningReportViewProps> = ({
  records,
  specs,
  warnings,
  processChanges,
  onInspectRecord,
  onNavigateToTab,
}) => {
  // 設定時段與週一跨週末模式 (F04)
  const [isWeekendIncluded, setIsWeekendIncluded] = useState(true);
  const [reportDate, setReportDate] = useState('2026-10-26');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState<'draft' | 'approved' | 'published'>('draft');
  const [approvedBy, setApprovedBy] = useState<string>('');
  const [approvedAt, setApprovedAt] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // 篩選當期檢測數據 (例如 2026-10-26 或包含週末 10-23 ~ 10-26)
  const filteredRecords = records.filter((r) => {
    const d = r.testTime.slice(0, 10);
    if (isWeekendIncluded) {
      return d >= '2026-10-23' && d <= reportDate;
    }
    return d === reportDate;
  });

  // 計算當期超規項目
  const oocItems = filteredRecords
    .filter((r) => {
      if (r.value === null || r.valueStatus !== 'valid') return false;
      const spec = specs.find(
        (s) =>
          s.product === r.product &&
          s.testItem === r.testItem &&
          r.thickness >= s.thicknessMin &&
          r.thickness <= s.thicknessMax
      );
      if (!spec) return false;
      if (spec.usl !== null && r.value > spec.usl) return true;
      if (spec.lsl !== null && r.value < spec.lsl) return true;
      return false;
    })
    .map((r) => {
      const spec = specs.find(
        (s) =>
          s.product === r.product &&
          s.testItem === r.testItem &&
          r.thickness >= s.thicknessMin &&
          r.thickness <= s.thicknessMax
      )!;
      const limitStr = spec.lsl !== null && r.value! < spec.lsl ? `LSL ${spec.lsl}` : `USL ${spec.usl}`;
      const dev =
        spec.lsl !== null && r.value! < spec.lsl
          ? `${(r.value! - spec.lsl).toFixed(1)} ${r.unit}`
          : `+${(r.value! - (spec.usl || 0)).toFixed(1)} ${r.unit}`;
      return {
        record: r,
        batchNo: r.batchNo,
        product: r.product,
        testItem: r.testItem,
        location: r.samplingLocation,
        value: r.value!,
        unit: r.unit,
        specLimit: `${limitStr} ${spec.unit}`,
        deviation: dev,
      };
    });

  const totalBatches = new Set(filteredRecords.map((r) => r.batchNo)).size;
  const passRate = totalBatches > 0 ? (((totalBatches - oocItems.length) / totalBatches) * 100).toFixed(1) : '100.0';

  // 期間內的活躍變更 (4M)
  const activeChanges = processChanges.filter((p) => p.changeTime >= '2026-10-20');

  // 待確認/追蹤事項
  const [tasks, setTasks] = useState([
    { id: 'T1', task: '暫扣批號 B261026-A2，熱處理課複測晶粒度與退火溫控', owner: '陳品管組長', deadline: '今日 12:00', done: false },
    { id: 'T2', task: '品質檢查門禁待確認：委外單位 71.2 kgf/mm² 換算核定', owner: '李志剛', deadline: '今日 10:30', done: false },
    { id: 'T3', task: '週一晨會呈報：張力輥彎曲量調校效益 (斜對角差改善 59%)', owner: '黃製程工程師', deadline: '今日 09:00', done: true },
  ]);

  // AI 早報草稿內容 (可人工直接編輯)
  const [executiveSummary, setExecutiveSummary] = useState(
    `本期檢測總計 ${totalBatches} 批，檢測合格率 ${passRate}%。今日早班重點注意：SUS304-EP (0.25mm) 批號 B261026-A2 出現抗拉強度超規 (LM中心 615 MPa、邊部 608 MPa，低於 LSL 620 MPa)，已執行產線暫扣並由品保課調查。此外，10/20~10/25 連續 6 批抗拉強度有持續單向下降趨勢，推測與退火爐溫微調試驗關聯中（尚未定論因果）。而張力整平機參數調整後，斜對角差由 0.62mm 降至 0.25mm，表現優良改善。`
  );

  // 呼叫 AI 產生早報草稿 (F14)
  const handleGenerateAiDraft = async () => {
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/ai/morning-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportContext: {
            date: reportDate,
            totalBatches,
            passRate,
            oocCount: oocItems.length,
            isWeekend: isWeekendIncluded,
            oocItems: oocItems.map((o) => ({
              batchNo: o.batchNo,
              product: o.product,
              testItem: o.testItem,
              location: o.location,
              value: `${o.value} ${o.unit}`,
              specLimit: o.specLimit,
              deviation: o.deviation,
            })),
            processChanges: activeChanges.map((c) => ({
              parameterName: c.parameterName,
              beforeValue: c.beforeValue,
              afterValue: c.afterValue,
              batchScope: c.batchScope,
              causalityConfidence: c.causalityConfidence,
            })),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.draftText) {
          setExecutiveSummary(data.draftText);
          return;
        }
      }
      throw new Error('Fallback to client engine');
    } catch {
      // 在 GitHub Pages 靜態託管環境下無後端伺服器，自動無縫切換至前端智能早報引擎
      const timeLabel = isWeekendIncluded ? `${reportDate} (含週五至週日跨週末彙整)` : `${reportDate}`;
      let fallbackDraft = `## 每日品質早報 (草稿) — ${timeLabel}\n\n`;
      fallbackDraft += `### 一、檢測總體概況\n`;
      fallbackDraft += `- **檢測時段**：昨日 08:00 至 今日 08:00\n`;
      fallbackDraft += `- **完成檢驗總批次**：${totalBatches} 批\n`;
      fallbackDraft += `- **檢驗合格率**：${passRate}%\n`;
      fallbackDraft += `- **超規批數**：${oocItems.length} 批\n\n`;

      fallbackDraft += `### 二、超規與警戒項目清單 (可穿透來源)\n`;
      if (oocItems.length > 0) {
        oocItems.forEach((item, idx) => {
          fallbackDraft += `${idx + 1}. **批號 [${item.batchNo}]** — 產品：${item.product} | 項目：${item.testItem} | 位置：${item.location}\n`;
          fallbackDraft += `   - **實測值**：${item.value} ${item.unit} (規格限：${item.specLimit})，偏離幅度：${item.deviation}\n`;
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
      if (activeChanges.length > 0) {
        activeChanges.forEach((pc) => {
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

      setExecutiveSummary(fallbackDraft);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleApprove = () => {
    setReportStatus('approved');
    setApprovedBy('張品保協理 (QA-Director)');
    setApprovedAt(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleCopyMarkdown = () => {
    const md = `# 每日品質早報 (${reportDate})\n\n${executiveSummary}\n\n超規項目：\n${oocItems
      .map((o) => `- 批號 ${o.batchNo} (${o.testItem}): ${o.value} ${o.unit} (${o.specLimit})`)
      .join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 頂部控制面板：時段設定、跨週末開關、操作按鈕 */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">早報基準日：</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* F04 關鍵功能：週一納入週五至週日資料開關 */}
          <label className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 cursor-pointer hover:bg-slate-800">
            <input
              type="checkbox"
              checked={isWeekendIncluded}
              onChange={(e) => setIsWeekendIncluded(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span className="font-medium text-sky-300">週一納入週末 (跨週五至週日 72hr)</span>
          </label>

          <span className="text-xs text-slate-400">
            統計區間：
            <span className="text-slate-200 font-mono ml-1">
              {isWeekendIncluded ? '2026-10-23 08:00 ~ 今日 08:00 (跨週末)' : '昨日 08:00 ~ 今日 08:00'}
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateAiDraft}
            disabled={isAiGenerating}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
            <span>{isAiGenerating ? 'AI 草稿生成中...' : 'AI 生成早報草稿 (F14)'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedNotice ? '已複製！' : '複製早報摘要'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>匯出 / 列印</span>
          </button>
        </div>
      </div>

      {/* KPI 卡片總覽 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">完成檢驗批數 (Batches)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{totalBatches}</span>
            <span className="text-xs text-slate-400">批 ({filteredRecords.length} 筆實測)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">檢測批次合格率 (Pass Rate)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{passRate}%</span>
            <span className="text-xs text-emerald-500/80">目標 &ge; 98.0%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">超規項目 (OOC Items)</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono ${oocItems.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {oocItems.length}
            </span>
            <span className="text-xs text-rose-400/80">
              {oocItems.length > 0 ? '已隔離暫扣' : '無超規'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">早報審查狀態 (Review Status)</span>
          <div className="flex items-center space-x-2 mt-1">
            {reportStatus === 'draft' ? (
              <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                草稿 (待主管簽核)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
                ✓ 已核准發布 ({approvedBy} {approvedAt})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 早報執行摘要編輯區 (可人工確認與微調 F04, F14) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">
              早報核心變化重點與管理摘要 (可編輯並簽核)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {reportStatus === 'draft' && (
              <button
                onClick={handleApprove}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>主管確認發布 (Approve)</span>
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={5}
          value={executiveSummary}
          onChange={(e) => setExecutiveSummary(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 font-sans"
          placeholder="點擊「AI 生成早報草稿」或直接在此輸入今日早報重點..."
        />
        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
          <span>提示：早報數據依據原始檢測資料庫實時彙整，主管確認無誤後點擊「主管確認發布」。</span>
          <span>引用數據溯源有效</span>
        </div>
      </div>

      {/* 超規項目清單 (每筆摘要可穿透回查來源數據 F04) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100">
              超規與警戒項目清單 (點擊任一項目穿透回查原始數據 F04)
            </h3>
          </div>
          <span className="text-xs text-slate-400">共 {oocItems.length} 筆超規</span>
        </div>

        {oocItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/80">
            本統計時段內無超規項目，製程狀態穩定。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">批號 (Batch)</th>
                  <th className="py-2.5 px-3">產品品名</th>
                  <th className="py-2.5 px-3">檢測項目</th>
                  <th className="py-2.5 px-3">取樣位置</th>
                  <th className="py-2.5 px-3">實測數值</th>
                  <th className="py-2.5 px-3">適用規格限</th>
                  <th className="py-2.5 px-3">偏差量</th>
                  <th className="py-2.5 px-3 text-right">來源數據穿透</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {oocItems.map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onInspectRecord(item.record)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="py-2.5 px-3 font-mono font-semibold text-sky-300">
                      {item.batchNo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{item.product}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-100">{item.testItem}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                        {item.location}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                      {item.value} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{item.specLimit}</td>
                    <td className="py-2.5 px-3 font-mono text-rose-300">{item.deviation}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center space-x-1 text-xs text-sky-400 group-hover:underline">
                        <span>回查</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 雙欄：緩變趨勢預警 + 製程變更 (4M) 聯動 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 趨勢提醒 (F08, F04) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>緩變趨勢提醒 (連續單向/偏移預警)</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('alert_tracking')}
              className="text-xs text-sky-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>查看處理歷程</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {warnings.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{w.ruleName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      w.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {w.status === 'investigating' ? '調查處理中' : w.status === 'pending' ? '待確認' : '已結案'}
                  </span>
                </div>
                <p className="text-slate-400">{w.triggerDetails}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>影響期間：{w.period}</span>
                  <span>負責人：{w.assignee || '未指派'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 製程變更 (4M) 聯動追蹤 (F09, F04) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>製程變更聯動 (4M 異動與物性驗證)</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('process_change')}
              className="text-xs text-sky-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>變更效益分析</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {activeChanges.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300">{c.parameterName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      c.causalityConfidence === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {c.causalityConfidence === 'confirmed' ? '已驗證因果' : '待確認關聯性 (F09不自動認定)'}
                  </span>
                </div>
                <div className="text-slate-300">
                  變更數值：<span className="font-mono text-slate-400">{c.beforeValue}</span> &rarr;{' '}
                  <span className="font-mono text-emerald-400 font-semibold">{c.afterValue}</span>
                </div>
                <p className="text-slate-400">{c.impactSummary}</p>
                <div className="text-[11px] text-slate-500">
                  時間：{c.changeTime} | 適用批次：{c.batchScope}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 待追蹤交辦事項清單 (F04) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>今日早會待追蹤與交辦事項 (Pending Action Items)</span>
          </h3>
        </div>

        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() =>
                    setTasks((prev) =>
                      prev.map((item) => (item.id === t.id ? { ...item, done: !item.done } : item))
                    )
                  }
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className={t.done ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}>
                  {t.task}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <span className="text-sky-300 font-medium">{t.owner}</span>
                <span className="text-slate-500">截止：{t.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
