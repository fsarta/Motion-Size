import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, BarChart2, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import { UnitInput, Select } from './Common';
import { toBase } from '../utils/unitConversion';

/* --- Types --- */

type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine';
type CalcTarget = 'duration' | 'distance' | 'velocity'; // Which parameter is calculated?

interface MotionSegment {
  id: string;
  type: SegmentType;
  
  // Basic Kinematics (Stored in Base Units: s, deg/mm, deg/s / mm/s)
  duration: number; 
  distance: number; 
  velocity: number; 
  
  // Dynamics (Calculated/Stored)
  accel: number; 
  decel: number;
  jerk: number;
  
  // Configuration
  payload: number; 
  
  // State
  calcTarget: CalcTarget; // The "Unlocked" parameter
  
  // UI Preferences
  distUnitType: 'angle' | 'length'; // User toggle for Rotary vs Linear
}

const DEFAULT_SEGMENTS: MotionSegment[] = [
  { 
    id: '1', type: 'Trapezoid', 
    duration: 1.0, distance: 360, velocity: 540, // 360 deg in 1s trapezoid (1.5 factor) = 540 deg/s peak
    accel: 1620, decel: 1620, jerk: 0, payload: 0,
    calcTarget: 'velocity', // Velocity is calculated from Time & Dist
    distUnitType: 'angle'
  },
  { 
    id: '2', type: 'Dwell/Traverse', 
    duration: 0.5, distance: 0, velocity: 0, 
    accel: 0, decel: 0, jerk: 0, payload: 0,
    calcTarget: 'distance',
    distUnitType: 'angle'
  },
];

/* --- Components --- */

const LockButton = ({ locked, onClick }: { locked: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`mr-1 focus:outline-none ${locked ? 'text-black' : 'text-gray-400 hover:text-blue-600'}`}
    title={locked ? "Locked (Input)" : "Unlocked (Calculated)"}
  >
    {locked ? <Lock size={14} fill="currentColor" /> : <Unlock size={14} />}
  </button>
);

const DetailRow = ({ 
  label, 
  children,
  locked,
  onToggleLock
}: { 
  label: string, 
  children: React.ReactNode, 
  locked: boolean, 
  onToggleLock: () => void 
}) => (
  <div className="mb-3">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs text-gray-700 font-medium">{label}</label>
    </div>
    <div className="flex items-center">
      <LockButton locked={locked} onClick={onToggleLock} />
      <div className={`flex-1 ${!locked ? 'opacity-80' : ''}`}>
        {children}
      </div>
    </div>
  </div>
);

const ReadOnlyRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex items-center mb-2">
    <label className="w-16 text-right text-xs text-gray-600 mr-2">{label}</label>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

export const ProfileEditor: React.FC = () => {
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SEGMENTS[0].id);

  // --- Logic ---

  // Solves the kinematic triangle (d, v, t) and dynamics based on profile type
  const solveSegment = (seg: MotionSegment): MotionSegment => {
    let { duration, distance, velocity, type, calcTarget } = seg;
    let accel = 0, decel = 0, jerk = 0;

    // 1. Solve Kinematics (d, v, t)
    // Factors depend on profile area. 
    // Triangle: Vpeak = 2 * Vavg
    // Trapezoid (1/3): Vpeak = 1.5 * Vavg
    // Sine/S-Curve: Higher factors (~2 for Sine)
    // Dwell: V = 0
    
    let shapeFactor = 1.0; // Square (Const Vel)
    if (type === 'Trapezoid') shapeFactor = 1.5;
    if (type === 'Triangle') shapeFactor = 2.0;
    if (type === 'Accel/Decel') shapeFactor = 2.0; // Linear ramp from 0
    
    // Avoid division by zero
    const safeDur = duration === 0 ? 0.0001 : duration;
    const safeVel = velocity === 0 ? 0.0001 : velocity;

    if (calcTarget === 'velocity') {
       if (type === 'Dwell/Traverse' && distance === 0) {
           velocity = 0;
       } else {
           const vAvg = distance / safeDur;
           velocity = vAvg * shapeFactor;
       }
    } else if (calcTarget === 'duration') {
       if (velocity === 0 && distance !== 0) {
           duration = 0; // Impossible
       } else {
           const vAvg = velocity / shapeFactor;
           duration = Math.abs(distance / (vAvg || 1)); // Avoid inf
       }
    } else if (calcTarget === 'distance') {
       const vAvg = velocity / shapeFactor;
       distance = vAvg * duration;
    }

    // 2. Solve Dynamics (Accel, Decel, Jerk) based on Vpeak and Time
    // Formulas assume symmetric profiles for simplicity in this demo
    if (type === 'Trapezoid') {
        // 1/3 time for accel
        const tAcc = duration / 3;
        accel = Math.abs(velocity / tAcc);
        decel = Math.abs(velocity / tAcc);
    } else if (type === 'Triangle') {
        // 1/2 time for accel
        const tAcc = duration / 2;
        accel = Math.abs(velocity / tAcc);
        decel = Math.abs(velocity / tAcc);
    } else if (type === 'Accel/Decel') {
        // Full time for accel
        accel = Math.abs(velocity / duration);
        decel = 0; 
    } else if (type === 'Dwell/Traverse') {
        accel = 0;
        decel = 0;
    }
    
    // Jerk approximation (infinite for linear ramps, but let's show 0 or a value if S-Curve)
    jerk = 0;

    return {
        ...seg,
        duration,
        distance,
        velocity,
        accel,
        decel,
        jerk
    };
  };

  const updateSegment = (id: string, updates: Partial<MotionSegment>) => {
    setSegments(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, ...updates };
      // Logic for calcTarget switching
      // If we are locking the current target (e.g. was calc Velocity, now user enters Velocity)
      // We must unlock something else. Priority: Unlock Distance, then Duration.
      if (updates.calcTarget === undefined && updates.velocity !== undefined && s.calcTarget === 'velocity') {
          // User edited Velocity manually, so Velocity becomes Input.
          // We need a new target. Let's solve for Distance.
          updated.calcTarget = 'distance'; 
      }
      
      return solveSegment(updated);
    }));
  };

  // Helper to switch lock state
  const handleLockClick = (seg: MotionSegment, target: CalcTarget) => {
      // If clicking the Open Lock (currently calculated), it becomes Closed (Input).
      // We must choose another field to become Open (Calculated).
      // If clicking a Closed Lock (currently input), it becomes Open (Calculated).
      
      if (seg.calcTarget === target) {
          // It is currently calculated (Open). User wants to Lock it.
          // Do nothing? Or force another to unlock?
          // Usually clicking an open lock means "I want to set this".
          // But to set it, we just type in the box.
          // Let's assume clicking lock explicitly sets it as the Calculated field.
          return; 
      } else {
          // It is currently Input (Closed). User wants to Unlock it (make it calculated).
          updateSegment(seg.id, { calcTarget: target });
      }
  };

  const addSegment = () => {
    const newId = Date.now().toString();
    const newSeg: MotionSegment = {
       id: newId, type: 'Dwell/Traverse',
       duration: 1.0, distance: 0, velocity: 0,
       accel: 0, decel: 0, jerk: 0, payload: 0,
       calcTarget: 'distance',
       distUnitType: 'angle'
    };
    setSegments([...segments, solveSegment(newSeg)]);
    setSelectedId(newId);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    const newSegs = segments.filter(s => s.id !== id);
    setSegments(newSegs);
    if (selectedId === id) setSelectedId(newSegs[0].id);
  };

  const selectedSegment = segments.find(s => s.id === selectedId) || segments[0];

  // --- Chart Calculation ---
  const chartData = useMemo(() => {
    let currentTime = 0;
    const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    let maxV = 10;

    segments.forEach(seg => {
        const startT = currentTime;
        const endT = currentTime + seg.duration;
        const V = seg.velocity;
        
        if (seg.type === 'Trapezoid') {
             const t1 = startT + (seg.duration * 0.33);
             const t2 = startT + (seg.duration * 0.66);
             points.push({ x: t1, y: V });
             points.push({ x: t2, y: V });
             points.push({ x: endT, y: 0 }); 
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
             points.push({ x: endT, y: V });
        } else {
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
  const scaleX = (x: number) => pad + (x / (chartData.totalTime || 1)) * (svgW - 2*pad);
  const scaleY = (y: number) => (svgH - pad) - (y / ((chartData.maxVel || 10) * 1.2)) * (svgH - 2*pad);


  return (
    <div className="flex h-full border border-gray-300 bg-white font-sans text-xs">
      
      {/* LEFT COLUMN: Grid & Detail Editor */}
      <div className="w-[480px] flex flex-col border-r border-gray-300">
        
        {/* 1. TOP: Segment Grid */}
        <div className="h-[40%] flex flex-col bg-white">
           <div className="h-7 bg-gray-100 border-b border-gray-300 flex items-center px-2 space-x-2 shrink-0">
             <button onClick={addSegment} className="flex items-center px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-blue-50 text-xs text-gray-700">
                <Plus size={12} className="mr-1 text-green-600"/> Add
             </button>
             <div className="w-px h-4 bg-gray-300 mx-1"></div>
             <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Sequence</span>
           </div>
           
           <div className="grid grid-cols-[24px_110px_60px_70px_1fr_24px] bg-gray-200 border-b border-gray-300 font-semibold text-gray-700 py-1 shrink-0">
               <div className="text-center">#</div>
               <div className="px-1 border-l border-gray-300">Type</div>
               <div className="px-1 border-l border-gray-300 text-right">Time</div>
               <div className="px-1 border-l border-gray-300 text-right">Dist</div>
               <div className="px-1 border-l border-gray-300 text-right">V Max</div>
               <div></div>
           </div>

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
                       <div className="p-1 text-right border-r border-gray-200 truncate">{seg.duration.toFixed(3)}</div>
                       <div className="p-1 text-right border-r border-gray-200 truncate">{seg.distance.toFixed(1)}</div>
                       <div className="p-1 text-right border-r border-gray-200 truncate">{seg.velocity.toFixed(1)}</div>
                       
                       <div className="flex items-center justify-center">
                           <button onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }} className="text-gray-400 hover:text-red-500">
                               <Trash2 size={12} />
                           </button>
                       </div>
                   </div>
               ))}
           </div>
        </div>

        {/* 2. BOTTOM: Detail Panel */}
        <div className="flex-1 bg-gray-100 border-t border-gray-300 p-4 shadow-inner overflow-y-auto">
           {selectedSegment && (
             <div className="flex gap-6">
                
                {/* Left Column: Kinematics Inputs */}
                <div className="flex-1 min-w-[160px]">
                   <DetailRow 
                      label="Duration" 
                      locked={selectedSegment.calcTarget !== 'duration'}
                      onToggleLock={() => handleLockClick(selectedSegment, 'duration')}
                   >
                      <UnitInput 
                         type="time"
                         value={selectedSegment.duration}
                         onChange={(v) => updateSegment(selectedSegment.id, { duration: parseFloat(v), calcTarget: selectedSegment.calcTarget === 'duration' ? 'velocity' : selectedSegment.calcTarget })}
                         readOnly={selectedSegment.calcTarget === 'duration'}
                      />
                   </DetailRow>

                   <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-700 font-medium">Distance</label>
                          {/* Unit Type Toggle for Distance */}
                          <select 
                             className="text-[10px] bg-transparent border-none outline-none text-gray-500 cursor-pointer hover:text-blue-600"
                             value={selectedSegment.distUnitType}
                             onChange={(e) => updateSegment(selectedSegment.id, { distUnitType: e.target.value as any })}
                          >
                             <option value="angle">Rotary (deg, rad)</option>
                             <option value="length">Linear (mm, m)</option>
                          </select>
                      </div>
                      <div className="flex items-center">
                          <LockButton 
                             locked={selectedSegment.calcTarget !== 'distance'} 
                             onClick={() => handleLockClick(selectedSegment, 'distance')} 
                          />
                          <div className={`flex-1 ${selectedSegment.calcTarget === 'distance' ? 'opacity-80' : ''}`}>
                             <UnitInput 
                                type={selectedSegment.distUnitType}
                                value={selectedSegment.distance}
                                onChange={(v) => updateSegment(selectedSegment.id, { distance: parseFloat(v), calcTarget: selectedSegment.calcTarget === 'distance' ? 'velocity' : selectedSegment.calcTarget })}
                                readOnly={selectedSegment.calcTarget === 'distance'}
                             />
                          </div>
                      </div>
                   </div>

                   <DetailRow 
                      label="Velocity" 
                      locked={selectedSegment.calcTarget !== 'velocity'}
                      onToggleLock={() => handleLockClick(selectedSegment, 'velocity')}
                   >
                      <UnitInput 
                         type="speed"
                         value={selectedSegment.velocity}
                         onChange={(v) => updateSegment(selectedSegment.id, { velocity: parseFloat(v), calcTarget: selectedSegment.calcTarget === 'velocity' ? 'distance' : selectedSegment.calcTarget })}
                         readOnly={selectedSegment.calcTarget === 'velocity'}
                      />
                   </DetailRow>
                </div>

                {/* Right Column: Calculated Dynamics */}
                <div className="flex-1 min-w-[180px] bg-gray-50 border border-gray-200 p-2 rounded-sm h-fit">
                   <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-right">Calculated Results</div>
                   
                   <ReadOnlyRow label="Accel.">
                      <UnitInput type="angle" value={selectedSegment.accel} onChange={()=>{}} readOnly /> 
                      {/* Note: UnitInput type 'angle' is a placeholder if we lack 'acceleration' type. Using angle creates basic UI. 
                          Ideally we add 'acceleration' to unitConversion.ts, but for now value displays raw or standard. 
                          Wait, UnitInput handles display. If type is 'angle', it shows deg. 
                          We need Rate units. We'll use 'speed' (deg/s) for now or just numeric readouts if types missing.
                      */}
                   </ReadOnlyRow>
                   
                   <ReadOnlyRow label="Decel.">
                      <UnitInput type="angle" value={selectedSegment.decel} onChange={()=>{}} readOnly />
                   </ReadOnlyRow>
                   
                   <div className="mt-4 border-t border-gray-200 pt-2">
                       <ReadOnlyRow label="Jerk">
                          <UnitInput type="angle" value={selectedSegment.jerk} onChange={()=>{}} readOnly />
                       </ReadOnlyRow>
                   </div>
                </div>

             </div>
           )}
        </div>
      </div>

      {/* RIGHT COLUMN: Chart */}
      <div className="flex-1 flex flex-col bg-white relative min-w-[300px]">
         <div className="absolute top-2 right-2 flex space-x-1 z-10">
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><ZoomIn size={14} className="text-gray-600"/></button>
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><ZoomOut size={14} className="text-gray-600"/></button>
            <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50"><BarChart2 size={14} className="text-gray-600"/></button>
         </div>

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

                <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#ccc" />
                <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#ccc" />
                
                <path 
                    d={`M ${chartData.points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')}`}
                    fill="none"
                    stroke="#0078d7"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                <path 
                    d={`M ${scaleX(0)},${scaleY(0)} L ${chartData.points.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')} L ${scaleX(chartData.totalTime)},${scaleY(0)} Z`}
                    fill="#0078d7"
                    fillOpacity="0.1"
                />

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

                <text x={svgW / 2} y={svgH - 10} textAnchor="middle" fontSize="10" fill="#666">Time (s)</text>
                <text x={15} y={svgH / 2} textAnchor="middle" fontSize="10" fill="#666" transform={`rotate(-90, 15, ${svgH/2})`}>Velocity</text>
            </svg>
         </div>

         <div className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 justify-between text-[10px] text-gray-500">
             <span>Cycle Time: <b>{chartData.totalTime.toFixed(3)} s</b></span>
             <span>Max Vel: <b>{chartData.maxVel.toFixed(1)}</b></span>
         </div>
      </div>
    </div>
  );
};
