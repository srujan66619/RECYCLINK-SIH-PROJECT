import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, ArrowRight, Play, Pause, RotateCcw, 
  X, QrCode, Cpu, Scale, Building2, Truck, ShieldCheck, Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STEPS = [
  {
    step: 1,
    title: "1. Collector Mobile Intake",
    view: "collector",
    route: "/collector/dashboard",
    description: "Informal Kabadiwala opens simplified mobile interface with touch-friendly layout.",
    icon: "📱"
  },
  {
    step: 2,
    title: "2. AI Material Scanner",
    view: "collector",
    route: "/collector/identify",
    description: "Computer Vision analyzes high-grade PCB: 94% confidence, 2.4 kg, detecting recoverable gold/copper.",
    icon: "💻"
  },
  {
    step: 3,
    title: "3. Fair-Price Intelligence",
    view: "collector",
    route: "/collector/fair-price",
    description: "Pricing engine checks CPCB open benchmark: Recommended ₹455/kg (Lot total: ₹1,092).",
    icon: "⚖️"
  },
  {
    step: 4,
    title: "4. Smart Recycler Matching",
    view: "collector",
    route: "/collector/recyclers",
    description: "Matches with GreenCycle E-Waste (CPCB Licensed, 4.2 km away, offering top rate ₹465/kg).",
    icon: "🏢"
  },
  {
    step: 5,
    title: "5. Lot Created & QR Code",
    view: "collector",
    route: "/collector/lots",
    description: "Generated tamper-evident Trace ID 'RC-2026-000184' and digital intake QR ticket.",
    icon: "🏷️"
  },
  {
    step: 6,
    title: "6. Recycler Portal & Logistics",
    view: "recycler",
    route: "/recycler",
    description: "Authorized recycler accepts lot and dispatches GPS logistics vehicle for verified collection.",
    icon: "🚚"
  },
  {
    step: 7,
    title: "7. Digital Scale Handover",
    view: "recycler",
    route: "/recycler",
    description: "Recycler verifies certified weight (2.4 kg) and instantly disburses ₹1,116 payout via UPI.",
    icon: "✅"
  },
  {
    step: 8,
    title: "8. Circular Trace Explorer",
    view: "trace",
    route: "/trace/RC-2026-000001",
    description: "Public verifiable 7-stage chain of custody proven on immutable audit ledger.",
    icon: "🔗"
  },
  {
    step: 9,
    title: "9. National Impact Metrics",
    view: "admin",
    route: "/admin",
    description: "CPCB and Government dashboard reflects +2.4 kg formalization & zero toxic leakage into landfills.",
    icon: "📊"
  }
];

export default function DemoTourModal({ isOpen, onClose, setActiveView }) {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const current = STEPS[currentStepIndex];

  useEffect(() => {
    if (!isOpen) return;
    if (typeof setActiveView === 'function') {
      setActiveView(current.view);
    }
    if (current.route) {
      navigate(current.route);
    }
  }, [currentStepIndex, isOpen, navigate]);

  useEffect(() => {
    let timer;
    if (isPlaying && isOpen) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= STEPS.length - 1) {
            setIsPlaying(false);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            return prev;
          }
          return prev + 1;
        });
      }, 5500); // 5.5s per step = 49s total presentation time! Perfect for 90s pitch!
    }
    return () => clearInterval(timer);
  }, [isPlaying, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5">
      <div className="glass-panel p-5 rounded-2xl border-2 border-emerald-500/80 shadow-2xl bg-slate-950/95 space-y-3 relative">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{current.icon}</span>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                SIH Judge 90s Guided Flow ({currentStepIndex + 1}/{STEPS.length})
              </span>
              <h4 className="font-display font-bold text-sm text-white">{current.title}</h4>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
          {current.description}
        </p>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {STEPS.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition ${
                idx === currentStepIndex ? 'bg-emerald-400' :
                idx < currentStepIndex ? 'bg-emerald-800' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-1 shadow-md shadow-emerald-500/20"
            >
              <span>{currentStepIndex === STEPS.length - 1 ? 'Finish' : 'Next Step'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
