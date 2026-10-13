import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { WhatsAppTemplate } from '@/types/whatsapp';
import { Search, Send, RefreshCw } from 'lucide-react';

interface SendTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WhatsAppTemplate[];
  onSend: (templateName: string, language: string, components: any[]) => Promise<void>;
  onSync: () => Promise<void>;
}

export const SendTemplateDialog: React.FC<SendTemplateDialogProps> = ({
  open,
  onOpenChange,
  templates,
  onSend,
  onSync,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  // 1. Extract BODY component and variables
  const bodyComponent = selectedTemplate?.components.find((c) => c.type === 'BODY');
  const bodyText = bodyComponent?.text || '';
  const bodyVariables = Array.from(new Set(bodyText.match(/\{\{(\d+)\}\}/g) || []));

  // 2. Extract HEADER component and variables / media
  const headerComponent = selectedTemplate?.components.find((c) => c.type === 'HEADER');
  const headerFormat = headerComponent?.format; // TEXT, IMAGE, VIDEO, DOCUMENT
  const headerText = headerComponent?.text || '';
  const headerVariables = Array.from(new Set(headerText.match(/\{\{(\d+)\}\}/g) || []));

  const handleSelectTemplate = (tmpl: WhatsAppTemplate) => {
    setSelectedTemplate(tmpl);
    setParamValues({});
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    setSending(true);

    try {
      // Build components payload for Meta Cloud API
      const components: any[] = [];

      // A. HEADER Component
      if (headerComponent) {
        if (headerVariables.length > 0) {
          const headerParameters = headerVariables.map((v) => {
            const key = `header_${v.replace(/[{}]/g, '')}`;
            const val = paramValues[key]?.trim() || '-';
            return {
              type: 'text',
              text: val,
            };
          });
          components.push({
            type: 'header',
            parameters: headerParameters,
          });
        }
      }

      // B. BODY Component
      if (bodyVariables.length > 0) {
        const bodyParameters = bodyVariables.map((v) => {
          const key = `body_${v.replace(/[{}]/g, '')}`;
          const val = paramValues[key]?.trim() || '-';
          return {
            type: 'text',
            text: val,
          };
        });

        components.push({
          type: 'body',
          parameters: bodyParameters,
        });
      }

      await onSend(selectedTemplate.name, selectedTemplate.language || 'en', components);
      onOpenChange(false);
      setSelectedTemplate(null);
      setParamValues({});
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-slate-100 shadow-2xl bg-white">
        <DialogHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-800">
            Select Approved Template
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync from Meta
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 h-[460px]">
          {/* Template List Column */}
          <div className="flex flex-col p-4 overflow-hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg border-slate-200"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No approved templates found.
                </div>
              ) : (
                filtered.map((tmpl) => {
                  const isSelected = selectedTemplate?.name === tmpl.name;
                  return (
                    <div
                      key={tmpl.id || tmpl.name}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {tmpl.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 bg-slate-100 text-slate-600"
                        >
                          {tmpl.category}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-2">
                        {tmpl.components.find((c) => c.type === 'BODY')?.text || 'Template body'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Template Preview Column */}
          <div className="flex flex-col p-4 bg-slate-50/50 overflow-hidden">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Preview
            </span>
            {selectedTemplate ? (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    {selectedTemplate.name}
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTemplate.components.find((c) => c.type === 'BODY')?.text ||
                      'No preview body text available'}
                  </div>

                  {/* Dynamic Header Parameters Inputs */}
                  {headerVariables.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">HEADER</span>
                        <span>Header Variables:</span>
                      </div>
                      <div className="space-y-1.5">
                        {headerVariables.map((variable) => {
                          const num = variable.replace(/[{}]/g, '');
                          const paramKey = `header_${num}`;
                          return (
                            <div key={paramKey} className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {variable}
                              </span>
                              <Input
                                placeholder={`Header variable ${variable}...`}
                                value={paramValues[paramKey] || ''}
                                onChange={(e) =>
                                  setParamValues((prev) => ({
                                    ...prev,
                                    [paramKey]: e.target.value,
                                  }))
                                }
                                className="h-8 text-xs flex-1 rounded-lg border-slate-200"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Body Parameters Inputs */}
                  {bodyVariables.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">BODY</span>
                        <span>Body Variables:</span>
                      </div>
                      <div className="space-y-1.5">
                        {bodyVariables.map((variable) => {
                          const num = variable.replace(/[{}]/g, '');
                          const paramKey = `body_${num}`;
                          return (
                            <div key={paramKey} className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {variable}
                              </span>
                              <Input
                                placeholder={`Body variable ${variable}...`}
                                value={paramValues[paramKey] || ''}
                                onChange={(e) =>
                                  setParamValues((prev) => ({
                                    ...prev,
                                    [paramKey]: e.target.value,
                                  }))
                                }
                                className="h-8 text-xs flex-1 rounded-lg border-slate-200"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  {selectedTemplate.components
                    .filter((c) => c.type === 'BUTTONS')
                    .map((btnGrp, i) => (
                      <div key={i} className="pt-2 border-t border-slate-100 space-y-1.5">
                        {btnGrp.buttons?.map((b: any, bi: number) => (
                          <div
                            key={bi}
                            className="text-center py-1.5 px-3 rounded-lg border border-indigo-200 text-indigo-600 font-medium text-xs bg-indigo-50/30"
                          >
                            {b.text}
                          </div>
                        ))}
                      </div>
                    ))}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl h-10 shadow-sm gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending...' : 'Send Template'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a template on the left to preview
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
