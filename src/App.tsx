/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentSwarm } from './components/AgentSwarm';
import { ReactFlowProvider } from '@xyflow/react';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    document.title = "Youkta - owner name: Youbaraj";
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-black selection:bg-cyan-500/30">
      <ReactFlowProvider>
        <AgentSwarm />
      </ReactFlowProvider>
    </div>
  );
}
