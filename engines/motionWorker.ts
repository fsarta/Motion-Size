import { MotionSegment, TimePoint, ProfileType } from '../types';
import { MotionLaws } from '../utils/motionLaws';

export const simulateMotion = (
    segments: MotionSegment[], 
    totalInertia: number, 
    profileType: ProfileType, 
    gearRatio: number,
    masterProfileData: string | null,
    friction: number = 0,
    efficiency: number = 1,
    gravityForce: number = 0,
    camTable?: any
): TimePoint[] => {
  const points: TimePoint[] = [];

  if ((profileType === 'Master/Follower' || profileType === 'Camming') && masterProfileData && masterProfileData !== 'undefined') {
    try {
      const masterSegments = JSON.parse(masterProfileData) as MotionSegment[];
      const masterPoints = simulateMotion(masterSegments, 0, 'Time Based', 1, null);
      
      if (profileType === 'Camming' && camTable && camTable.sectors) {
          return masterPoints.map(mp => {
              const mPos = mp.pos % camTable.masterRange;
              const sector = camTable.sectors.find((s: any) => mPos >= s.masterStart && mPos <= s.masterEnd) || camTable.sectors[camTable.sectors.length - 1];
              
              let s = 0, v = 0, a = 0, j = 0;
              
              if (sector) {
                  const rangeX = sector.masterEnd - sector.masterStart;
                  const rangeY = sector.slaveEnd - sector.slaveStart;
                  
                  if (rangeX > 0) {
                      const u = Math.min(1, Math.max(0, (mPos - sector.masterStart) / rangeX));
                      const [s_norm, v_norm, a_norm, j_norm] = MotionLaws[sector.law](u);
                      
                      s = sector.slaveStart + (rangeY * s_norm);
                      const dMdt = mp.vel; 
                      v = (rangeY / rangeX) * v_norm * dMdt;
                      a = (rangeY / (rangeX * rangeX)) * a_norm * dMdt * dMdt;
                      j = (rangeY / Math.pow(rangeX, 3)) * j_norm * Math.pow(dMdt, 3);
                  } else {
                      s = sector.slaveStart;
                  }
              }
              
              return {
                  t: mp.t,
                  masterPos: mp.pos,
                  pos: s * gearRatio,
                  vel: v * gearRatio,
                  acc: a * gearRatio,
                  jerk: j * gearRatio,
                  torque: (totalInertia * a * gearRatio),
              };
          });
      }

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
    const steps = Math.max(10, Math.min(1000, Math.ceil(T / 0.005)));
    const actualDt = T / steps;

    for (let i = 0; i <= steps; i++) {
      const t = i * actualDt;
      let s = 0, v = 0, a = 0, j = 0;

      if (seg.type === 'Accel/Decel') {
        a = (v1 - v0) / T;
        v = v0 + a * t;
        s = v0 * t + 0.5 * a * t * t;
        j = 0; // Constant acceleration -> zero jerk
      } else if (seg.type === 'S-Curve') {
        const v_avg = S / T;
        v = v_avg * (1 - Math.cos((Math.PI * t) / T));
        s = v_avg * (t - (T / Math.PI) * Math.sin((Math.PI * t) / T));
        a = v_avg * (Math.PI / T) * Math.sin((Math.PI * t) / T);
        j = v_avg * Math.pow(Math.PI / T, 2) * Math.cos((Math.PI * t) / T);
        v1 = v_avg * 2; 
      } else if (seg.type === 'Trapezoid') {
        const ta = T * 0.25; const td = T * 0.25; const tc = T - ta - td;
        const vp = S / (T - ta);
        if (t <= ta) { a = vp / ta; v = a * t; s = 0.5 * a * t * t; }
        else if (t <= ta + tc) { a = 0; v = vp; s = (0.5 * vp * ta) + vp * (t - ta); }
        else { const tr = t - (ta + tc); a = -vp / td; v = vp + a * tr; s = (S - (0.5 * vp * td)) + (vp * tr + 0.5 * a * tr * tr); }
        j = 0; // Infinite at corners, zero elsewhere. We chart zero.
        v1 = 0;
      } else if (seg.type === 'Sine') {
        s = S * (t / T - (1 / (2 * Math.PI)) * Math.sin((2 * Math.PI * t) / T));
        v = (S / T) * (1 - Math.cos((2 * Math.PI * t) / T));
        a = ((2 * Math.PI * S) / (T * T)) * Math.sin((2 * Math.PI * t) / T);
        j = ((4 * Math.pow(Math.PI, 2) * S) / Math.pow(T, 3)) * Math.cos((2 * Math.PI * t) / T);
        v1 = 0;
      } else if (seg.type === 'Triangle') {
        const vPeak = 2 * S / T;
        const halfT = T / 2;
        if (t <= halfT) {
            a = vPeak / halfT;
            v = a * t;
            s = 0.5 * a * t * t;
        } else {
            const tr = t - halfT;
            a = -vPeak / halfT;
            v = vPeak + a * tr;
            s = 0.5 * vPeak * halfT + vPeak * tr + 0.5 * a * tr * tr;
        }
        j = 0; // Infinite at corners, zero elsewhere.
        v1 = 0;
      } else if (seg.type === 'Dwell/Traverse') {
        v = 0; a = 0; s = 0; j = 0;
        v1 = 0;
      } else {
        v = S / T; a = 0; s = v * t; v1 = v; j = 0;
      }

      // We no longer need discrete derivative for basic segments
      lastAcc = a;

      if (i > 0 || points.length === 0) {
        const signVel = v > 0 ? 1 : v < 0 ? -1 : 0;
        const t_friction = friction * signVel;
        points.push({
          t: currentT + t,
          masterPos: 0,
          pos: currentPos + s,
          vel: v,
          acc: a,
          jerk: j,
          torque: ((totalInertia * a) + t_friction + gravityForce + seg.payload) / (efficiency || 1),
        });
      }
    }
    currentT += T;
    currentPos = points.length > 0 ? points[points.length - 1].pos : 0;
    runningVelocity = v1; 
  });

  return points;
};

self.onmessage = (e: MessageEvent) => {
  const { segments, totalInertia, profileType, gearRatio, masterProfileData, friction, efficiency, gravityForce, camTable } = e.data;
  
  const result = simulateMotion(segments, totalInertia, profileType, gearRatio, masterProfileData, friction, efficiency, gravityForce, camTable);
  
  self.postMessage(result);
};
