/**
 * 品質工程統計與 SPC 演算法 (Mean, StdDev, Moving Average, Cpk, WECO Rules)
 */

import { QualityRecord, SpecConfig, EarlyWarning } from '../types';

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(3));
}

export function calculateStdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(3));
}

export function calculateMovingAverage(values: number[], windowSize: number = 3): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else {
      const window = values.slice(i - windowSize + 1, i + 1);
      result.push(calculateMean(window));
    }
  }
  return result;
}

export function calculateCpk(values: number[], usl: number | null, lsl: number | null): { cp: number; cpk: number } {
  if (values.length < 3) return { cp: 0, cpk: 0 };
  const mean = calculateMean(values);
  const std = calculateStdDev(values);
  if (std === 0) return { cp: 0, cpk: 0 };

  let cpu = Infinity;
  let cpl = Infinity;
  let cp = 0;

  if (usl !== null && lsl !== null) {
    cp = Number(((usl - lsl) / (6 * std)).toFixed(2));
    cpu = (usl - mean) / (3 * std);
    cpl = (mean - lsl) / (3 * std);
    const cpk = Number(Math.min(cpu, cpl).toFixed(2));
    return { cp, cpk };
  } else if (usl !== null) {
    cpu = (usl - mean) / (3 * std);
    return { cp: Number(cpu.toFixed(2)), cpk: Number(cpu.toFixed(2)) };
  } else if (lsl !== null) {
    cpl = (mean - lsl) / (3 * std);
    return { cp: Number(cpl.toFixed(2)), cpk: Number(cpl.toFixed(2)) };
  }

  return { cp: 0, cpk: 0 };
}

/**
 * 依據有效日期與規格庫判定數值狀態
 */
export function evaluateRecordAgainstSpec(
  record: QualityRecord,
  specs: SpecConfig[]
): {
  isOoc: boolean;
  isNearLimit: boolean;
  statusText: string;
  spec: SpecConfig | undefined;
  colorClass: string;
} {
  if (record.value === null || record.valueStatus !== 'valid') {
    return {
      isOoc: false,
      isNearLimit: false,
      statusText: record.valueStatus === 'not_tested' ? '未測' : '缺資料',
      spec: undefined,
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    };
  }

  // 依產品、厚度範圍與測試項目比對當前生效規格 (F07 生效日期版本控制)
  const matchedSpec = specs.find((s) => {
    if (s.product !== record.product) return false;
    if (s.testItem !== record.testItem) return false;
    if (record.thickness < s.thicknessMin || record.thickness > s.thicknessMax) return false;

    // 依測試時間比對歷史生效日
    const testDate = record.testTime.slice(0, 10);
    if (s.effectiveFrom && testDate < s.effectiveFrom) return false;
    if (s.effectiveTo && testDate > s.effectiveTo) return false;

    return true;
  });

  if (!matchedSpec) {
    return {
      isOoc: false,
      isNearLimit: false,
      statusText: '無適用規格',
      spec: undefined,
      colorClass: 'text-slate-400 bg-slate-800/40 border-slate-700',
    };
  }

  const val = record.value;
  const { usl, lsl, polarity } = matchedSpec;

  let isOoc = false;
  let isNearLimit = false;

  if (usl !== null && val > usl) isOoc = true;
  if (lsl !== null && val < lsl) isOoc = true;

  // 警戒區間 (距離邊界 10% 緩衝)
  if (!isOoc) {
    if (usl !== null && lsl !== null) {
      const buffer = (usl - lsl) * 0.12;
      if (val >= usl - buffer || val <= lsl + buffer) isNearLimit = true;
    } else if (usl !== null && val >= usl * 0.9) {
      isNearLimit = true;
    } else if (lsl !== null && val <= lsl * 1.1) {
      isNearLimit = true;
    }
  }

  // F07: 顏色依品質意義呈現！
  // LOWER_IS_BETTER: 數值下降為改善 (綠色)，上升為注意/超規 (紅色)
  // HIGHER_IS_BETTER: 數值下降為注意/超規 (紅色)，高數值為良好 (綠色)
  let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let statusText = '合格';

  if (isOoc) {
    statusText = '超規 (OOC)';
    colorClass = 'text-rose-400 bg-rose-500/15 border-rose-500/40 font-semibold';
  } else if (isNearLimit) {
    statusText = '接近界限';
    colorClass = 'text-amber-400 bg-amber-500/15 border-amber-500/40';
  } else {
    if (polarity === 'LOWER_IS_BETTER' && matchedSpec.target !== null && val <= matchedSpec.target) {
      statusText = '優良 (低翹曲/平整)';
      colorClass = 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40';
    }
  }

  return { isOoc, isNearLimit, statusText, spec: matchedSpec, colorClass };
}
