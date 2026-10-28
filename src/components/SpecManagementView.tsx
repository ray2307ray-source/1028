import React, { useState } from 'react';
import { SpecConfig, EarlyWarning } from '../types';
import {
  Sliders,
  History,
  CheckCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  HelpCircle,
  FileCheck,
  Layers,
} from 'lucide-react';

interface SpecManagementViewProps {
  specs: SpecConfig[];
  onUpdateSpecs: (newSpecs: SpecConfig[]) => void;
  warnings: EarlyWarning[];
}

export const SpecManagementView: React.FC<SpecManagementViewProps> = ({
  specs,
  onUpdateSpecs,
  warnings,
}) => {
  const [selectedProduct, setSelectedProduct] = useState('SUS304-EP 精密鋼帶');

  // 預警規則開關與參數設定 (F08)
  const [ruleConfig, setRuleConfig] = useState({
    rule1_ooc: true,
    rule2_nearLimitBuffer: 10, // 接近界限 10% 警戒帶
    rule3_runPoints: 6, // 連續 6 點單向下降/上升
    rule4_shiftPoints: 7, // 連續 7 點偏離基準線
  });

  const productSpecs = specs.filter((s) => s.product === selectedProduct);

  return (
    <div className="space-y-6">
      {/* 產品切換與說明 */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>產品規格版本庫與判讀方向設定 (F07, F08)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            歷史數據嚴格依「檢驗當時有效規格版本」判定。顏色完全依品質意義呈現：斜對角差下降為改善 (綠色)，抗拉強度下降為警報 (紅色)。
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">選擇產品規格：</span>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="SUS304-EP 精密鋼帶">SUS304-EP 精密鋼帶</option>
            <option value="PET-OPT 光學級薄膜">PET-OPT 光學級薄膜</option>
            <option value="C1100-HV 導電高韌銅箔">C1100-HV 導電高韌銅箔</option>
          </select>
        </div>
      </div>

      {/* 規格清單與歷史版本生效控制卡 (F07) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productSpecs.map((spec) => {
          const isHistory = !!spec.effectiveTo;
          return (
            <div
              key={spec.id}
              className={`p-5 rounded-xl border relative transition ${
                isHistory
                  ? 'bg-slate-950/40 border-slate-800 opacity-75'
                  : 'bg-slate-900 border-slate-700/80 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{spec.testItem}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        isHistory
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {spec.version}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    厚度適用範圍：{spec.thicknessMin} ~ {spec.thicknessMax} mm
                  </span>
                </div>

                {/* 判讀極性標籤 (F07 核心規範) */}
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                    spec.polarity === 'LOWER_IS_BETTER'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {spec.polarity === 'LOWER_IS_BETTER' ? (
                    <>
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>數值下降 = 改善 (綠色)</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                      <span>數值下降 = 劣化注意 (紅色)</span>
                    </>
                  )}
                </span>
              </div>

              {/* 規格界限數值 */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs mb-3 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">下限 (LSL)</span>
                  <span className="font-bold text-slate-200">
                    {spec.lsl !== null ? `${spec.lsl} ${spec.unit}` : '無下限'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">目標值 (Target)</span>
                  <span className="font-bold text-emerald-400">
                    {spec.target !== null ? `${spec.target} ${spec.unit}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">上限 (USL)</span>
                  <span className="font-bold text-slate-200">
                    {spec.usl !== null ? `${spec.usl} ${spec.unit}` : '無上限'}
                  </span>
                </div>
              </div>

              {/* 生效期間版本說明 */}
              <div className="text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    生效期間：{spec.effectiveFrom} ~ {spec.effectiveTo || '持續現行生效中'}
                  </span>
                </div>
                <p className="text-slate-500">{spec.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 超規與緩變預警規則引擎設定 (F08) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>超規與緩變預警規則引擎設定 (F08 Rule Engine)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            即使檢測數值目前仍在合格規格內，亦可靈敏捕捉連續單向劣化、接近邊界與基準偏移，提早於批量超規前預警。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">規則 1：單點超規預警 (Out of Limit OOC)</span>
              <input
                type="checkbox"
                checked={ruleConfig.rule1_ooc}
                onChange={(e) => setRuleConfig({ ...ruleConfig, rule1_ooc: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
            </div>
            <p className="text-slate-400 text-[11px]">
              觸發條件：實測數值超出 USL 或低於 LSL。立即標記紅色警報，通知產線隔離暫扣。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">規則 2：接近界限警戒帶 (Near Limit Buffer)</span>
              <div className="flex items-center space-x-1 font-mono">
                <input
                  type="number"
                  value={ruleConfig.rule2_nearLimitBuffer}
                  onChange={(e) =>
                    setRuleConfig({ ...ruleConfig, rule2_nearLimitBuffer: parseInt(e.target.value) || 10 })
                  }
                  className="w-12 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-center text-slate-100"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px]">
              觸發條件：數值進入公差帶邊緣 10% 緩衝區（例如抗拉強度接近 620~635 MPa），提早防範。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">規則 3：連續趨勢預警 (Run / Trend Warning)</span>
              <div className="flex items-center space-x-1 font-mono">
                <span className="text-slate-400">連續</span>
                <input
                  type="number"
                  value={ruleConfig.rule3_runPoints}
                  onChange={(e) =>
                    setRuleConfig({ ...ruleConfig, rule3_runPoints: parseInt(e.target.value) || 6 })
                  }
                  className="w-12 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-center text-slate-100"
                />
                <span className="text-slate-400">點</span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px]">
              觸發條件：連續 6 批單向持續下降 (抗拉) 或持續上升 (斜對角差/翹曲)，標註緩變警示。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">規則 4：基準偏移警示 (Step Shift Warning)</span>
              <div className="flex items-center space-x-1 font-mono">
                <span className="text-slate-400">連續</span>
                <input
                  type="number"
                  value={ruleConfig.rule4_shiftPoints}
                  onChange={(e) =>
                    setRuleConfig({ ...ruleConfig, rule4_shiftPoints: parseInt(e.target.value) || 7 })
                  }
                  className="w-12 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-center text-slate-100"
                />
                <span className="text-slate-400">點</span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px]">
              觸發條件：連續 7 點落在中心線同一側，或平均值相較基準期位移超過 1.5 個標準差。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
