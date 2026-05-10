import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Bot, 
  Code2, 
  ShieldCheck, 
  Terminal, 
  Wrench, 
  Package, 
  Truck, 
  Gamepad2, 
  Palette, 
  Bug, 
  Cpu,
  BrainCircuit,
  Settings,
  RefreshCcw,
  HeartPulse
} from 'lucide-react';

export type AgentStatus = 'Idle' | 'Thinking' | 'Coding' | 'Fixing' | 'Ready';

interface AgentSwarmNodeProps {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  isActive: boolean;
  isCompleted: boolean;
  isCEO?: boolean;
  isCollaborating?: boolean;
  isSelected?: boolean;
  lastMessage?: string;
  output?: string;
  history?: { message: string; type: 'log' | 'code' }[];
  x?: number;
  y?: number;
  inWeight?: number; 
  outWeight?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const getIcon = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('ceo') || r.includes('director')) return <BrainCircuit className="w-6 h-6 text-cyan-400" />;
  if (r.includes('architect')) return <Settings className="w-5 h-5 text-blue-400" />;
  if (r.includes('frontend')) return <Palette className="w-5 h-5 text-pink-400" />;
  if (r.includes('backend')) return <Cpu className="w-5 h-5 text-emerald-400" />;
  if (r.includes('game')) return <Gamepad2 className="w-5 h-5 text-orange-400" />;
  if (r.includes('asset')) return <Code2 className="w-5 h-5 text-cyan-400" />;
  if (r.includes('qa') || r.includes('tester')) return <ShieldCheck className="w-5 h-5 text-yellow-400" />;
  if (r.includes('security')) return <ShieldCheck className="w-5 h-5 text-red-500" />;
  if (r.includes('debugger')) return <Bug className="w-5 h-5 text-rose-400" />;
  if (r.includes('build') || r.includes('compiler')) return <Package className="w-5 h-5 text-indigo-400" />;
  if (r.includes('delivery')) return <Truck className="w-5 h-5 text-amber-400" />;
  if (r.includes('healer') || r.includes('aegis')) return <HeartPulse className="w-5 h-5 text-red-400" />;
  if (r.includes('support') || r.includes('handover')) return <Bot className="w-5 h-5 text-cyan-400" />;
  return <Bot className="w-5 h-5 text-gray-400" />;
};

export function AgentSwarmNode({ 
  name, 
  role, 
  status, 
  isActive, 
  isCompleted, 
  isCEO,
  isCollaborating,
  isSelected,
  lastMessage,
  output,
  history,
  x,
  y,
  inWeight = 0,
  outWeight = 0,
  className,
  onClick 
}: AgentSwarmNodeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'Thinking': return 'text-orange-400 bg-orange-400/10 border-orange-400/50';
      case 'Coding': return 'text-blue-400 bg-blue-400/10 border-blue-400/50';
      case 'Fixing': return 'text-red-400 bg-red-400/10 border-red-400/50';
      case 'Ready': return 'text-green-400 bg-green-400/10 border-green-400/50';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const isWorking = (isActive || isCollaborating) && status !== 'Idle' && status !== 'Ready';
  const isListening = isCollaborating && (status === 'Idle' || status === 'Ready');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isCEO ? 1.05 : 1,
        ...(x !== undefined && y !== undefined ? {
          x: x - (isCEO ? 75 : 65),
          y: y - 35,
        } : {})
      }}
      transition={{
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 },
        ...(x !== undefined && y !== undefined ? {
          x: { type: "spring", stiffness: 60, damping: 20 },
          y: { type: "spring", stiffness: 60, damping: 20 },
        } : {})
      }}
      whileHover={{ scale: isCEO ? 1.08 : 1.03, zIndex: 100 }}
      onClick={onClick}
      className={cn(
        x !== undefined && y !== undefined ? "absolute" : "relative",
        "p-2.5 rounded-lg border transition-all duration-300 cursor-pointer",
        "bg-black/90 backdrop-blur-xl",
        isCEO ? "border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.3)] w-[150px]" : "border-white/10 hover:border-white/20 shadow-xl w-[130px]",
        (isActive || isCollaborating) && !isCEO && "border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
        isSelected && "border-cyan-400 ring-1 ring-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-50",
        isCollaborating && "bg-cyan-500/5",
        isCompleted && "border-green-500/30 bg-green-500/5",
        className
      )}
    >
      {/* Floating Animation Layer */}
      <motion.div
        animate={{ 
          y: isWorking ? [0, -3, 0] : isListening ? [0, -1, 0] : 0,
          rotateZ: isWorking ? [0, 0.5, -0.5, 0] : isListening ? [0, 0.2, -0.2, 0] : 0
        }}
        transition={{
          y: { repeat: Infinity, duration: isWorking ? 1.5 : 3, ease: "easeInOut" },
          rotateZ: { repeat: Infinity, duration: isWorking ? 0.5 : 1.5, ease: "easeInOut" }
        }}
      >
        {/* Glow Effect for CEO */}
        {isCEO && (
          <div className="absolute inset-0 rounded-lg bg-cyan-500/5 animate-pulse pointer-events-none" />
        )}

        {/* Neon Ring for Collaborating Nodes */}
        {isCollaborating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.02, 1],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -inset-0.5 rounded-lg border border-cyan-500/40 blur-[1px] pointer-events-none"
          />
        )}

        <div className="flex items-start justify-between mb-2">
          <div 
            className={cn(
              "p-1.5 rounded-md bg-black/40 relative group/icon",
              (isActive || isCEO || isCollaborating) && "shadow-[0_0_10px_rgba(6,182,212,0.3)] border border-cyan-500/20",
              isCollaborating && "bg-cyan-500/10"
            )}
            title={`${name} - ${role}`}
          >
            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-black/95 border border-cyan-500/30 rounded-md text-[8px] whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-all duration-200 pointer-events-none z-[110] shadow-[0_0_15px_rgba(6,182,212,0.3)] translate-y-1 group-hover/icon:translate-y-0">
              <div className="font-bold text-white tracking-wider mb-0.5">{name}</div>
              <div className="text-cyan-400 font-mono uppercase text-[7px]">{role}</div>
            </div>

            {getIcon(role)}
            {(inWeight > 0 || outWeight > 0) && (
              <div className="absolute -top-1 -left-1 flex gap-1">
                {inWeight > 2 && (
                  <div className="text-[6px] px-1 bg-rose-500 text-white rounded-sm font-bold shadow-lg animate-pulse" title="Potential Bottleneck">
                    !
                  </div>
                )}
              </div>
            )}
            {isCollaborating && (
              <motion.div 
                className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>
          <div className={cn(
            "px-1.5 py-0.5 rounded text-[7px] font-mono border uppercase tracking-wider",
            getStatusColor(),
            isWorking && "animate-pulse",
            isCollaborating && "border-cyan-500/50 shadow-[0_0_5px_rgba(6,182,212,0.2)]"
          )}>
            {isCollaborating && status === 'Idle' ? 'Syncing' : status}
          </div>
        </div>

        <h3 className={cn(
          "text-[11px] font-bold text-white/90 truncate",
          isCEO && "text-cyan-400"
        )}>{name}</h3>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[7px] text-white/40 font-mono uppercase tracking-[0.1em]">{role}</p>
          <div className="flex gap-1 opacity-40 scale-75 origin-right">
            <div className="flex items-center gap-0.5" title="In-bound dependencies">
              <RefreshCcw className="w-2 h-2 text-cyan-400 rotate-180" />
              <span className="text-[7px] font-mono text-cyan-400">{inWeight}</span>
            </div>
            <div className="flex items-center gap-0.5" title="Out-bound dependencies">
              <RefreshCcw className="w-2 h-2 text-blue-400" />
              <span className="text-[7px] font-mono text-blue-400">{outWeight}</span>
            </div>
          </div>
        </div>

        {/* Progress Line */}
        <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors",
              isCompleted ? "bg-green-500" : (isActive || isCEO) ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/10"
            )}
            initial={{ width: 0 }}
            animate={{ width: isCompleted ? '100%' : (isActive || isCEO) ? '100%' : '0%' }}
            transition={{ duration: 1 }}
          />
        </div>

        {/* Selected State Details (Insight Panel mirroring) */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/5 overflow-hidden"
            >
              <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
                {/* Current Activity */}
                {(lastMessage || output) && (
                  <div className="space-y-3">
                    {lastMessage && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">Active Neural Pulse</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        </div>
                        <p className="text-[10px] text-white/70 leading-relaxed bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]">
                          {lastMessage}
                        </p>
                      </div>
                    )}
                    {output && (
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-emerald-400/50 uppercase tracking-widest">Compilation Fragment</span>
                        <pre className="text-[9px] text-emerald-400/80 bg-black/60 p-2 rounded-lg border border-white/5 overflow-x-auto whitespace-pre-wrap">
                          {output}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* History Section */}
                {history && history.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest block">Activity Thread history</span>
                    <div className="space-y-2">
                      {history.slice(-5).map((h, i) => (
                        <div key={i} className="text-[9px] text-white/40 border-l border-white/10 pl-2 py-1 italic">
                          {h.message.length > 100 ? h.message.substring(0, 100) + '...' : h.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!lastMessage && !output && (
                  <p className="text-[9px] text-white/20 italic text-center py-4">Awaiting neural activation sequence...</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>

  );
}
