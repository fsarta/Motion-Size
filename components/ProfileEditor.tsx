import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, BarChart2, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';

/* --- Types --- */

type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine';

interface MotionSegment {
  id: string;
  type: SegmentType;
  
  // Basic Kinematics
  duration: number; // s
  distance: number; // user units (deg, mm)
  velocity: number; // max velocity
  
  // Dynamics
  accel: number; 
  decel: number;
  jerk: number;
  
  // Configuration
  payload: number; // External Force / Torque
  
  // UI State
  lockDuration: boolean;
  lockDistance: boolean;
  lockVelocity: boolean;
  lockAccel: boolean; // New lock for Accel/Decel section
  
  accelMode: 'Rate' | 'Time'; // Input acceleration as Rate (unit/s^2) or Time (s)
}

const DEFAULT_SEGMENTS: MotionSegment[] = [
  { 
    id: '1', type: 'Accel/Decel', 
    duration: 1.0, distance: 360, velocity: 500, 
    accel: 0, decel: 0, jerk: 0, payload: 0,
    lockDuration: true, lockDistance: true, lockVelocity: false, lockAccel: true,
    accelMode: 'Rate'
  },
  { 
    id: '2', type: 'Dwell/Traverse', 
    duration: 0.5, distance: 0, velocity: 0, 
    accel: 0, decel: 0, jerk: 0, payload: 0,
    lockDuration: true, lockDistance: true, lockVelocity: false, lockAccel: true,
    accelMode: 'Rate'
  },
];

/* --- Components --- */

const LockButton = ({ locked, onClick }: { locked: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="mr-1 text-gray-700 hover:text-black focus:outline-none"
    title={locked ? "Unlock parameter (Calculate this)" : "Lock parameter (Fixed input)"}
  >
    {locked ? <Lock size={14} fill="currentColor" /> : <Unlock size={14} />}
  </button>
);

const DetailInputRow = ({ 
  label, value, onChange, unit, locked, onToggleLock 
}: { 
  label: string, value: number, onChange: (v: number) => void, unit?: string, locked?: boolean, onToggleLock?: () => void 
}) => (
  <div className="mb-3">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs text-gray-700 font-medium">{label} {unit && `(${unit})`}</label>
    </div>
    <div className="flex items-center">
      {onToggleLock && <LockButton locked={!!locked} onClick={onToggleLock} />}
      <input 
        type="number" 
        className={`w-full text-xs border border-gray-300 px-2 py-1 h-7 rounded-sm focus:outline-none focus:border-blue-500
          ${locked ? 'bg-white text-black font-semibold' : 'bg-gray-100 text-gray-500'}
        `}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        readOnly={!locked}
      />
    </div>
  </div>
);

const DetailRightInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="flex items-center mb-2">
    <label className="w-12 text-right text-xs text-gray-600 mr-2">{label}</label>
    <input 
      type="number"
      className="flex-1 text-xs border border-gray-300 px-2 py-1 h-6 rounded-sm focus:outline-none focus:border-blue-500"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  </div>
);

export const ProfileEditor: React.FC = () => {
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SEGMENTS[0].id);

  // --- Handlers ---

  const updateSegment = (id: string, updates: Partial<MotionSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addSegment = () => {
    const newId = Date.now().toString();
    const newSeg: MotionSegment = {
       id: newId, type: 'Dwell/Traverse',
       duration: 1.0, distance: 0, velocity: 0,
       accel: 0, decel: 0, jerk: 0, payload: 0,
       lockDuration: true, lockDistance: true, lockVelocity: false, lockAccel: true,
       accelMode: 'Time'
    };
    setSegments([...segments, newSeg]);
    setSelectedId(newId);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    const idx = segments.findIndex(s => s.id === id);
    const newSegs = segments.filter(s => s.id !== id);
    setSegments(newSegs);
    if (selectedId === id) {
        setSelectedId(newSegs[Math.min(idx, newSegs.length - 1)].id);
    }
  };

  const selectedSegment = segments.find(s => s.id === selectedId) || segments[0];

  // --- Chart Calculation ---
  // Calculates points for plotting based on the segment type
  const chartData = useMemo(() => {
    let currentTime = 0;
    const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    let maxV = 10;

    segments.forEach(seg => {
        const startT = currentTime;
        const endT = currentTime + seg.duration;
        const V = seg.velocity; // For simplicity, we assume velocity inputs are relative max/end velocities
        
        // Simple shape generation logic
        if (seg.type === 'Trapezoid') {
             // 1/3 Accel, 1/3 Const, 1/3 Decel (Simplified model)
             const t1 = startT + (seg.duration * 0.33);
             const t2 = startT + (seg.duration * 0.66);
             
             points.push({ x: t1, y: V });
             points.push({ x: t2, y: V });
             points.push({ x: endT, y: 0 }); // Assuming return to 0 for demo visual
        } else if (seg.type === 'Triangle') {
             const tMid = startT + (seg.duration * 0.5);
             points.push({ x: tMid, y: V });
             points.push({ x: endT, y: 0 });
        } else if (seg.type === 'Dwell/Traverse') {
             if (seg.distance === 0) {
                 points.push({ x: endT, y: 0 });
             } else {
                 points.push({ x: endT, y: V }); 
             }
        } else if (seg.type === 'Accel/Decel') {
             // Linear Ramp to target V
             points.push({ x: endT, y: V });
        } else {
             // Default linear
             points.push({ x: endT, y: V });
        }

        if (Math.abs(V) > maxV) maxV = Math.abs(V);
        currentTime = endT;
    });

    return { points, totalTime: currentTime, maxVel: maxV };
  }, [segments]);

  // --- Scaling ---
  const svgW = 600;
  const svgH = 300;
  const pad = 40;
  const scaleX = (x: number) => pad + (x / chartData.totalTime) * (svgW - 2*pad);
  const scaleY = (y: number) => (svgH - pad) - (y / (chartData.maxVel * 1.2)) * (svgH - 2*pad);


  return (
    <div className="flex h-full border border-gray-300 bg-white font-sans text-xs">
      
      {/* LEFT COLUMN: Grid & Detail Editor */}
      <div className="w-[480px] flex flex-col border-r border-gray-300">
        
        {/* 1. TOP: Segment Grid */}
        <div className="h-[40%] flex flex-col bg-white">
           {/* Toolbar */}
           <div className="h-7 bg-gray-100 border-b border-gray-300 flex items-center px-2 space-x-2 shrink-0">
             <button onClick={addSegment} className="flex items-center px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-blue-50 text-xs text-gray-700">
                <Plus size={12} className="mr-1 text-green-600"/> Add
             </button>
             <div className="w-px h-4 bg-gray-300 mx-1"></div>
             <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Sequence</span>
           </div>
           
           {/* Header */}
           <div className="grid grid-cols-[24px_110px_60px_70px_1fr_24px] bg-gray-200 border-b border-gray-300 font-semibold text-gray-700 py-1 shrink-0">
               <div className="text-center">#</div>
               <div className="px-1 border-l border-gray-300">Type</div>
               <div className="px-1 border-l border-gray-300 text-right">Time (s)</div>
               <div className="px-1 border-l border-gray-300 text-right">Pos (deg)</div>
               <div className="px-1 border-l border-gray-300 text-right">Ext. Force</div>
               <div></div>
           </div>

           {/* Rows */}
           <div className="flex-1 overflow-y-auto bg-white">
               {segments.map((seg, idx) => (
                   <div 
                      key={seg.id}
                      onClick={() => setSelectedId(seg.id)}
                      className={`grid grid-cols-[24px_110px_60px_70px_1fr_24px] border-b border-gray-100 items-center cursor-pointer hover:bg-blue-50
                        ${selectedId === seg.id ? 'bg-blue-100' : ''}
                      `}
                   >
                       <div className="flex items-center justify-center text-gray-500 h-full border-r border-gray-200 bg-gray-50">
                          {selectedId === seg.id ? <ChevronRight size={12} className="text-black"/> : (idx + 1)}
                       </div>
                       
                       <div className="p-0.5 border-r border-gray-200">
                           <select 
                             className="w-full bg-transparent outline-none focus:bg-white text-xs"
                             value={seg.type}
                             onChange={(e) => updateSegment(seg.id, { type: e.target.value as SegmentType })}
                           >
                              <option>Accel/Decel</option>
                              <option>Trapezoid</option>
                              <option>Triangle</option>
                              <option>Dwell/Traverse</option>
                              <option>S-Curve</option>
                              <option>Sine</option>
                           </select>
                       </div>

                       <div className="p-1 text-right border-r border-gray-200">{seg.duration}</div>
                       <div className="p-1 text-right border-r border-gray-200">{seg.distance}</div>
                       <div className="p-1 text-right border-r border-gray-200">{seg.payload}</div>
                       
                       <div className="flex items-center justify-center">
                           <button onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }} className="text-gray-400 hover:text-red-500">
                               <Trash2 size={12} />
                           </button>
                       </div>
                   </div>
               ))}
           </div>
        </div>

        {/* 2. BOTTOM: Detail Panel (Gray) */}
        <div className="flex-1 bg-gray-100 border-t border-gray-300 p-4 shadow-inner overflow-y-auto">
           {selectedSegment && (
             <div className="flex gap-6">
                
                {/* Left Column: Basic Kinematics */}
                <div className="flex-1 min-w-[140px]">
                   <DetailInputRow 
                      label="Duration" 
                      unit="s" 
                      value={selectedSegment.duration} 
                      onChange={(v) => updateSegment(selectedSegment.id, { duration: v })}
                      locked={selectedSegment.lockDuration}
                      onToggleLock={() => updateSegment(selectedSegment.id, { lockDuration: !selectedSegment.lockDuration })}
                   />
                   <DetailInputRow 
                      label="Distance" 
                      unit="deg" 
                      value={selectedSegment.distance} 
                      onChange={(v) => updateSegment(selectedSegment.id, { distance: v })}
                      locked={selectedSegment.lockDistance}
                      onToggleLock={() => updateSegment(selectedSegment.id, { lockDistance: !selectedSegment.lockDistance })}
                   />
                   <DetailInputRow 
                      label="Velocity" 
                      unit="deg/s" 
                      value={selectedSegment.velocity} 
                      onChange={(v) => updateSegment(selectedSegment.id, { velocity: v })}
                      locked={selectedSegment.lockVelocity}
                      onToggleLock={() => updateSegment(selectedSegment.id, { lockVelocity: !selectedSegment.lockVelocity })}
                   />
                </div>

                {/* Right Column: Dynamics / Specifics */}
                <div className="flex-1 min-w-[180px]">
                   {/* Header Row with Lock and Dropdown */}
                   <div className="flex justify-end mb-3 items-center">
                      <LockButton 
                        locked={selectedSegment.lockAccel} 
                        onClick={() => updateSegment(selectedSegment.id, { lockAccel: !selectedSegment.lockAccel })} 
                      />
                      <div className="relative inline-block text-left w-32">
                         <select 
                            className="block w-full text-xs border border-gray-300 py-1 pl-2 pr-4 rounded-sm leading-tight focus:outline-none focus:bg-white bg-white"
                            value={selectedSegment.accelMode}
                            onChange={(e) => updateSegment(selectedSegment.id, { accelMode: e.target.value as any })}
                         >
                            <option value="Rate">Rate (deg/s²)</option>
                            <option value="Time">Time (s)</option>
                         </select>
                      </div>
                   </div>
                   
                   <div className="bg-gray-50 border border-gray-200 p-2 rounded-sm">
                      <DetailRightInput 
                        label="Accel." 
                        value={selectedSegment.accel} 
                        onChange={(v) => updateSegment(selectedSegment.id, { accel: v })} 
                      />
                      <DetailRightInput 
                        label="Decel." 
                        value={selectedSegment.decel} 
                        onChange={(v) => updateSegment(selectedSegment.id, { decel: v })} 
                      />
                      
                      <div className="mt-4 border-t border-gray-200 pt-2">
                        <div className="flex justify-end mb-2">
                            <label className="text-xs text-gray-500 mr-2">Jerk Unit:</label>
                            <select className="text-xs border border-gray-300 rounded-sm bg-white h-5 w-24">
                                <option>Time (s)</option>
                                <option>Rate (deg/s³)</option>
                            </select>
                        </div>
                        <DetailRightInput 
                            label="Jerk" 
                            value={selectedSegment.jerk} 
                            onChange={(v) => updateSegment(selectedSegment.id, { jerk: v })} 
                        />
                      </div>
                   </div>
                </div>

             </div>
           )}
        </div>
      </div>

      {/* RIGHT COLUMN: Chart */}
      <div className="flex-1 flex flex-col bg-white relative min-w-[300px]">
         {/* Toolbar */}
         <div className="absolute top-2 right-2 flex space-x-1 z-10">
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><ZoomIn size={14} className="text-gray-600"/></button>
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><ZoomOut size={14} className="text-gray-600"/></button>
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><BarChart2 size={14} className="text-gray-600"/></button>
         </div>

         {/* Chart Area */}
         <div className="flex-1 flex items-center justify-center overflow-hidden">
            <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="p-4">
                {/* Background Grid */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const y = scaleY(i * (chartData.maxVel * 1.2 / 5));
                    return (
                        <g key={i}>
                            <line x1={pad} y1={y} x2={svgW - pad} y2={y} stroke="#f0f0f0" />
                            <text x={pad - 5} y={y + 3} textAnchor="end" fontSize="10" fill="#999">
                                {Math.round(i * (chartData.maxVel * 1.2 / 5))}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#ccc" />
                <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#ccc" />
                
                {/* Velocity Path */}
                <path 
                    d={`M ${chartData.points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')}`}
                    fill="none"
                    stroke="#0078d7"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {/* Area Fill */}
                <path 
                    d={`M ${scaleX(0)},${scaleY(0)} L ${chartData.points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')} L ${scaleX(chartData.totalTime)},${scaleY(0)} Z`}
                    fill="#0078d7"
                    fillOpacity="0.1"
                />

                {/* Points */}
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

                {/* Labels */}
                <text x={svgW / 2} y={svgH - 10} textAnchor="middle" fontSize="10" fill="#666">Time (s)</text>
                <text x={15} y={svgH / 2} textAnchor="middle" fontSize="10" fill="#666" transform={`rotate(-90, 15, ${svgH/2})`}>Velocity</text>
            </svg>
         </div>

         {/* Chart Stats Footer */}
         <div className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 justify-between text-[10px] text-gray-500">
             <span>Cycle Time: <b>{chartData.totalTime.toFixed(3)} s</b></span>
             <span>Max Vel: <b>{chartData.maxVel.toFixed(1)}</b></span>
             <span>RMS Torque: <b>--</b></span>
         </div>
      </div>
    </div>
  );
};
