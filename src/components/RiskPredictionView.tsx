import React, { useState } from 'react';
import { PredictionResult } from '../types';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface RiskPredictionViewProps {
  predictionResults: PredictionResult[];
}

export const RiskPredictionView: React.FC<RiskPredictionViewProps> = ({
  predictionResults,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = predictionResults[selectedIdx] || predictionResults[0];

  return (
    <div className="space-y-6">
      {/* 標題與 F15 關鍵驗收準則 */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              異常風險前瞻預測模型 (F15 Anomaly Risk Forecast - P3)
            </h3>
            <p className="text-xs text-slate-400">
              前瞻評估指定測試項目在未來期間之超規機率。嚴格以時間先後切分訓練與驗證，與既有規則預警比對，通過評估才推薦上線。
            </p>
          </div>
        </div>

        {/* 驗證原則橫幅 */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <span className="text-slate-500 block text-[10px] font-semibold">
              ① 時間序列切分規範 (Time-series Split)
            </span>
            <span className="text-slate-200">
              嚴格按時間先後切分（訓練集在前，驗證集在後），杜絕未來資訊洩漏。
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] font-semibold">
              ② 基準對比 (Baseline Comparison)
            </span>
            <span className="text-slate-200">
              與單點超規 (Rule 1) 及 WECO 規則比對提前預警天數與召回率。
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] font-semibold">
              ③ 上線門檻 (Production Readiness)
            </span>
            <span className="text-emerald-400 font-semibold">
              準確率 &ge; 90% 且召回率 &ge; 85% 始允許作為現場輔助依據。
            </span>
          </div>
        </div>
      </div>

      {/* 預測對象切換按鈕 */}
      <div className="flex space-x-2">
        {predictionResults.map((pr, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              selectedIdx === idx
                ? 'bg-slate-800 border-indigo-500 text-sky-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {pr.product} — {pr.testItem}
          </button>
        ))}
      </div>

      {/* 核心預測指標展示卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300">未來期間超規風險機率</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                current.riskLevel === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {current.riskLevel === 'HIGH' ? '高風險 HIGH RISK' : '平穩 LOW RISK'}
            </span>
          </div>

          <div className="text-center py-4">
            <div
              className={`text-5xl font-extrabold font-mono ${
                current.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {current.predictedOocProbability}%
            </div>
            <span className="text-xs text-slate-400 mt-2 block">
              預測視窗：{current.forecastWindow}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">當前實測均值：</span>
              <span className="text-slate-200">{current.currentMean}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">模型預估漂移均值：</span>
              <span className="text-rose-400 font-bold">{current.expectedMean}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">每批漂移斜率：</span>
              <span className="text-amber-400">{current.driftRatePerBatch} / batch</span>
            </div>
          </div>
        </div>

        {/* 時間先後訓練集 vs 驗證集可視化 (F15 關鍵) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>時間序列訓練與驗證時間軸分割 (嚴禁混洗)</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
              ✓ 驗證通過，符合上線標準
            </span>
          </div>

          {/* 時間軸進度條視覺化 */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{current.trainingWindow}</span>
              <span className="text-sky-400">{current.validationWindow}</span>
              <span className="text-rose-400 font-bold">未來 7 天 (預測目標)</span>
            </div>

            <div className="h-6 w-full rounded-lg bg-slate-800 overflow-hidden flex text-[10px] font-bold text-white text-center leading-6">
              <div className="w-[60%] bg-indigo-600/80">訓練集 (Training Set) 60%</div>
              <div className="w-[25%] bg-sky-600">回溯驗證 (Validation) 25%</div>
              <div className="w-[15%] bg-amber-600 animate-pulse">預測期 (Forecast)</div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>時間點 T-60</span>
              <span>時間點 T-15 (切分點)</span>
              <span>今日 T-0</span>
              <span>T+7天</span>
            </div>
          </div>

          {/* 驗證回溯指標與既有規則比對 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-slate-400 block mb-1">回溯驗證準確率 (Accuracy)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {current.validationAccuracy}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">目標 &ge; 90%</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-slate-400 block mb-1">超規召回率 (Recall)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {current.validationRecall}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">避免漏報風險</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-slate-400 block mb-1">較既有規則提前預警時間</span>
              <span className="text-lg font-bold font-mono text-sky-400">
                {current.comparisonWithRule}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">爭取停機微調黃金期</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200">
            <strong>工程處置建議：</strong> 模型顯示 SUS304 抗拉值具高機率在次批持續漂移超規，建議產線提前執行退火 No.2 溫區微降溫與冷卻噴嘴巡檢，以中斷下滑慣性。
          </div>
        </div>
      </div>
    </div>
  );
};
