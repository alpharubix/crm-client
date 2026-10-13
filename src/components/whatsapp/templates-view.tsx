import React, { useState } from 'react';
import type { WhatsAppTemplate } from '@/types/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ArrowLeft,
  Plus,
  RefreshCw,
  Edit2,
  Calendar,
  Cloud,
  ChevronDown,
} from 'lucide-react';

interface TemplatesViewProps {
  templates: WhatsAppTemplate[];
  onBack: () => void;
  onSync: () => Promise<void>;
  channelName?: string;
  channelPhone?: string;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onBack,
  onSync,
  channelName = 'R1Xchange',
  channelPhone = '919364111650',
}) => {
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(
    templates[0] || null
  );
  const [syncing, setSyncing] = useState(false);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. Header matching TeleCRM Screenshot 3 */}
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
            <span>Templates</span>
            <button
              onClick={handleSync}
              className="text-slate-400 hover:text-indigo-600 transition-colors ml-1"
              title="Sync Templates from Meta"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-mono ml-2">
            {channelName}: {channelPhone}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium text-slate-600 border-slate-200 gap-1.5"
          >
            <Cloud className="h-3.5 w-3.5 text-slate-400" />
            <span>Cloud API</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium text-slate-600 border-slate-200 gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Today</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* 2. Main Body Grid: Left templates list, Right detail + analytics */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Template List */}
        <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col h-full">
          <div className="p-3 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search template(s) by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/60"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-medium">
                {filtered.length} Templates
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Template</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((tmpl) => {
              const isSelected = selectedTemplate?.name === tmpl.name;
              return (
                <div
                  key={tmpl.id || tmpl.name}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/60 border-l-4 border-indigo-600 pl-2.5'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-indigo-900">
                      {tmpl.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {tmpl.category}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {tmpl.components.find((c) => c.type === 'BODY')?.text || ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-300">→</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail & Performance Panel */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          {selectedTemplate ? (
            <>
              {/* Template Title & Category Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedTemplate.name}
                  </h2>
                  <Edit2 className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                  <Badge
                    variant="secondary"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase tracking-wider ml-2"
                  >
                    {selectedTemplate.category}-({selectedTemplate.language || 'en'})
                  </Badge>
                </div>
              </div>

              {/* Grid: Preview Card + Financial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Preview Box with purple header */}
                <div className="md:col-span-1 rounded-2xl bg-[#F6F5FC] border border-purple-100 p-4 space-y-2 shadow-sm">
                  <div className="font-bold text-xs text-slate-800">
                    {selectedTemplate.name}
                  </div>
                  <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {selectedTemplate.components.find((c) => c.type === 'BODY')?.text ||
                      'No preview body available'}
                  </div>
                </div>

                {/* Amount Spent Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                    Amount Spent
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    ₹0.00
                  </div>
                </div>

                {/* Cost Per Message Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1">
                    Cost Per Message
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    ₹0.00
                  </div>
                </div>
              </div>

              {/* Performance Metrics Cards matching TeleCRM Screenshot 3 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 tracking-tight">
                  Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xl font-bold text-slate-800 mb-0.5">0</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Sent
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xl font-bold text-slate-800 mb-0.5">0</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Delivered
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xl font-bold text-slate-800 mb-0.5">0</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Read
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xl font-bold text-slate-800 mb-0.5">0</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Replied
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range Chart Placeholder matching TeleCRM Screenshot 3 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[220px] text-slate-400 text-xs shadow-xs relative">
                <div className="absolute top-4 right-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] font-medium text-slate-500 border-slate-200 gap-1 px-2"
                  >
                    <span>Sent, Delivered, Read</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </div>
                <span>No data available for the selected date range</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a template to view details and performance metrics
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
