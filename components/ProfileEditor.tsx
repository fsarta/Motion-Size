
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Lock, Unlock, CheckSquare, Square, Link as LinkIcon, Activity, ChevronDown, AlertCircle } from 'lucide-react';
import { UnitInput, InputGroup, Select } from './Common';

type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine';
type CalcTarget = 'duration' | 'distance' | 'velocity';
type ProfileType = 'Time Based' | 'Master/Follower' | 'Camming';

export interface MotionSegment {
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
}

interface TimePoint {
  t: number;
  masterPos: number;
  pos: number;
  vel: number;
  acc: number;
  jerk: number;
  torque: number;
  motorVel: number;
}

type TraceType = 'pos' | 'vel' | 'acc' | 'jerk' | 'torque' | 'motorVel' | 'masterPos';

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
    duration: 1.0, distance: 360, velocity: 480, 
    startVelocity: 0, endVelocity: 0,
    accel: 1920, decel: 1920, jerk: 0, payload: 0,
    calcTarget: 'velocity'
  }
];

// Physics Engine with Chaining and High-Fidelity Curves
const simulateMotion = (
    segments: MotionSegment[], 
    motorRatio: number, 
    totalInertia: number, 
    profileType: ProfileType, 
    gearRatio: number,
    masterProfileData: string | null
): TimePoint[] => {
  const points: TimePoint[] = [];
  const dt = 0.005; 

  if ((profileType === 'Master/Follower' || profileType === 'Camming') && masterProfileData) {
    try {
      const masterSegments = JSON.parse(masterProfileData) as MotionSegment[];
      const masterPoints = simulateMotion(masterSegments, 1, 0, 'Time Based', 1, null);
      return masterPoints.map(mp => ({
        t: mp.t,
        masterPos: mp.pos,
        pos: mp.pos * gearRatio,
        vel: mp.vel * gearRatio,
        acc: mp.acc * gearRatio,
        jerk: mp.jerk * gearRatio,
        torque: (totalInertia * mp.acc * gearRatio),
        motorVel: mp.vel * gearRatio * motorRatio
      }));
    } catch (e) { console.error("Master simulation failed", e); }
  }

  if (!segments || segments.length === 0) return [];

  let currentT = 0;
  let currentPos = 0;
  let runningVelocity = 0;
  let lastAcc = 0;

  segments.forEach(seg => {
    const T = Math.max(0.001, seg.duration);
    const S = seg.distance;
    const v0 = runningVelocity;
    let v1 = seg.velocity; 
    const steps = Math.ceil(T / dt);
    const actualDt = T / steps;

    for (let i = 0; i <= steps; i++) {
      const t = i * actualDt;
      let s = 0, v = 0, a = 0;

      if (seg.type === 'Accel/Decel') {
        a = (v1 - v0) / T;
        v = v0 + a * t;
        s = v0 * t + 0.5 * a * t * t;
      } else if (seg.type === 'S-Curve') {
        const v_avg = S / T;
        v = v_avg * (1 - Math.cos((Math.PI * t) / T));
        s = v_avg * (t - (T / Math.PI) * Math.sin((Math.PI * t) / T));
        a = v_avg * (Math.PI / T) * Math.sin((Math.PI * t) / T);
        v1 = 0;
      } else if (seg.type === 'Trapezoid') {
        const ta = T * 0.25; const td = T * 0.25; const tc = T - ta - td;
        const vp = S / (T - ta);
        if (t <= ta) { a = vp / ta; v = a * t; s = 0.5 * a * t * t; }
        else if (t <= ta + tc) { a = 0; v = vp; s = (0.5 * vp * ta) + vp * (t - ta); }
        else { const tr = t - (ta + tc); a = -vp / td; v = vp + a * tr; s = (S - (0.5 * vp * td)) + (vp * tr + 0.5 * a * tr * tr); }
        v1 = 0;
      } else if (seg.type === 'Sine') {
        s = S * (t / T - (1 / (2 * Math.PI)) * Math.sin((2 * Math.PI * t) / T));
        v = (S / T) * (1 - Math.cos((2 * Math.PI * t) / T));
        a = ((2 * Math.PI * S) / (T * T)) * Math.sin((2 * Math.PI * t) / T);
        v1 = 0;
      } else {
        v = S / T; a = 0; s = v * t; v1 = v;
      }

      const j = (a - lastAcc) / (actualDt || 1);
      lastAcc = a;

      if (i > 0 || points.length === 0) {
        points.push({
          t: currentT + t,
          masterPos: 0,
          pos: currentPos + s,
          vel: v,
          acc: a,
          jerk: j,
          torque: (totalInertia * a) + seg.payload,
          motorVel: v * motorRatio
        });
      }
    }
    currentT += T;
    currentPos = points.length > 0 ? points[points.length - 1].pos : 0;
    runningVelocity = v1; 
  });

  return points;
};

const LockButton = ({ locked, onClick }: { locked: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`mr-2 p-1 rounded hover:bg-gray-200 transition-colors ${locked ? 'text-blue-600' : 'text-gray-400'}`}>
    {locked ? <Lock size={14} /> : <Unlock size={14} />}
  </button>
);

export const ProfileEditor = ({ 
  profileType = 'Time Based', 
  masterAxisName, 
  gearRatio = 1, 
  savedProfileData, 
  masterProfileData,
  onProfileChange 
}: any) => {
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SEGMENTS[0].id);
  const [cursorTime, setCursorTime] = useState<number | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 800, height: 400 });
  const graphRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!graphRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGraphSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(graphRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (savedProfileData) {
      try {
        const parsed = JSON.parse(savedProfileData);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setSegments(parsed);
            if (!parsed.find((p: any) => p.id === selectedId)) setSelectedId(parsed[0].id);
        }
      } catch (e) {}
    }
  }, [savedProfileData]);

  const timeSeries = useMemo(() => 
    simulateMotion(segments, 1, 0.015, profileType, gearRatio, masterProfileData),
  [segments, profileType, gearRatio, masterProfileData]);

  const [traces, setTraces] = useState<TraceConfig[]>([
    { key: 'pos', label: 'Position', color: '#10b981', unit: 'deg', active: true },
    { key: 'vel', label: 'Velocity', color: '#3b82f6', unit: 'deg/s', active: true },
    { key: 'acc', label: 'Accel', color: '#ef4444', unit: 'deg/s²', active: false },
    { key: 'jerk', label: 'Jerk', color: '#f97316', unit: 'deg/s³', active: false },
    { key: 'torque', label: 'Torque', color: '#8b5cf6', unit: 'Nm', active: false },
    { key: 'masterPos', label: 'Master Pos', color: '#6366f1', unit: 'deg', active: false },
  ]);

  const updateSegment = (id: string, field: keyof MotionSegment, value: any) => {
    const newSegments = segments.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (updated.type === 'Accel/Decel') {
          if (updated.calcTarget === 'velocity') updated.velocity = (2 * updated.distance) / (updated.duration || 1);
          else if (updated.calcTarget === 'duration') updated.duration = (2 * updated.distance) / (Math.abs(updated.velocity) || 1);
          else if (updated.calcTarget === 'distance') updated.distance = 0.5 * updated.velocity * updated.duration;
      } else {
          if (updated.calcTarget === 'velocity') updated.velocity = updated.distance / (updated.duration || 1);
          else if (updated.calcTarget === 'duration') updated.duration = Math.abs(updated.distance / (Math.abs(updated.velocity) || 1));
          else if (updated.calcTarget === 'distance') updated.distance = updated.velocity * updated.duration;
      }
      return updated;
    });
    setSegments(newSegments);
    onProfileChange(JSON.stringify(newSegments));
  };

  const selectedSeg = segments.find(s => s.id === selectedId) || null;
  const maxT = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].t : 1;

  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 40;

  const scaleX = (t: number) => paddingLeft + (t / maxT) * (graphSize.width - paddingLeft - paddingRight);
  const getScaleY = (key: TraceType) => {
    const vals = timeSeries.map(p => p[key] as number);
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 1);
    const range = max - min;
    return (v: number) => (graphSize.height - paddingBottom) - ((v - min) / (range || 1)) * (graphSize.height - paddingTop - paddingBottom);
  };

  return (
    <div className="flex h-full border border-gray-300 bg-white font-sans text-xs select-none">
      <div className="w-[450px] border-r border-gray-300 flex flex-col bg-gray-100 overflow-hidden shrink-0">
        <div className="p-2 bg-gray-200 font-bold border-b border-gray-300 flex justify-between items-center shrink-0">
          <span className="text-gray-700 uppercase tracking-tight">Sequence Editor</span>
          {profileType === 'Time Based' && (
            <button onClick={() => {
                const newId = Date.now().toString();
                const newSeg = { ...DEFAULT_SEGMENTS[0], id: newId };
                const newS = [...segments, newSeg];
                setSegments(newS);
                setSelectedId(newId);
                onProfileChange(JSON.stringify(newS));
            }} className="flex items-center space-x-1 px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 text-[10px]">
              <Plus size={12} /> <span>Add Segment</span>
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/2 overflow-y-auto border-b border-gray-300 bg-white">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                        <tr className="text-[10px] text-gray-500 uppercase">
                            <th className="p-2 w-8">#</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Abs Time (s)</th>
                            <th className="p-2">Abs Dist (deg)</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {segments.reduce((acc, s, i) => {
                            const prev = acc[i-1] || { absT: 0, absD: 0 };
                            acc.push({ ...s, absT: prev.absT + s.duration, absD: prev.absD + s.distance });
                            return acc;
                        }, [] as any[]).map((s, i) => (
                            <tr key={s.id} onClick={() => setSelectedId(s.id)}
                                className={`cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${selectedId === s.id ? 'bg-win-select font-bold' : ''}`}>
                                <td className="p-2 text-gray-400">{i+1}</td>
                                <td className="p-2 text-blue-600">{s.type}</td>
                                <td className="p-2 font-mono">{s.absT.toFixed(3)}</td>
                                <td className="p-2 font-mono">{s.absD.toFixed(1)}</td>
                                <td className="p-2 text-center">
                                    <button onClick={(e) => { 
                                        e.stopPropagation(); 
                                        const filtered = segments.filter(seg => seg.id !== s.id);
                                        setSegments(filtered);
                                        if (filtered.length > 0) setSelectedId(filtered[0].id);
                                        onProfileChange(JSON.stringify(filtered));
                                    }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {selectedSeg ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-300 pb-1">
                            <span className="font-bold text-gray-700 uppercase text-[10px]">Segment Details (Relative)</span>
                            <span className="text-[10px] text-gray-400 font-mono">#{segments.findIndex(s=>s.id===selectedSeg.id)+1}</span>
                        </div>
                        <InputGroup label="Motion Law">
                            <Select value={selectedSeg.type} options={['Accel/Decel', 'Trapezoid', 'S-Curve', 'Sine', 'Dwell/Traverse']} 
                                onChange={e => updateSegment(selectedSeg.id, 'type', e.target.value as SegmentType)} />
                        </InputGroup>
                        <div className="space-y-1">
                            <InputGroup label="Rel. Duration (s)">
                                <LockButton locked={selectedSeg.calcTarget === 'duration'} onClick={() => updateSegment(selectedSeg.id, 'calcTarget', 'duration')} />
                                <input className="w-full border border-gray-300 px-2 h-6 text-xs bg-white" type="number" step="0.1" value={selectedSeg.duration} onChange={e => updateSegment(selectedSeg.id, 'duration', parseFloat(e.target.value))} />
                            </InputGroup>
                            <InputGroup label="Rel. Distance (deg)">
                                <LockButton locked={selectedSeg.calcTarget === 'distance'} onClick={() => updateSegment(selectedSeg.id, 'calcTarget', 'distance')} />
                                <input className="w-full border border-gray-300 px-2 h-6 text-xs bg-white" type="number" step="1" value={selectedSeg.distance} onChange={e => updateSegment(selectedSeg.id, 'distance', parseFloat(e.target.value))} />
                            </InputGroup>
                            <InputGroup label="End Velocity (deg/s)">
                                <LockButton locked={selectedSeg.calcTarget === 'velocity'} onClick={() => updateSegment(selectedSeg.id, 'calcTarget', 'velocity')} />
                                <input className="w-full border border-gray-300 px-2 h-6 text-xs bg-white" type="number" step="10" value={selectedSeg.velocity} onChange={e => updateSegment(selectedSeg.id, 'velocity', parseFloat(e.target.value))} />
                            </InputGroup>
                        </div>
                    </div>
                ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 italic"><AlertCircle size={24} className="mb-2 opacity-20"/><p>Select a segment</p></div>}
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="h-9 bg-gray-50 border-b border-gray-300 flex items-center px-4 space-x-4 shrink-0 overflow-x-auto">
          {traces.filter(t => t.key !== 'masterPos' || (profileType !== 'Time Based')).map(t => (
            <div key={t.key} className="flex items-center space-x-1.5 cursor-pointer group shrink-0" onClick={() => setTraces(traces.map(tr => tr.key === t.key ? {...tr, active: !tr.active} : tr))}>
              {t.active ? <CheckSquare size={13} className="text-blue-600"/> : <Square size={13} className="text-gray-300 group-hover:text-gray-400"/>}
              <div className="w-3 h-1 rounded-full" style={{backgroundColor: t.color}}></div>
              <span className={`text-[10px] font-bold uppercase ${t.active ? 'text-gray-700' : 'text-gray-400'}`}>{t.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 relative bg-white">
          <svg 
            ref={graphRef} width="100%" height="100%" className="overflow-visible"
            onMouseMove={(e) => {
              if (timeSeries.length === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const t = Math.max(0, Math.min(maxT, ((e.clientX - rect.left - paddingLeft) / (rect.width - paddingLeft - paddingRight)) * maxT));
              setCursorTime(t);
            }}
            onMouseLeave={() => setCursorTime(null)}
          >
            {[0.2, 0.4, 0.5, 0.6, 0.8].map(p => (
              <line key={p} x1={paddingLeft} y1={`${p*100}%`} x2={graphSize.width - paddingRight} y2={`${p*100}%`} stroke={p === 0.5 ? '#e5e5e5' : '#f5f5f5'} strokeWidth={p===0.5 ? 1 : 0.5} />
            ))}
            
            {timeSeries.length > 0 && traces.filter(t => t.active).map(t => {
              const sy = getScaleY(t.key); 
              const d = timeSeries.map((p, i) => `${i===0?'M':'L'} ${scaleX(p.t)},${sy(p[t.key] as number)}`).join(' ');
              return <path key={t.key} d={d} fill="none" stroke={t.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
            })}

            {cursorTime !== null && (
              <g>
                <line x1={scaleX(cursorTime)} y1="0" x2={scaleX(cursorTime)} y2="100%" stroke="#111" strokeDasharray="4,2" />
                <rect x={scaleX(cursorTime) - 25} y="5" width="50" height="15" rx="2" fill="#111" />
                <text x={scaleX(cursorTime)} y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{cursorTime.toFixed(3)}s</text>
              </g>
            )}
          </svg>
        </div>

        <div className="h-48 bg-gray-50 border-t border-gray-300 p-2 overflow-y-auto">
          <div className="flex justify-between items-center mb-2 px-2">
             <span className="text-[10px] font-bold text-blue-800 uppercase">Analysis Data</span>
             <div className="bg-blue-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-blue-700 uppercase">
                CURSOR TIME: {cursorTime !== null ? cursorTime.toFixed(4) : '---'} s
             </div>
          </div>
          <table className="w-full text-[10px] text-left border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-gray-200 uppercase font-bold">
                <th className="pb-1 pl-2">Trace</th>
                <th className="pb-1">Cursor Value</th>
                <th className="pb-1">Unit</th>
                <th className="pb-1">Min</th>
                <th className="pb-1">Max</th>
                <th className="pb-1">RMS</th>
              </tr>
            </thead>
            <tbody>
              {timeSeries.length > 0 ? traces.filter(t => t.active).map(t => {
                const currentVal = timeSeries.find(p => p.t >= (cursorTime || 0))?.[t.key] || 0;
                const vals = timeSeries.map(p => p[t.key] as number);
                const rms = Math.sqrt(vals.reduce((acc, v) => acc + v*v, 0) / vals.length);
                return (
                  <tr key={t.key} className="border-b border-gray-100 hover:bg-white transition-colors">
                    <td className="py-1.5 pl-2 font-bold flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: t.color}}></div>
                        {t.label.toUpperCase()}
                    </td>
                    <td className="py-1.5 font-mono text-blue-700 font-bold">{(currentVal as number).toFixed(4)}</td>
                    <td className="py-1.5 text-gray-400">{t.unit}</td>
                    <td className="py-1.5 font-mono text-gray-600">{Math.min(...vals).toFixed(3)}</td>
                    <td className="py-1.5 font-mono text-gray-600">{Math.max(...vals).toFixed(3)}</td>
                    <td className="py-1.5 font-mono text-purple-600 font-semibold">{rms.toFixed(3)}</td>
                  </tr>
                );
              }) : <tr><td colSpan={6} className="py-8 text-center text-gray-400 italic uppercase">No data to display.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
