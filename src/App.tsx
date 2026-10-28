/**
 * 智慧品質檢驗早報與趨勢預警系統 (Quality Intelligence & Early Warning System)
 * 完整符合規格表 F01 ~ F16 全部功能需求
 */

import React, { useState } from 'react';
import {
  INITIAL_RECORDS,
  INITIAL_SPECS,
  INITIAL_EARLY_WARNINGS,
  INITIAL_PROCESS_CHANGES,
  INITIAL_ANOMALY_CASES,
  INITIAL_QUALITY_ISSUES,
  INITIAL_PREDICTION_RESULTS,
  INITIAL_EFFICACY_STATS,
} from './data/mockQualityDatabase';
import {
  QualityRecord,
  SpecConfig,
  EarlyWarning,
  ProcessChange,
  AnomalyCase,
  DataQualityIssue,
} from './types';
import { Header } from './components/Header';
import { MorningReportView } from './components/MorningReportView';
import { DataImportView } from './components/DataImportView';
import { TrendAnalysisView } from './components/TrendAnalysisView';
import { SpecManagementView } from './components/SpecManagementView';
import { ProcessChangeView } from './components/ProcessChangeView';
import { AlertTrackingView } from './components/AlertTrackingView';
import { HistoricalQueryView } from './components/HistoricalQueryView';
import { AiAssistantView } from './components/AiAssistantView';
import { RiskPredictionView } from './components/RiskPredictionView';
import { EfficacyDashboardView } from './components/EfficacyDashboardView';
import { RecordDetailModal } from './components/RecordDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('morning_report');

  // 資料狀態管理 (全模組共享統一資料欄位 F02)
  const [records, setRecords] = useState<QualityRecord[]>(INITIAL_RECORDS);
  const [specs, setSpecs] = useState<SpecConfig[]>(INITIAL_SPECS);
  const [warnings, setWarnings] = useState<EarlyWarning[]>(INITIAL_EARLY_WARNINGS);
  const [processChanges, setProcessChanges] = useState<ProcessChange[]>(INITIAL_PROCESS_CHANGES);
  const [cases] = useState<AnomalyCase[]>(INITIAL_ANOMALY_CASES);
  const [qualityIssues, setQualityIssues] = useState<DataQualityIssue[]>(INITIAL_QUALITY_ISSUES);
  const [predictionResults] = useState(INITIAL_PREDICTION_RESULTS);
  const [efficacyStats] = useState(INITIAL_EFFICACY_STATS);

  // 穿透回查來源數據 Modal (F04, F05, F08, F11)
  const [inspectedRecord, setInspectedRecord] = useState<QualityRecord | null>(null);

  // 新增紀錄 (F01 匯入與登錄)
  const handleAddRecords = (newRecords: QualityRecord[]) => {
    setRecords((prev) => [...newRecords, ...prev]);
  };

  // 處理品質檢查待確認問題 (F03)
  const handleResolveIssue = (
    issueId: string,
    resolution: 'auto_convert' | 'confirm_zero' | 'mark_untested' | 'discard'
  ) => {
    setQualityIssues((prev) =>
      prev.map((iss) => {
        if (iss.id !== issueId) return iss;

        if (resolution === 'auto_convert') {
          // 換算單位 kgf/mm² -> MPa
          setRecords((rList) =>
            rList.map((r) => {
              if (r.id === iss.recordId && r.unit.includes('kgf')) {
                const converted = Number(((r.value || 0) * 9.80665).toFixed(1));
                return {
                  ...r,
                  value: converted,
                  unit: 'MPa',
                  qualityFlags: [...(r.qualityFlags || []), 'UNIT_CONVERTED'],
                };
              }
              return r;
            })
          );
        }

        return { ...iss, status: 'resolved' };
      })
    );
  };

  // 更新預警事件 (F10 CAPA 結案)
  const handleUpdateWarning = (updated: EarlyWarning) => {
    setWarnings((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // 新增製程變更 (F09)
  const handleAddProcessChange = (newChange: ProcessChange) => {
    setProcessChanges((prev) => [newChange, ...prev]);
  };

  const unresolvedAlertsCount = warnings.filter(
    (w) => w.status === 'investigating' || w.status === 'pending'
  ).length;

  const pendingIssuesCount = qualityIssues.filter((q) => q.status === 'pending').length;
  const pendingChangesCount = processChanges.filter((p) => p.status === 'testing').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 頂部導航與狀態條 */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unresolvedAlertsCount={unresolvedAlertsCount}
        pendingIssuesCount={pendingIssuesCount}
        pendingChangesCount={pendingChangesCount}
        onOpenQuickImport={() => setActiveTab('import_entry')}
      />

      {/* 主工作區塊 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* F04, F14: 每日品質早報 */}
        {activeTab === 'morning_report' && (
          <MorningReportView
            records={records}
            specs={specs}
            warnings={warnings}
            processChanges={processChanges}
            onInspectRecord={(rec) => setInspectedRecord(rec)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* F01, F02, F03: 資料匯入、統一欄位與品質檢查門禁 */}
        {activeTab === 'import_entry' && (
          <DataImportView
            records={records}
            onAddRecords={handleAddRecords}
            qualityIssues={qualityIssues}
            onResolveIssue={handleResolveIssue}
            specs={specs}
          />
        )}

        {/* F05, F06: 多時間尺度趨勢分析與 LM vs 邊部位置比較 */}
        {activeTab === 'trend_position' && (
          <TrendAnalysisView
            records={records}
            specs={specs}
            processChanges={processChanges}
            onInspectRecord={(rec) => setInspectedRecord(rec)}
          />
        )}

        {/* F07, F08: 規格與判讀極性設定 & 預警規則引擎 */}
        {activeTab === 'specs_warnings' && (
          <SpecManagementView
            specs={specs}
            onUpdateSpecs={(newSpecs) => setSpecs(newSpecs)}
            warnings={warnings}
          />
        )}

        {/* F09: 製程變更標註 (4M) 與物性對比 */}
        {activeTab === 'process_change' && (
          <ProcessChangeView
            processChanges={processChanges}
            onAddChange={handleAddProcessChange}
            records={records}
          />
        )}

        {/* F10: 預警處理追蹤 (CAPA) */}
        {activeTab === 'alert_tracking' && (
          <AlertTrackingView warnings={warnings} onUpdateWarning={handleUpdateWarning} />
        )}

        {/* F11, F12: 8年歷史資料查詢 (含方法差異標註) 與異常案例資料庫 */}
        {activeTab === 'historical_cases' && (
          <HistoricalQueryView
            records={records}
            cases={cases}
            onInspectRecord={(rec) => setInspectedRecord(rec)}
            onNavigateToAiSearch={() => setActiveTab('ai_search')}
          />
        )}

        {/* F13: AI 案例智慧檢索與技術問答 */}
        {activeTab === 'ai_search' && <AiAssistantView cases={cases} />}

        {/* F15: 異常風險預測模型 (P3) */}
        {activeTab === 'risk_prediction' && (
          <RiskPredictionView predictionResults={predictionResults} />
        )}

        {/* F16: 成效統計量化看板 */}
        {activeTab === 'efficacy_stats' && <EfficacyDashboardView stats={efficacyStats} />}
      </main>

      {/* 來源數據穿透 Modal (F04, F05, F08, F11) */}
      <RecordDetailModal
        record={inspectedRecord}
        specs={specs}
        onClose={() => setInspectedRecord(null)}
      />

      {/* 頁尾系統資訊 */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>智慧品質檢驗早報與趨勢預警系統 (Quality Intelligence & Early Warning System)</span>
          <span className="font-mono text-slate-600">符合 F01~F16 規範 | JIS Z2241 / ASTM E8 標準相容</span>
        </div>
      </footer>
    </div>
  );
}
