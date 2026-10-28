import React from 'react';
import { QualityRecord, SpecConfig } from '../types';
import { evaluateRecordAgainstSpec } from '../utils/qcCalculations';
import { X, CheckCircle, AlertOctagon, Info, ShieldAlert, User, Clock, Layers } from 'lucide-react';

interface RecordDetailModalProps {
  record: QualityRecord | null;
  specs: SpecConfig[];
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, specs, onClose }) => {
  if (!record) return null;

  const evaluation = evaluateRecordAgainstSpec(record, specs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {record.id}
              </span>
              <h3 className="text-base font-bold text-slate-100">
                檢測來源數據詳情 (F02 統一欄位回查)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              批號：<span className="text-sky-300 font-mono font-medium">{record.batchNo}</span> | 
              檢測時間：<span className="text-slate-300">{record.testTime}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 判定狀態橫幅 */}
        <div className={`p-3 rounded-xl border flex items-center justify-between mb-5 ${evaluation.colorClass}`}>
          <div className="flex items-center space-x-2.5">
            {evaluation.isOoc ? (
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            ) : evaluation.isNearLimit ? (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <span className="font-semibold text-sm">品質判定結果：{evaluation.statusText}</span>
              {evaluation.spec && (
                <p className="text-xs opacity-90">
                  依據版本：{evaluation.spec.version} (生效日: {evaluation.spec.effectiveFrom}) | 
                  USL: {evaluation.spec.usl ?? '無'} / LSL: {evaluation.spec.lsl ?? '無'} {record.unit}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold font-mono">
              {record.value !== null ? `${record.value} ${record.unit}` : '無數值'}
            </span>
            <span className="block text-[11px] opacity-80">
              狀態：{record.valueStatus === 'valid' ? '實測有效' : record.valueStatus === 'not_tested' ? '未測 (Not Tested)' : '缺資料 (Missing)'}
            </span>
          </div>
        </div>

        {/* 統一資料欄位網格 (F02) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-5">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">產品品名</span>
            <span className="text-slate-100 font-medium">{record.product}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">厚度規格</span>
            <span className="text-slate-100 font-mono font-medium">{record.thickness} mm</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">取樣位置 (F06)</span>
            <span className="text-sky-300 font-semibold">
              {record.samplingLocation === 'LM' ? 'LM (中心線)' : record.samplingLocation.includes('Edge') ? `邊部 (${record.samplingLocation})` : record.samplingLocation}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">測試項目</span>
            <span className="text-slate-100 font-medium">{record.testItem}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">方向 / 面別</span>
            <span className="text-slate-200 font-medium">{record.direction}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">檢驗方法 (Method)</span>
            <span className="text-slate-200 font-mono">{record.method}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">測試目的</span>
            <span className="text-indigo-300 font-medium">{record.purpose}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">檢驗人員</span>
            <span className="text-slate-200">{record.operator}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400 block mb-1">品管覆核狀態</span>
            <span className={record.verified ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {record.verified ? '✓ 已覆核確認' : '○ 待覆核'}
            </span>
          </div>
        </div>

        {/* 備註與標籤 */}
        {record.qualityFlags && record.qualityFlags.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">歷史品質／方法標記：</span>
              <ul className="list-disc list-inside mt-0.5 text-slate-300">
                {record.qualityFlags.map((flag) => (
                  <li key={flag}>
                    {flag === 'METHOD_DIFF_2022' && '注意：2022年機台標準升級，與現行數位機型有響應差異，不可直接混算。'}
                    {flag === 'UNIT_CONVERTED' && '此筆資料經單位自動換算，保留原始數值追蹤。'}
                    {flag === 'SUSPECT_DUPLICATE' && '疑似重複登錄批次，已註記待確認。'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {record.remarks && (
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">檢驗備註與現場紀錄：</span> {record.remarks}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
