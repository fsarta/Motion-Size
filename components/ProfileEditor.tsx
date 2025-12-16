import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Lock, Unlock, ChevronRight, CheckSquare, Square, RefreshCw, Upload, FileText, Download } from 'lucide-react';
import { UnitInput } from './Common';

/* --- Types --- */

type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine';
type CalcTarget = 'duration' | 'distance' | 'velocity';

interface MotionSegment {
  id: string;
  type: SegmentType;
  duration: number; 
  distance: number; 
  velocity: number; 
  startVelocity: number; 
  endVelocity: number;   
  accel: number; 
  decel: number;
  jerk: number;
  payload: number; 
  calcTarget: CalcTarget;
  distUnitType: 'angle' | 'length';
}

interface TimePoint {
  t: number;
  pos: number;
  vel: number;
  acc: number;
  jerk: number;
  torque: number;
  motorVel: number;
}

type TraceType = 'pos' | 'vel' | 'acc' | 'jerk' | 'torque' | 'motorVel';

interface TraceConfig {
  key: TraceType;
  label: string;
  color: string;
  unit: string;
  active: boolean;
}

const DEFAULT_SEGMENTS: MotionSegment[] = [
  { 
    id: '1', type: 'Trapezoid', 
    duration: 1.0, distance: 360, velocity: 540, 
    startVelocity: 0, endVelocity: 0,
    accel: 1620, decel: 1620, jerk: 0, payload: 0,
    calcTarget: 'velocity', 
    distUnitType: 'angle'
  },
  { 
    id: '2', type: 'Dwell/Traverse', 
    duration: 0.5, distance: 0, velocity: 0, 
    startVelocity: 0, endVelocity: 0,
    accel: 0, decel: 0, jerk: 0, payload: 0,
    calcTarget: 'distance', 
    distUnitType: 'angle'
  },
];

/* --- Components --- */

const LockButton = ({ locked, onClick, disabled }: { locked: boolean, onClick: () => void, disabled?: boolean }) => (
  <button 
    onClick={disabled ? undefined : onClick}
    className={`mr-1 focus:outline-none ${disabled ? 'text-gray-300 cursor-not-allowed' : locked ? 'text-black' : 'text-gray-400 hover:text-blue-600'}`}
    title={disabled ? "Fixed by Profile Type" : (locked ? "Locked (Input)" : "Unlocked (Calculated)")}
  >
    {locked ? <Lock size={14} fill="currentColor" /> : <Unlock size={14} />}
  </button>
);

const DetailRow = ({ label, children, locked, onToggleLock, disabledLock }: any) => (
  <div className="mb-3">
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs text-gray-700 font-medium">{label}</label>
    </div>
    <div className="flex items-center">
      <LockButton locked={locked} onClick={onToggleLock} disabled={disabledLock} />
      <div className={`flex-1 ${!locked || disabledLock ? 'opacity-90' : ''}`}>
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

// --- Math / Simulation Helpers ---

const simulateMotion = (segments: MotionSegment[], motorRatio: number = 10, totalInertia: number = 0.05): TimePoint[] => {
  const points: TimePoint[] = [];
  const dt = 0.01; 
  let currentT = 0;
  let currentPos = 0;

  segments.forEach(seg => {
    const steps = Math.max(2, Math.ceil(seg.duration / dt));
    const realDt = seg.duration / steps;
    let t_local = 0;
    
    // Trapezoid Params
    const t_acc = seg.duration / 3;
    const t_dec = seg.duration / 3;
    const t_flat = seg.duration - t_acc - t_dec;
    
    const slope = (seg.velocity - seg.startVelocity) / seg.duration;

    for (let i = 0; i <= steps; i++) {
        let v = 0;
        let a = 0;
        let j = 0; // Jerk simplified

        if (seg.type === 'Dwell/Traverse') {
            v = seg.velocity; 
            a = 0;
        } else if (seg.type === 'Accel/Decel') {
            v = seg.startVelocity + slope * t_local;
            a = slope;
        } else if (seg.type === 'Trapezoid') {
            if (t_local < t_acc) {
                a = (seg.velocity > 0 ? 1 : -1) * Math.abs(seg.accel);
                v = a * t_local;
            } else if (t_local < t_acc + t_flat) {
                a = 0;
                v = seg.velocity;
            } else {
                a = (seg.velocity > 0 ? -1 : 1) * Math.abs(seg.decel);
                const t_dec_local = t_local - (t_acc + t_flat);
                v = seg.velocity + a * t_dec_local;
            }
        } else {
             v = (seg.distance / seg.duration);
             a = 0;
        }

        if (i > 0) currentPos += v * realDt;

        const damping = 0.01;
        const torque = (totalInertia * a) + seg.payload + (damping * v);

        points.push({
            t: currentT + t_local,
            pos: currentPos,
            vel: v,
            acc: a,
            jerk: j, 
            torque: torque,
            motorVel: v * motorRatio
        });
        t_local += realDt;
    }
    currentT += seg.duration;
  });

  return points;
};

// Process Raw CSV Data
const processImportedData = (rawData: {t: number, pos: number}[], motorRatio: number, totalInertia: number): TimePoint[] => {
    if (rawData.length === 0) return [];
    
    // Sort by time just in case
    rawData.sort((a, b) => a.t - b.t);

    const points: TimePoint[] = [];
    
    for (let i = 0; i < rawData.length; i++) {
        const curr = rawData[i];
        const prev = i > 0 ? rawData[i-1] : null;
        const next = i < rawData.length - 1 ? rawData[i+1] : null;

        let v = 0;
        let a = 0;
        let j = 0;

        // Calculate Velocity (finite difference)
        if (prev) {
            const dt = curr.t - prev.t;
            if (dt > 0) v = (curr.pos - prev.pos) / dt;
        } else if (next) {
            // Start point approximation
            const dt = next.t - curr.t;
            if (dt > 0) v = (next.pos - curr.pos) / dt;
        }

        // Calculate Accel
        // We need previous velocity for this. 
        // For i=0, v=initial. For i>0, we just calculated v.
        // To get a smooth accel, better to calculate all Vs first, then all As.
    }

    // Two-pass approach for derivatives
    const tempV: number[] = new Array(rawData.length).fill(0);
    const tempA: number[] = new Array(rawData.length).fill(0);
    const tempJ: number[] = new Array(rawData.length).fill(0);

    // Pass 1: Velocity
    for (let i = 0; i < rawData.length; i++) {
        if (i === 0) {
           if (rawData.length > 1) tempV[i] = (rawData[1].pos - rawData[0].pos) / (rawData[1].t - rawData[0].t);
        } else if (i === rawData.length - 1) {
           tempV[i] = (rawData[i].pos - rawData[i-1].pos) / (rawData[i].t - rawData[i-1].t);
        } else {
           // Central difference
           tempV[i] = (rawData[i+1].pos - rawData[i-1].pos) / (rawData[i+1].t - rawData[i-1].t);
        }
    }

    // Pass 2: Acceleration
    for (let i = 0; i < rawData.length; i++) {
        if (i === 0) {
           if (rawData.length > 1) tempA[i] = (tempV[1] - tempV[0]) / (rawData[1].t - rawData[0].t);
        } else if (i === rawData.length - 1) {
           tempA[i] = (tempV[i] - tempV[i-1]) / (rawData[i].t - rawData[i-1].t);
        } else {
           tempA[i] = (tempV[i+1] - tempV[i-1]) / (rawData[i+1].t - rawData[i-1].t);
        }
    }

    // Pass 3: Jerk
    for (let i = 0; i < rawData.length; i++) {
        if (i === 0) {
           if (rawData.length > 1) tempJ[i] = (tempA[1] - tempA[0]) / (rawData[1].t - rawData[0].t);
        } else if (i === rawData.length - 1) {
           tempJ[i] = (tempA[i] - tempA[i-1]) / (rawData[i].t - rawData[i-1].t);
        } else {
           tempJ[i] = (tempA[i+1] - tempA[i-1]) / (rawData[i+1].t - rawData[i-1].t);
        }
    }

    // Final Assembly
    for (let i = 0; i < rawData.length; i++) {
        const t = rawData[i].t;
        const pos = rawData[i].pos;
        const v = tempV[i];
        const a = tempA[i];
        const j = tempJ[i];
        
        const damping = 0.01;
        const torque = (totalInertia * a) + (damping * v); // Assuming 0 external payload for import, or add field

        points.push({ t, pos, vel: v, acc: a, jerk: j, torque, motorVel: v * motorRatio });
    }

    return points;
};


export const ProfileEditor: React.FC = () => {
  // Mode: Sequence Editor vs CSV Import
  const [mode, setMode] = useState<'sequence' | 'import'>('sequence');

  // Sequence Data
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SEGMENTS[0].id);
  
  // Import Data
  const [importedData, setImportedData] = useState<TimePoint[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');

  // Common UI State
  const [cursorTime, setCursorTime] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Chart Trace Config
  const [traces, setTraces] = useState<TraceConfig[]>([
    { key: 'pos', label: 'Position', color: '#10b981', unit: 'deg', active: true },
    { key: 'vel', label: 'Velocity', color: '#3b82f6', unit: 'deg/s', active: true },
    { key: 'acc', label: 'Accel', color: '#ef4444', unit: 'deg/s²', active: false },
    { key: 'jerk', label: 'Jerk', color: '#f59e0b', unit: 'deg/s³', active: false },
    { key: 'torque', label: 'Est. Torque', color: '#8b5cf6', unit: 'Nm', active: false },
    { key: 'motorVel', label: 'Motor Speed', color: '#ec4899', unit: 'rpm', active: false },
  ]);

  const [motorRatio, setMotorRatio] = useState<number>(10);

  // --- Sequence Logic ---

  const solveSegment = (seg: MotionSegment, startV: number): MotionSegment => {
    let { duration, distance, velocity, type, calcTarget } = seg;
    let accel = 0, decel = 0, jerk = 0;
    let endV = 0;
    const safeDur = duration === 0 ? 0.0001 : duration;

    if (type === 'Dwell/Traverse') {
        velocity = startV; 
        if (calcTarget === 'velocity') calcTarget = 'distance';
        
        if (calcTarget === 'distance') {
            distance = velocity * duration;
        } else if (calcTarget === 'duration') {
             if (Math.abs(velocity) < 1e-6) distance = 0; 
             else duration = distance / velocity;
        }
        endV = velocity;
    } 
    else if (type === 'Accel/Decel') {
        if (calcTarget === 'velocity') {
            const vAvg = distance / safeDur;
            velocity = 2 * vAvg - startV;
        } else if (calcTarget === 'distance') {
            const vAvg = (startV + velocity) / 2;
            distance = vAvg * duration;
        } else if (calcTarget === 'duration') {
            const vAvg = (startV + velocity) / 2;
            if (Math.abs(vAvg) < 1e-6) duration = 0; 
            else duration = distance / vAvg;
        }
        endV = velocity;
        accel = Math.abs((endV - startV) / safeDur);
        decel = 0; 
    }
    else {
        let shapeFactor = 1.0; 
        if (type === 'Trapezoid') shapeFactor = 1.5;
        if (type === 'Triangle') shapeFactor = 2.0;
        
        if (calcTarget === 'velocity') {
           const vAvg = distance / safeDur;
           velocity = vAvg * shapeFactor;
        } else if (calcTarget === 'duration') {
           const vAvg = velocity / shapeFactor;
           duration = Math.abs(distance / (vAvg || 1));
        } else if (calcTarget === 'distance') {
           const vAvg = velocity / shapeFactor;
           distance = vAvg * duration;
        }
        endV = 0; 
        
        if (type === 'Trapezoid') {
            const tAcc = duration / 3;
            accel = Math.abs(velocity / tAcc);
            decel = Math.abs(velocity / tAcc);
        } else if (type === 'Triangle') {
            const tAcc = duration / 2;
            accel = Math.abs(velocity / tAcc);
            decel = Math.abs(velocity / tAcc);
        }
    }

    return { ...seg, calcTarget, duration, distance, velocity, startVelocity: startV, endVelocity: endV, accel, decel, jerk };
  };

  const recalculateChain = (currentSegments: MotionSegment[]): MotionSegment[] => {
      let currentV = 0;
      return currentSegments.map(seg => {
          const solved = solveSegment(seg, currentV);
          currentV = solved.endVelocity;
          return solved;
      });
  };

  const updateSegment = (id: string, updates: Partial<MotionSegment>) => {
    setSegments(prev => {
      const updatedList = prev.map(s => {
        if (s.id !== id) return s;
        const newSeg = { ...s, ...updates };
        if (updates.calcTarget === undefined && updates.velocity !== undefined && s.calcTarget === 'velocity') {
            newSeg.calcTarget = 'distance';
        }
        if (newSeg.type === 'Dwell/Traverse' && newSeg.calcTarget === 'velocity') {
            newSeg.calcTarget = 'distance';
        }
        return newSeg;
      });
      return recalculateChain(updatedList);
    });
  };

  const handleLockClick = (seg: MotionSegment, target: CalcTarget) => {
      if (seg.calcTarget === target) return; 
      updateSegment(seg.id, { calcTarget: target });
  };

  const addSegment = () => {
    const newId = Date.now().toString();
    const newSeg: MotionSegment = {
       id: newId, type: 'Dwell/Traverse',
       duration: 1.0, distance: 0, velocity: 0,
       startVelocity: 0, endVelocity: 0,
       accel: 0, decel: 0, jerk: 0, payload: 0,
       calcTarget: 'distance',
       distUnitType: 'angle'
    };
    setSegments(prev => recalculateChain([...prev, newSeg]));
    setSelectedId(newId);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    const newSegs = segments.filter(s => s.id !== id);
    setSegments(recalculateChain(newSegs));
    if (selectedId === id) setSelectedId(newSegs[0].id);
  };

  // --- Import Logic ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          // Simple parsing: split by line, split by comma. Expected: time, pos
          const lines = text.split('\n');
          const raw: {t: number, pos: number}[] = [];
          
          lines.forEach(line => {
              const parts = line.trim().split(/[,;|\t]+/);
              if (parts.length >= 2) {
                  const t = parseFloat(parts[0]);
                  const pos = parseFloat(parts[1]);
                  if (!isNaN(t) && !isNaN(pos)) {
                      raw.push({t, pos});
                  }
              }
          });

          // Process
          const processed = processImportedData(raw, motorRatio, 0.05);
          setImportedData(processed);
      };
      reader.readAsText(file);
  };

  // --- Chart Data & Analysis ---

  const toggleTrace = (key: TraceType) => {
      setTraces(prev => prev.map(t => t.key === key ? { ...t, active: !t.active } : t));
  };

  const selectedSegment = segments.find(s => s.id === selectedId) || segments[0];
  
  const gridData = useMemo(() => {
      let absPos = 0;
      return segments.map(s => {
          absPos += s.distance;
          return { ...s, absPos };
      });
  }, [segments]);

  const timeSeries = useMemo(() => {
      if (mode === 'import') return importedData;
      return simulateMotion(segments, motorRatio);
  }, [segments, motorRatio, mode, importedData]);

  const analysis = useMemo(() => {
     const res: Record<TraceType, { min: number, max: number, avg: number, rms: number }> = {} as any;
     
     traces.forEach(t => {
         const values = timeSeries.map(p => p[t.key]);
         if (values.length === 0) {
             res[t.key] = { min:0, max:0, avg:0, rms:0 };
             return;
         }
         const min = Math.min(...values);
         const max = Math.max(...values);
         const sum = values.reduce((a, b) => a + b, 0);
         const avg = sum / values.length;
         const sqSum = values.reduce((a, b) => a + (b*b), 0);
         const rms = Math.sqrt(sqSum / values.length);
         res[t.key] = { min, max, avg, rms };
     });
     return res;
  }, [timeSeries, traces]);

  const totalTime = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].t : 0;

  // Find cursor values
  const cursorPoint = useMemo(() => {
     if (cursorTime === null || timeSeries.length === 0) return null;
     // Find closest point
     const closest = timeSeries.reduce((prev, curr) => 
        Math.abs(curr.t - cursorTime) < Math.abs(prev.t - cursorTime) ? curr : prev
     );
     return closest;
  }, [cursorTime, timeSeries]);

  // --- SVG Scaling ---
  const svgW = 600;
  const svgH = 250;
  const padX = 40;
  const padY = 20;

  const scaleX = (t: number) => padX + (t / (totalTime || 1)) * (svgW - 2 * padX);
  
  const getScaleYLocal = (key: TraceType) => {
      const stats = analysis[key];
      const range = Math.max(0.001, stats.max - stats.min);
      const minY = stats.min - (range * 0.05);
      const maxY = stats.max + (range * 0.05);
      const effectiveRange = maxY - minY;
      
      return (val: number) => {
          const norm = (val - minY) / effectiveRange;
          return (svgH - padY) - (norm * (svgH - 2 * padY));
      };
  };

  const getPath = (key: TraceType) => {
      if (timeSeries.length === 0) return '';
      const scaleYLocal = getScaleYLocal(key);
      return timeSeries.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.t).toFixed(1)},${scaleYLocal(p[key]).toFixed(1)}`
      ).join(' ');
  };

  // Improved Cursor Handler using SVG Matrix
  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      // Create an SVGPoint for transformation
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;

      // Transform screen coordinates to SVG coordinates
      const svgP = point.matrixTransform(svg.getScreenCTM()?.inverse());
      
      // Calculate Time from SVG X
      // svgP.x = padX + (t / totalTime) * plotWidth
      // t = ((svgP.x - padX) / plotWidth) * totalTime
      
      const plotWidth = svgW - 2 * padX;
      let t = ((svgP.x - padX) / plotWidth) * (totalTime || 1);
      
      t = Math.max(0, Math.min(totalTime, t));
      setCursorTime(t);
  };

  const handleGraphMouseLeave = () => {
      setCursorTime(null);
  };

  return (
    <div className="flex h-full border border-gray-300 bg-white font-sans text-xs">
      
      {/* LEFT COLUMN: Editor (Dual Mode) */}
      <div className="w-[480px] flex flex-col border-r border-gray-300 shrink-0">
        
        {/* Mode Toggles */}
        <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-1 shrink-0">
             <button 
                onClick={() => setMode('sequence')}
                className={`flex-1 flex items-center justify-center h-6 text-[10px] font-bold uppercase rounded-sm mr-1 ${mode === 'sequence' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
             >
                Sequence Editor
             </button>
             <button 
                onClick={() => setMode('import')}
                className={`flex-1 flex items-center justify-center h-6 text-[10px] font-bold uppercase rounded-sm ${mode === 'import' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
             >
                Import CSV Profile
             </button>
        </div>

        {/* MODE: SEQUENCE EDITOR */}
        {mode === 'sequence' && (
            <>
                {/* Grid */}
                <div className="h-[40%] flex flex-col bg-white">
                <div className="h-7 bg-gray-50 border-b border-gray-300 flex items-center px-2 space-x-2 shrink-0">
                    <button onClick={addSegment} className="flex items-center px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-blue-50 text-xs text-gray-700">
                        <Plus size={12} className="mr-1 text-green-600"/> Add Step
                    </button>
                </div>
                
                <div className="grid grid-cols-[24px_110px_60px_70px_1fr_24px] bg-gray-200 border-b border-gray-300 font-semibold text-gray-700 py-1 shrink-0">
                    <div className="text-center">#</div>
                    <div className="px-1 border-l border-gray-300">Type</div>
                    <div className="px-1 border-l border-gray-300 text-right">Time</div>
                    <div className="px-1 border-l border-gray-300 text-right">End Pos</div>
                    <div className="px-1 border-l border-gray-300 text-right">V End</div>
                    <div></div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white">
                    {gridData.map((seg, idx) => (
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
                            <div className="p-1 text-right border-r border-gray-200 truncate">{seg.absPos.toFixed(1)}</div>
                            <div className="p-1 text-right border-r border-gray-200 truncate">{seg.endVelocity.toFixed(1)}</div>
                            
                            <div className="flex items-center justify-center">
                                <button onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                </div>

                {/* Details */}
                <div className="flex-1 bg-gray-100 border-t border-gray-300 p-4 shadow-inner overflow-y-auto">
                {selectedSegment && (
                    <div className="flex gap-6">
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
                            disabledLock={selectedSegment.type === 'Dwell/Traverse'}
                        >
                            <UnitInput 
                                type="speed"
                                value={selectedSegment.velocity}
                                onChange={(v) => updateSegment(selectedSegment.id, { velocity: parseFloat(v), calcTarget: selectedSegment.calcTarget === 'velocity' ? 'distance' : selectedSegment.calcTarget })}
                                readOnly={selectedSegment.calcTarget === 'velocity' || selectedSegment.type === 'Dwell/Traverse'}
                            />
                        </DetailRow>

                        <DetailRow label="Payload/Force" locked={true} onToggleLock={()=>{}} disabledLock={true}>
                            <UnitInput 
                                type="torque"
                                value={selectedSegment.payload}
                                onChange={(v) => updateSegment(selectedSegment.id, { payload: parseFloat(v) })}
                            />
                        </DetailRow>
                        </div>

                        <div className="flex-1 min-w-[180px] bg-gray-50 border border-gray-200 p-2 rounded-sm h-fit">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-right">Calculated Results</div>
                        <ReadOnlyRow label="Accel.">
                            <UnitInput type="angle" value={selectedSegment.accel} onChange={()=>{}} readOnly /> 
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
            </>
        )}

        {/* MODE: CSV IMPORT */}
        {mode === 'import' && (
            <div className="flex-1 bg-gray-50 flex flex-col p-6">
                <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center mb-6 hover:bg-blue-50 transition-colors">
                    <Upload size={32} className="text-gray-400 mb-2"/>
                    <span className="text-sm font-semibold text-gray-600">Click to Upload CSV</span>
                    <span className="text-xs text-gray-400 mt-1">Format: Time, Position</span>
                    <input 
                        type="file" 
                        accept=".csv,.txt"
                        className="absolute opacity-0 w-full h-full cursor-pointer inset-0"
                        onChange={handleFileUpload}
                    />
                </div>

                {importedData.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
                        <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 pb-2">
                            <FileText size={16} className="text-blue-600"/>
                            <span className="font-bold text-gray-700">{importFileName}</span>
                        </div>
                        <div className="space-y-2 text-xs text-gray-600">
                             <div className="flex justify-between">
                                 <span>Data Points:</span>
                                 <span className="font-mono">{importedData.length}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Total Duration:</span>
                                 <span className="font-mono">{totalTime.toFixed(3)} s</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Max Position:</span>
                                 <span className="font-mono">{analysis.pos.max.toFixed(2)}</span>
                             </div>
                        </div>
                        <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 text-[10px] border border-yellow-100 rounded">
                           Note: Velocity, Acceleration, and Jerk are numerically derived from Time/Position data points.
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 text-xs italic">
                        No data loaded.
                    </div>
                )}
            </div>
        )}
      </div>

      {/* RIGHT COLUMN: Chart & Analyzer */}
      <div className="flex-1 flex flex-col bg-white relative min-w-[300px]">
         
         {/* Chart Toolbar / Legend */}
         <div className="h-8 border-b border-gray-300 bg-gray-50 flex items-center px-2 space-x-3 shrink-0 overflow-x-auto">
            {traces.map(t => (
                <div 
                   key={t.key} 
                   className="flex items-center cursor-pointer select-none space-x-1 hover:bg-gray-200 px-1.5 py-0.5 rounded"
                   onClick={() => toggleTrace(t.key)}
                >
                   <div className={`${t.active ? 'text-blue-600' : 'text-gray-400'}`}>
                      {t.active ? <CheckSquare size={12} /> : <Square size={12} />}
                   </div>
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.active ? t.color : '#ccc' }}></div>
                   <span className={`text-[10px] font-medium ${t.active ? 'text-gray-700' : 'text-gray-400'}`}>{t.label}</span>
                </div>
            ))}
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            <div className="flex items-center space-x-1">
               <span className="text-[10px] text-gray-500">Ratio:</span>
               <input 
                  type="number" 
                  className="w-10 h-5 text-[10px] border border-gray-300 px-1" 
                  value={motorRatio} 
                  onChange={(e) => setMotorRatio(parseFloat(e.target.value))} 
               />
            </div>
         </div>

         {/* Chart Area */}
         <div className="flex-1 flex items-center justify-center overflow-hidden relative">
            <div className="absolute top-2 right-2 flex space-x-1 z-10 pointer-events-none">
               <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50 pointer-events-auto"><ZoomIn size={14} className="text-gray-600"/></button>
               <button className="p-1 bg-white border border-gray-300 shadow-sm rounded hover:bg-gray-50 pointer-events-auto"><ZoomOut size={14} className="text-gray-600"/></button>
            </div>

            <svg 
                ref={svgRef}
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${svgW} ${svgH}`} 
                preserveAspectRatio="none" 
                className="p-4 bg-white cursor-crosshair"
                onMouseMove={handleGraphMouseMove}
                onMouseLeave={handleGraphMouseLeave}
            >
                {/* Background Grid */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const y = (svgH - padY) - (i * (svgH - 2*padY) / 5);
                    return (
                        <line key={i} x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#f0f0f0" />
                    );
                })}
                <line x1={padX} y1={svgH - padY} x2={svgW - padX} y2={svgH - padY} stroke="#ccc" />
                <line x1={padX} y1={padY} x2={padX} y2={svgH - padY} stroke="#ccc" />
                
                {/* Paths */}
                {traces.map(t => {
                    if (!t.active) return null;
                    return (
                        <path 
                            key={t.key}
                            d={getPath(t.key)}
                            fill="none"
                            stroke={t.color}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                    );
                })}
                
                {/* Cursor Line and Dots */}
                {cursorTime !== null && cursorPoint && (
                    <>
                        <line 
                            x1={scaleX(cursorTime)} 
                            y1={padY} 
                            x2={scaleX(cursorTime)} 
                            y2={svgH - padY} 
                            stroke="#555" 
                            strokeDasharray="4,2" 
                            strokeWidth="1"
                        />
                        {traces.map(t => {
                            if (!t.active) return null;
                            const scaleYLocal = getScaleYLocal(t.key);
                            return (
                                <circle 
                                    key={`cursor-${t.key}`}
                                    cx={scaleX(cursorTime)}
                                    cy={scaleYLocal(cursorPoint[t.key])}
                                    r="3"
                                    fill={t.color}
                                    stroke="white"
                                    strokeWidth="1"
                                />
                            );
                        })}
                    </>
                )}

                <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fontSize="10" fill="#666">Time (s)</text>
            </svg>
         </div>

         {/* Analyzer Table */}
         <div className="h-32 bg-gray-50 border-t border-gray-300 flex flex-col shrink-0">
             <div className="px-2 py-1 bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase flex justify-between items-center">
                 <span>Analyzer</span>
                 <RefreshCw size={10} className="cursor-pointer hover:text-blue-600" />
             </div>
             <div className="flex-1 overflow-auto">
                 <table className="w-full text-right text-[10px] border-collapse">
                    <thead className="bg-gray-100 text-gray-500 sticky top-0">
                        <tr>
                            <th className="p-1 text-left pl-3 font-semibold">Trace</th>
                            <th className="p-1 font-semibold text-blue-600">Cursor</th>
                            <th className="p-1 font-semibold">Min</th>
                            <th className="p-1 font-semibold">Max</th>
                            <th className="p-1 font-semibold">Avg</th>
                            <th className="p-1 font-semibold pr-3">RMS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {traces.map(t => {
                            if (!t.active) return null;
                            const stat = analysis[t.key];
                            const curVal = cursorPoint ? cursorPoint[t.key] : null;
                            return (
                                <tr key={t.key} className="bg-white hover:bg-blue-50">
                                    <td className="p-1 text-left pl-3 border-l-4" style={{ borderLeftColor: t.color }}>
                                        {t.label} <span className="text-gray-400">({t.unit})</span>
                                    </td>
                                    <td className="p-1 font-bold text-blue-700 bg-blue-50/50">
                                        {curVal !== null ? curVal.toFixed(2) : '-'}
                                    </td>
                                    <td className="p-1">{stat.min.toFixed(2)}</td>
                                    <td className="p-1">{stat.max.toFixed(2)}</td>
                                    <td className="p-1">{stat.avg.toFixed(2)}</td>
                                    <td className="p-1 pr-3">{stat.rms.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                 </table>
             </div>
         </div>
      </div>
    </div>
  );
};
