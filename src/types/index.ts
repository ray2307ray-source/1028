/**
 * 智慧品質檢驗系統型別定義 (F01 ~ F16)
 */

export type SamplingLocation = 'LM' | 'Edge_DS' | 'Edge_WS' | 'Head' | 'Tail' | 'All';

export type DirectionType = 'MD' | 'TD' | 'Top' | 'Bottom' | 'None';

export type ValueStatus = 'valid' | 'not_tested' | 'missing';

export interface QualityRecord {
  id: string;
  testTime: string; // YYYY-MM-DD HH:mm
  batchNo: string;
  product: string;
  thickness: number; // mm
  samplingLocation: 'LM' | 'Edge_DS' | 'Edge_WS' | 'Head' | 'Tail';
  testItem: string;
  direction: DirectionType;
  value: number | null;
  valueStatus: ValueStatus; // F03: 嚴格區分未測、缺資料與數值0
  unit: string;
  method: string;
  purpose: '例行品檢 Routine' | '製程變更驗證 Process Change' | '首件檢驗 FAI' | '客訴調查 Claim' | '研發試車 Pilot';
  operator: string;
  verified: boolean;
  qualityFlags?: ('METHOD_DIFF_2022' | 'SUSPECT_DUPLICATE' | 'UNIT_CONVERTED' | 'MANUAL_OVERRIDE')[];
  remarks?: string;
}

export interface DataQualityIssue {
  id: string;
  recordId: string;
  batchNo: string;
  testItem: string;
  type: 'MISSING_FIELD' | 'FORMAT_ERROR' | 'UNIT_MISMATCH' | 'SUSPECT_DUPLICATE' | 'ZERO_AMBIGUITY';
  severity: 'error' | 'warning' | 'info';
  field: string;
  rawValue: string | number | null;
  description: string;
  suggestedAction: string;
  status: 'pending' | 'resolved' | 'ignored';
  resolutionNote?: string;
}

export type SpecPolarity = 'LOWER_IS_BETTER' | 'HIGHER_IS_BETTER' | 'TARGET_IS_BETTER';

export interface SpecConfig {
  id: string;
  product: string;
  thicknessMin: number;
  thicknessMax: number;
  testItem: string;
  unit: string;
  usl: number | null; // Upper Spec Limit
  lsl: number | null; // Lower Spec Limit
  target: number | null;
  effectiveFrom: string; // YYYY-MM-DD (F07 生效版本)
  effectiveTo?: string; // 空代表持續有效
  version: string;
  polarity: SpecPolarity; // 斜對角差下降為改善(綠色)，強度下降為注意(紅色)
  description: string;
}

export type WarningRuleType = 'OOC' | 'NEAR_LIMIT' | 'RUN_TREND' | 'BASE_SHIFT';
export type WarningStatus = 'pending' | 'investigating' | 'closed' | 'false_positive';

export interface EarlyWarning {
  id: string;
  ruleType: WarningRuleType;
  ruleName: string;
  severity: 'critical' | 'warning' | 'notice';
  product: string;
  thickness: number;
  testItem: string;
  samplingLocation: string;
  triggeredAt: string;
  period: string;
  affectedBatchCount: number;
  affectedBatches: string[];
  triggerDetails: string;
  dataPoints: { batchNo: string; testTime: string; value: number; limit?: number }[];
  status: WarningStatus;
  assignee?: string;
  rootCauseHypothesis?: string;
  verifiedCause?: string;
  actionsTaken?: string;
  retestBatchNo?: string;
  retestResult?: string;
  timeline: { time: string; user: string; action: string; note: string }[];
}

export interface ProcessChange {
  id: string;
  changeTime: string;
  batchScope: string;
  product: string;
  parameterName: string;
  beforeValue: string | number;
  afterValue: string | number;
  unit: string;
  reason: string;
  operator: string;
  status: 'effective' | 'testing' | 'reverted';
  causalityConfidence: 'confirmed' | 'probable' | 'pending_verification'; // F09: 不自動認定因果
  beforeMean?: number;
  afterMean?: number;
  impactSummary?: string;
}

export interface AnomalyCase {
  id: string; // e.g. CASE-2024-0812
  title: string;
  date: string;
  product: string;
  affectedItem: string;
  processContext: string;
  symptom: string;
  hypothesis: string; // 原因假說 (推測原因)
  verifiedCause: string; // 已確認原因 (經金相/實驗驗證)
  correctiveAction: string; // 處置與改善措施
  outcome: string; // 改善結果
  verifiedBy: string;
  sourceBatches: string[];
  tags: string[];
}

export interface MorningReport {
  id: string;
  reportDate: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  isWeekendIncluded: boolean; // 週一納入週五至週日
  totalBatches: number;
  passRate: number;
  summaryText: string;
  keyChangePoints: string[];
  oocItems: {
    recordId: string;
    batchNo: string;
    product: string;
    testItem: string;
    location: string;
    value: number;
    specLimit: string;
    deviation: string;
  }[];
  trendAlertCount: number;
  processChangesCount: number;
  pendingTasks: { id: string; title: string; owner: string; deadline: string; status: string }[];
  status: 'draft' | 'approved' | 'published';
  author: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PredictionResult {
  product: string;
  testItem: string;
  location: string;
  forecastWindow: string; // e.g. "未來 7 天 / 次批 10 批"
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  predictedOocProbability: number; // 0 ~ 100%
  expectedMean: number;
  currentMean: number;
  driftRatePerBatch: number;
  trainingWindow: string; // e.g. "2026-08-01 ~ 2026-09-30 (時間先後劃分)"
  validationWindow: string; // e.g. "2026-10-01 ~ 2026-10-20"
  validationAccuracy: number; // e.g. 91.4%
  validationRecall: number; // e.g. 88.2%
  comparisonWithRule: string; // 比既有規則提早 2.8 批發出訊號
  readyForProduction: boolean;
}

export interface EfficacyStats {
  laborHoursBeforeMin: number; // 90 min/day
  laborHoursAfterMin: number; // 12 min/day
  dataCorrectionsBeforePerMonth: number; // 42 次
  dataCorrectionsAfterPerMonth: number; // 3 次
  reportOnTimeRateBefore: number; // 68%
  reportOnTimeRateAfter: number; // 98%
  alertConfirmRateBefore: number; // 45%
  alertConfirmRateAfter: number; // 94%
  falsePositiveRate: number; // 3.8%
  leadTimeAdvanceBatches: number; // 提前 3.6 批
}
