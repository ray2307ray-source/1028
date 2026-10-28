import React, { useState, useMemo } from 'react';
import { QualityRecord, SpecConfig, ProcessChange } from '../types';
import {
  calculateMean,
  calculateStdDev,
  calculateMovingAverage,
  calculateCpk,
} from '../utils/qcCalculations';
import {
  BarChart2,
  Calendar,
  Layers,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Pin,
} from 'lucide-react';

interface TrendAnalysisViewProps {
  records: QualityRecord[];
  specs: SpecConfig[];
  processChanges: ProcessChange[];
  onInspectRecord: (record: QualityRecord) => void;
}

export const TrendAnalysisView: React.FC<TrendAnalysisViewProps> = ({
  records,
  specs,
  processChanges,
  onInspectRecord,
}) => {
  // 篩選狀態 (F05, F06)
  const [selectedProduct, setSelectedProduct] = useState('SUS304-EP 精密鋼帶');
  const [selectedThickness, setSelectedThickness] = useState<number>(0.25);
  const [selectedItem, setSelectedItem] = useState('抗拉強度 Tensile Strength');
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month' | 'quarter' | 'all'>('week');
  const [locationMode, setLocationMode] = useState<'both' | 'lm_only' | 'edge_only'>('both');
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // 防混算警告提示 (F06: 不同規格不會在未提示下混算)
  const [combineThicknessWarning, setCombineThicknessWarning] = useState(false);

  // 取得有效規格 (F07)
  const activeSpec = useMemo(() => {
    return specs.find(
      (s) =>
        s.product === selectedProduct &&
        s.testItem === selectedItem &&
        selectedThickness >= s.thicknessMin &&
        selectedThickness <= s.thicknessMax
    );
  }, [specs, selectedProduct, selectedItem, selectedThickness]);

  // 依時間尺度篩選紀錄
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (r.product !== selectedProduct) return false;
        if (r.thickness !== selectedThickness) return false;
        if (r.testItem !== selectedItem) return false;
        if (r.value === null || r.valueStatus !== 'valid') return false;

        if (timeScale === 'day') {
          return r.testTime >= '2026-10-25';
        } else if (timeScale === 'week') {
          return r.testTime >= '2026-10-18';
        } else if (timeScale === 'month') {
          return r.testTime >= '2026-09-26';
        } else if (timeScale === 'quarter') {
          return r.testTime >= '2026-07-01';
        }
        return true;
      })
      .sort((a, b) => (a.testTime > b.testTime ? 1 : -1));
  }, [records, selectedProduct, selectedThickness, selectedItem, timeScale]);

  // 分離 LM (中心線) 與 邊部 (Edge: DS/WS) 數據 (F06: 分別追蹤，支援同圖比較，各位置顯示實際樣本數)
  const lmRecords = useMemo(() => filteredRecords.filter((r) => r.samplingLocation === 'LM'), [filteredRecords]);
  const edgeRecords = useMemo(
    () => filteredRecords.filter((r) => r.samplingLocation.includes('Edge')),
    [filteredRecords]
  );

  const lmValues = lmRecords.map((r) => r.value as number);
  const edgeValues = edgeRecords.map((r) => r.value as number);
  const allValues = filteredRecords.map((r) => r.value as number);

  // 統計量
  const lmMean = calculateMean(lmValues);
  const edgeMean = calculateMean(edgeValues);
  const overallMean = calculateMean(allValues);

  const lmStd = calculateStdDev(lmValues);
  const edgeStd = calculateStdDev(edgeValues);

  const cpkStats = calculateCpk(
    allValues,
    activeSpec?.usl ?? null,
    activeSpec?.lsl ?? null
  );

  // 計算移動平均 (MA-3)
  const movingAverages = useMemo(() => {
    return calculateMovingAverage(allValues, 3);
  }, [allValues]);

  // SVG 圖表繪製座標計算
  const chartHeight = 280;
  const chartWidth = 720;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };

  const effectiveUsl = activeSpec?.usl ?? Math.max(...allValues, 100) * 1.05;
  const effectiveLsl = activeSpec?.lsl ?? Math.min(...allValues, 0) * 0.95;

  const minY = Math.min(effectiveLsl * 0.96, Math.min(...allValues, Infinity) * 0.96);
  const maxY = Math.max(effectiveUsl * 1.04, Math.max(...allValues, -Infinity) * 1.04);
  const rangeY = maxY - minY || 1;

  const getYCoord = (val: number) => {
    const ratio = (val - minY) / rangeY;
    return chartHeight - padding.bottom - ratio * (chartHeight - padding.top - padding.bottom);
  };

  const getXCoord = (index: number, total: number) => {
    if (total <= 1) return padding.left + (chartWidth - padding.left - padding.right) / 2;
    const innerW = chartWidth - padding.left - padding.right;
    return padding.left + (index / (total - 1)) * innerW;
  };

  return (
    <div className="space-y-6">
      {/* 頂部篩選器面板 (產品、厚度、項目、時間尺度、取樣位置比較 F05, F06) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-sky-400" />
              <span>多時間尺度趨勢分析與位置分組比較 (F05, F06)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              免手動整理 Excel，即時切換日/週/月/季跨度。LM (中心線) 與邊部分開追蹤並支援同圖比較，嚴格防止混算。
            </p>
          </div>

          {/* 時間尺度切換 (F05) */}
          <div className="flex items-center space-x-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            {(['day', 'week', 'month', 'quarter', 'all'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setTimeScale(scale)}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  timeScale === scale
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scale === 'day' && '日 (Day)'}
                {scale === 'week' && '週 (Week)'}
                {scale === 'month' && '月 (Month)'}
                {scale === 'quarter' && '季 (Quarter)'}
                {scale === 'all' && '全量歷史 (8年)'}
              </button>
            ))}
          </div>
        </div>

        {/* 下拉篩選控制項 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">產品品名</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="SUS304-EP 精密鋼帶">SUS304-EP 精密鋼帶</option>
              <option value="PET-OPT 光學級薄膜">PET-OPT 光學級薄膜</option>
              <option value="C1100-HV 導電高韌銅箔">C1100-HV 導電高韌銅箔</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 flex items-center justify-between">
              <span>厚度規格 (獨立分離不混算)</span>
              <span className="text-[10px] text-sky-400 font-mono">F06 防混算</span>
            </label>
            <select
              value={selectedThickness}
              onChange={(e) => setSelectedThickness(parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono font-medium"
            >
              <option value={0.25}>0.25 mm (關鍵薄規)</option>
              <option value={0.50}>0.50 mm (中厚規)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">測試項目</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="抗拉強度 Tensile Strength">抗拉強度 Tensile Strength (MPa)</option>
              <option value="斜對角差 Diagonal Difference">斜對角差 Diagonal Difference (mm)</option>
              <option value="延伸率 Elongation">延伸率 Elongation (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">取樣位置追蹤模式 (F06)</label>
            <select
              value={locationMode}
              onChange={(e) => setLocationMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sky-300 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="both">同圖重疊比較 (LM vs 邊部)</option>
              <option value="lm_only">僅檢視 LM (中心線)</option>
              <option value="edge_only">僅檢視 邊部 (Edge DS/WS)</option>
            </select>
          </div>
        </div>

        {/* 輔助開關與樣本數統計橫幅 (F06: 各位置顯示實際樣本數) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showMovingAverage}
                onChange={(e) => setShowMovingAverage(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span>顯示移動平均線 (MA 3)</span>
            </label>

            {activeSpec && (
              <span className="text-slate-400 text-[11px]">
                規格界限：USL <span className="font-mono text-slate-200">{activeSpec.usl ?? '無'}</span> / LSL{' '}
                <span className="font-mono text-slate-200">{activeSpec.lsl ?? '無'}</span> {activeSpec.unit}
              </span>
            )}
          </div>

          {/* 各位置獨立樣本數提示 (F06) */}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-[11px]">
              LM 實際樣本數 (N_LM): <strong className="text-sky-200">{lmRecords.length}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[11px]">
              邊部實際樣本數 (N_Edge): <strong className="text-amber-200">{edgeRecords.length}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
              全期間總樣本: <strong>{filteredRecords.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SPC 互動趨勢圖與製程變更標籤 (F05, F06, F09) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-200">
              趨勢圖 (SPC Run Chart) — {selectedProduct} ({selectedThickness}mm)
            </span>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
                <span>LM 中心線 (均值: {lmMean})</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span>邊部 (均值: {edgeMean})</span>
              </span>
              {showMovingAverage && (
                <span className="flex items-center space-x-1.5 text-indigo-400">
                  <span className="w-3 h-0.5 bg-indigo-400 inline-block"></span>
                  <span>移動平均 (MA-3)</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            期間平均：<span className="text-slate-100 font-bold">{overallMean}</span> | Cpk:{' '}
            <span className={`font-bold ${cpkStats.cpk < 1.33 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {cpkStats.cpk}
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[640px] text-xs font-mono"
          >
            {/* 網格背景線 */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = padding.top + pct * (chartHeight - padding.top - padding.bottom);
              const val = (maxY - pct * rangeY).toFixed(1);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                  />
                  <text x={padding.left - 8} y={y + 4} fill="#64748b" textAnchor="end" fontSize="10">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* 管制界限 USL / LSL / Target */}
            {activeSpec?.usl && (
              <g>
                <line
                  x1={padding.left}
                  y1={getYCoord(activeSpec.usl)}
                  x2={chartWidth - padding.right}
                  y2={getYCoord(activeSpec.usl)}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                />
                <text
                  x={chartWidth - padding.right}
                  y={getYCoord(activeSpec.usl) - 6}
                  fill="#f43f5e"
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="bold"
                >
                  USL: {activeSpec.usl} {activeSpec.unit}
                </text>
              </g>
            )}

            {activeSpec?.lsl && (
              <g>
                <line
                  x1={padding.left}
                  y1={getYCoord(activeSpec.lsl)}
                  x2={chartWidth - padding.right}
                  y2={getYCoord(activeSpec.lsl)}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                />
                <text
                  x={chartWidth - padding.right}
                  y={getYCoord(activeSpec.lsl) + 12}
                  fill="#f43f5e"
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="bold"
                >
                  LSL: {activeSpec.lsl} {activeSpec.unit}
                </text>
              </g>
            )}

            {activeSpec?.target && (
              <g>
                <line
                  x1={padding.left}
                  y1={getYCoord(activeSpec.target)}
                  x2={chartWidth - padding.right}
                  y2={getYCoord(activeSpec.target)}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left + 8}
                  y={getYCoord(activeSpec.target) - 5}
                  fill="#10b981"
                  fontSize="10"
                >
                  目標 Target: {activeSpec.target}
                </text>
              </g>
            )}

            {/* 移動平均線 (MA-3) */}
            {showMovingAverage && (
              <path
                d={filteredRecords
                  .map((_, i) => {
                    const ma = movingAverages[i];
                    if (ma === null) return '';
                    const x = getXCoord(i, filteredRecords.length);
                    const y = getYCoord(ma);
                    return `${i === 2 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                opacity="0.8"
              />
            )}

            {/* LM 中心線折線與數據點 */}
            {(locationMode === 'both' || locationMode === 'lm_only') && (
              <g>
                <path
                  d={lmRecords
                    .map((r, i) => {
                      // 尋找在 filteredRecords 中的整體索引
                      const fullIdx = filteredRecords.findIndex((fr) => fr.id === r.id);
                      const x = getXCoord(fullIdx, filteredRecords.length);
                      const y = getYCoord(r.value!);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
                {lmRecords.map((r) => {
                  const fullIdx = filteredRecords.findIndex((fr) => fr.id === r.id);
                  const cx = getXCoord(fullIdx, filteredRecords.length);
                  const cy = getYCoord(r.value!);
                  const isOoc =
                    (activeSpec?.usl && r.value! > activeSpec.usl) ||
                    (activeSpec?.lsl && r.value! < activeSpec.lsl);
                  return (
                    <circle
                      key={r.id}
                      cx={cx}
                      cy={cy}
                      r={isOoc ? 5.5 : 4}
                      fill={isOoc ? '#f43f5e' : '#38bdf8'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:scale-150 transition"
                      onMouseEnter={() => setHoveredPoint({ record: r, x: cx, y: cy })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onInspectRecord(r)}
                    />
                  );
                })}
              </g>
            )}

            {/* 邊部 (Edge) 折線與數據點 */}
            {(locationMode === 'both' || locationMode === 'edge_only') && (
              <g>
                <path
                  d={edgeRecords
                    .map((r, i) => {
                      const fullIdx = filteredRecords.findIndex((fr) => fr.id === r.id);
                      const x = getXCoord(fullIdx, filteredRecords.length);
                      const y = getYCoord(r.value!);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeDasharray={locationMode === 'both' ? '3 2' : 'none'}
                />
                {edgeRecords.map((r) => {
                  const fullIdx = filteredRecords.findIndex((fr) => fr.id === r.id);
                  const cx = getXCoord(fullIdx, filteredRecords.length);
                  const cy = getYCoord(r.value!);
                  const isOoc =
                    (activeSpec?.usl && r.value! > activeSpec.usl) ||
                    (activeSpec?.lsl && r.value! < activeSpec.lsl);
                  return (
                    <rect
                      key={r.id}
                      x={cx - 3.5}
                      y={cy - 3.5}
                      width={7}
                      height={7}
                      fill={isOoc ? '#f43f5e' : '#fbbf24'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:scale-150 transition"
                      onMouseEnter={() => setHoveredPoint({ record: r, x: cx, y: cy })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onInspectRecord(r)}
                    />
                  );
                })}
              </g>
            )}

            {/* 製程變更標註 (4M Event Marker Line - F09) */}
            {processChanges.map((pc, idx) => {
              // 模擬將變更對應到圖表時間軸
              const xPos = padding.left + (chartWidth - padding.left - padding.right) * 0.42;
              return (
                <g key={pc.id}>
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={chartHeight - padding.bottom}
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <rect
                    x={xPos - 50}
                    y={padding.top - 20}
                    width={100}
                    height={18}
                    rx="4"
                    fill="#581c87"
                    stroke="#a855f7"
                  />
                  <text
                    x={xPos}
                    y={padding.top - 8}
                    fill="#e9d5ff"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    4M變更: 輥壓下量
                  </text>
                </g>
              );
            })}

            {/* X 軸標籤 (批號與時間) */}
            {filteredRecords.map((r, i) => {
              if (filteredRecords.length > 12 && i % 2 !== 0) return null;
              const x = getXCoord(i, filteredRecords.length);
              return (
                <text
                  key={r.id}
                  x={x}
                  y={chartHeight - padding.bottom + 18}
                  fill="#94a3b8"
                  textAnchor="middle"
                  fontSize="9"
                >
                  {r.batchNo.slice(-6)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs shadow-xl"
            style={{
              left: Math.min(Math.max(hoveredPoint.x, 80), chartWidth - 160),
              top: Math.max(hoveredPoint.y - 65, 10),
            }}
          >
            <div className="font-mono font-bold text-sky-300">
              {hoveredPoint.record.batchNo} ({hoveredPoint.record.samplingLocation})
            </div>
            <div className="text-slate-200">
              實測值：<span className="font-mono font-semibold">{hoveredPoint.record.value} {hoveredPoint.record.unit}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              時間：{hoveredPoint.record.testTime} (點擊穿透詳情)
            </div>
          </div>
        )}
      </div>

      {/* 統計與位置對比資訊卡 (F06 LM vs Edge 數值比較) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block mb-1">LM (中心線) 統計表現</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-sky-400">{lmMean}</span>
            <span className="text-slate-400">{activeSpec?.unit}</span>
          </div>
          <div className="mt-2 text-slate-400 space-y-0.5">
            <div>標準差 StdDev: <span className="font-mono text-slate-200">{lmStd}</span></div>
            <div>樣本數: <span className="font-mono text-slate-200">{lmRecords.length} 批</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block mb-1">邊部 (Edge DS/WS) 統計表現</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-amber-400">{edgeMean}</span>
            <span className="text-slate-400">{activeSpec?.unit}</span>
          </div>
          <div className="mt-2 text-slate-400 space-y-0.5">
            <div>標準差 StdDev: <span className="font-mono text-slate-200">{edgeStd}</span></div>
            <div>樣本數: <span className="font-mono text-slate-200">{edgeRecords.length} 批</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block mb-1">中心與邊部位置差 (Center vs Edge Delta)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-slate-100">
              {Math.abs(Number((lmMean - edgeMean).toFixed(2)))}
            </span>
            <span className="text-slate-400">{activeSpec?.unit}</span>
          </div>
          <p className="mt-2 text-slate-400 leading-relaxed text-[11px]">
            {lmMean > edgeMean
              ? '中心線抗拉值顯著高於邊部約 ' + (lmMean - edgeMean).toFixed(1) + ' MPa，顯示冷卻速率或軋延張力存在跨幅差異。'
              : '中心與邊部差異微小，跨幅均勻性良好。'}
          </p>
        </div>
      </div>
    </div>
  );
};
