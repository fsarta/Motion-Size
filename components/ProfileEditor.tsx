import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Lock, Unlock, ChevronRight, CheckSquare, Square, RefreshCw, Upload, FileText, Link as LinkIcon, Clock, Lock as LockIcon, Activity, ArrowRightLeft } from 'lucide-react';
import { UnitInput } from './Common';

/* --- Types --- */

type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine' | 'Cam Profile' | 'Geared Motion';
type CalcTarget = 'duration' | 'distance' | 'velocity';
type ProfileType = 'Time Based' | 'Master/Follower' | 'Camming';

export interface MotionSegment {
  id: string;
  type: SegmentType;
  duration: number; // Matches Cycle Time OR Master Distance (in Camming)
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
  masterPos: number; // Master Position (deg/mm)
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
    duration: 2.0, distance: 360, velocity: 270, 
    startVelocity: 0, endVelocity: 0,
    accel: 540, decel: 540, jerk: 0, payload: 0,
    calcTarget: 'velocity', 
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

const ReadOnlyRow = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="flex items-center mb-2">
    <label className="w-16 text-right text-xs text-gray-600 mr-2">{label}</label>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);

// --- Math / Simulation Helpers ---

// Helper to evaluate a specific cam segment given a local 'x' (master dist)
const evaluateCamSegment = (seg: MotionSegment, x_local: number): number => {
    // x_local is from 0 to seg.duration (which is master dist)
    // Returns relative Y (slave dist from start of segment)
    
    if (seg.duration <= 0) return seg.distance;
    const ratio = Math.max(0, Math.min(1, x_local / seg.duration));
    const h = seg.distance;

    if (seg.type === 'Dwell/Traverse') {
        // Linear interpolation
        return h * ratio;
    }
    else if (seg.type === 'Sine' || seg.type === 'Cam Profile') {
        // Simple Cycloidal-like for smoothness
        // s = h * (t - sin(2pi*t)/2pi)
        return h * (ratio - (1 / (2 * Math.PI)) * Math.sin(2 * Math.PI * ratio));
    }
    else if (seg.type === 'Trapezoid' || seg.type === 'Accel/Decel') {
        // Simplified cubic for smooth accel
         return h * ratio * ratio * (3 - 2 * ratio);
    }
    
    // Default Linear
    return h * ratio;
};

const simulateMotion = (
    segments: MotionSegment[], 
    motorRatio: number, 
    totalInertia: number, 
    profileType: ProfileType, 
    gearRatio: number,
    cycleTime: number,
    masterSegments: MotionSegment[] = []
): TimePoint[] => {
  const points: TimePoint[] = [];
  
  // 1. GENERATE MASTER TRAJECTORY (Time -> MasterPos)
  // Only if NOT Time Based (to avoid infinite recursion)
  if (profileType !== 'Time Based') {
    // We reuse the standard simulation logic to generate the Master's path over time
    // If no master segments, create a virtual linear master 0-360 over cycleTime
    let activeMasterSegments = masterSegments;
    if (activeMasterSegments.length === 0) {
        const dur = (Number.isFinite(cycleTime) && cycleTime > 0) ? cycleTime : 10;
        activeMasterSegments = [{
            id: 'virt_master',
            type: 'Dwell/Traverse',
            duration: dur,
            distance: 360,
            velocity: 360/dur,
            startVelocity: 360/dur, 
            endVelocity: 360/dur,
            accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: 'distance', distUnitType: 'angle'
        }];
    }

    // Simulate Master Time Series first
    // Note: We set profileType to 'Time Based' recursively to force standard integration for the master
    const masterPoints = simulateMotion(
        activeMasterSegments, 
        1, 0, 'Time Based', 1, cycleTime, []
    );

    // 2. PROCESS SLAVE (Depending on Type)

    if (profileType === 'Master/Follower') {
        // Linear Gearing: Slave = Master * Ratio
        return masterPoints.map(mp => {
            const sPos = mp.pos * gearRatio;
            const sVel = mp.vel * gearRatio;
            const sAcc = mp.acc * gearRatio;
            return {
                t: mp.t,
                masterPos: mp.pos,
                pos: sPos,
                vel: sVel,
                acc: sAcc,
                jerk: 0, // derived later if needed
                torque: (totalInertia * sAcc) + (0.01 * sVel),
                motorVel: sVel * motorRatio
            };
        });
    }
    else if (profileType === 'Camming') {
        // Camming: Slave = f(MasterPos) defined by 'segments'
        // 'segments' here define the cam profile: X=MasterDist, Y=SlaveDist
        
        // Pre-calculate cumulative master positions for the cam segments
        const camMap: { startM: number, endM: number, seg: MotionSegment, startS: number }[] = [];
        let cumM = 0;
        let cumS = 0;
        
        // If user hasn't defined any segments, create a default 1:1 match
        const camSegments = segments.length > 0 ? segments : [{...DEFAULT_SEGMENTS[0], duration: 360, distance: 360}];

        camSegments.forEach(seg => {
            camMap.push({
                startM: cumM,
                endM: cumM + seg.duration,
                seg: seg,
                startS: cumS
            });
            cumM += seg.duration;
            cumS += seg.distance;
        });
        
        const totalCamMasterDist = cumM || 360; // Normalize cycle

        return masterPoints.map((mp, i) => {
            // Normalize master pos to cam cycle
            let mPos = mp.pos % totalCamMasterDist;
            if (mPos < 0) mPos += totalCamMasterDist;

            // Find segment
            const activeSeg = camMap.find(c => mPos >= c.startM && mPos <= c.endM) || camMap[camMap.length - 1];
            
            // Evaluate Position
            const localM = mPos - activeSeg.startM;
            const relativeS = evaluateCamSegment(activeSeg.seg, localM);
            const sPos = activeSeg.startS + relativeS;

            // Numerical Differentiation for V and A (Chain rule implies V_s = (ds/dm) * V_m)
            // But discrete diff is robust enough for visualizer
            let sVel = 0;
            let sAcc = 0;
            
            if (i > 0) {
                const prev = points[i-1];
                const dt = mp.t - prev.t;
                if (dt > 0.000001) {
                    sVel = (sPos - prev.pos) / dt;
                    sAcc = (sVel - prev.vel) / dt;
                }
            }

            points.push({
                t: mp.t,
                masterPos: mp.pos,
                pos: sPos,
                vel: sVel,
                acc: sAcc,
                jerk: 0,
                torque: (totalInertia * sAcc) + (0.01 * sVel),
                motorVel: sVel * motorRatio
            });

            return points[i];
        });
    }
  }

  // STANDARD TIME BASED SIMULATION
  // (Original logic for Time Based)
  const dt = 0.01; 
  let currentT = 0;
  let currentPos = 0;

  segments.forEach(seg => {
    const duration = seg.duration > 0 ? seg.duration : 0.01; 
    const steps = Math.max(2, Math.ceil(duration / dt));
    const realDt = duration / steps;
    let t_local = 0;
    
    // Trapezoid Params
    const t_acc = duration / 3;
    const t_dec = duration / 3;
    const t_flat = duration - t_acc - t_dec;
    
    const startV = seg.startVelocity;
    const targetV = seg.velocity;

    const slope = (targetV - startV) / duration;

    for (let i = 0; i <= steps; i++) {
        let v = 0;
        let a = 0;
        let j = 0;

        if (seg.type === 'Dwell/Traverse') {
            v = targetV; 
            if (seg.startVelocity !== seg.endVelocity && seg.startVelocity !== undefined) {
                 v = seg.startVelocity + ((seg.endVelocity - seg.startVelocity) * (t_local/duration));
                 a = (seg.endVelocity - seg.startVelocity) / duration;
            } else {
                 a = 0;
            }
        } else if (seg.type === 'Accel/Decel') {
            v = startV + slope * t_local;
            a = slope;
        } else if (seg.type === 'Trapezoid') {
            if (t_local < t_acc) {
                const accVal = Math.abs(targetV / t_acc) * (targetV > 0 ? 1 : -1);
                a = accVal;
                v = a * t_local;
            } else if (t_local < t_acc + t_flat) {
                a = 0;
                v = targetV;
            } else {
                const decVal = Math.abs(targetV / t_dec) * (targetV > 0 ? -1 : 1);
                a = decVal;
                const t_dec_local = t_local - (t_acc + t_flat);
                v = targetV + a * t_dec_local;
            }
        } else {
             // Fallback linear
             v = (seg.distance / duration);
             a = 0;
        }

        if (i > 0) currentPos += v * realDt;

        const damping = 0.01;
        const torque = (totalInertia * a) + seg.payload + (damping * v);

        points.push({
            t: currentT + t_local,
            masterPos: 0,
            pos: currentPos,
            vel: v,
            acc: a,
            jerk: j, 
            torque: torque,
            motorVel: v * motorRatio
        });
        t_local += realDt;
    }
    currentT += duration;
  });

  return points;
};

// Process Raw CSV Data
const processImportedData = (rawData: {t: number, pos: number}[], motorRatio: number, totalInertia: number): TimePoint[] => {
    if (rawData.length === 0) return [];
    rawData.sort((a, b) => a.t - b.t);
    const points: TimePoint[] = [];
    const tempV: number[] = new Array(rawData.length).fill(0);
    const tempA: number[] = new Array(rawData.length).fill(0);

    for (let i = 0; i < rawData.length; i++) {
        if (i === 0) {
           if (rawData.length > 1) tempV[i] = (rawData[1].pos - rawData[0].pos) / (rawData[1].t - rawData[0].t);
        } else if (i === rawData.length - 1) {
           tempV[i] = (rawData[i].pos - rawData[i-1].pos) / (rawData[i].t - rawData[i-1].t);
        } else {
           tempV[i] = (rawData[i+1].pos - rawData[i-1].pos) / (rawData[i+1].t - rawData[i-1].t);
        }
    }
    for (let i = 0; i < rawData.length; i++) {
        if (i === 0) {
           if (rawData.length > 1) tempA[i] = (tempV[1] - tempV[0]) / (rawData[1].t - rawData[0].t);
        } else if (i === rawData.length - 1) {
           tempA[i] = (tempV[i] - tempV[i-1]) / (rawData[i].t - rawData[i-1].t);
        } else {
           tempA[i] = (tempV[i+1] - tempV[i-1]) / (rawData[i+1].t - rawData[i-1].t);
        }
    }
    for (let i = 0; i < rawData.length; i++) {
        const t = rawData[i].t;
        const pos = rawData[i].pos;
        const v = tempV[i];
        const a = tempA[i];
        const damping = 0.01;
        const torque = (totalInertia * a) + (damping * v); 
        points.push({ t, masterPos: 0, pos, vel: v, acc: a, jerk: 0, torque, motorVel: v * motorRatio });
    }
    return points;
};


export const ProfileEditor = ({ 
  profileType = 'Time Based',
  masterAxisName = 'Virtual Master',
  gearRatio = 1.0,
  cycleTime = 10,
  savedProfileData,
  masterProfileData,
  onProfileChange
}: { 
  profileType?: ProfileType,
  masterAxisName?: string,
  gearRatio?: number,
  cycleTime?: number,
  savedProfileData?: string | null,
  masterProfileData?: string | null,
  onProfileChange?: (jsonData: string) => void
}) => {
  // Mode: Sequence Editor vs CSV Import
  const [mode, setMode] = useState<'sequence' | 'import'>('sequence');

  // Sequence Data
  const [segments, setSegments] = useState<MotionSegment[]>(DEFAULT_SEGMENTS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SEGMENTS[0].id);
  
  // Parse Saved Data on Init or Change
  useEffect(() => {
    if (savedProfileData) {
        try {
            const parsed = JSON.parse(savedProfileData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setSegments(parsed);
                setSelectedId(parsed[0].id);
                return;
            }
        } catch (e) {
            console.error("Failed to parse saved profile", e);
        }
    } 
    // Reset to default if no data (e.g. new axis)
    setSegments(DEFAULT_SEGMENTS);
    setSelectedId(DEFAULT_SEGMENTS[0].id);
  }, [savedProfileData]);

  // Handle Updates and emit change
  const emitChange = (newSegments: MotionSegment[]) => {
      setSegments(newSegments);
      if (onProfileChange) {
          onProfileChange(JSON.stringify(newSegments));
      }
  };
  
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
    { key: 'masterPos', label: 'Master Pos', color: '#9ca3af', unit: 'deg', active: false },
  ]);

  const [motorRatio, setMotorRatio] = useState<number>(10);

  const isMasterFollower = profileType === 'Master/Follower';
  const isCamming = profileType === 'Camming';
  const isSyncMode = isMasterFollower || isCamming;
  const isLockedProfile = isMasterFollower; // Only Master/Follower is strictly locked

  // Master Segments parsing (if available)
  const masterSegments: MotionSegment[] = useMemo(() => {
      if (masterProfileData) {
          try {
              return JSON.parse(masterProfileData);
          } catch(e) {}
      }
      return [];
  }, [masterProfileData]);

  // Ensure Master Trace is visible in Sync Modes automatically (UX improvement)
  useEffect(() => {
      if (isSyncMode) {
          setTraces(prev => prev.map(t => t.key === 'masterPos' ? { ...t, active: true } : t));
      }
  }, [isSyncMode]);

  // --- Sequence Logic ---
  const solveSegment = (seg: MotionSegment, startV: number): MotionSegment => {
    let { duration, distance, velocity, type, calcTarget } = seg;
    let accel = 0, decel = 0, jerk = 0;
    let endV = 0;
    const safeDur = duration === 0 ? 0.0001 : duration;

    // For Camming, 'duration' is actually Master Distance. 
    // We treat 'velocity' as slope (SlaveUnit / MasterUnit) if calcTarget is velocity? 
    // To simplify: Camming usually defines Duration (X range) and Distance (Y range).
    if (isCamming) {
       // Just preserve input for camming, mostly geometric
       return { ...seg, startVelocity: 0, endVelocity: 0 };
    }

    // Standard Time-Based Logic
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
    const updatedList = segments.map(s => {
      if (s.id !== id) return s;
      const newSeg = { ...s, ...updates };
      // Simplify updates for Camming mode (inputs are raw)
      if (!isCamming) {
          if (updates.calcTarget === undefined && updates.velocity !== undefined && s.calcTarget === 'velocity') {
              newSeg.calcTarget = 'distance';
          }
          if (newSeg.type === 'Dwell/Traverse' && newSeg.calcTarget === 'velocity') {
              newSeg.calcTarget = 'distance';
          }
      }
      return newSeg;
    });
    emitChange(recalculateChain(updatedList));
  };

  const handleLockClick = (seg: MotionSegment, target: CalcTarget) => {
      if (seg.calcTarget === target) return; 
      updateSegment(seg.id, { calcTarget: target });
  };

  const addSegment = () => {
    const newId = Date.now().toString();
    const newSeg: MotionSegment = {
       id: newId, type: isCamming ? 'Sine' : 'Dwell/Traverse',
       duration: isCamming ? 90 : 1.0, 
       distance: isCamming ? 100 : 0, 
       velocity: 0,
       startVelocity: 0, endVelocity: 0,
       accel: 0, decel: 0, jerk: 0, payload: 0,
       calcTarget: 'distance',
       distUnitType: 'angle'
    };
    emitChange(recalculateChain([...segments, newSeg]));
    setSelectedId(newId);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    const newSegs = segments.filter(s => s.id !== id);
    emitChange(recalculateChain(newSegs));
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
          const processed = processImportedData(raw, motorRatio, 0.05);
          setImportedData(processed);
      };
      reader.readAsText(file);
  };

  // --- Chart Data & Analysis ---

  const toggleTrace = (key: TraceType) => {
      setTraces(prev => prev.map(t => t.key === key ? { ...t, active: !t.active } : t));
  };
  
  const gridData = useMemo(() => {
      if (isMasterFollower) {
          // In Master/Follower Mode, we display the segments derived from the Master
          if (masterSegments.length > 0) {
              let absPos = 0;
              return masterSegments.map(s => {
                  const scaledDist = s.distance * gearRatio;
                  absPos += scaledDist;
                  return {
                      ...s,
                      distance: scaledDist,
                      velocity: s.velocity * gearRatio,
                      startVelocity: s.startVelocity * gearRatio,
                      endVelocity: s.endVelocity * gearRatio,
                      absPos: absPos
                  };
              });
          }

          // Fallback to synthetic
          const masterDist = 360; 
          const slaveDist = masterDist * gearRatio;
          const cycle = (Number.isFinite(cycleTime) && cycleTime > 0) ? cycleTime : 10;
          
          return [{
             id: 'master-ref',
             type: 'Geared Motion',
             duration: cycle,
             distance: slaveDist,
             absPos: slaveDist,
             velocity: slaveDist / cycle,
             startVelocity: 0,
             endVelocity: 0,
             accel: 0,
             decel: 0,
             jerk: 0,
             payload: 0,
             calcTarget: 'distance',
             distUnitType: 'angle'
          } as MotionSegment & { absPos: number }];
      }

      // For Camming and Time Based, we use user segments
      let absPos = 0;
      return segments.map(s => {
          absPos += s.distance;
          return { ...s, absPos };
      });
  }, [segments, isMasterFollower, cycleTime, gearRatio, masterSegments]);

  // Select the appropriate segment for the Details Panel
  const selectedSegment = isMasterFollower
    ? gridData[0]
    : (segments.find(s => s.id === selectedId) ? { ...segments.find(s => s.id === selectedId)!, absPos: gridData.find(g => g.id === selectedId)?.absPos || 0 } : gridData[0]);

  const timeSeries = useMemo(() => {
      if (mode === 'import') return importedData;
      return simulateMotion(segments, motorRatio, 0.05, profileType, gearRatio, cycleTime, masterSegments);
  }, [segments, motorRatio, mode, importedData, profileType, gearRatio, cycleTime, masterSegments]);

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
  const xDomainMax = totalTime; 

  // Find cursor values (Cursor is also mapped to Time)
  const cursorPoint = useMemo(() => {
     if (cursorTime === null || timeSeries.length === 0) return null;
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

  // Scale Function: Maps Time to Screen X
  const scaleX = (val: number) => {
      const max = xDomainMax || 1;
      return padX + (val / max) * (svgW - 2 * padX);
  };
  
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
      return timeSeries.map((p, i) => {
        return `${i === 0 ? 'M' : 'L'} ${scaleX(p.t).toFixed(1)},${scaleYLocal(p[key]).toFixed(1)}`
      }).join(' ');
  };

  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;

      const svgP = point.matrixTransform(svg.getScreenCTM()?.inverse());
      const plotWidth = svgW - 2 * padX;
      
      const ratio = (svgP.x - padX) / plotWidth;
      
      let val = ratio * xDomainMax;
      val = Math.max(0, Math.min(xDomainMax, val));
      
      setCursorTime(val);
  };

  const handleGraphMouseLeave = () => {
      setCursorTime(null);
  };

  const xLabel = "Time";
  const xUnit = "(s)";
  
  // Dynamic Labels
  let durationLabel = "Duration";
  if (isCamming) durationLabel = "Master Dist";
  else if (isMasterFollower) durationLabel = "Cycle Duration";
  
  const velocityLabel = "Velocity (Slave)";

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

        {isCamming && mode === 'sequence' && (
            <div className="bg-purple-50 text-purple-800 px-3 py-2 border-b border-purple-200 text-[10px] flex flex-col items-start">
                <div className="flex items-center font-bold">
                  <Activity size={12} className="mr-1"/> 
                  <span>Electronic Camming Active</span>
                </div>
                <div className="text-purple-600 mt-1">
                   Define Cam Profile relative to Master Position.
                   <br/>
                   <span className="opacity-75">Following Master: {masterAxisName}</span>
                </div>
            </div>
        )}

        {isMasterFollower && mode === 'sequence' && (
             <div className="bg-blue-50 text-blue-800 px-3 py-2 border-b border-blue-200 text-[10px] flex flex-col">
                <div className="flex items-center font-bold mb-1">
                    <LinkIcon size={12} className="mr-1"/> 
                    <span>Synchronized to Master: {masterAxisName}</span>
                </div>
                <div className="text-blue-600 ml-4">
                   Gear Ratio: {gearRatio.toFixed(3)}:1 (Master:Slave)
                </div>
            </div>
        )}

        {/* MODE: SEQUENCE EDITOR */}
        {mode === 'sequence' && (
            <>
                {/* Grid */}
                <div className={`h-[40%] flex flex-col bg-white relative`}>
                    <div className="h-7 bg-gray-50 border-b border-gray-300 flex items-center px-2 space-x-2 shrink-0">
                        <button 
                            onClick={addSegment} 
                            disabled={isLockedProfile}
                            className={`flex items-center px-2 py-0.5 border border-gray-300 rounded shadow-sm text-xs 
                                ${isLockedProfile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-blue-50 text-gray-700'}
                            `}
                        >
                            <Plus size={12} className={`mr-1 ${isLockedProfile ? 'text-gray-400' : 'text-green-600'}`}/> Add Step
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-[24px_110px_60px_70px_1fr_24px] bg-gray-200 border-b border-gray-300 font-semibold text-gray-700 py-1 shrink-0">
                        <div className="text-center">#</div>
                        <div className="px-1 border-l border-gray-300">Type</div>
                        <div className="px-1 border-l border-gray-300 text-right">
                           {isCamming ? 'Master Dist' : (isMasterFollower ? 'Cycle Time' : 'Time')}
                        </div>
                        <div className="px-1 border-l border-gray-300 text-right">End Pos</div>
                        <div className="px-1 border-l border-gray-300 text-right">V End</div>
                        <div></div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white relative">
                        {gridData.map((seg, idx) => (
                            <div 
                                key={seg.id}
                                onClick={() => !isLockedProfile && setSelectedId(seg.id)}
                                className={`grid grid-cols-[24px_110px_60px_70px_1fr_24px] border-b border-gray-100 items-center 
                                    ${isLockedProfile ? 'bg-gray-50' : 'cursor-pointer hover:bg-blue-50'}
                                    ${!isLockedProfile && selectedId === seg.id ? 'bg-blue-100' : ''}
                                `}
                            >
                                <div className="flex items-center justify-center text-gray-500 h-full border-r border-gray-200 bg-gray-50">
                                    {!isLockedProfile && selectedId === seg.id ? <ChevronRight size={12} className="text-black"/> : (idx + 1)}
                                </div>
                                <div className="p-0.5 border-r border-gray-200">
                                    {isLockedProfile ? (
                                        <div className="px-1 italic text-gray-500">{seg.type}</div>
                                    ) : (
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
                                            {isCamming && <option>Cam Profile</option>}
                                        </select>
                                    )}
                                </div>
                                <div className="p-1 text-right border-r border-gray-200 truncate">{seg.duration.toFixed(3)}</div>
                                <div className="p-1 text-right border-r border-gray-200 truncate">{seg.absPos.toFixed(1)}</div>
                                <div className="p-1 text-right border-r border-gray-200 truncate">{seg.endVelocity.toFixed(1)}</div>
                                
                                <div className="flex items-center justify-center">
                                    {!isLockedProfile && (
                                        <button onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {/* Overlay for Locked State (Only for Master/Follower, NOT Camming) */}
                        {isMasterFollower && (
                           <div className="absolute top-10 left-10 right-10 p-4 bg-white/95 border border-gray-300 shadow-lg text-center backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                              <LockIcon size={24} className="text-gray-400 mb-2"/>
                              <div className="font-bold text-gray-700">Profile Locked to Master</div>
                              <div className="text-gray-500 mt-1">
                                 {masterSegments.length > 0 ? (
                                     <span>Tracking {masterSegments.length} segment(s) from Master. Scaled by ratio {gearRatio}.</span>
                                 ) : (
                                     <span>No Master profile found. Using Virtual Master cycle ({cycleTime}s).</span>
                                 )}
                              </div>
                           </div>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className={`flex-1 bg-gray-100 border-t border-gray-300 p-4 shadow-inner overflow-y-auto ${isLockedProfile ? 'opacity-80 pointer-events-none' : ''}`}>
                {selectedSegment && (
                    <div className="flex gap-6">
                        <div className="flex-1 min-w-[160px]">
                        <DetailRow 
                            label={durationLabel}
                            locked={isLockedProfile || (!isCamming && selectedSegment.calcTarget !== 'duration')}
                            onToggleLock={() => !isCamming && handleLockClick(selectedSegment, 'duration')}
                            disabledLock={isLockedProfile || isCamming}
                        >
                            <UnitInput 
                                type={isCamming ? 'angle' : 'time'}
                                value={selectedSegment.duration}
                                onChange={(v) => {
                                    const val = parseFloat(v);
                                    updateSegment(selectedSegment.id, { duration: val, calcTarget: selectedSegment.calcTarget === 'duration' ? 'velocity' : selectedSegment.calcTarget });
                                }}
                                readOnly={isLockedProfile || (!isCamming && selectedSegment.calcTarget === 'duration')}
                            />
                        </DetailRow>

                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-gray-700 font-medium">Distance (Slave)</label>
                                <select 
                                    className="text-[10px] bg-transparent border-none outline-none text-gray-500 cursor-pointer hover:text-blue-600"
                                    value={selectedSegment.distUnitType}
                                    onChange={(e) => updateSegment(selectedSegment.id, { distUnitType: e.target.value as any })}
                                    disabled={isLockedProfile}
                                >
                                    <option value="angle">Rotary (deg, rad)</option>
                                    <option value="length">Linear (mm, m)</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <LockButton 
                                    locked={isLockedProfile || (!isCamming && selectedSegment.calcTarget !== 'distance')} 
                                    onClick={() => !isCamming && handleLockClick(selectedSegment, 'distance')} 
                                    disabled={isLockedProfile || isCamming}
                                />
                                <div className={`flex-1 ${(selectedSegment.calcTarget === 'distance') ? 'opacity-80' : ''}`}>
                                    <UnitInput 
                                        type={selectedSegment.distUnitType}
                                        value={selectedSegment.distance}
                                        onChange={(v) => {
                                            const val = parseFloat(v);
                                            updateSegment(selectedSegment.id, { distance: val, calcTarget: selectedSegment.calcTarget === 'distance' ? 'velocity' : selectedSegment.calcTarget });
                                        }}
                                        readOnly={isLockedProfile || (!isCamming && selectedSegment.calcTarget === 'distance')}
                                    />
                                </div>
                            </div>
                        </div>

                        {!isCamming && (
                            <DetailRow 
                                label={velocityLabel}
                                locked={isLockedProfile || selectedSegment.calcTarget !== 'velocity'}
                                onToggleLock={() => handleLockClick(selectedSegment, 'velocity')}
                                disabledLock={isLockedProfile || selectedSegment.type === 'Dwell/Traverse'}
                            >
                                <UnitInput 
                                    type="speed"
                                    value={selectedSegment.velocity}
                                    onChange={(v) => updateSegment(selectedSegment.id, { velocity: parseFloat(v), calcTarget: selectedSegment.calcTarget === 'velocity' ? 'distance' : selectedSegment.calcTarget })}
                                    readOnly={isLockedProfile || selectedSegment.calcTarget === 'velocity' || selectedSegment.type === 'Dwell/Traverse'}
                                />
                            </DetailRow>
                        )}

                        <DetailRow label="Payload/Force" locked={true} onToggleLock={()=>{}} disabledLock={true}>
                            <UnitInput 
                                type="torque"
                                value={selectedSegment.payload}
                                onChange={(v) => updateSegment(selectedSegment.id, { payload: parseFloat(v) })}
                                readOnly={isLockedProfile}
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
            
            {/* Simulation Params */}
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

                {/* X-Axis Ticks & Labels */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const ratio = i / 5;
                    const xVal = ratio * xDomainMax;
                    const xPos = padX + ratio * (svgW - 2 * padX);
                    return (
                        <g key={`x-tick-${i}`}>
                            <line x1={xPos} y1={svgH - padY} x2={xPos} y2={svgH - padY + 4} stroke="#ccc" />
                            <text 
                                x={xPos} 
                                y={svgH - 5} 
                                textAnchor="middle" 
                                fontSize="9" 
                                fill="#999"
                            >
                                {xVal.toFixed(1)}
                            </text>
                        </g>
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

                <text x={svgW - padX - 10} y={svgH - 25} textAnchor="end" fontSize="10" fill="#666">{xLabel} {xUnit}</text>
            </svg>
         </div>

         {/* Analyzer Table */}
         <div className="h-32 bg-gray-50 border-t border-gray-300 flex flex-col shrink-0">
             <div className="px-2 py-1 bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase flex justify-between items-center">
                 <span>Analyzer</span>
                 {isSyncMode && cursorPoint && (
                     <div className="flex items-center space-x-1 text-purple-700">
                         <Clock size={10} />
                         <span>Master: {cursorPoint.masterPos.toFixed(1)}°</span>
                     </div>
                 )}
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