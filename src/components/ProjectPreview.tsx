import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Layers, 
  Cpu, 
  Database, 
  Layout, 
  ShieldCheck, 
  Bug, 
  Terminal,
  ExternalLink,
  ChevronRight,
  Zap,
  Eye,
  X,
  Code as CodeIcon,
  Monitor,
  Smartphone,
  RefreshCcw,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AgentStatus } from './AgentSwarmNode';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  isCompleted: boolean;
  lastMessage?: string;
  output?: string;
  history?: { message: string; type: 'log' | 'code' }[];
}

interface ProjectPreviewProps {
  agents: AgentInfo[];
  onClose: () => void;
  onModify: (agentName: string, request: string) => void;
}

export function ProjectPreview({ agents, onClose, onModify }: ProjectPreviewProps) {
  const [activeTab, setActiveTab] = useState<'architecture' | 'live'>('architecture');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const completedAgents = agents.filter(a => a.isCompleted);
  const progressPercent = Math.round((completedAgents.length / agents.length) * 100);

  const getCombinedCode = () => {
    const assetCode = agents.find(a => a.id === 'asset')?.output || '';
    const frontendCode = agents.find(a => a.id === 'frontend')?.output || '';
    const backendCode = agents.find(a => a.id === 'backend')?.output || '';
    
    const cleanFrontend = frontendCode.replace(/```(html|javascript|typescript|jsx|tsx|css)?\n/g, '').replace(/```/g, '');
    const cleanAsset = assetCode.replace(/```(html|css)?\n/g, '').replace(/```/g, '');
    const cleanBackend = backendCode.replace(/```(javascript|typescript)?\n/g, '').replace(/```/g, '');

    const isFullHtml = cleanFrontend.toLowerCase().includes('<html');

    if (isFullHtml) return cleanFrontend;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
          <style>
            body { background: #020617; color: white; margin: 0; font-family: system-ui; }
            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
            ${cleanAsset}
          </style>
        </head>
        <body>
          <div id="root">${cleanFrontend}</div>
          <script>
            ${cleanBackend}
          </script>
        </body>
      </html>
    `;
  };

  const updatePreview = () => {
    if (activeTab !== 'live' || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(getCombinedCode());
    doc.close();
  };

  useEffect(() => {
    if (activeTab === 'live') {
      const timer = setTimeout(updatePreview, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, agents]);

  const getIcon = (id: string) => {
    switch (id) {
      case 'ceo': return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'strategy': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'frontend': return <Layout className="w-4 h-4 text-pink-400" />;
      case 'backend': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'game': return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'asset': return <Box className="w-4 h-4 text-purple-400" />;
      case 'qa': return <Bug className="w-4 h-4 text-orange-400" />;
      case 'security': return <ShieldCheck className="w-4 h-4 text-red-400" />;
      case 'debugger': return <Bug className="w-4 h-4 text-blue-400" />;
      case 'build': return <Terminal className="w-4 h-4 text-slate-400" />;
      case 'support': return <Zap className="w-4 h-4 text-lime-400" />;
      default: return <Box className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] p-6 space-y-6 overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-xs font-black tracking-[0.4em] uppercase text-white italic">NEURAL FORGE</h2>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Tab Switcher */}
           <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('architecture')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-2",
                  activeTab === 'architecture' ? "bg-white text-black" : "text-white/40 hover:text-white/60"
                )}
              >
                <CodeIcon size={10} /> ARCHITECTURE
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-2",
                  activeTab === 'live' ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-white/40 hover:text-white/60"
                )}
              >
                <Eye size={10} /> LIVE PREVIEW
              </button>
           </div>
           <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-all hover:scale-110">
              <X size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'architecture' ? (
            <motion.div 
              key="arch"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full grid grid-cols-12 gap-6"
            >
              {/* Left: Build Components */}
              <div className="col-span-8 flex flex-col space-y-4 min-h-0">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active System Modules</h3>
                  <span className="text-[9px] font-mono text-white/20 uppercase">{completedAgents.length} Integrated Units</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-4">
                  {agents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-5 rounded-2xl border transition-all relative overflow-hidden group",
                        agent.isCompleted 
                          ? "bg-white/[0.03] border-white/10 hover:border-emerald-500/30" 
                          : agent.status === 'Thinking' 
                            ? "bg-cyan-500/5 border-cyan-500/20 animate-pulse" 
                            : "bg-white/[0.01] border-white/5 opacity-50"
                      )}
                    >
                      {/* Background Glow */}
                      {agent.isCompleted && (
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onModify(agent.name, "Refine this module...")}
                            className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            MODIFY CORE <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
                          agent.isCompleted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"
                        )}>
                          {getIcon(agent.id)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white/90 uppercase tracking-wide">{agent.name}</h4>
                              {agent.isCompleted && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono text-emerald-400">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  VERIFIED
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-white/40 font-mono mb-3">{agent.role}</p>
                          
                          {agent.isCompleted ? (
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-white/60 leading-relaxed italic">
                                "{agent.lastMessage}"
                              </div>
                              {agent.output && (
                                <div className="relative group">
                                  <div className="absolute top-2 right-2 flex gap-2">
                                     <button 
                                       title="Download Source Content"
                                       onClick={() => {
                                         const blob = new Blob([agent.output || ''], { type: 'text/plain' });
                                         const url = URL.createObjectURL(blob);
                                         const a = document.createElement('a');
                                         a.href = url;
                                         a.download = `${agent.id}_output_${Date.now()}.txt`;
                                         document.body.appendChild(a);
                                         a.click();
                                         document.body.removeChild(a);
                                         URL.revokeObjectURL(url);
                                       }}
                                       className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all"
                                     >
                                        <ExternalLink className="w-3 h-3" />
                                     </button>
                                  </div>
                                  <pre className="p-3 bg-[#0a0a0a] rounded-lg border border-white/5 text-[10px] text-emerald-400/80 overflow-x-auto font-mono scrollbar-thin max-h-[150px]">
                                    {agent.output}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-[10px] font-mono text-white/20">
                              <div className="flex gap-1">
                                {[1,2,3].map(i => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                              </div>
                              SYNCING WITH NEURAL CORE...
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: Architecture & Analytics */}
              <div className="col-span-4 space-y-6">
                 <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">Internal Architecture</h3>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/40 uppercase">Module Integrity</span>
                          <span className="text-[10px] font-mono text-emerald-400">98.4%</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/40 uppercase">Neural Coherence</span>
                          <span className="text-[10px] font-mono text-cyan-400">OPTIMIZED</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/40 uppercase">Thread Latency</span>
                          <span className="text-[10px] font-mono text-amber-400">24ms</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                       <label className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] block mb-3">Build Logs</label>
                       <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                          {agents.filter(a => a.isCompleted).slice(-5).map((a, i) => (
                            <div key={i} className="flex gap-3 text-[10px] font-mono">
                               <span className="text-emerald-500/50">OK</span>
                               <span className="text-white/40 uppercase text-[9px]">{a.id} LINK STABLE</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Global Export</h3>
                    <p className="text-[10px] text-white/40 leading-relaxed font-mono">Integrated neural assets are ready for deployment via secure quantum handshake.</p>
                    <button 
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      RETURN TO SWARM
                    </button>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="live"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full flex flex-col gap-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button 
                      onClick={() => setViewMode('desktop')}
                      className={cn("p-1.5 rounded-md transition-all", viewMode === 'desktop' ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50")}
                    >
                      <Monitor size={14} />
                    </button>
                    <button 
                      onClick={() => setViewMode('mobile')}
                      className={cn("p-1.5 rounded-md transition-all", viewMode === 'mobile' ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50")}
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={updatePreview}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold text-white/40 hover:text-white/70 transition-all uppercase"
                  >
                    <RefreshCcw size={12} /> RE-IGNITE RENDER
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-400 uppercase">Live Neural Stream</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] rounded-3xl border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                
                <div className={cn(
                  "relative transition-all duration-700 bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_50px_rgba(16,185,129,0.1)] overflow-hidden",
                  viewMode === 'desktop' ? "w-full h-full rounded-xl border border-white/10" : "w-[375px] h-[667px] rounded-[3rem] border-[12px] border-slate-800"
                )}>
                  {viewMode === 'mobile' && (
                    <>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-20" />
                    </>
                  )}
                  <iframe
                    ref={iframeRef}
                    title="Neural Preview"
                    className="w-full h-full bg-transparent"
                    sandbox="allow-scripts allow-modals allow-forms"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
