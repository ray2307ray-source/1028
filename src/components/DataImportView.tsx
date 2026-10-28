import React, { useState } from 'react';
import { QualityRecord, DataQualityIssue, SpecConfig } from '../types';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  RefreshCw,
  HelpCircle,
  FileText,
  Database,
  ArrowRight,
  Eye,
  Check,
  X,
  FileUp,
} from 'lucide-react';

interface DataImportViewProps {
  records: QualityRecord[];
  onAddRecords: (newRecords: QualityRecord[]) => void;
  qualityIssues: DataQualityIssue[];
  onResolveIssue: (issueId: string, resolution: 'auto_convert' | 'confirm_zero' | 'mark_untested' | 'discard') => void;
  specs: SpecConfig[];
}

export const DataImportView: React.FC<DataImportViewProps> = ({
  records,
  onAddRecords,
  qualityIssues,
  onResolveIssue,
  specs,
}) => {
  const [activeImportMode, setActiveImportMode] = useState<'excel' | 'erp' | 'word' | 'manual'>('excel');

  // 人工單筆登錄表單狀態 (F01, F02)
  const [manualForm, setManualForm] = useState({
    batchNo: 'B261026-N1',
    product: 'SUS304-EP 精密鋼帶',
    thickness: 0.25,
    samplingLocation: 'LM' as 'LM' | 'Edge_DS' | 'Edge_WS' | 'Head' | 'Tail',
    testItem: '抗拉強度 Tensile Strength',
    direction: 'MD' as 'MD' | 'TD' | 'Top' | 'Bottom' | 'None',
    valueStr: '695',
    valueStatus: 'valid' as 'valid' | 'not_tested' | 'missing',
    unit: 'MPa',
    method: 'JIS Z2241:2022',
    purpose: '例行品檢 Routine' as any,
    operator: '陳建銘 (QA-04)',
    remarks: '',
  });

  // 待匯入檔案模擬資料 (預覽與欄位映射 F01)
  const [previewRows, setPreviewRows] = useState<any[]>([
    {
      rawId: 1,
      batchNo: 'B261026-IMP1',
      product: 'SUS304-EP 精密鋼帶',
      thickness: '0.25',
      location: 'LM',
      item: '抗拉強度 Tensile Strength',
      direction: 'MD',
      rawVal: '702',
      unit: 'MPa',
      method: 'JIS Z2241:2022',
      purpose: '例行品檢 Routine',
      status: 'valid',
      checkResult: 'OK',
    },
    {
      rawId: 2,
      batchNo: 'B261026-IMP1',
      product: 'SUS304-EP 精密鋼帶',
      thickness: '0.25',
      location: 'Edge_DS',
      item: '抗拉強度 Tensile Strength',
      direction: 'MD',
      rawVal: '685',
      unit: 'MPa',
      method: 'JIS Z2241:2022',
      purpose: '例行品檢 Routine',
      status: 'valid',
      checkResult: 'OK',
    },
    {
      rawId: 3,
      batchNo: 'B261026-IMP2',
      product: 'SUS304-EP 精密鋼帶',
      thickness: '0.25',
      location: 'LM',
      item: '表面粗糙度 Ra',
      direction: 'Top',
      rawVal: '', // 空白字串
      unit: 'μm',
      method: 'SOP-QC-SURF',
      purpose: '例行品檢 Routine',
      status: 'not_tested', // F03: 區分未測，不自動填0！
      checkResult: '未測標註 (不自動填0)',
    },
    {
      rawId: 4,
      batchNo: 'B261026-A1', // 重複批號+項目+位置
      product: 'SUS304-EP 精密鋼帶',
      thickness: '0.25',
      location: 'LM',
      item: '抗拉強度 Tensile Strength',
      direction: 'MD',
      rawVal: '698',
      unit: 'MPa',
      method: 'JIS Z2241:2022',
      purpose: '例行品檢 Routine',
      status: 'duplicate',
      checkResult: '疑似重複 (已存在相同紀錄)',
    },
    {
      rawId: 5,
      batchNo: '', // 缺必要欄位
      product: 'SUS304-EP 精密鋼帶',
      thickness: '0.25',
      location: 'Edge_WS',
      item: '斜對角差 Diagonal Difference',
      direction: 'None',
      rawVal: '0.45',
      unit: 'mm',
      method: 'SOP-QC-DIFF-03',
      purpose: '例行品檢 Routine',
      status: 'error',
      checkResult: '失敗：缺少必要欄位 [批號 BatchNo]',
    },
  ]);

  const [importSummary, setImportSummary] = useState<{
    successCount: number;
    failedCount: number;
    duplicateCount: number;
    executed: boolean;
  } | null>(null);

  // 執行確認匯入 (F01)
  const handleConfirmImport = () => {
    let success = 0;
    let failed = 0;
    let dup = 0;
    const recordsToAppend: QualityRecord[] = [];

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    previewRows.forEach((row) => {
      if (row.status === 'error') {
        failed++;
        return;
      }
      if (row.status === 'duplicate') {
        dup++;
        return;
      }

      // 成功解析
      success++;
      const val = row.rawVal === '' ? null : parseFloat(row.rawVal);
      recordsToAppend.push({
        id: `REC-IMP-${Date.now()}-${row.rawId}`,
        testTime: nowStr,
        batchNo: row.batchNo,
        product: row.product,
        thickness: parseFloat(row.thickness) || 0.25,
        samplingLocation: row.location,
        testItem: row.item,
        direction: row.direction,
        value: val,
        valueStatus: row.rawVal === '' ? 'not_tested' : 'valid',
        unit: row.unit,
        method: row.method,
        purpose: row.purpose,
        operator: 'Excel批次匯入員',
        verified: true,
      });
    });

    onAddRecords(recordsToAppend);
    setImportSummary({
      successCount: success,
      failedCount: failed,
      duplicateCount: dup,
      executed: true,
    });
  };

  // 人工單筆登錄送出 (F01, F02, F03)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalVal: number | null = null;
    let finalStatus = manualForm.valueStatus;

    if (finalStatus === 'valid') {
      if (manualForm.valueStr === '') {
        alert('若標註為「有效實測值」，請填寫數值；若未測請選擇「未測 (Not Tested)」');
        return;
      }
      finalVal = parseFloat(manualForm.valueStr);
      if (isNaN(finalVal)) {
        alert('數值格式不正確，請輸入有效浮點數或整數');
        return;
      }
    } else {
      finalVal = null;
    }

    const newRecord: QualityRecord = {
      id: `REC-MANUAL-${Date.now()}`,
      testTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      batchNo: manualForm.batchNo.trim(),
      product: manualForm.product,
      thickness: Number(manualForm.thickness),
      samplingLocation: manualForm.samplingLocation,
      testItem: manualForm.testItem,
      direction: manualForm.direction,
      value: finalVal,
      valueStatus: finalStatus,
      unit: manualForm.unit,
      method: manualForm.method,
      purpose: manualForm.purpose,
      operator: manualForm.operator,
      verified: true,
      remarks: manualForm.remarks,
    };

    onAddRecords([newRecord]);
    alert(`批號 ${manualForm.batchNo} 檢測紀錄已成功登錄！`);
  };

  return (
    <div className="space-y-6">
      {/* 匯入來源方式切換分頁 (Excel / ERP / Word / 人工登錄) */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveImportMode('excel')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-medium cursor-pointer transition ${
            activeImportMode === 'excel'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>既有 Excel 格式匯入 (F01)</span>
        </button>

        <button
          onClick={() => setActiveImportMode('erp')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-medium cursor-pointer transition ${
            activeImportMode === 'erp'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ERP 系統匯出轉入 (F01)</span>
        </button>

        <button
          onClick={() => setActiveImportMode('word')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-medium cursor-pointer transition ${
            activeImportMode === 'word'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>實驗室 Word 報告萃取 (F01)</span>
        </button>

        <button
          onClick={() => setActiveImportMode('manual')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-medium cursor-pointer transition ${
            activeImportMode === 'manual'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>人工單筆檢測登錄 (F01, F02)</span>
        </button>
      </div>

      {activeImportMode === 'excel' && (
        <div className="space-y-6">
          {/* 上傳與預覽面板 (F01) */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Excel 批次資料預覽與欄位自動對齊 (Preview Before Import)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  支援既有品管檢測 Excel 檔案拖曳解析，匯入前提供完整預覽與資料檢驗，絕不無聲漏入。
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => alert('已下載標準品管資料欄位範本 (包含 F02 統一欄位)')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
                >
                  下載標準 Excel 範本
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>確認並執行匯入</span>
                </button>
              </div>
            </div>

            {/* 匯入校驗結果橫幅 (F01: 顯示成功、失敗及重複筆數；失敗資料標示原因) */}
            {importSummary && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-300">成功匯入筆數</span>
                    <p className="text-lg font-bold font-mono text-emerald-400">{importSummary.successCount} 筆</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-rose-300">失敗筆數 (已阻擋漏入)</span>
                    <p className="text-lg font-bold font-mono text-rose-400">{importSummary.failedCount} 筆</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                  <Copy className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-300">疑似重複筆數 (已過濾)</span>
                    <p className="text-lg font-bold font-mono text-amber-400">{importSummary.duplicateCount} 筆</p>
                  </div>
                </div>
              </div>
            )}

            {/* 預覽表格 */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">行號</th>
                    <th className="py-2.5 px-3">批號 (Batch)</th>
                    <th className="py-2.5 px-3">產品品名</th>
                    <th className="py-2.5 px-3">厚度</th>
                    <th className="py-2.5 px-3">取樣位置</th>
                    <th className="py-2.5 px-3">測試項目</th>
                    <th className="py-2.5 px-3">方向</th>
                    <th className="py-2.5 px-3">原始數值</th>
                    <th className="py-2.5 px-3">單位</th>
                    <th className="py-2.5 px-3">檢驗方法</th>
                    <th className="py-2.5 px-3">檢核狀態 (Validation)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {previewRows.map((row) => (
                    <tr
                      key={row.rawId}
                      className={
                        row.status === 'error'
                          ? 'bg-rose-950/20'
                          : row.status === 'duplicate'
                          ? 'bg-amber-950/20'
                          : 'hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{row.rawId}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                        {row.batchNo || <span className="text-rose-400 font-bold">[未填寫]</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{row.product}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{row.thickness} mm</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-sky-300 border border-slate-700">
                          {row.location}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-100 font-medium">{row.item}</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.direction}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-100">
                        {row.rawVal === '' ? (
                          <span className="text-amber-400 italic">空白 (未測/缺)</span>
                        ) : (
                          row.rawVal
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{row.unit}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{row.method}</td>
                      <td className="py-2.5 px-3">
                        {row.status === 'valid' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
                            ✓ 合格可匯入
                          </span>
                        )}
                        {row.status === 'not_tested' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                            ○ 未測 (保持NULL)
                          </span>
                        )}
                        {row.status === 'duplicate' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                            ⚠ 疑似重複批次
                          </span>
                        )}
                        {row.status === 'error' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                            ✕ {row.checkResult}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeImportMode === 'manual' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="border-b border-slate-800 pb-3 mb-5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>人工檢測資料即時登錄 (F01, F02 統一欄位規範)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              品管現場作業員即時登錄，資料直接供早報、趨勢與預警查詢共用，毋需重複建檔。
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">生產批號 (Batch No) *</label>
                <input
                  type="text"
                  required
                  value={manualForm.batchNo}
                  onChange={(e) => setManualForm({ ...manualForm, batchNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="例如 B261026-A1"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">產品規格品名 *</label>
                <select
                  value={manualForm.product}
                  onChange={(e) => setManualForm({ ...manualForm, product: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="SUS304-EP 精密鋼帶">SUS304-EP 精密鋼帶</option>
                  <option value="PET-OPT 光學級薄膜">PET-OPT 光學級薄膜</option>
                  <option value="C1100-HV 導電高韌銅箔">C1100-HV 導電高韌銅箔</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">厚度規格 (Thickness, mm) *</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={manualForm.thickness}
                  onChange={(e) => setManualForm({ ...manualForm, thickness: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">取樣位置 (Sampling Location - F06) *</label>
                <select
                  value={manualForm.samplingLocation}
                  onChange={(e) => setManualForm({ ...manualForm, samplingLocation: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sky-300 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="LM">LM (中心線 - Centerline)</option>
                  <option value="Edge_DS">邊部 (Edge DS 傳動側)</option>
                  <option value="Edge_WS">邊部 (Edge WS 操作側)</option>
                  <option value="Head">卷頭部 (Head)</option>
                  <option value="Tail">卷尾部 (Tail)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">測試項目 (Test Item) *</label>
                <select
                  value={manualForm.testItem}
                  onChange={(e) => setManualForm({ ...manualForm, testItem: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="抗拉強度 Tensile Strength">抗拉強度 Tensile Strength (MPa)</option>
                  <option value="斜對角差 Diagonal Difference">斜對角差 Diagonal Difference (mm)</option>
                  <option value="延伸率 Elongation">延伸率 Elongation (%)</option>
                  <option value="表面粗糙度 Ra">表面粗糙度 Ra (μm)</option>
                  <option value="厚度偏差 Thickness Dev">厚度偏差 Thickness Dev (μm)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">方向 / 面別 (Direction) *</label>
                <select
                  value={manualForm.direction}
                  onChange={(e) => setManualForm({ ...manualForm, direction: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="MD">MD (縱向軋延方向)</option>
                  <option value="TD">TD (橫向垂直方向)</option>
                  <option value="Top">Top (正面)</option>
                  <option value="Bottom">Bottom (反面)</option>
                  <option value="None">None (無方向性)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  數值狀態 (F03: 嚴格區分未測、缺與0) *
                </label>
                <select
                  value={manualForm.valueStatus}
                  onChange={(e) => setManualForm({ ...manualForm, valueStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="valid">實測有效數值 (Valid Measured)</option>
                  <option value="not_tested">未測 (Not Tested - 探針/機台維護等)</option>
                  <option value="missing">缺資料 (Missing Data - 等待重抽)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  檢測實測數值 (若非實測請留空)
                </label>
                <input
                  type="text"
                  disabled={manualForm.valueStatus !== 'valid'}
                  value={manualForm.valueStr}
                  onChange={(e) => setManualForm({ ...manualForm, valueStr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-40"
                  placeholder="例如 695 或 0.0"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">單位 (Unit)</label>
                <input
                  type="text"
                  value={manualForm.unit}
                  onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">檢驗方法 (Method)</label>
                <input
                  type="text"
                  value={manualForm.method}
                  onChange={(e) => setManualForm({ ...manualForm, method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">檢驗目的 (Purpose)</label>
                <select
                  value={manualForm.purpose}
                  onChange={(e) => setManualForm({ ...manualForm, purpose: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="例行品檢 Routine">例行品檢 Routine</option>
                  <option value="製程變更驗證 Process Change">製程變更驗證 Process Change</option>
                  <option value="首件檢驗 FAI">首件檢驗 FAI</option>
                  <option value="客訴調查 Claim">客訴調查 Claim</option>
                  <option value="研發試車 Pilot">研發試車 Pilot</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">檢驗操作人員</label>
                <input
                  type="text"
                  value={manualForm.operator}
                  onChange={(e) => setManualForm({ ...manualForm, operator: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">備註說明與現場異常紀錄</label>
              <input
                type="text"
                value={manualForm.remarks}
                onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="選填：例如新更換刀片首卷、外觀有微刮痕等..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                確認登錄此筆檢測資料
              </button>
            </div>
          </form>
        </div>
      )}

      {(activeImportMode === 'erp' || activeImportMode === 'word') && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <h3 className="text-sm font-bold text-slate-100 mb-2">
            {activeImportMode === 'erp' ? 'ERP 系統匯出批次轉入機制' : '實驗室 Word 檢驗報告文字批次萃取'}
          </h3>
          <p className="text-slate-400 mb-4">
            針對非標準 Excel 的來源（如 ERP 轉出的定寬文字檔、Word 檢驗憑證），系統依據 F01 規範提供格式對應器：
          </p>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-mono text-[11px] text-slate-300">
            <div className="text-sky-400 font-semibold">// 來源資料範例預覽：</div>
            <p>BATCH: B261026-ERP9 | ITEM: TS_MD | VALUE: 692 MPa | LOC: CENTER_LM | OP: 9942</p>
            <p>BATCH: B261026-ERP9 | ITEM: WARPAGE | VALUE: 0.28 mm | LOC: EDGE_DS | OP: 9942</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-slate-400">已自動套用 ERP 轉換正規化規則 (SOP-ERP-QC-MAPPING-2026)</span>
            <button
              onClick={() => {
                alert('模擬 ERP 批次已轉入預覽隊列，請切換至「既有 Excel 格式匯入」查看。');
                setActiveImportMode('excel');
              }}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
            >
              載入轉換資料至預覽清單
            </button>
          </div>
        </div>
      )}

      {/* F03: 資料品質檢查待確認清單 (Data Quality Issues Queue) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>資料品質檢查把關待確認清單 (F03 Data Quality Gate)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              嚴格檢查欄位缺漏、格式錯誤、單位不一致；區分「未測」、「缺資料」與數值 0。不自動當成 0，亦不直接刪除疑似異常值。
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/30">
            {qualityIssues.filter((q) => q.status === 'pending').length} 件待確認
          </span>
        </div>

        <div className="space-y-3">
          {qualityIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                issue.status === 'resolved'
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : issue.severity === 'error'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-amber-950/20 border-amber-500/30'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-sky-300">{issue.batchNo}</span>
                  <span className="text-slate-400 font-medium">[{issue.testItem}]</span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      issue.severity === 'error'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {issue.type}
                  </span>
                  {issue.status === 'resolved' && (
                    <span className="text-emerald-400 font-semibold">✓ 已校核處理</span>
                  )}
                </div>
                <p className="text-slate-200">{issue.description}</p>
                <p className="text-slate-400 text-[11px]">
                  建議處置：<span className="text-indigo-300">{issue.suggestedAction}</span>
                </p>
              </div>

              {issue.status === 'pending' && (
                <div className="flex items-center space-x-2 shrink-0">
                  {issue.type === 'UNIT_MISMATCH' && (
                    <button
                      onClick={() => onResolveIssue(issue.id, 'auto_convert')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer"
                    >
                      一鍵換算為 MPa
                    </button>
                  )}
                  {issue.type === 'ZERO_AMBIGUITY' && (
                    <button
                      onClick={() => onResolveIssue(issue.id, 'mark_untested')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition cursor-pointer"
                    >
                      確認為「未測」
                    </button>
                  )}
                  <button
                    onClick={() => onResolveIssue(issue.id, 'confirm_zero')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer"
                  >
                    確認放行
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
