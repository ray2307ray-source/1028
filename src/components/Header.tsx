import React from 'react';
import {
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
  Search,
  Sliders,
  History,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unresolvedAlertsCount: number;
  pendingIssuesCount: number;
  pendingChangesCount: number;
  onOpenQuickImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unresolvedAlertsCount,
  pendingIssuesCount,
  pendingChangesCount,
  onOpenQuickImport,
}) => {
  const tabs = [
    { id: 'morning_report', label: '每日早報', badge: null, icon: Activity, priority: 'P1' },
    { id: 'import_entry', label: '資料匯入與品質門禁', badge: pendingIssuesCount > 0 ? `${pendingIssuesCount}待確認` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: FileSpreadsheet, priority: 'P1' },
    { id: 'trend_position', label: '趨勢與位置比較', badge: 'LM vs 邊部', icon: BarChart3, priority: 'P1' },
    { id: 'specs_warnings', label: '規格與判讀規則', badge: '極性方向', icon: Sliders, priority: 'P1' },
    { id: 'process_change', label: '製程變更標註(4M)', badge: pendingChangesCount > 0 ? `${pendingChangesCount}項試驗` : null, icon: Layers, priority: 'P1' },
    { id: 'alert_tracking', label: '預警處理追蹤', badge: unresolvedAlertsCount > 0 ? `${unresolvedAlertsCount}未結案` : null, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: AlertTriangle, priority: 'P1' },
    { id: 'historical_cases', label: '8年歷史與案例庫', badge: '方法差異警示', icon: History, priority: 'P2' },
    { id: 'ai_search', label: 'AI 案例檢索', badge: 'Gemini', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Sparkles, priority: 'P2' },
    { id: 'risk_prediction', label: '異常風險預測', badge: 'P3前瞻', icon: TrendingDown, priority: 'P3' },
    { id: 'efficacy_stats', label: '成效統計看板', badge: '節省86%', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2, priority: 'P1' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* 頂部系統狀態列 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  智慧品質檢驗早報與趨勢預警系統
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  F01~F16 全功能版
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quality Intelligence & Early Warning System | 產線即時聯防
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300 font-medium">當前班別：早班 (08:00~16:00)</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">系統時間：2026-10-26 08:30</span>
            </div>

            <button
              onClick={onOpenQuickImport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>快速匯入資料</span>
            </button>
          </div>
        </div>

        {/* 次級功能標籤導覽 (Tab Navigation) */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-sky-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded border ${
                      tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
