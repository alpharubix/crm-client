import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { WhatsAppTemplate } from '@/types/whatsapp';
import { sendBroadcastCampaign } from '@/api/whatsapp';
import {
  Search,
  ArrowLeft,
  Plus,
  Megaphone,
  CheckCircle2,
  Users,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';

interface BroadcastsViewProps {
  onBack: () => void;
  templates?: WhatsAppTemplate[];
  channelName?: string;
  channelPhone?: string;
}

export const BroadcastsView: React.FC<BroadcastsViewProps> = ({
  onBack,
  templates = [],
  channelName = 'R1Xchange',
  channelPhone = '919364111650',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState('');
  const [campaignName, setCampaignName] = useState(`Broadcast_${new Date().toLocaleDateString()}`);

  // Broadcast Mode: 'template' | 'text'
  const [sendMode, setSendMode] = useState<'template' | 'text'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  // Excel parsed data
  const [fileName, setFileName] = useState('');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [phoneCol, setPhoneCol] = useState('');
  const [messageCol, setMessageCol] = useState(''); // Used if sendMode === 'text'

  // Variable mappings for templates: { "header_1": colName, "body_1": colName, ... }
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({});

  // Sending status
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template variables extraction
  const headerComp = selectedTemplate?.components.find((c) => c.type === 'HEADER');
  const headerVars = Array.from(new Set((headerComp?.text || '').match(/\{\{(\d+)\}\}/g) || []));

  const bodyComp = selectedTemplate?.components.find((c) => c.type === 'BODY');
  const bodyVars = Array.from(new Set((bodyComp?.text || '').match(/\{\{(\d+)\}\}/g) || []));

  // Past broadcast campaigns mockup
  const [pastCampaigns, setPastCampaigns] = useState([
    { id: '1', name: 'Product Launch Update', timeAgo: '2d', leads: 45, rate: '98%', rateColor: 'border-emerald-500 text-emerald-600' },
    { id: '2', name: 'Weekend Payment Alert', timeAgo: '4d', leads: 120, rate: '94%', rateColor: 'border-amber-500 text-amber-600' },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length > 0) {
          const headers = Object.keys(data[0] as object);
          setExcelHeaders(headers);
          setExcelRows(data);

          // Auto-detect phone column
          const detectedPhone = headers.find((h) =>
            /phone|mobile|contact|number|wa|whatsapp/i.test(h)
          ) || headers[0];
          setPhoneCol(detectedPhone);

          // Auto-detect message column if any
          const detectedMsg = headers.find((h) =>
            /message|msg|text|content|body/i.test(h)
          );
          if (detectedMsg) setMessageCol(detectedMsg);
        }
      } catch (err) {
        console.error('Error parsing Excel:', err);
        alert('Could not read this Excel file. Please ensure it is a valid .xlsx or .csv.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleStartBroadcast = async () => {
    if (!phoneCol) {
      alert('Please select the Phone Number column');
      return;
    }

    if (sendMode === 'template' && !selectedTemplate) {
      alert('Please select an approved WhatsApp template');
      return;
    }

    if (sendMode === 'text' && !messageCol) {
      alert('Please select the column that contains the message text');
      return;
    }

    setSending(true);
    try {
      // Build recipients payload
      const recipients = excelRows.map((row) => {
        let phone = String(row[phoneCol] || '').replace(/\D/g, '');
        // If 10-digit Indian number, prepend 91 automatically
        if (phone.length === 10) {
          phone = `91${phone}`;
        }

        if (sendMode === 'text') {
          return {
            phone,
            custom_text: String(row[messageCol] || '').trim(),
          };
        }

        // Template mode: construct components with mapped column values
        const components: any[] = [];

        // Header variables
        if (headerVars.length > 0) {
          const headerParams = headerVars.map((v) => {
            const num = v.replace(/[{}]/g, '');
            const col = variableMappings[`header_${num}`];
            const val = col && row[col] !== undefined ? String(row[col]) : '-';
            return { type: 'text', text: val };
          });
          components.push({ type: 'header', parameters: headerParams });
        }

        // Body variables
        if (bodyVars.length > 0) {
          const bodyParams = bodyVars.map((v) => {
            const num = v.replace(/[{}]/g, '');
            const col = variableMappings[`body_${num}`];
            const val = col && row[col] !== undefined ? String(row[col]) : '-';
            return { type: 'text', text: val };
          });
          components.push({ type: 'body', parameters: bodyParams });
        }

        return {
          phone,
          components,
        };
      });

      const res = await sendBroadcastCampaign({
        campaign_name: campaignName,
        send_mode: sendMode,
        template_name: selectedTemplate?.name,
        language_code: selectedTemplate?.language || 'en',
        recipients,
      });

      setSendResult({
        total: res.total,
        sent: res.sent,
        failed: res.failed,
        details: res.details,
      });

      // Append to past campaigns list
      setPastCampaigns((prev) => [
        {
          id: String(Date.now()),
          name: campaignName,
          timeAgo: 'Just now',
          leads: res.sent,
          rate: `${Math.round((res.sent / Math.max(res.total, 1)) * 100)}%`,
          rateColor: res.sent > 0 ? 'border-emerald-500 text-emerald-600' : 'border-red-500 text-red-600',
        },
        ...prev,
      ]);

      setStep(3);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Broadcast failed to execute');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFileName('');
    setExcelHeaders([]);
    setExcelRows([]);
    setPhoneCol('');
    setMessageCol('');
    setVariableMappings({});
    setSelectedTemplate(null);
    setSendResult(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. Header Bar */}
      <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-slate-500 hover:text-slate-700"
            title="Back to inbox"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
            <Megaphone className="h-4 w-4 text-indigo-600" />
            <span>Excel WhatsApp Broadcast</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono ml-2">
            {channelName}: {channelPhone}
          </span>
        </div>
      </div>

      {/* 2. Main Body Grid */}
      <div className="flex-1 flex overflow-hidden">

        {/* Right Campaign Wizard */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Stepper */}
            <div className="flex items-center justify-center gap-8 py-2">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step === 1
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className="text-xs font-semibold text-slate-700">1. Upload Excel</span>
              </div>

              <div className="h-0.5 w-16 bg-slate-200" />

              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step === 2
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : step > 2
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className="text-xs font-semibold text-slate-700">2. Configure Message</span>
              </div>

              <div className="h-0.5 w-16 bg-slate-200" />

              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step === 3
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  3
                </div>
                <span className="text-xs font-semibold text-slate-700">3. Results</span>
              </div>
            </div>

            {/* STEP 1: Upload Excel & Map Phone */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Upload Numbers Sheet</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload an Excel (.xlsx) or CSV file with your recipient phone numbers and custom data.
                  </p>
                </div>

                {/* Campaign Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Campaign Name</label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="E.g. Diwali Offer Blast"
                    className="h-9 text-xs"
                  />
                </div>

                {/* File Dropzone */}
                {!fileName ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-500 mb-2" />
                    <span className="text-xs font-bold text-slate-700">Click to upload Excel or CSV</span>
                    <span className="text-[11px] text-slate-400 mt-1">Supports .xlsx, .xls, .csv</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{fileName}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {excelRows.length} rows detected
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFileName('');
                        setExcelRows([]);
                        setExcelHeaders([]);
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Map Phone Number Column */}
                {excelHeaders.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Select Phone Number Column <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={phoneCol}
                        onChange={(e) => setPhoneCol(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white text-xs px-2.5 font-medium text-slate-700"
                      >
                        {excelHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h} (Example: {excelRows[0]?.[h]})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preview first 3 rows */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Sample Rows Preview
                      </span>
                      <div className="mt-1.5 space-y-1">
                        {excelRows.slice(0, 3).map((r, i) => (
                          <div key={i} className="text-xs font-mono text-slate-600 flex gap-2">
                            <span className="text-slate-400">#{i + 1}:</span>
                            <span className="font-bold text-indigo-600">{r[phoneCol]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!excelRows.length || !phoneCol}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl px-6 h-9 shadow-sm"
                  >
                    Next: Choose Message &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Configure Template / Text */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Configure Broadcast Message</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose whether to send an approved WhatsApp template (works for cold leads) or custom text.
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSendMode('template')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      sendMode === 'template'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>WhatsApp Template</span>
                      {sendMode === 'template' && <span className="text-indigo-600">●</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Recommended. Delivered to cold and new leads without 24-hr limitation.
                    </div>
                  </div>

                  <div
                    onClick={() => setSendMode('text')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      sendMode === 'text'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                      <span>Custom Text Column</span>
                      {sendMode === 'text' && <span className="text-indigo-600">●</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Sends freeform message from an Excel column. Works for active conversations.
                    </div>
                  </div>
                </div>

                {/* If Template Mode */}
                {sendMode === 'template' && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Select Template</label>
                      <select
                        value={selectedTemplate?.name || ''}
                        onChange={(e) => {
                          const t = templates.find((item) => item.name === e.target.value);
                          setSelectedTemplate(t || null);
                          setVariableMappings({});
                        }}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white text-xs px-2.5 font-medium text-slate-700"
                      >
                        <option value="">-- Choose an approved template --</option>
                        {templates.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTemplate && (
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                        <div className="text-xs font-bold text-slate-800">
                          Template: {selectedTemplate.name}
                        </div>
                        <div className="text-xs text-slate-600 whitespace-pre-wrap font-normal">
                          {selectedTemplate.components.find((c) => c.type === 'BODY')?.text}
                        </div>

                        {/* Map Header Variables */}
                        {headerVars.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700">
                              Map Header Variable ({headerVars.join(', ')})
                            </span>
                            {headerVars.map((v) => {
                              const num = v.replace(/[{}]/g, '');
                              const key = `header_${num}`;
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold text-indigo-600">{v}</span>
                                  <select
                                    value={variableMappings[key] || ''}
                                    onChange={(e) =>
                                      setVariableMappings((prev) => ({ ...prev, [key]: e.target.value }))
                                    }
                                    className="flex-1 h-8 rounded-lg border border-slate-200 bg-white text-xs px-2"
                                  >
                                    <option value="">-- Select Excel column for {v} --</option>
                                    {excelHeaders.map((h) => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Map Body Variables */}
                        {bodyVars.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700">
                              Map Body Variables ({bodyVars.join(', ')})
                            </span>
                            {bodyVars.map((v) => {
                              const num = v.replace(/[{}]/g, '');
                              const key = `body_${num}`;
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold text-indigo-600">{v}</span>
                                  <select
                                    value={variableMappings[key] || ''}
                                    onChange={(e) =>
                                      setVariableMappings((prev) => ({ ...prev, [key]: e.target.value }))
                                    }
                                    className="flex-1 h-8 rounded-lg border border-slate-200 bg-white text-xs px-2"
                                  >
                                    <option value="">-- Select Excel column for {v} --</option>
                                    {excelHeaders.map((h) => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* If Text Mode */}
                {sendMode === 'text' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Message Text Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={messageCol}
                      onChange={(e) => setMessageCol(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white text-xs px-2.5 font-medium text-slate-700"
                    >
                      <option value="">-- Choose message column --</option>
                      {excelHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h} (Example: "{excelRows[0]?.[h]}")
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-3 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold rounded-xl h-9"
                  >
                    &larr; Back
                  </Button>
                  <Button
                    onClick={handleStartBroadcast}
                    disabled={sending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl px-6 h-9 shadow-sm gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Blasting {excelRows.length} Messages...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Send to {excelRows.length} Numbers Now</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Results Summary */}
            {step === 3 && sendResult && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-9 w-9" />
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-800">Broadcast Completed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your campaign "{campaignName}" has been dispatched via Meta WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-xl font-bold text-slate-800">{sendResult.total}</div>
                    <div className="text-[11px] text-slate-400 font-medium">Total Numbers</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <div className="text-xl font-bold text-emerald-600">{sendResult.sent}</div>
                    <div className="text-[11px] text-emerald-700 font-medium">Successfully Sent</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <div className="text-xl font-bold text-red-600">{sendResult.failed}</div>
                    <div className="text-[11px] text-red-700 font-medium">Failed</div>
                  </div>
                </div>

                {/* Display Failed Reasons If Any */}
                {sendResult.failed > 0 && sendResult.details && (
                  <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 text-left max-w-lg mx-auto space-y-2">
                    <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Failure Reason(s) from Meta:</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-red-700">
                      {sendResult.details
                        .filter((d: any) => d.status === 'failed')
                        .slice(0, 5)
                        .map((d: any, idx: number) => (
                          <div key={idx} className="font-mono bg-white p-1.5 rounded border border-red-100">
                            <strong>{d.phone}:</strong> {d.error}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    onClick={resetForm}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl px-6 h-9"
                  >
                    Start Another Broadcast
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="text-xs font-semibold rounded-xl h-9"
                  >
                    View in Chat Inbox
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastsView;
