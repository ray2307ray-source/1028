import React, { useState } from 'react';
import { ProcessChange, QualityRecord } from '../types';
import {
  Layers,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Activity,
  Sliders,
} from 'lucide-react';

interface ProcessChangeViewProps {
  processChanges: ProcessChange[];
  onAddChange: (change: ProcessChange) => void;
  records: QualityRecord[];
}

export const ProcessChangeView: React.FC<ProcessChangeViewProps> = ({
  processChanges,
  onAddChange,
  records,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    changeTime: '2026-10-26 08:00',
    batchScope: 'B261026-N1 起',
    product: 'SUS304-EP 精密鋼帶',
    parameterName: '連續光輝退火爐 No.2 溫區微調',
    beforeValue: '1060 °C',
    afterValue: '1048 °C (-12°C)',
    unit: '°C',
    reason: '降低晶粒粗化風險，回升抗拉強度至 680 MPa 以上',
    operator: '林工程師 (熱處理課)',
    causalityConfidence: 'pending_verification' as 'confirmed' | 'probable' | 'pending_verification',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newChange: ProcessChange = {
      id: `PC-${Date.now()}`,
      changeTime: form.changeTime,
      batchScope: form.batchScope,
      product: form.product,
      parameterName: form.parameterName,
      beforeValue: form.beforeValue,
      afterValue: form.afterValue,
      unit: form.unit,
      reason: form.reason,
      operator: form.operator,
      status: 'testing',
      causalityConfidence: form.causalityConfidence,
      impactSummary: '新設定生效試行中，系統正持續收集變更後首批 10 批檢測數據以進行因果比對',
    };
    onAddChange(newChange);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 標題與新增變更按鈕 */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>製程變更標註與物性因果對比 (F09 Process Change 4M)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            記錄人機料法 (4M) 變更時間、適用批號、參數前後值及原因。嚴守 F09 原則：對應不明時標註「待確認」，不自動認定因果！
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>登錄新製程變更 (4M)</span>
        </button>
      </div>

      {/* 變更項目卡片清單 (含前後物性統計對比) */}
      <div className="space-y-4">
        {processChanges.map((change) => (
          <div
            key={change.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold">
                  {change.id}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{change.parameterName}</h4>
                <span className="text-xs text-slate-400">({change.product})</span>
              </div>

              {/* F09 關鍵標籤：因果關係判定 */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 self-start sm:self-auto ${
                  change.causalityConfidence === 'confirmed'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {change.causalityConfidence === 'confirmed' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已驗證因果關係</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>待確認關聯性 (F09不自動認定因果)</span>
                  </>
                )}
              </span>
            </div>

            {/* 參數變更前 vs 變更後值 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block mb-1 text-[11px]">變更前設定值</span>
                <span className="font-mono font-bold text-slate-300 text-sm">{change.beforeValue}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block mb-1 text-[11px]">變更後實施值</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{change.afterValue}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block mb-1 text-[11px]">實施時間與適用批號</span>
                <span className="font-mono text-sky-300 block">{change.changeTime}</span>
                <span className="text-slate-400 text-[10px]">{change.batchScope}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 block mb-1 text-[11px]">變更登錄工程師</span>
                <span className="text-slate-200">{change.operator}</span>
                <span className="text-slate-500 block text-[10px]">狀態：{change.status}</span>
              </div>
            </div>

            {/* 前後物性統計比較說明 (Before/After Impact) */}
            <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs">
              <span className="font-semibold text-indigo-300 block mb-1">
                前後物性檢測統計驗證 (Before/After Comparative Impact)：
              </span>
              <p className="text-slate-300 leading-relaxed">{change.impactSummary}</p>
              {change.beforeMean !== undefined && change.afterMean !== undefined && (
                <div className="mt-2 flex items-center space-x-4 font-mono text-[11px] text-slate-400">
                  <span>變更前 10 批均值：<strong className="text-slate-200">{change.beforeMean}</strong></span>
                  <span>&rarr;</span>
                  <span>變更後 10 批均值：<strong className="text-emerald-400">{change.afterMean}</strong></span>
                </div>
              )}
            </div>

            <div className="mt-3 text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">變更發起原因：</span> {change.reason}
            </div>
          </div>
        ))}
      </div>

      {/* 新增變更 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4">
              登錄製程變更 (4M 異動標註 - F09)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">變更參數名稱 *</label>
                <input
                  type="text"
                  required
                  value={form.parameterName}
                  onChange={(e) => setForm({ ...form, parameterName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">變更前數值 *</label>
                  <input
                    type="text"
                    required
                    value={form.beforeValue}
                    onChange={(e) => setForm({ ...form, beforeValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">變更後數值 *</label>
                  <input
                    type="text"
                    required
                    value={form.afterValue}
                    onChange={(e) => setForm({ ...form, afterValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">生效時間 *</label>
                  <input
                    type="text"
                    required
                    value={form.changeTime}
                    onChange={(e) => setForm({ ...form, changeTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">適用批號範圍 *</label>
                  <input
                    type="text"
                    required
                    value={form.batchScope}
                    onChange={(e) => setForm({ ...form, batchScope: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">變更原因 (Why) *</label>
                <textarea
                  required
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold text-amber-300">
                  因果信心度 (F09: 不得任意認定假因果)
                </label>
                <select
                  value={form.causalityConfidence}
                  onChange={(e) => setForm({ ...form, causalityConfidence: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="pending_verification">待確認關聯性 (不自動認定因果，待持續驗證)</option>
                  <option value="probable">高度可能 (多批數據趨勢相符)</option>
                  <option value="confirmed">已驗證因果 (經DOE實驗或冶金金相證實)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer"
                >
                  確認登錄並標註至趨勢圖
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
