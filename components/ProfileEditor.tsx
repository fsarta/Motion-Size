import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Play, ZoomIn, ZoomOut, BarChart2 } from 'lucide-react';
import { UnitInput } from './Common';

interface MotionSegment {
  id: string;
  type: 'Accel' | 'Const Vel' | 'Decel' | 'Dwell';
  duration: number; // s
  endVelocity: number; // m/s or rpm
  payload: number; // % (simulation factor)
}

const DEFAULT_SEGMENTS: MotionSegment[] = [
  { id: '1', type: 'Accel', duration: 0.5, endVelocity: 100, payload: 100 },
  { id: '2', type: 'Const Vel', duration: 2.0, endVelocity: 100, payload: 100 },
  { id: '3', type: 'Decel', duration: 0.5, endVelocity: 0, payload: 100 },
  { id: '4', type: 'Dwell', duration: 1.0, endVelocity: 0, payload: 0 },
];

export const ProfileEditor: React.FC = () => {
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedSegId, setSelectedSegId] = useState<string | null>(null);

  // --- Calculations for Chart ---
  const chartData = useMemo(() => {
    let currentTime = 0;
    const points: { x: number; y: number; type: string }[] = [{ x: 0, y: 0, type: 'Start' }];
    
    // We assume the profile starts at 0 velocity for the first segment if it's Accel
    // But logically, each segment connects to the previous one.
    
    let currentVel = 0;

    segments.forEach(seg => {
      currentTime += seg.duration;
      // Update logic based on type to ensure continuity
      if (seg.type === 'Accel' || seg.type === 'Decel') {
          currentVel = seg.endVelocity;
      } else if (seg.type === 'Const Vel') {
          // Keep previous velocity (or force user input to match? For UI demo, let's trust endVelocity)
          currentVel = seg.endVelocity; 
      } else {
          currentVel = 0;
      }
      
      points.push({
        x: currentTime,
        y: currentVel,
        type: seg.type
      });
    });

    return { points, totalTime: currentTime, maxVel: Math.max(...points.map(p => p.y), 10) };
  }, [segments]);

  // --- Handlers ---
  const updateSegment = (id: string, field: keyof MotionSegment, value: any) => {
    setSegments(prev => prev.map(s => {
      if (s.id !== id) return s;
      let val = value;
      if (field === 'duration' || field === 'endVelocity' || field === 'payload') {
          val = parseFloat(value) || 0;
      }
      return { ...s, [field]: val };
    }));
  };

  const addSegment = () => {
    const last = segments[segments.length - 1];
    const newId = Date.now().toString();
    const newSeg: MotionSegment = {
        id: newId,
        type: 'Dwell',
        duration: 1,
        endVelocity: 0,
        payload: 0
    };
    
    // Simple logic to predict next segment type
    if (last.type === 'Accel') newSeg.type = 'Const Vel';
    if (last.type === 'Const Vel') newSeg.type = 'Decel';
    if (last.type === 'Decel') newSeg.type = 'Dwell';
    if (last.type === 'Dwell') newSeg.type = 'Accel';

    // Predict velocity
    if (newSeg.type === 'Const Vel') newSeg.endVelocity = last.endVelocity;
    if (newSeg.type === 'Accel') newSeg.endVelocity = 100;

    setSegments([...segments, newSeg]);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  // --- Chart Scaling ---
  const svgWidth = 600;
  const svgHeight = 250;
  const padding = 30;
  
  const scaleX = (val: number) => padding + (val / chartData.totalTime) * (svgWidth - 2 * padding);
  const scaleY = (val: number) => (svgHeight - padding) - (val / (chartData.maxVel * 1.2)) * (svgHeight - 2 * padding); // 1.2 for headroom

  return (
    <div className="flex h-full border border-gray-300 bg-white">
      {/* Left: Grid Editor */}
      <div className="w-[450px] flex flex-col border-r border-gray-300 bg-gray-50">
        
        {/* Toolbar */}
        <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-2 space-x-2">
           <button onClick={addSegment} className="flex items-center px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-blue-50 text-xs">
              <Plus size={12} className="mr-1 text-green-600"/> Add Step
           </button>
           <div className="w-px h-4 bg-gray-300 mx-2"></div>
           <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Motion Profile Definition</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[30px_90px_60px_70px_1fr_30px] bg-gray-200 border-b border-gray-300 text-xs font-semibold text-gray-700 py-1">
           <div className="text-center">#</div>
           <div className="px-1 border-l border-gray-300">Type</div>
           <div className="px-1 border-l border-gray-300 text-right">Dur (s)</div>
           <div className="px-1 border-l border-gray-300 text-right">End V</div>
           <div className="px-1 border-l border-gray-300 text-right">Payload %</div>
           <div className="px-1 border-l border-gray-300"></div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto bg-white">
          {segments.map((seg, idx) => (
            <div 
                key={seg.id} 
                onClick={() => setSelectedSegId(seg.id)}
                className={`grid grid-cols-[30px_90px_60px_70px_1fr_30px] border-b border-gray-100 text-xs items-center hover:bg-win-hover cursor-pointer
                    ${selectedSegId === seg.id ? 'bg-win-select' : ''}
                `}
            >
               <div className="text-center text-gray-500 bg-gray-50 h-full flex items-center justify-center border-r border-gray-200">{idx + 1}</div>
               
               <div className="p-0.5 border-r border-gray-200">
                  <select 
                    className="w-full bg-transparent outline-none focus:bg-white"
                    value={seg.type}
                    onChange={(e) => updateSegment(seg.id, 'type', e.target.value)}
                  >
                    <option value="Accel">Accel</option>
                    <option value="Const Vel">Const Vel</option>
                    <option value="Decel">Decel</option>
                    <option value="Dwell">Dwell</option>
                  </select>
               </div>

               <div className="p-0.5 border-r border-gray-200">
                  <input 
                    type="number" 
                    className="w-full text-right bg-transparent outline-none focus:bg-white px-1"
                    value={seg.duration}
                    onChange={(e) => updateSegment(seg.id, 'duration', e.target.value)}
                    step={0.1}
                  />
               </div>

               <div className="p-0.5 border-r border-gray-200">
                  <input 
                    type="number" 
                    className={`w-full text-right bg-transparent outline-none focus:bg-white px-1 ${seg.type === 'Dwell' ? 'text-gray-300' : ''}`}
                    value={seg.endVelocity}
                    onChange={(e) => updateSegment(seg.id, 'endVelocity', e.target.value)}
                    disabled={seg.type === 'Dwell'}
                  />
               </div>

               <div className="p-0.5 border-r border-gray-200">
                   <div className="flex items-center px-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-2">
                         <div className="h-full bg-blue-500" style={{ width: `${Math.min(seg.payload, 100)}%` }}></div>
                      </div>
                      <input 
                        type="number" 
                        className="w-8 text-right bg-transparent outline-none focus:bg-white"
                        value={seg.payload}
                        onChange={(e) => updateSegment(seg.id, 'payload', e.target.value)}
                      />
                   </div>
               </div>

               <div className="flex items-center justify-center">
                   <button onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }} className="text-gray-400 hover:text-red-500">
                       <Trash2 size={12} />
                   </button>
               </div>
            </div>
          ))}
        </div>
        
        {/* Footer Summary */}
        <div className="h-8 bg-gray-100 border-t border-gray-300 flex items-center px-2 text-xs text-gray-600 justify-between">
            <span>Total Time: <span className="font-bold">{chartData.totalTime.toFixed(2)} s</span></span>
            <span>Max Vel: <span className="font-bold">{chartData.maxVel.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Right: Chart */}
      <div className="flex-1 flex flex-col bg-white relative">
         <div className="absolute top-2 right-2 flex space-x-1 z-10">
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><ZoomIn size={14} className="text-gray-600"/></button>
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><ZoomOut size={14} className="text-gray-600"/></button>
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><BarChart2 size={14} className="text-gray-600"/></button>
         </div>

         <div className="flex-1 flex items-center justify-center overflow-hidden">
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid Lines */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const y = scaleY(i * (chartData.maxVel * 1.2 / 5));
                    return (
                        <g key={i}>
                            <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#f0f0f0" />
                            <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="10" fill="#999">
                                {Math.round(i * (chartData.maxVel * 1.2 / 5))}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#ccc" />
                <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#ccc" />
                
                {/* Velocity Path */}
                <path 
                    d={`M ${chartData.points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')}`}
                    fill="none"
                    stroke="#0078d7"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {/* Area under curve */}
                <path 
                    d={`M ${scaleX(0)},${scaleY(0)} L ${chartData.points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')} L ${scaleX(chartData.totalTime)},${scaleY(0)} Z`}
                    fill="url(#grad1)"
                    opacity="0.2"
                />

                {/* Data Points */}
                {chartData.points.map((p, i) => (
                    <circle 
                        key={i} 
                        cx={scaleX(p.x)} 
                        cy={scaleY(p.y)} 
                        r="3" 
                        fill="white" 
                        stroke="#0078d7" 
                        strokeWidth="1.5"
                    />
                ))}
                
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#0078d7', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#0078d7', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                {/* X Axis Label */}
                <text x={svgWidth / 2} y={svgHeight - 5} textAnchor="middle" fontSize="10" fill="#666">Time (s)</text>
                {/* Y Axis Label */}
                <text x={10} y={svgHeight / 2} textAnchor="middle" fontSize="10" fill="#666" transform={`rotate(-90, 10, ${svgHeight/2})`}>Velocity</text>
            </svg>
         </div>
      </div>
    </div>
  );
};
