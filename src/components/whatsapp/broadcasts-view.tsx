import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  ArrowLeft,
  Plus,
  RefreshCw,
  Megaphone,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface BroadcastsViewProps {
  onBack: () => void;
  channelName?: string;
  channelPhone?: string;
}

export const BroadcastsView: React.FC<BroadcastsViewProps> = ({
  onBack,
  channelName = 'R1Xchange',
  channelPhone = '919364111650',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState('');

  // Sample broadcasts list matching Screenshot 4
  const sampleBroadcasts = [
    { id: '1', name: '@testt', timeAgo: '4d', leads: 1, rate: '100%', rateColor: 'border-emerald-500 text-emerald-600' },
    { id: '2', name: '@test-s', timeAgo: '4d', leads: 1, rate: '100%', rateColor: 'border-amber-500 text-amber-600' },
    { id: '3', name: '@test', timeAgo: '5d', leads: 1, rate: '100%', rateColor: 'border-red-500 text-red-600' },
  ];

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
            <span>Broadcasts</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono ml-2">
            {channelName}: {channelPhone}
          </span>
        </div>
      </div>

      {/* 2. Main Body Grid: Left past campaigns list, Right wizard */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Broadcasts List */}
        <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col h-full">
          <div className="p-3 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search broadcast(s) by name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/60"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-medium">
                {sampleBroadcasts.length} Broadcasts
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="h-7 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Broadcast</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {sampleBroadcasts.map((bc) => (
              <div
                key={bc.id}
                className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs text-indigo-950">{bc.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <span>{bc.timeAgo}</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                      SG
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {bc.leads}
                    </span>
                  </div>
                </div>

                {/* Progress Ring matching TeleCRM Screenshot 4 */}
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-[10px] ${bc.rateColor}`}
                >
                  {bc.rate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Wizard: Create Broadcast */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Create Broadcast</h2>
            </div>

            {/* Stepper matching Screenshot 4: Select leads -> Select template -> Confirmation */}
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
                <span className="text-xs font-semibold text-indigo-600">
                  Select leads
                </span>
              </div>

              <div className="h-0.5 w-16 bg-slate-200" />

              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step === 2
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  2
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Select template
                </span>
              </div>

              <div className="h-0.5 w-16 bg-slate-200" />

              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step === 3
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  3
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Confirmation
                </span>
              </div>
            </div>

            {/* Step 1 Content matching Screenshot 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[10px]">
                  ✓
                </div>
                <span className="font-bold text-xs text-slate-800">
                  {channelName} : {channelPhone}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 min-h-[140px] flex flex-col justify-between">
                <div className="inline-block">
                  <span className="px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-600 font-medium bg-slate-50">
                    Whatsapp broadcast
                  </span>
                </div>

                <div className="text-center py-4">
                  <Button
                    variant="ghost"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    + Add a Condition
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => setStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl px-8 h-10 shadow-sm"
                >
                  Select Leads
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
