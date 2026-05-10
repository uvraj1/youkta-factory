import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AgentSwarmNode, AgentStatus } from './AgentSwarmNode';

export type FlowAgentNodeData = {
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
  inWeight?: number;
  outWeight?: number;
  onClick?: (e: React.MouseEvent) => void;
};

export const FlowAgentNode = ({ data, selected }: NodeProps) => {
  const agentData = data as unknown as FlowAgentNodeData;
  
  return (
    <div className="relative group/flownode">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-cyan-500/50 !border-none !opacity-0 group-hover/flownode:!opacity-100 transition-opacity"
      />
      
      <div onClick={agentData.onClick}>
        <AgentSwarmNode
          {...agentData}
          // Positioning is handled by React Flow
          isSelected={selected}
          className="!relative !left-0 !top-0 !translate-x-0 !translate-y-0"
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-cyan-500/50 !border-none !opacity-0 group-hover/flownode:!opacity-100 transition-opacity"
      />
    </div>
  );
};
