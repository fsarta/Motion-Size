import { MotionSegment, TimePoint, ProfileType } from '../types';

export const simulateMotion = (
    segments: MotionSegment[], 
    totalInertia: number, 
    profileType: ProfileType, 
    gearRatio: number,
    masterProfileData: string | null
): TimePoint[] => {
  const points: TimePoint[] = [];
  const dt = 0.005; 

  if ((profileType === 'Master/Follower' || profileType === 'Camming') && masterProfileData && masterProfileData !== 'undefined') {
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

self.onmessage = (e: MessageEvent) => {
  const { segments, totalInertia, profileType, gearRatio, masterProfileData } = e.data;
  
  const result = simulateMotion(segments, totalInertia, profileType, gearRatio, masterProfileData);
  
  self.postMessage(result);
};
