import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu, CheckCircle } from 'lucide-react';

export default function AgentConsole({ logs, isRunning }) {
 const containerRef = useRef(null);

 useEffect(() => {
 if (containerRef.current) {
 containerRef.current.scrollTop = containerRef.current.scrollHeight;
 }
 }, [logs]);

 return (
 <div className="flex flex-col h-full bg-[#111111] text-green-400 font-mono -hard overflow-hidden">
 {/* Console Header */}
 <div className="flex items-center justify-between bg-black border-b-[3px] border-black px-4 py-2 text-xs text-gray-400 select-none">
 <div className="flex items-center gap-2 font-black">
 <Terminal size={14} className="text-[#A3E635]" />
 <span>STRATEGY AGENT NETWORK COORDINATOR</span>
 </div>
 {isRunning && (
 <div className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C] animate-pulse"></span>
 <span className="text-[#FB923C] font-black uppercase text-[10px]">Processing</span>
 </div>
)}
 </div>

 {/* Terminal Output */}
 <div 
 ref={containerRef}
 className="flex-1 p-4 overflow-y-auto font-mono text-xs md:text-sm space-y-3 min-h-[160px] max-h-[350px] scrollbar-thin scrollbar-thumb-green-600"
 >
 {logs.length === 0 ? (
 <div className="text-gray-500 italic select-none">
 &gt; Agent Network standing by. Define inquiry context and trigger simulation...
 </div>
) : (
 logs.map((log, index) => {
 const formattedTime = new Date(log.at || Date.now()).toLocaleTimeString([], { 
 hour: '2-digit', 
 minute: '2-digit', 
 second: '2-digit' 
 });
 
 // Map agent IDs to custom terminal accent colors
 const agentColors = {
 founder: 'text-[#C084FC]',
 research: 'text-[#FB923C]',
 analyst: 'text-[#F472B6]',
 strategy: 'text-[#A3E635]',
 coach: 'text-cyan-400',
 composer: 'text-yellow-400'
 };
 const agentColor = agentColors[log.id] || 'text-green-400';

 return (
 <div key={index} className="flex gap-2 items-start animate-fade-in border-b border-gray-900 pb-2">
 <span className="text-gray-600 shrink-0 select-none">[{formattedTime}]</span>
 <div className="flex-1">
 <span className={`${agentColor} font-black shrink-0 uppercase select-none mr-2`}>
 [{log.agent || 'SYSTEM'}]:
 </span>
 <span className="text-gray-200">{log.message}</span>
 </div>
 </div>
);
 })
)}
 {isRunning && (
 <div className="flex items-center gap-2 text-green-400/70 select-none">
 <span>&gt;</span>
 <span className="animate-pulse flex items-center gap-1">
 <Cpu size={14} className="animate-spin" />
 <span>Awaiting agent response...</span>
 </span>
 </div>
)}
 </div>
 </div>
);
}
