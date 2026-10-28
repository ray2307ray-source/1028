import React from 'react';
import { EfficacyStats } from '../types';
import {
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Printer,
} from 'lucide-react';

interface EfficacyDashboardViewProps {
  stats: EfficacyStats;
}

export const EfficacyDashboardView: React.FC<EfficacyDashboardViewProps> = ({ stats }) => {
  const laborSavedPct = (
    ((stats.laborHoursBeforeMin - stats.laborHoursAfterMin) / stats.laborHoursBeforeMin) *
    100
  ).toFixed(1);

  const errorReductionPct = (
    ((stats.dataCorrectionsBeforePerMonth - stats.dataCorrectionsAfterPerMonth) /
      stats.dataCorrectionsBeforePerMonth) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* 標題與量化回報導言 */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>系統導入前後成效量化指標與投資回報看板 (F16 Efficacy ROI)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            提供試辦前後量化成效對比，證明工時縮減、資料品質提升與提早預警價值，作為硬體擴充之決策佐證。
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center space-x-1.5 self-start md:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>匯出成效成果報告 (PDF)</span>
        </button>
      </div>

      {/* 6 大關鍵量化對比卡片 (Before vs After) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 指標 1：早報彙整工時 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">每日早報彙整工時</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              節省 {laborSavedPct}%
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <div className="text-slate-400 text-xs line-through">
              {stats.laborHoursBeforeMin} 分鐘/天
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {stats.laborHoursAfterMin} 分鐘/天
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            自動彙整檢測資料與 AI 早報草稿輔助，工程師擺脫手動 Excel 整理與剪貼。
          </p>
        </div>

        {/* 指標 2：資料錯誤與修正次數 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">每月資料瑕疵修正次數</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              減少 {errorReductionPct}%
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <div className="text-slate-400 text-xs line-through">
              {stats.dataCorrectionsBeforePerMonth} 次/月
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {stats.dataCorrectionsAfterPerMonth} 次/月
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            F03 資料品質門禁嚴格把關單位與格式，區分「未測」與「0」，杜絕漏填。
          </p>
        </div>

        {/* 指標 3：早報準時發布率 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">品質早報準時發布率</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              提升 +30%
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <div className="text-slate-400 text-xs">{stats.reportOnTimeRateBefore}%</div>
            <ArrowRight className="w-4 h-4 text-sky-400" />
            <div className="text-2xl font-bold font-mono text-sky-400">
              {stats.reportOnTimeRateAfter}%
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            早班晨會前（08:30）準時產出早報，並支援週一跨週末 72hr 自動彙總。
          </p>
        </div>

        {/* 指標 4：預警確認與處置結案率 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">預警確認與處置結案率</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              提升 +49%
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <div className="text-slate-400 text-xs">{stats.alertConfirmRateBefore}%</div>
            <ArrowRight className="w-4 h-4 text-indigo-400" />
            <div className="text-2xl font-bold font-mono text-indigo-400">
              {stats.alertConfirmRateAfter}%
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            F10 CAPA 閉環追蹤指派專人，不再發生警報無人確認或推諉漏管。
          </p>
        </div>

        {/* 指標 5：預警提前發現時間 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">預警提前發現時間 (Lead Time)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              黃金處置期
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              平均提早 {stats.leadTimeAdvanceBatches}
            </span>
            <span className="text-xs text-slate-400">批次</span>
          </div>
          <p className="text-[11px] text-slate-500">
            在數值仍處於合格規格內時，及早捕捉連續下降趨勢，避免整卷報廢。
          </p>
        </div>

        {/* 指標 6：系統誤報率 */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">預警系統誤報率 (False Alarm)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              優於同業 &lt; 5%
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.falsePositiveRate}%
            </span>
            <span className="text-xs text-slate-400">低干擾</span>
          </div>
          <p className="text-[11px] text-slate-500">
            結合 F07 判讀極性（斜對角差下降為改善不誤報）與去重機制，杜絕警報疲勞。
          </p>
        </div>
      </div>

      {/* 試辦總結摘要報告卡片 */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>試辦成果報告與擴充升級評估摘要 (Evaluation Summary)</span>
        </h4>
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            1. <strong>效益證明</strong>：導入本系統後，品管每日早報整理工時自 90 分鐘銳減至 12 分鐘，單一廠區每年節省約 474 人時工時成本；資料漏測與單位誤填錯誤率下降 92.8%。
          </p>
          <p>
            2. <strong>品質防損</strong>：得益於 F08 緩變趨勢預警與 F09 製程變更聯動，提前 3.6 批攔截退火晶粒粗化隱患，成功避免單次估計逾新台幣 120 萬之批量報廢損失。
          </p>
          <p>
            3. <strong>建議後續擴充方向</strong>：試辦數據表明成效顯著，建議擴充納入產線線上自動厚度測厚儀 (Online Gauge) 實時串接，並擴充延伸至第二、第三生產廠區。
          </p>
        </div>
      </div>
    </div>
  );
};

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
