import React from 'react';

/**
 * StartupGraph — SVG visualization of a node-graph representing
 * interconnected startup data points. Used as the hero visual on
 * the landing page and in the "How it compounds" section.
 */
export default function StartupGraph({ className = '' }) {
  // Node definitions
  const nodes = [
    { id: 'center', x: 300, y: 250, r: 24, fill: '#1A1A1A', label: null },
    { id: 'seed', x: 160, y: 120, r: 8, fill: '#E5E7EB', label: 'Seed +$2.4M', labelX: -10, labelY: -14 },
    { id: 'pricing', x: 440, y: 100, r: 14, fill: '#C8E64A', label: 'Pricing', labelX: 0, labelY: -20 },
    { id: 'atlas', x: 360, y: 340, r: 8, fill: '#E5E7EB', label: 'Atlas Freight', labelX: 0, labelY: 18 },
    { id: 'meridian', x: 460, y: 300, r: 8, fill: '#E5E7EB', label: 'Meridian pilot', labelX: 10, labelY: 18 },
    { id: 'churn', x: 130, y: 320, r: 14, fill: '#C8E64A', label: 'SMB churn', labelX: -10, labelY: 20 },
    { id: 'n1', x: 240, y: 160, r: 6, fill: '#E5E7EB', label: null },
    { id: 'n2', x: 480, y: 220, r: 6, fill: '#E5E7EB', label: null },
    { id: 'n3', x: 190, y: 260, r: 5, fill: '#E5E7EB', label: null },
  ];

  // Edge connections
  const edges = [
    ['center', 'seed'], ['center', 'pricing'], ['center', 'atlas'],
    ['center', 'meridian'], ['center', 'churn'], ['center', 'n1'],
    ['center', 'n2'], ['center', 'n3'],
    ['seed', 'n1'], ['n1', 'pricing'], ['pricing', 'n2'],
    ['n2', 'meridian'], ['meridian', 'atlas'], ['atlas', 'churn'],
    ['churn', 'n3'], ['n3', 'seed'],
  ];

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <div className={`relative ${className}`}>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-outfit font-semibold tracking-[0.12em] uppercase text-gray-400">
              Live · Startup Graph
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-green-700 tracking-wide">synced</span>
          </div>
        </div>

        {/* SVG Graph */}
        <svg viewBox="0 0 600 440" className="w-full h-auto" aria-label="Startup Graph visualization showing interconnected startup data points">
          {/* Edges */}
          {edges.map(([from, to], i) => {
            const a = nodeMap[from];
            const b = nodeMap[to];
            return (
              <line
                key={i}
                x1={a.x} y1={a.y}
                x2={b.x} y2={b.y}
                stroke="#E5E7EB"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              {/* Glow for accent nodes */}
              {node.fill === '#C8E64A' && (
                <circle
                  cx={node.x} cy={node.y} r={node.r + 6}
                  fill="#C8E64A" opacity="0.15"
                  className="animate-pulse-soft"
                />
              )}
              <circle
                cx={node.x} cy={node.y} r={node.r}
                fill={node.fill}
                stroke={node.fill === '#1A1A1A' ? '#1A1A1A' : 'none'}
                strokeWidth="0"
              />
              {node.label && (
                <text
                  x={node.x + (node.labelX || 0)}
                  y={node.y + (node.labelY || 0)}
                  textAnchor="middle"
                  className="fill-gray-500"
                  style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
                >
                  {node.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
