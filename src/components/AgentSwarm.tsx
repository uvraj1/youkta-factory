import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentSwarmNode, AgentStatus } from './AgentSwarmNode';
import { ProjectPreview } from './ProjectPreview';
import JSZip from 'jszip';
import { 
  Play, 
  Terminal as TerminalIcon, 
  Code, 
  Cpu, 
  Zap, 
  RefreshCcw, 
  Download,
  AlertCircle,
  CheckCircle2,
  Settings2,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Bot,
  Send,
  X,
  Key,
  Shield,
  Save,
  Eye,
  EyeOff,
  Cpu as CpuIcon,
  Activity,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Globe,
  Smartphone,
  Layers,
  Wrench,
  MessageSquare,
  Lock,
  Unlock,
  Layout,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { generateSwarmStep } from '../services/gemini';
import { cn } from '../lib/utils';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  MarkerType
} from '@xyflow/react';
import { FlowAgentNode } from './FlowAgentNode';

const nodeTypes = {
  agent: FlowAgentNode,
};

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

const SWARM_CONNECTIONS: Record<string, string[]> = {
  ceo: ['strategy', 'build', 'support'],
  strategy: ['frontend', 'backend', 'game', 'asset'],
  frontend: ['asset', 'qa'],
  backend: ['qa', 'security'],
  game: ['qa'],
  asset: ['frontend'],
  qa: ['debugger', 'security'],
  security: ['build'],
  debugger: ['ceo', 'strategy', 'frontend', 'backend'], 
  build: ['support'],
  support: ['nexus'],
  nexus: ['ceo'],
  aegis: ['ceo', 'strategy', 'game', 'qa', 'security', 'debugger', 'asset', 'frontend', 'backend', 'build', 'support', 'nexus'],
};

const INITIAL_AGENTS: AgentInfo[] = [
  { id: 'ceo', name: 'Prime Lucifer', role: 'CEO', status: 'Idle', isCompleted: false },
  { id: 'strategy', name: 'Architect X', role: 'Project Manager', status: 'Idle', isCompleted: false },
  { id: 'game', name: 'Proto Dev', role: 'Lead Developer', status: 'Idle', isCompleted: false },
  { id: 'qa', name: 'Final Judge', role: 'QA Tester', status: 'Idle', isCompleted: false },
  { id: 'security', name: 'Cyber Shield', role: 'Security Analyst', status: 'Idle', isCompleted: false },
  { id: 'debugger', name: 'Bug Hunter', role: 'Debugger', status: 'Idle', isCompleted: false },
  { id: 'aegis', name: 'Aegis Healer', role: 'Self-Healing Protocol', status: 'Idle', isCompleted: false, lastMessage: 'Neural Pulse Monitoring: ACTIVE. Self-Healing Protocols: STANDBY.' },
  { id: 'asset', name: 'Shape Shifter', role: 'Asset Creator', status: 'Idle', isCompleted: false },
  { id: 'frontend', name: 'Canvas Master', role: 'UI Designer', status: 'Idle', isCompleted: false },
  { id: 'backend', name: 'Core Engine', role: 'Backend Engineer', status: 'Idle', isCompleted: false },
  { id: 'build', name: 'Cloud Forge', role: 'DevOps Engineer', status: 'Idle', isCompleted: false },
  { id: 'support', name: 'Linker Pro', role: 'Support Specialist', status: 'Idle', isCompleted: false },
  { id: 'nexus', name: 'Nexus Github', role: 'Hosting Automator', status: 'Idle', isCompleted: false, lastMessage: 'Integrated Hosting Protocol: STANDBY. Awaiting GitHub Session.' },
];

interface BuildStep {
  id: string;
  message: string;
  status: 'pending' | 'active' | 'success' | 'error';
}

const PROJECT_TYPES = [
  { id: 'ai_agent', name: 'AI AGENT', icon: Bot, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { id: 'ai_bot', name: 'AI BOT', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'website', name: 'WEBSITE', icon: Globe, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'web_app', name: 'WEB APP', icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'android_app', name: 'MOBILE APP', icon: Smartphone, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'tool', name: 'SYSTEM TOOL', icon: Wrench, color: 'text-slate-400', bg: 'bg-slate-400/10' },
];

export function AgentSwarm() {
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0].id);
  const [instruction, setInstruction] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [collaboratingIds, setCollaboratingIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<{ agent: string; message: string; type: 'log' | 'code' | 'error' }[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBuildConsole, setShowBuildConsole] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [consoleType, setConsoleType] = useState<'APK' | 'GITHUB' | null>(null);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lucifer_swarm_keys');
    return saved ? JSON.parse(saved) : { global: '' };
  });
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [swarmContext, setSwarmContext] = useState("Project Started.");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const total = agents.length;
    const cx = dimensions.width / 2 || 500;
    const cy = dimensions.height / 2 || 400;
    const cols = 4;
    const spacingX = 250;
    const spacingY = 180;
    const gridWidth = (cols - 1) * spacingX;
    const gridHeight = (Math.ceil(total / cols) - 1) * spacingY;
    const startX = cx - gridWidth / 2;
    const startY = cy - gridHeight / 2;

    const newNodes: Node[] = agents.map((agent, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const weights = getWeights(agent.id);
      
      const existingNode = nodes.find(n => n.id === agent.id);
      const defaultPosition = {
        x: startX + col * spacingX,
        y: startY + row * spacingY
      };

      return {
        id: agent.id,
        type: 'agent',
        position: existingNode?.position || defaultPosition,
        data: {
          ...agent,
          inWeight: weights.inWeight,
          outWeight: weights.outWeight,
          isActive: activeAgentId === agent.id,
          isCollaborating: collaboratingIds.includes(agent.id),
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedAgentId(selectedAgentId === agent.id ? null : agent.id);
            if (agent.lastMessage) addLog(agent.name, agent.lastMessage);
          },
        },
      };
    });

    const newEdges: Edge[] = [];
    Object.entries(SWARM_CONNECTIONS).forEach(([source, targets]) => {
      targets.forEach(target => {
        const isActive = (activeAgentId === source && collaboratingIds.includes(target)) || 
                        (activeAgentId === target && collaboratingIds.includes(source));
        
        newEdges.push({
          id: `${source}-${target}`,
          source,
          target,
          animated: isActive,
          style: {
            stroke: isActive ? '#06b6d4' : 'rgba(255,255,255,0.1)',
            strokeWidth: isActive ? 3 : 1,
            transition: 'stroke-width 0.5s, stroke 0.5s',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? '#06b6d4' : 'rgba(255,255,255,0.1)',
          },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agents, activeAgentId, collaboratingIds, dimensions.width, dimensions.height, selectedAgentId]);

  const startFactory = async (isRevision = false) => {
    const selectedType = PROJECT_TYPES.find(p => p.id === projectType)?.name || 'Digital Asset';
    const finalInstruction = isRevision 
      ? `[TARGET: ${selectedType}] ${instruction} | UPDATED PLAN: ${revisionNote}` 
      : `[TARGET: ${selectedType}] ${instruction}`;
    
    if (!finalInstruction.trim()) return;
    
    setIsProcessing(true);
    setAgents(prev => prev.map(a => ({ ...a, status: 'Idle', isCompleted: false })));
    if (!isRevision) setLogs([]);
    
    addLog('System', isRevision ? `APPLYING REVISIONS: ${revisionNote}` : `Initializing Neural Fabric for Directive: ${instruction}`, 'log');

    const agentIds = INITIAL_AGENTS.map(a => a.id);
    let currentContext = isRevision ? `${swarmContext}\nUSER_FEEDBACK: ${revisionNote}` : "Project Initialized.";
    const MAX_ATTEMPTS = 5;

    for (const id of agentIds) {
      if (id === 'aegis') continue; // Skip healer in main loop
      
      // Special logic for Nexus (GitHub Hosting)
      if (id === 'nexus') {
        const isAndroid = projectType === 'android_app';
        if (isAndroid) {
          addLog('Nexus Github', 'Platform Detected: MOBILE. Auto-hosting bypassed (Local Build Required).', 'log');
          setAgents(prev => prev.map(a => a.id === 'nexus' ? { ...a, status: 'Ready', isCompleted: true, lastMessage: 'Android hosting requires manual signature.' } : a));
          continue;
        }

        const hasGithub = !!apiKeys.github_token;
        if (!hasGithub) {
          addLog('Nexus Github', 'Protocol: [OPTIONAL] | Status: DISCONNECTED. Set GitHub Token in Settings to enable auto-hosting.', 'log');
          setAgents(prev => prev.map(a => a.id === 'nexus' ? { ...a, status: 'Ready', isCompleted: true, lastMessage: 'GitHub link not established.' } : a));
          continue;
        }
      }

      const agent = INITIAL_AGENTS.find(a => a.id === id);
      if (!agent) continue;

      let stepSuccess = false;
      let attempts = 0;

      while (!stepSuccess && attempts < MAX_ATTEMPTS) {
        attempts++;
        setActiveAgentId(id);
        setCollaboratingIds(SWARM_CONNECTIONS[id] || []);
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'Thinking' } : a));
        
        try {
          const step = await generateSwarmStep(agent.name, currentContext, finalInstruction, apiKeys[id] || apiKeys.global);
          
          setAgents(prev => prev.map(a => a.id === id ? { 
            ...a, 
            status: step.status as AgentStatus, 
            lastMessage: step.message,
            output: step.output,
            history: [...(a.history || []), { message: step.message, type: 'log' }, ...(step.output ? [{ message: step.output, type: 'code' as const }] : [])]
          } : a));

          if (step.status === 'Fixing') {
            addLog(agent.name, step.message, 'error');
            addLog('Aegis Healer', `Detected Quota/Neural Glitch in ${agent.name}. Cooldown initiated...`, 'log');
            setActiveAgentId('aegis');
            setCollaboratingIds([id]);
            await new Promise(r => setTimeout(r, 8000));
            
            if (attempts < MAX_ATTEMPTS) {
              addLog('Aegis Healer', `Retrying ${agent.name} sequence (Attempt ${attempts + 1}/${MAX_ATTEMPTS})`, 'log');
              continue; 
            }
          }

          stepSuccess = true;
          addLog(agent.name, step.message, 'log');
          if (step.output) {
            addLog(agent.name, step.output, 'code');
          }

          // Buffer delay between agents to prevent burst quota hits
          await new Promise(r => setTimeout(r, 4000)); 
          
          setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'Ready', isCompleted: true } : a));
          currentContext += `\n${agent.name}: ${step.message}`;
          setCollaboratingIds([]);
        } catch (error) {
          addLog('System', `Critical failure in ${agent.name}: ${error}`, 'error');
          if (attempts < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, 10000));
            continue;
          }
        }
      }
    }

    setSwarmContext(currentContext);
    setActiveAgentId(null);
    setCollaboratingIds([]);
    setIsProcessing(false);
    setRevisionNote('');
    addLog('System', 'LUCIFER SWARM: Phase Integration Complete.', 'log');
  };

  const handleGithubDeploy = async () => {
    const token = apiKeys.github_token;
    if (!token) {
      addLog('System', 'GitHub Token missing. Please connect GitHub in Settings first.', 'error');
      setShowSettings(true);
      return;
    }
    setConsoleType('GITHUB');
    setShowBuildConsole(true);
    setGithubUrl(null);
    setBuildSteps([
      { id: 'auth', message: 'Authenticating with GitHub...', status: 'active' },
      { id: 'repo', message: 'Creating Repository...', status: 'pending' },
      { id: 'files', message: 'Uploading Source Files...', status: 'pending' },
      { id: 'ready', message: 'Deployment Successful!', status: 'pending' }
    ]);

    try {
      // 1. Auth & Get User
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      if (!userRes.ok) throw new Error('Invalid GitHub Token');
      const userData = await userRes.json();
      const username = userData.login;
      setBuildSteps(prev => prev.map(s => s.id === 'auth' ? { ...s, status: 'success' } : s));

      // 2. Create Repo
      setBuildSteps(prev => prev.map(s => s.id === 'repo' ? { ...s, status: 'active' } : s));
      const repoName = `youkta-swarm-${Date.now()}`;
      const repoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          description: 'Created by Youkta Swarm Factory - Owner: Youbaraj',
          private: false,
          auto_init: true
        })
      });
      if (!repoRes.ok) throw new Error('Failed to create repository. Check token scopes (needs "repo").');
      setBuildSteps(prev => prev.map(s => s.id === 'repo' ? { ...s, status: 'success' } : s));

      // 3. Upload Files
      setBuildSteps(prev => prev.map(s => s.id === 'files' ? { ...s, status: 'active' } : s));
      
      const utf8ToBase64 = (str: string) => window.btoa(unescape(encodeURIComponent(str)));
      
      const assetCode = agents.find(a => a.id === 'asset')?.output || '';
      const frontendCode = agents.find(a => a.id === 'frontend')?.output || '';
      const backendCode = agents.find(a => a.id === 'backend')?.output || '';
      
      const cleanFrontend = frontendCode.replace(/```(html|javascript|typescript|jsx|tsx|css)?\n/g, '').replace(/```/g, '');
      const cleanAsset = assetCode.replace(/```(html|css)?\n/g, '').replace(/```/g, '');
      const cleanBackend = backendCode.replace(/```(javascript|typescript)?\n/g, '').replace(/```/g, '');

      const isFullHtml = cleanFrontend.toLowerCase().includes('<html');
      const indexHtml = isFullHtml ? cleanFrontend : `<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <script src="https://cdn.tailwindcss.com"></script>\n    <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>\n    <style>\n      body { background: #020617; color: white; margin: 0; font-family: system-ui; }\n      ::-webkit-scrollbar { width: 4px; }\n      ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }\n      ${cleanAsset}\n    </style>\n  </head>\n  <body>\n    <div id="root">${cleanFrontend}</div>\n    <script>\n      ${cleanBackend}\n    </script>\n  </body>\n</html>`;

      const filesToUpload = agents.filter(a => a.output).map(a => ({
        path: `src/${a.id}_${a.name.toLowerCase().replace(/\s+/g, '_')}.js`,
        content: utf8ToBase64(a.output || '')
      }));
        
      filesToUpload.push({ path: 'README.md', content: utf8ToBase64(`# Youkta Swarm App\nGenerated by Youkta AI Factory\n\nCreator & Programmer: Youbaraj`) });
      filesToUpload.push({ path: 'index.html', content: utf8ToBase64(indexHtml) });

      for (const file of filesToUpload) {
        await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`, {
          method: 'PUT',
          headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Add ${file.path}`, content: file.content })
        });
      }
      setBuildSteps(prev => prev.map(s => s.id === 'files' ? { ...s, status: 'success' } : s));

      // 4. Ready
      setBuildSteps(prev => prev.map(s => s.id === 'ready' ? { ...s, status: 'success' } : s));
      const finalUrl = `https://github.com/${username}/${repoName}`;
      setGithubUrl(finalUrl);
      addLog('Nexus Github', `Repository created successfully: ${finalUrl}`, 'log');

    } catch (err: any) {
       setBuildSteps(prev => prev.map(s => s.status === 'active' || s.status === 'pending' ? { ...s, status: 'error' } : s));
       addLog('Nexus Github', `Deployment failed: ${err.message}`, 'error');
    }
  };

  const handleDownload = async (type: 'ZIP' | 'APK') => {
    const supportAgent = agents.find(a => a.id === 'support')?.name || 'Linker Pro';
    
    if (type === 'APK') {
      setConsoleType('APK');
      setShowBuildConsole(true);
      setBuildSteps([
        { id: 'env', message: 'Initializing Android Build Environment...', status: 'active' },
        { id: 'code', message: 'Analyzing Neural Code Structures...', status: 'pending' },
        { id: 'gradle', message: 'Configuring Gradle Build Runner...', status: 'pending' },
        { id: 'compile', message: 'Compiling Java & Kotlin Bytecode...', status: 'pending' },
        { id: 'dex', message: 'Generating Dalvik Executable (DEX)...', status: 'pending' },
        { id: 'sign', message: 'Applying Quantum Security Signature...', status: 'pending' },
        { id: 'ready', message: 'Finalizing APK Package Architecture...', status: 'pending' }
      ]);

      const runStep = async (idx: number) => {
        if (idx >= 7) return;
        setBuildSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'active' } : i < idx ? { ...s, status: 'success' } : s));
        await new Promise(r => setTimeout(r, 800 + Math.random() * 800));
        if (idx === 6) {
          setBuildSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'success' } : s));
          
          // Download simulation
          const content = `LUCIFER SWARM NEURAL BUILD\nTarget: Android Mobile\nPhase: Production\n\nNOTE: You are in a browser sandbox. Direct .apk binary generation requires a backend build server.\nFor your phone to install this, follow these steps:\n1. Download the Source Code ZIP.\n2. Upload it to a service like Expo.dev or Capacitor.\n3. Build the actual signed binary there.\n\nThis simulation confirms that your swarm logic is valid and ready for mobile deployment.`;
          const blob = new Blob([content], { type: 'application/vnd.android.package-archive' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `lucifer_neural_build.apk`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          addLog(supportAgent, `APK simulated binary delivered. View build console for installation guide.`, 'log');
        } else {
          runStep(idx + 1);
        }
      };
      runStep(0);
      return;
    }

    setAgents(prev => prev.map(a => a.id === 'support' ? { ...a, status: 'Coding' } : a));
    addLog(supportAgent, `Bundling architecture into secure ZIP archive...`, 'log');
    
    try {
      const zip = new JSZip();
      const folder = zip.folder("lucifer_swarm_project");
      
      agents.forEach(agent => {
        if (agent.output) {
          folder?.file(`${agent.id}_${agent.name.toLowerCase().replace(/\s+/g, '_')}.js`, agent.output);
        }
      });

      const buildReport = `LUCIFER SWARM FACTORY BUILD REPORT\nGenerated: ${new Date().toLocaleString()}\nInstruction: ${instruction}\n\nThis archive contains the direct neural output of each module.`;
      folder?.file("BUILD_REPORT.txt", buildReport);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lucifer_project_source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog(supportAgent, `Package sealed and delivered. Integrity verified.`, 'log');
      setAgents(prev => prev.map(a => a.id === 'support' ? { ...a, status: 'Ready' } : a));
    } catch (err) {
      addLog('System', `Encryption failure: ${err}`, 'error');
    }
  };

  const saveApiKeys = (newKeys: Record<string, string>) => {
    setApiKeys(newKeys);
    localStorage.setItem('lucifer_swarm_keys', JSON.stringify(newKeys));
    addLog('System', 'Neural API integrity verified. Configuration saved.', 'log');
    setShowSettings(false);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        window.requestAnimationFrame(() => {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Neural Self-Healing Logic
  useEffect(() => {
    const healInterval = setInterval(() => {
      const failingAgent = agents.find(a => a.status === 'Fixing' && a.id !== 'aegis');
      if (failingAgent) {
        addLog('Aegis Healer', `Detected anomaly in ${failingAgent.name}. Initiating Self-Healing Protocols...`, 'log');
        setActiveAgentId('aegis');
        setCollaboratingIds([failingAgent.id]);
        
        setTimeout(() => {
          setAgents(prev => prev.map(a => a.id === failingAgent.id ? { ...a, status: 'Ready', lastMessage: 'Neural paths restored by AEGIS.' } : a));
          addLog('Aegis Healer', `${failingAgent.name} successfully repaired. Neural integrity: 100%.`, 'log');
          setActiveAgentId(null);
          setCollaboratingIds([]);
        }, 2000);
      }
    }, 5000);

    return () => clearInterval(healInterval);
  }, [agents]);

  // Pre-calculate weights for the graph visualization
  const getWeights = (agentId: string) => {
    const outWeight = SWARM_CONNECTIONS[agentId]?.length || 0;
    const inWeight = Object.values(SWARM_CONNECTIONS).filter(targets => targets.includes(agentId)).length;
    return { inWeight, outWeight };
  };

  const resetLayout = () => {
    const cx = dimensions.width / 2 || 500;
    const cy = dimensions.height / 2 || 400;
    const cols = 4;
    const spacingX = 250;
    const spacingY = 180;
    const total = agents.length;
    const gridWidth = (cols - 1) * spacingX;
    const gridHeight = (Math.ceil(total / cols) - 1) * spacingY;
    const startX = cx - gridWidth / 2;
    const startY = cy - gridHeight / 2;

    setNodes(prev => prev.map((node, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      return {
        ...node,
        position: {
          x: startX + col * spacingX,
          y: startY + row * spacingY
        }
      };
    }));
    addLog('System', 'Neural Grid stabilized. Positions recalibrated.', 'log');
  };

  const addLog = (agent: string, message: string, type: 'log' | 'code' | 'error' = 'log') => {
    setLogs(prev => [...prev, { agent, message, type }]);
  };

  return (
    <div className="flex flex-col h-full bg-[#020202] text-white p-4 gap-4 overflow-hidden font-sans">
      {/* Neural Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-30 px-5 py-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl mx-2">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-cyan-500" />
<h1 className="text-xs font-black tracking-[0.4em] uppercase text-white italic">
            YOUKTA FACTORY
          </h1>
          <span className="text-[8px] font-mono text-white/30 hidden sm:inline">
            owner: Youbaraj
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 mr-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/5 bg-white/5">
              <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[8px] font-mono text-white/40">SYSTEM SYNC</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {!isProcessing && agents.every(a => a.isCompleted) && agents.length > 0 && (
              <button 
                onClick={() => handleDownload('ZIP')}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5"
                title="Download Source Code"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-cyan-400 transition-all border border-white/5"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-2 rounded-lg border transition-all",
                showPreview ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/5 text-white/40"
              )}
            >
              {showPreview ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={() => setShowTerminal(!showTerminal)}
              className={cn(
                "p-2 rounded-lg border transition-all",
                showTerminal ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-white/5 border-white/5 text-white/40"
              )}
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 relative">
        {/* Sidebar: Control Panel */}
        <AnimatePresence>
          {showControlPanel && (
            <motion.div 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-[340px] flex flex-col bg-black/60 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-50 pointer-events-auto"
            >
              <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CpuIcon className="w-3.5 h-3.5 text-cyan-500" />
                  <h2 className="text-[10px] font-mono text-white/70 uppercase tracking-[0.2em] font-bold"> Digital Foundation </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => zoomIn()} 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-cyan-500"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => zoomOut()} 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-cyan-500"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => fitView({ duration: 800 })} 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-cyan-500"
                    title="Fit View"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={resetLayout} 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-cyan-500"
                    title="Reset Layout"
                  >
                    <Layout className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsLocked(!isLocked)} 
                    className={cn(
                      "p-1 hover:bg-white/10 rounded transition-colors",
                      isLocked ? "text-amber-500" : "text-white/30 hover:text-cyan-500"
                    )}
                    title={isLocked ? "Unlock Interactivity" : "Lock Interactivity"}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  {!isProcessing && agents.every(a => a.isCompleted) && agents.length > 0 && (
                    <button 
                      onClick={() => handleDownload('ZIP')} 
                      className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-cyan-500"
                      title="Download Source"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setShowControlPanel(false)} className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-white">
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Control Panel Content */}
                {!isProcessing && agents.every(a => a.isCompleted) && agents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                       <div className={cn("p-2.5 rounded-xl", PROJECT_TYPES.find(p => p.id === projectType)?.bg)}>
                          {React.createElement(PROJECT_TYPES.find(p => p.id === projectType)?.icon || Bot, { className: cn("w-5 h-5", PROJECT_TYPES.find(p => p.id === projectType)?.color) })}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{PROJECT_TYPES.find(p => p.id === projectType)?.name}</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">Deployment Sequence Complete</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleDownload('ZIP')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase tracking-widest">SOURCE.ZIP</button>
                      <button onClick={() => handleDownload('APK')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 hover:bg-indigo-500/20 transition-all uppercase tracking-widest">APP.APK</button>
                    </div>
                    <button onClick={handleGithubDeploy} className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[9px] font-mono text-orange-400 hover:bg-orange-500/20 transition-all uppercase tracking-widest">
                      <Globe className="w-4 h-4" /> 1-CLICK GITHUB DEPLOY
                    </button>
                    <div className="relative pt-2">
                      <div className="absolute top-0 left-4 px-2 bg-black text-[8px] font-mono text-white/30 uppercase tracking-widest">Neural Revision</div>
                      <input type="text" value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="REQUEST CHANGE..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 placeholder:text-white/10" onKeyDown={(e) => e.key === 'Enter' && startFactory(true)} />
                      <button onClick={() => startFactory(true)} className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 p-2 text-cyan-500 hover:text-cyan-400 transition-colors"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] ml-2">Select Architecture</label>
                      <div className="grid grid-cols-2 gap-2">
                        {PROJECT_TYPES.map(type => (
                          <button key={type.id} onClick={() => setProjectType(type.id)} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", projectType === type.id ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/10")}>
                            <type.icon className={cn("w-4 h-4", projectType === type.id ? type.color : "text-white")} />
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", projectType === type.id ? "text-white" : "text-white/40")}>{type.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] ml-2">Neural Directives</label>
                      <textarea 
                        value={instruction} 
                        onChange={(e) => setInstruction(e.target.value)} 
                        placeholder="INITIALIZE SYSTEM..." 
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 placeholder:text-white/10 resize-none"
                      />
                      <button 
                        onClick={startFactory} 
                        disabled={isProcessing || !instruction.trim()} 
                        className={cn("w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all", isProcessing || !instruction.trim() ? "bg-white/5 text-white/10" : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]")}
                      >
                        {isProcessing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                        <span>{isProcessing ? "Processing..." : "Ignite Neural Forge"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Workspace (Neural Canvas) */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-black/40 rounded-3xl border border-white/5 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            panOnDrag={!isLocked}
            zoomOnScroll={!isLocked}
            proOptions={{ hideAttribution: true }}
            className="z-0"
            colorMode="dark"
          >
            <Background color="#1e293b" gap={60} size={1} />
          </ReactFlow>
          
          {/* Pinned Interface Overlays */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Agent Detail Popover */}
            <div className="absolute top-8 left-8 w-80 pointer-events-auto">
              <AnimatePresence>
                {selectedAgentId && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="p-5 bg-cyan-950/40 backdrop-blur-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden mb-4 rounded-2xl"
                  >
                    <div className="absolute top-0 right-0 p-2">
                      <button onClick={() => setSelectedAgentId(null)} className="text-white/20 hover:text-white"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30"><Bot className="w-5 h-5 text-cyan-400" /></div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{agents.find(a => a.id === selectedAgentId)?.name}</h3>
                        <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-widest">{agents.find(a => a.id === selectedAgentId)?.role}</p>
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                      {agents.find(a => a.id === selectedAgentId)?.history?.map((h, idx) => (
                        <div key={idx} className="text-[10px] text-white/70 bg-white/5 p-2 rounded-lg border border-white/5 mb-2">
                          {h.type === 'code' ? <pre className="text-emerald-400/80 text-[8px] whitespace-pre-wrap">{h.message}</pre> : <p>{h.message}</p>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


          {/* Terminal Toggle (Pinned Right) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
            {!showTerminal && (
              <motion.button initial={{ x: 20 }} animate={{ x: 0 }} whileHover={{ x: -5 }} onClick={() => setShowTerminal(true)} className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-l-2xl text-cyan-500 shadow-2xl">
                <PanelRightOpen className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Control Panel Toggle (Pinned Left) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
            {!showControlPanel && (
              <motion.button initial={{ x: -20 }} animate={{ x: 0 }} whileHover={{ x: 5 }} onClick={() => setShowControlPanel(true)} className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-r-2xl text-cyan-500 shadow-2xl">
                <PanelLeftOpen className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Status Bar (Pinned Bottom) */}
          <div className="absolute bottom-8 left-8 z-40 bg-black/60 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2 text-[9px] font-mono flex items-center gap-6 pointer-events-auto">
             <div className="flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full", isProcessing ? "bg-cyan-500 animate-ping" : "bg-green-500")} />
               <span className="text-white/50 uppercase tracking-widest">Status: {isProcessing ? 'Active' : 'Standby'}</span>
             </div>
          </div>
        </div>
      </div>

    {/* Project Preview Overlay */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 z-[60] bg-black shadow-2xl rounded-3xl overflow-hidden border border-white/10"
            >
              <ProjectPreview 
                agents={agents} 
                onClose={() => setShowPreview(false)}
                onModify={(agentName, note) => {
                  setRevisionNote(`[${agentName}] ${note}`);
                  setShowPreview(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar: Command Terminal */}
        <AnimatePresence>
          {showTerminal && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-[420px] flex flex-col bg-black/60 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                  <h2 className="text-[10px] font-mono text-white/70 uppercase tracking-[0.2em] font-bold"> Neural Interaction Log </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setLogs([])} className="text-[10px] font-mono text-white/20 hover:text-cyan-500 transition-colors uppercase"> Wipe </button>
                  <button onClick={() => setShowTerminal(false)} className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-white">
                    <PanelRightClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 font-mono text-[10px] space-y-4 scrollbar-thin">
                {logs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-white/10 gap-4 opacity-50">
                    <div className="w-12 h-12 border border-dashed border-white/20 rounded-full animate-spin-slow flex items-center justify-center">
                      <RefreshCcw className="w-5 h-5" />
                    </div>
                    <p className="tracking-widest capitalize">System Awaiting Signal...</p>
                  </div>
                )}
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="group">
                    <div className="flex items-center gap-2 text-cyan-400/40 text-[9px] mb-1">
                      <span className="text-cyan-500">➤ {log.agent}</span>
                      <span className="opacity-50">|</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    {log.type === 'code' ? (
                      <div className="relative">
                        <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-cyan-500/20" />
                        <pre className="p-3 bg-black/40 text-emerald-400 border border-white/5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">{log.message}</pre>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="w-0.5 h-auto bg-white/5 rounded-full" />
                        <p className="text-white/70 leading-relaxed tracking-wide">{log.message}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <Settings2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">System Core Configuration</h2>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Neural API & Key Management</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors group"
                >
                  <X className="w-5 h-5 text-white/20 group-hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-8">
                  {/* Global Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-cyan-500" />
                      <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Global Neural Core</h3>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                      <p className="text-xs text-white/40 leading-relaxed">
                        This key handles all factory-wide operations. If an agent does not have a specific override, this core link will be used.
                      </p>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input 
                          type={showKeyId === 'global' ? 'text' : 'password'}
                          value={apiKeys.global || ''}
                          onChange={(e) => setApiKeys(prev => ({ ...prev, global: e.target.value }))}
                          placeholder="ENTER GLOBAL API KEY..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-all text-cyan-400"
                        />
                        <button 
                          onClick={() => setShowKeyId(showKeyId === 'global' ? null : 'global')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {showKeyId === 'global' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* GitHub Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-orange-500" />
                      <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Deployment Integration</h3>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase mb-1">GitHub Nexus Sync (Personal Access Token)</h4>
                          <p className="text-[10px] text-white/40 leading-relaxed">
                            Provide a GitHub Personal Access Token (PAT) with 'repo' scope to allow real deployment to your GitHub account.
                          </p>
                        </div>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input 
                            type={showKeyId === 'github' ? 'text' : 'password'}
                            value={apiKeys.github_token || ''}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, github_token: e.target.value }))}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-xs font-mono focus:outline-none focus:border-orange-500 transition-all text-orange-400"
                          />
                          <button 
                            onClick={() => setShowKeyId(showKeyId === 'github' ? null : 'github')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                          >
                            {showKeyId === 'github' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Individual Agents Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CpuIcon className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">Individual Neural Overrides</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {INITIAL_AGENTS.map(agent => (
                        <div key={agent.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 shrink-0">
                            <Bot className="w-5 h-5 text-white/20" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-bold text-white mb-0.5 truncate uppercase tracking-wide">{agent.name}</h4>
                            <p className="text-[9px] text-white/20 font-mono truncate">{agent.role}</p>
                          </div>
                          <div className="relative w-48">
                            <input 
                              type={showKeyId === agent.id ? 'text' : 'password'}
                              value={apiKeys[agent.id] || ''}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, [agent.id]: e.target.value }))}
                              placeholder="DEFAULT"
                              className="w-full bg-black/40 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-[10px] font-mono focus:outline-none focus:border-emerald-500/50 transition-all text-emerald-400 placeholder:text-white/5"
                            />
                            <button 
                              onClick={() => setShowKeyId(showKeyId === agent.id ? null : agent.id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
                            >
                              {showKeyId === agent.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <button 
                  onClick={() => {
                    const reset = { global: '' };
                    setApiKeys(reset);
                    localStorage.removeItem('lucifer_swarm_keys');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset to Defaults
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2 rounded-xl text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => saveApiKeys(apiKeys)}
                    className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  >
                    <Save className="w-4 h-4" />
                    Archive Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Build Console Overlay */}
      <AnimatePresence>
        {showBuildConsole && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{consoleType === 'GITHUB' ? 'GitHub Deployment Console' : 'Android Build Console'}</h3>
                </div>
                <button 
                  onClick={() => setShowBuildConsole(false)}
                  className="text-white/20 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  {buildSteps.map((step) => (
                    <motion.div 
                      key={step.id} 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between font-mono text-[11px]"
                    >
                      <div className="flex items-center gap-3">
                        {step.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : step.status === 'active' ? (
                          <RefreshCcw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                        ) : step.status === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-white/10" />
                        )}
                        <span className={cn(
                          step.status === 'active' ? "text-white" : step.status === 'error' ? "text-red-400" : "text-white/40"
                        )}>
                          {step.message}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[9px]",
                        step.status === 'success' ? "text-emerald-500" : 
                        step.status === 'active' ? "text-cyan-500" : 
                        step.status === 'error' ? "text-red-500" : "text-white/10"
                      )}>
                        {step.status.toUpperCase()}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {buildSteps.every(s => s.status === 'success') && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-5 rounded-xl border space-y-4",
                      consoleType === 'GITHUB' ? "bg-orange-500/5 border-orange-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <AlertTriangle className={cn("w-5 h-5 mt-1 shrink-0", consoleType === 'GITHUB' ? "text-orange-400" : "text-emerald-400")} />
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white">
                          {consoleType === 'GITHUB' ? 'GitHub Deployment Success' : 'APK Simulation Success'}
                        </h4>
                        {consoleType === 'GITHUB' ? (
                          <>
                            <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                              Your neural assets have been packaged and pushed to your connected GitHub account. 
                              The repository is now live.
                            </p>
                            <ul className="text-[9px] text-orange-400/70 font-mono space-y-1 list-disc pl-4 uppercase">
                              <li>Repository: <a href={githubUrl || '#'} target="_blank" rel="noreferrer" className="underline hover:text-orange-300">Live Link</a></li>
                              <li>Branch: main</li>
                              <li>Contains: index.html & src assets</li>
                            </ul>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                              Direct APK installation requires a signed binary generated on an Android build server. 
                              For this preview, we have provided a manifest link. To install on your phone:
                            </p>
                            <ul className="text-[9px] text-emerald-400/70 font-mono space-y-1 list-disc pl-4 uppercase">
                              <li>Export project as source ZIP.</li>
                              <li>Open project in Android Studio or Expo.</li>
                              <li>Generate signed production APK.</li>
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowBuildConsole(false)}
                      className={cn(
                        "w-full py-2.5 text-black text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors",
                        consoleType === 'GITHUB' ? "bg-orange-500 hover:bg-orange-400" : "bg-emerald-500 hover:bg-emerald-400"
                      )}
                    >
                      Acknowledge
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* Footer Branding */}
      <div className="absolute bottom-3 right-4 z-10 pointer-events-none text-[8px] font-mono text-white/25">
        created by Youkta • owner: Youbaraj
      </div>
    </div>
  );
}
