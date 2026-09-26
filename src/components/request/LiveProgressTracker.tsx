import React from 'react';
import { Clock, Languages, CheckCircle2, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';

export type SubtitleRequestStatus = 'pending' | 'translating' | 'completed' | 'in_progress' | 'rejected';

interface LiveProgressTrackerProps {
  status: SubtitleRequestStatus;
  requestId?: string;
  isAdmin?: boolean;
  onStatusChange?: (newStatus: 'pending' | 'translating' | 'completed') => Promise<void>;
  compact?: boolean;
}

export const LiveProgressTracker: React.FC<LiveProgressTrackerProps> = ({
  status,
  isAdmin = false,
  onStatusChange,
  compact = false,
}) => {
  // Normalize legacy status 'in_progress' to 'translating'
  const currentStatus = status === 'in_progress' ? 'translating' : status;

  const steps = [
    {
      id: 'pending',
      label: 'Request Queued',
      shortLabel: 'Pending',
      description: 'Community voting & queue',
      icon: Clock,
      color: 'amber',
    },
    {
      id: 'translating',
      label: 'Translating',
      shortLabel: 'Translating',
      description: 'Translator actively syncing',
      icon: Languages,
      color: 'blue',
    },
    {
      id: 'completed',
      label: 'Completed',
      shortLabel: 'Completed',
      description: 'Subtitles ready to download',
      icon: CheckCircle2,
      color: 'emerald',
    },
  ];

  const getStepIndex = (s: string) => {
    if (s === 'completed') return 2;
    if (s === 'translating') return 1;
    return 0; // pending or other
  };

  const currentIndex = getStepIndex(currentStatus);

  // Status Badge Component
  const renderBadge = () => {
    switch (currentStatus) {
      case 'translating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping inline-block" />
            <Languages className="w-3.5 h-3.5" />
            Translating
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            In Queue
          </span>
        );
    }
  };

  if (compact) {
    return <div className="flex items-center gap-2">{renderBadge()}</div>;
  }

  return (
    <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-3.5 backdrop-blur-sm">
      {/* Header with status badge and admin status switcher */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Live Progress
          </span>
          {renderBadge()}
        </div>

        {/* Admin Quick Switcher */}
        {isAdmin && onStatusChange && (
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-[10px]">
            <span className="text-zinc-500 px-1 font-mono flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-netflix-red" /> Admin:
            </span>
            <button
              type="button"
              onClick={() => onStatusChange('pending')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                currentStatus === 'pending'
                  ? 'bg-amber-500/30 text-amber-300 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Queue
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('translating')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                currentStatus === 'translating'
                  ? 'bg-blue-500/30 text-blue-300 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Translate
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('completed')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                currentStatus === 'completed'
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Minimal Roadmap Timeline */}
      <div className="relative pt-1 pb-1">
        {/* Background connector line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-zinc-800 -z-0" />
        
        {/* Active connector fill line */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 transition-all duration-500 -z-0"
          style={{
            width: currentIndex === 0 ? '0%' : currentIndex === 1 ? '50%' : 'calc(100% - 3rem)',
          }}
        />

        {/* Step Items */}
        <div className="grid grid-cols-3 relative z-10 text-center">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCurrent
                      ? idx === 0
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/20 scale-110'
                        : idx === 1
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-2 ring-blue-400/20 shadow-lg shadow-blue-500/20 scale-110'
                        : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/20 shadow-lg shadow-emerald-500/20 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                  }`}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                </div>

                <div className="mt-2">
                  <p
                    className={`text-[11px] font-bold tracking-tight ${
                      isCurrent
                        ? idx === 0
                          ? 'text-amber-400'
                          : idx === 1
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                        : isCompleted
                        ? 'text-zinc-300'
                        : 'text-zinc-600'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[9px] text-zinc-500 font-medium hidden sm:block mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
