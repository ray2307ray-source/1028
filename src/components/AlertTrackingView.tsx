import React, { useState } from 'react';
import { EarlyWarning, WarningStatus } from '../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface AlertTrackingViewProps {
  warnings: EarlyWarning[];
  onUpdateWarning: (updated: EarlyWarning) => void;
}

export const AlertTrackingView: React.FC<AlertTrackingViewProps> = ({
  warnings,
  onUpdateWarning,
}) => {
  const [selectedWarningId, setSelectedWarningId] = useState<string>(warnings[0]?.id || '');
  const [actionNote, setActionNote] = useState('');
  const [retestBatch, setRetestBatch] = useState('');
  const [retestVal, setRetestVal] = useState('');

  const currentWarning = warnings.find((w) => w.id === selectedWarningId) || warnings[0];

  const handleStatusChange = (newStatus: WarningStatus) => {
    if (!currentWarning) return;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const actionLabel =
      newStatus === 'closed'
        ? '結案'
        : newStatus === 'false_positive'
        ? '標記為誤報'
        : newStatus === 'investigating'
        ? '開始調查'
        : '待確認';

    const updated: EarlyWarning = {
      ...currentWarning,
      status: newStatus,
      timeline: [
        ...currentWarning.timeline,
        {
          time: now,
          user: '當前品管主管',
          action: actionLabel,
          note: actionNote || `狀態更新為 ${actionLabel}`,
        },
      ],
    };

    onUpdateWarning(updated);
    setActionNote('');
  };

  const handleAddRetest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWarning || !retestBatch) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updated: EarlyWarning = {
      ...currentWarning,
      retestBatchNo: retestBatch,
      retestResult: retestVal,
      timeline: [
        ...currentWarning.timeline,
        {
          time: now,
          user: '品管實驗室',
          action: '完成複測登錄',
          note: `複測批號：${retestBatch} | 複測結果：${retestVal}`,
        },
      ],
    };

    onUpdateWarning(updated);
    setRetestBatch('');
    setRetestVal('');
    alert('已成功登錄複測結果！');
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>預警事件處理追蹤與 CAPA 閉環系統 (F10)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          指派負責人、排查假說、複測紀錄與結案。同一事件自動合併關聯資料點防重複通知，保留完整處理歷程。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：預警列表清單 */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 block px-1">
            預警事件清單 ({warnings.length} 件)
          </span>

          <div className="space-y-2">
            {warnings.map((w) => {
              const isSelected = w.id === selectedWarningId;
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWarningId(w.id)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-semibold text-sky-300">{w.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.status === 'closed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : w.status === 'false_positive'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : w.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {w.status === 'closed'
                        ? '已結案'
                        : w.status === 'false_positive'
                        ? '誤報'
                        : w.status === 'investigating'
                        ? '追蹤中'
                        : '待確認'}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-200 line-clamp-1">{w.ruleName}</h5>
                  <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">{w.triggerDetails}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800">
                    <span>時間：{w.triggeredAt.slice(5)}</span>
                    <span className="text-indigo-300">{w.assignee || '未指派'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側：選定預警詳情、處置歷程與複測登記 */}
        {currentWarning && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              {/* 頂部詳情與狀態 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sky-400 text-sm">
                      {currentWarning.id}
                    </span>
                    <h4 className="text-base font-bold text-slate-100">
                      {currentWarning.ruleName}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    產品：<span className="text-slate-200">{currentWarning.product}</span> | 項目：
                    <span className="text-slate-200">{currentWarning.testItem}</span> | 位置：
                    <span className="text-sky-300 font-mono">{currentWarning.samplingLocation}</span>
                  </p>
                </div>

                {/* 狀態切換按鈕群 (F10) */}
                <div className="flex items-center space-x-2 text-xs">
                  {currentWarning.status !== 'investigating' && currentWarning.status !== 'closed' && (
                    <button
                      onClick={() => handleStatusChange('investigating')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer"
                    >
                      開始調查 (追蹤中)
                    </button>
                  )}
                  {currentWarning.status !== 'closed' && (
                    <button
                      onClick={() => handleStatusChange('closed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition cursor-pointer"
                    >
                      結案 (Closed)
                    </button>
                  )}
                  {currentWarning.status !== 'false_positive' && (
                    <button
                      onClick={() => handleStatusChange('false_positive')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition cursor-pointer"
                    >
                      標記為誤報
                    </button>
                  )}
                </div>
              </div>

              {/* 觸發規則與涉及批次資料點清單 (F08, F10) */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                <span className="font-semibold text-slate-300 block">觸發規則細節與期間：</span>
                <p className="text-slate-300 leading-relaxed">{currentWarning.triggerDetails}</p>
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1.5 text-[11px]">
                    關聯觸發數據點清單 (避免重複通知)：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentWarning.dataPoints.map((dp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 font-mono text-[11px] text-slate-200"
                      >
                        {dp.batchNo}: <strong className="text-amber-400">{dp.value}</strong> (
                        {dp.testTime})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 原因假說與處置措施 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-amber-400 font-semibold block mb-1">
                    排查原因假說 (Hypothesis)：
                  </span>
                  <p className="text-slate-300">
                    {currentWarning.rootCauseHypothesis || '待指派工程師提出假說'}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-emerald-400 font-semibold block mb-1">已實施處置措施：</span>
                  <p className="text-slate-300">
                    {currentWarning.actionsTaken || '現場暫扣並啟動退火溫區點檢'}
                  </p>
                </div>
              </div>

              {/* 複測紀錄 (Retest Result - F10) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <h5 className="font-semibold text-sky-300 mb-2">複測與放行紀錄 (Retest Verification)</h5>
                {currentWarning.retestBatchNo ? (
                  <div className="flex items-center space-x-4 text-slate-200 font-mono">
                    <span>複測批號：<strong className="text-sky-300">{currentWarning.retestBatchNo}</strong></span>
                    <span>複測數值/結果：<strong className="text-emerald-400">{currentWarning.retestResult}</strong></span>
                  </div>
                ) : (
                  <form onSubmit={handleAddRetest} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="複測批號 (例如 B261026-A2-R1)"
                      value={retestBatch}
                      onChange={(e) => setRetestBatch(e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="複測數值 (例如 688 MPa, 合格)"
                      value={retestVal}
                      onChange={(e) => setRetestVal(e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium cursor-pointer"
                    >
                      登記複測結果
                    </button>
                  </form>
                )}
              </div>

              {/* 完整歷程時間軸 (Timeline - F10) */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-3">
                  處置歷程時間軸 (Action Timeline)
                </span>
                <div className="relative pl-6 space-y-4 border-l border-slate-800 text-xs">
                  {currentWarning.timeline.map((entry, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900"></span>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span className="font-mono">{entry.time}</span>
                        <span>•</span>
                        <span className="text-indigo-300 font-medium">{entry.user}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-semibold">{entry.action}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
