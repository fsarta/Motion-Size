
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Lock, Unlock, CheckSquare, Square, Activity, AlertCircle, Timer, Gauge as GaugeIcon, Info } from 'lucide-react';
import { UnitInput, InputGroup, Select, SectionHeader } from './Common';
import { UnitType } from '../utils/unitConversion';

type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine';
type CalcTarget = 'duration' | 'distance' | 'velocity';
type ProfileType = 'Time Based' | 'Master/Follower' | 'Camming';

export interface MotionSegment {
  id: string;
  type: SegmentType;
  duration: number; 
  distance: number; 
  velocity: number; 
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
}

type TraceType = 'pos' | 'vel' | 'acc' | 'jerk' | 'torque' | 'masterPos';

interface TraceConfig {
  key: TraceType;
  label: string;
  color: string;
  unitType: UnitType;
  active: boolean;
}

const DEFAULT_SEGMENTS: MotionSegment[] = [
  { 
    id: '1', type: 'Trapezoid', 
    duration: 1.0, distance: 360, velocity: 480, 
    accel: 1920, decel: 1920, jerk: 0, payload: 0,
    calcTarget: 'velocity'
  }
];

const simulateMotion = (
    segments: MotionSegment[], 
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
      const masterPoints = simulateMotion(masterSegments, 0, 'Time Based', 1, null);
      return masterPoints.map(mp => ({
        t: mp.t,
        masterPos: mp.pos,
        pos: mp.pos * gearRatio,
        vel: mp.vel * gearRatio,
        acc: mp.acc * gearRatio,
        jerk: mp.jerk * gearRatio,
        torque: (totalInertia * mp.acc * gearRatio),
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
        v1 = v_avg * 2; 
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
        });
      }
    }
    currentT += T;
    currentPos = points.length > 0 ? points[points.length - 1].pos : 0;
    runningVelocity = v1; 
  });

  return points;
};

const LockButton = ({ locked, onClick, disabled }: { locked: boolean, onClick: () => void, disabled?: boolean }) => (
  <button 
    disabled={disabled}
    onClick={onClick} 
    className={`mr-2 p-1 rounded-sm border transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${locked ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
  >
    {locked ? <Lock size={12} /> : <Unlock size={12} />}
  </button>
);

const ModeToggle = ({ mode, onToggle }: { mode: 'value' | 'time', onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="mr-2 p-1 bg-gray-50 border border-gray-200 rounded-sm hover:bg-win-hover text-win-blue transition-colors flex items-center justify-center shadow-sm"
    title={mode === 'value' ? 'Switch to Time input' : 'Switch to Physical Value input'}
  >
    {mode === 'value' ? <GaugeIcon size={12} /> : <Timer size={12} />}
  </button>
);

export const ProfileEditor = ({ 
  profileType = 'Time Based', 
  masterAxisName, 
  gearRatio = 1, 
  savedProfileData, 
  masterProfileData,
  posUnitType = 'angle',
  isReadOnly = false,
  onProfileChange 
}: any) => {
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SEGMENTS[0].id);
  const [cursorTime, setCursorTime] = useState<number | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 800, height: 400 });
  const [accelModes, setAccelModes] = useState<Record<string, 'value' | 'time'>>({ acc: 'value', dec: 'value', jerk: 'value' });
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
    simulateMotion(segments, 0.015, profileType, gearRatio, masterProfileData),
  [segments, profileType, gearRatio, masterProfileData]);

  const [traces, setTraces] = useState<TraceConfig[]>([
    { key: 'pos', label: 'Position', color: '#10b981', unitType: posUnitType, active: true },
    { key: 'vel', label: 'Velocity', color: '#3b82f6', unitType: 'speed', active: true },
    { key: 'acc', label: 'Accel', color: '#ef4444', unitType: 'acceleration', active: false },
    { key: 'jerk', label: 'Jerk', color: '#f97316', unitType: 'jerk', active: false },
    { key: 'torque', label: 'Torque', color: '#8b5cf6', unitType: 'torque', active: false },
    { key: 'masterPos', label: 'Master Pos', color: '#6366f1', unitType: 'angle', active: false },
  ]);

  const updateSegment = (id: string, field: keyof MotionSegment, value: any, entryMode: 'value' | 'time' = 'value') => {
    if (isReadOnly) return;
    const newSegments = segments.map(s => {
      if (s.id !== id) return s;
      
      let updated = { ...s, [field]: value };
      const idx = segments.findIndex(seg => seg.id === id);
      const v0 = idx > 0 ? (segments[idx-1].type === 'Accel/Decel' ? segments[idx-1].velocity : 0) : 0;
      const dv = Math.abs(updated.velocity - v0);

      // Special handling for Time-based Accel/Decel/Jerk inputs
      if (entryMode === 'time') {
          if (field === 'accel' || field === 'decel') {
              const timeVal = parseFloat(value);
              updated[field] = timeVal > 0 ? dv / timeVal : updated[field];
          } else if (field === 'jerk') {
              const timeVal = parseFloat(value);
              updated.jerk = timeVal > 0 ? updated.accel / timeVal : updated.jerk;
          }
      }

      if (updated.type === 'Accel/Decel') {
          if (updated.calcTarget === 'velocity') updated.velocity = (2 * updated.distance) / (updated.duration || 1) - v0;
          else if (updated.calcTarget === 'duration') updated.duration = (2 * updated.distance) / (Math.abs(updated.velocity + v0) || 1);
          else if (updated.calcTarget === 'distance') updated.distance = 0.5 * (updated.velocity + v0) * updated.duration;
          updated.accel = Math.abs((updated.velocity - v0) / (updated.duration || 1));
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
  const paddingTop = 30;
  const paddingBottom = 30;

  const scaleX = (t: number) => paddingLeft + (t / (maxT || 1)) * (graphSize.width - paddingLeft - paddingRight);
  const getScaleY = (key: TraceType) => {
    const vals = timeSeries.map(p => p[key] as number);
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 1);
    const range = max - min;
    return (v: number) => (graphSize.height - paddingBottom) - ((v - min) / (range || 1)) * (graphSize.height - paddingTop - paddingBottom);
  };

  const getTimeValue = (val: number, field: 'accel' | 'decel' | 'jerk') => {
    if (val === 0) return 0;
    const idx = segments.findIndex(s => s.id === selectedId);
    const v0 = idx > 0 ? (segments[idx-1].type === 'Accel/Decel' ? segments[idx-1].velocity : 0) : 0;
    const dv = Math.abs((selectedSeg?.velocity || 0) - v0);
    
    if (field === 'jerk') return (selectedSeg?.accel || 0) / val;
    return dv / val;
  };

  return (
    <div className="flex h-full border border-win-border bg-win-panel font-sans text-xs select-none">
      <div className="w-[420px] border-r border-win-border flex flex-col bg-win-bg overflow-hidden shrink-0">
        <div className="p-2 bg-gray-600 text-white font-bold flex justify-between items-center shrink-0 z-10">
          <span className="uppercase text-[10px] tracking-widest pl-1">Sequence Editor</span>
          {!isReadOnly && (
            <button onClick={() => {
                const newId = Date.now().toString();
                const newSeg = { ...DEFAULT_SEGMENTS[0], id: newId };
                const newS = [...segments, newSeg];
                setSegments(newS);
                setSelectedId(newId);
                onProfileChange(JSON.stringify(newS));
            }} className="flex items-center space-x-1 px-2 py-0.5 bg-green-600 text-white rounded-sm hover:bg-green-700 text-[10px]">
              <Plus size={12} /> <span>New Step</span>
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/3 overflow-y-auto border-b border-win-border bg-white shadow-inner relative">
                {isReadOnly && (
                    <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] z-20 flex items-center justify-center p-4 text-center">
                        <div className="bg-white border border-blue-300 p-2 shadow-sm rounded-sm text-blue-800 flex items-center space-x-2">
                            <Info size={14}/> <span>Follower profile (Locked)</span>
                        </div>
                    </div>
                )}
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-500 font-semibold sticky top-0 z-10">
                        <tr>
                            <th className="p-2 border-b w-8">#</th>
                            <th className="p-2 border-b">Law</th>
                            <th className="p-2 border-b">Time (s)</th>
                            <th className="p-2 border-b">Dist ({posUnitType === 'angle' ? 'deg' : 'mm'})</th>
                            {!isReadOnly && <th className="p-2 border-b w-8"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {segments.reduce((acc, s, i) => {
                            const prev = acc[i-1] || { absT: 0, absD: 0 };
                            acc.push({ ...s, absT: prev.absT + s.duration, absD: prev.absD + s.distance });
                            return acc;
                        }, [] as any[]).map((s, i) => (
                            <tr key={s.id} onClick={() => setSelectedId(s.id)}
                                className={`cursor-pointer border-b border-gray-100 transition-colors group ${selectedId === s.id ? 'bg-blue-50 font-bold' : 'hover:bg-blue-50'}`}>
                                <td className="p-2 text-gray-400">{i+1}</td>
                                <td className="p-2 text-win-blue">{s.type}</td>
                                <td className="p-2 font-mono">{s.absT.toFixed(3)}</td>
                                <td className="p-2 font-mono">{s.absD.toFixed(1)}</td>
                                {!isReadOnly && (
                                    <td className="p-2 text-center">
                                        <button onClick={(e) => { 
                                            e.stopPropagation(); 
                                            const filtered = segments.filter(seg => seg.id !== s.id);
                                            setSegments(filtered);
                                            if (filtered.length > 0) setSelectedId(filtered[0].id);
                                            onProfileChange(JSON.stringify(filtered));
                                        }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600 transition-all">
                                            <Trash2 size={12}/>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-win-panel">
                {selectedSeg ? (
                    <div className={`space-y-1 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
                        <SectionHeader title="Segment Detail (Relative Values)" />
                        <InputGroup label="Motion Law">
                            <Select value={selectedSeg.type} options={['Accel/Decel', 'Trapezoid', 'Triangle', 'S-Curve', 'Sine', 'Dwell/Traverse']} 
                                onChange={e => updateSegment(selectedSeg.id, 'type', e.target.value as SegmentType)} />
                        </InputGroup>
                        <div className="h-2"></div>
                        <InputGroup label="Rel. Duration (s)">
                            <LockButton disabled={isReadOnly} locked={selectedSeg.calcTarget === 'duration'} onClick={() => updateSegment(selectedSeg.id, 'calcTarget', 'duration')} />
                            <UnitInput type="time" value={selectedSeg.duration} onChange={(val) => updateSegment(selectedSeg.id, 'duration', parseFloat(val))} readOnly={isReadOnly} />
                        </InputGroup>
                        <InputGroup label={`Rel. Distance (${posUnitType === 'angle' ? 'deg' : 'mm'})`}>
                            <LockButton disabled={isReadOnly} locked={selectedSeg.calcTarget === 'distance'} onClick={() => updateSegment(selectedSeg.id, 'calcTarget', 'distance')} />
                            <UnitInput type={posUnitType} value={selectedSeg.distance} onChange={(val) => updateSegment(selectedSeg.id, 'distance', parseFloat(val))} readOnly={isReadOnly} />
                        </InputGroup>
                        <InputGroup label="End Velocity">
                            <LockButton disabled={isReadOnly} locked={selectedSeg.calcTarget === 'velocity'} onClick={() => updateSegment(selectedSeg.id, 'calcTarget', 'velocity')} />
                            <UnitInput type="speed" value={selectedSeg.velocity} onChange={(val) => updateSegment(selectedSeg.id, 'velocity', parseFloat(val))} readOnly={isReadOnly} />
                        </InputGroup>
                        
                        <SectionHeader title="Dynamic Limits" />
                        
                        <InputGroup label="Acceleration">
                            <ModeToggle mode={accelModes.acc} onToggle={() => setAccelModes({...accelModes, acc: accelModes.acc === 'value' ? 'time' : 'value'})} />
                            {accelModes.acc === 'value' ? (
                                <UnitInput type="acceleration" value={selectedSeg.accel} onChange={(val) => updateSegment(selectedSeg.id, 'accel', parseFloat(val))} readOnly={isReadOnly} />
                            ) : (
                                <UnitInput type="time" value={getTimeValue(selectedSeg.accel, 'accel')} onChange={(val) => updateSegment(selectedSeg.id, 'accel', parseFloat(val), 'time')} readOnly={isReadOnly} />
                            )}
                        </InputGroup>
                        
                        <InputGroup label="Deceleration">
                            <ModeToggle mode={accelModes.dec} onToggle={() => setAccelModes({...accelModes, dec: accelModes.dec === 'value' ? 'time' : 'value'})} />
                            {accelModes.dec === 'value' ? (
                                <UnitInput type="acceleration" value={selectedSeg.decel} onChange={(val) => updateSegment(selectedSeg.id, 'decel', parseFloat(val))} readOnly={isReadOnly} />
                            ) : (
                                <UnitInput type="time" value={getTimeValue(selectedSeg.decel, 'decel')} onChange={(val) => updateSegment(selectedSeg.id, 'decel', parseFloat(val), 'time')} readOnly={isReadOnly} />
                            )}
                        </InputGroup>
                        
                        <InputGroup label="Jerk">
                            <ModeToggle mode={accelModes.jerk} onToggle={() => setAccelModes({...accelModes, jerk: accelModes.jerk === 'value' ? 'time' : 'value'})} />
                            {accelModes.jerk === 'value' ? (
                                <UnitInput type="jerk" value={selectedSeg.jerk} onChange={(val) => updateSegment(selectedSeg.id, 'jerk', parseFloat(val))} readOnly={isReadOnly} />
                            ) : (
                                <UnitInput type="time" value={getTimeValue(selectedSeg.jerk, 'jerk')} onChange={(val) => updateSegment(selectedSeg.id, 'jerk', parseFloat(val), 'time')} readOnly={isReadOnly} />
                            )}
                        </InputGroup>
                        
                        <InputGroup label="Additional Torque">
                            <UnitInput type="torque" value={selectedSeg.payload} onChange={(val) => updateSegment(selectedSeg.id, 'payload', parseFloat(val))} readOnly={isReadOnly} />
                        </InputGroup>
                    </div>
                ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 italic"><p>Select a step to edit parameters</p></div>}
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="h-9 bg-gray-50 border-b border-win-border flex items-center px-4 space-x-5 shrink-0 overflow-x-auto shadow-sm">
          {traces.filter(t => t.key !== 'masterPos' || profileType !== 'Time Based').map(t => (
            <div key={t.key} className="flex items-center space-x-1.5 cursor-pointer shrink-0" onClick={() => setTraces(traces.map(tr => tr.key === t.key ? {...tr, active: !tr.active} : tr))}>
              {t.active ? <CheckSquare size={14} className="text-blue-600"/> : <Square size={14} className="text-gray-300"/>}
              <div className="w-4 h-1 rounded-full" style={{backgroundColor: t.color}}></div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${t.active ? 'text-gray-700' : 'text-gray-400'}`}>{t.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 relative bg-white overflow-hidden">
          <svg 
            ref={graphRef} width="100%" height="100%" className="overflow-visible"
            onMouseMove={(e) => {
              if (timeSeries.length === 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const relativeX = e.clientX - rect.left;
              const t = Math.max(0, Math.min(maxT, ((relativeX - paddingLeft) / (rect.width - paddingLeft - paddingRight)) * maxT));
              setCursorTime(t);
            }}
            onMouseLeave={() => setCursorTime(null)}
          >
            {[0.2, 0.4, 0.5, 0.6, 0.8].map(p => (
              <line key={p} x1={paddingLeft} y1={`${p*100}%`} x2={graphSize.width - paddingRight} y2={`${p*100}%`} stroke="#f5f5f5" strokeWidth="0.5" />
            ))}
            
            {timeSeries.length > 0 && traces.filter(t => t.active).map(t => {
              const sy = getScaleY(t.key); 
              const d = timeSeries.map((p, i) => `${i===0?'M':'L'} ${scaleX(p.t)},${sy(p[t.key] as number)}`).join(' ');
              return <path key={t.key} d={d} fill="none" stroke={t.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
            })}

            {cursorTime !== null && (
              <g className="pointer-events-none">
                <line x1={scaleX(cursorTime)} y1="0" x2={scaleX(cursorTime)} y2="100%" stroke="#111" strokeDasharray="3,3" />
                <rect x={scaleX(cursorTime) - 25} y="2" width="50" height="15" fill="#111" rx="1" />
                <text x={scaleX(cursorTime)} y="13" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{cursorTime.toFixed(3)}s</text>
              </g>
            )}
          </svg>
        </div>

        <div className="h-52 bg-win-bg border-t border-win-border p-3 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2 px-1">
             <div className="flex items-center space-x-2">
                <Activity size={14} className="text-win-blue" />
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">System Dynamics Analysis</span>
             </div>
             <div className="bg-white border border-win-border px-3 py-1 flex items-center space-x-2 shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Time:</div>
                <div className="font-mono text-win-blue font-bold text-sm">{cursorTime !== null ? cursorTime.toFixed(4) : '0.0000'} s</div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white border border-win-border">
            <table className="w-full text-[10px] text-left border-collapse">
                <thead className="bg-gray-100 text-gray-500 uppercase font-bold text-[9px] border-b border-win-border">
                <tr>
                    <th className="p-2 border-r border-win-border">Trace</th>
                    <th className="p-2 border-r border-win-border">Cursor Val</th>
                    <th className="p-2 border-r border-win-border">Unit</th>
                    <th className="p-2 border-r border-win-border">Min</th>
                    <th className="p-2 border-r border-win-border">Max</th>
                    <th className="p-2 text-win-blue">RMS Value</th>
                </tr>
                </thead>
                <tbody>
                {timeSeries.length > 0 ? traces.filter(t => t.active).map(t => {
                    const currentVal = timeSeries.find(p => p.t >= (cursorTime || 0))?.[t.key] || 0;
                    const vals = timeSeries.map(p => p[t.key] as number);
                    const rms = Math.sqrt(vals.reduce((acc, v) => acc + v*v, 0) / vals.length);
                    const unitLabel = t.key === 'pos' ? (posUnitType === 'angle' ? 'deg' : 'mm') : t.key === 'vel' ? (posUnitType === 'angle' ? 'deg/s' : 'mm/s') : t.key === 'acc' ? (posUnitType === 'angle' ? 'deg/s²' : 'mm/s²') : t.key === 'jerk' ? (posUnitType === 'angle' ? 'deg/s³' : 'mm/s³') : '';
                    return (
                    <tr key={t.key} className="border-b border-gray-100 hover:bg-win-hover transition-colors font-mono">
                        <td className="p-2 border-r border-win-border font-sans font-bold flex items-center">
                            <div className="w-2.5 h-2.5 rounded-sm mr-2 shadow-sm" style={{backgroundColor: t.color}}></div>
                            {t.label}
                        </td>
                        <td className="p-2 border-r border-win-border text-win-blue font-bold">{(currentVal as number).toFixed(4)}</td>
                        <td className="p-2 border-r border-win-border text-gray-400 font-sans">{unitLabel}</td>
                        <td className="p-2 border-r border-win-border text-gray-600">{Math.min(...vals).toFixed(3)}</td>
                        <td className="p-2 border-r border-win-border text-gray-600">{Math.max(...vals).toFixed(3)}</td>
                        <td className="p-2 text-purple-700 font-bold bg-purple-50/20">{rms.toFixed(3)}</td>
                    </tr>
                    );
                }) : <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic uppercase">No analytical data available</td></tr>}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
