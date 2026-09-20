import { MotionSegment, TimePoint, ProfileType } from '../types';
import { MotionLaws } from '../utils/motionLaws';

export interface SimulationParams {
  segments: MotionSegment[];
  totalInertia: number; // kg*m^2 at motor shaft
  profileType: ProfileType;
  gearRatio: number;
  masterProfileData: string | null;
  friction: number; // Nm at motor shaft
  efficiency: number; // 0 - 1
  gravityForce: number; // Nm static gravity torque at motor shaft
  camTable?: any;
  axisUsage?: 'Linear' | 'Rotary';
  feedConstant?: number; // mm/rev or deg/rev
}

export const simulateMotion = (
  segments: MotionSegment[], 
  totalInertia: number, 
  profileType: ProfileType, 
  gearRatio: number,
  masterProfileData: string | null,
  friction: number = 0,
  efficiency: number = 1,
  gravityForce: number = 0,
  camTable?: any,
  axisUsage: 'Linear' | 'Rotary' = 'Rotary',
  feedConstant: number = 360
): TimePoint[] => {
  const eff = Math.max(0.1, Math.min(1.0, efficiency || 1));
  const gr = Math.max(0.001, gearRatio || 1);
  const isLinear = axisUsage === 'Linear';
  const feed = Math.max(0.001, feedConstant || (isLinear ? 10 : 360));
  
  // Conversion factors to angular quantities at motor shaft:
  // Rotary: pos in deg, vel in deg/s, acc in deg/s^2.
  //   omega_motor (rad/s) = (vel * pi / 180) * gr
  //   alpha_motor (rad/s^2) = (acc * pi / 180) * gr
  // Linear: pos in mm, vel in mm/s, acc in mm/s^2.
  //   omega_motor (rad/s) = (vel / feed) * 2 * pi * gr
  //   alpha_motor (rad/s^2) = (acc / feed) * 2 * pi * gr
  const accToAlphaMotor = isLinear 
    ? ((2 * Math.PI * gr) / feed) 
    : ((Math.PI * gr) / 180);

  const velToOmegaMotor = isLinear 
    ? ((2 * Math.PI * gr) / feed) 
    : ((Math.PI * gr) / 180);

  // Helper for 4-quadrant motor torque:
  // T_acc = J_tot * alpha_motor
  // T_load = friction * sign(v) + gravityForce + payload
  // If motoring (P_mech > 0), T_motor = T_acc + T_load / eff
  // If regenerating (P_mech < 0), T_motor = T_acc + T_load * eff
  const calculateMotorTorque = (acc: number, vel: number, payloadNm: number = 0): number => {
    const alphaMotor = acc * accToAlphaMotor;
    const omegaMotor = vel * velToOmegaMotor;
    const tAcc = totalInertia * alphaMotor;

    const signVel = vel > 0.0001 ? 1 : vel < -0.0001 ? -1 : 0;
    const tFric = friction * signVel;
    const tLoad = tFric + gravityForce + payloadNm;

    const netTorqueCandidate = tAcc + tLoad;
    const mechanicalPower = netTorqueCandidate * omegaMotor;

    if (mechanicalPower >= 0) {
      // Motoring quadrant: efficiency increases required motor torque
      return tAcc + (tLoad / eff);
    } else {
      // Regenerating / braking quadrant: mechanical friction assists braking
      return tAcc + (tLoad * eff);
    }
  };

  // 1. Electronic Camming & Master/Follower
  if ((profileType === 'Master/Follower' || profileType === 'Camming') && masterProfileData && masterProfileData !== 'undefined') {
    try {
      const masterSegments = JSON.parse(masterProfileData) as MotionSegment[];
      const masterPoints = simulateMotion(
        masterSegments, 0.001, 'Time Based', 1, null, 0, 1, 0, undefined, 'Rotary', 360
      );

      if (profileType === 'Camming' && camTable && Array.isArray(camTable.sectors) && camTable.sectors.length > 0) {
        const mRange = Math.max(1, camTable.masterRange || 360);

        return masterPoints.map(mp => {
          let mPos = ((mp.pos % mRange) + mRange) % mRange;
          const sector = camTable.sectors.find((s: any) => mPos >= s.masterStart && mPos <= s.masterEnd) 
            || camTable.sectors[camTable.sectors.length - 1];

          let s = 0, v = 0, a = 0, j = 0;

          if (sector) {
            const rangeX = Math.max(0.001, sector.masterEnd - sector.masterStart);
            const rangeY = sector.slaveEnd - sector.slaveStart;
            const u = Math.min(1, Math.max(0, (mPos - sector.masterStart) / rangeX));
            
            const lawFunc = MotionLaws[sector.law as keyof typeof MotionLaws] || MotionLaws['Poly5'];
            const [s_norm, v_norm, a_norm, j_norm] = lawFunc(u);

            s = sector.slaveStart + (rangeY * s_norm);
            const dMdt = mp.vel;
            const d2Mdt2 = mp.acc;

            v = (rangeY / rangeX) * v_norm * dMdt;
            a = (rangeY / (rangeX * rangeX)) * a_norm * dMdt * dMdt + (rangeY / rangeX) * v_norm * d2Mdt2;
            j = (rangeY / Math.pow(rangeX, 3)) * j_norm * Math.pow(dMdt, 3);
          }

          const slavePos = s * gr;
          const slaveVel = v * gr;
          const slaveAcc = a * gr;
          const slaveJerk = j * gr;
          const torque = calculateMotorTorque(slaveAcc, slaveVel, 0);

          return {
            t: mp.t,
            masterPos: mp.pos,
            pos: slavePos,
            vel: slaveVel,
            acc: slaveAcc,
            jerk: slaveJerk,
            torque: torque
          };
        });
      }

      // Master/Follower simple electronic gearing
      return masterPoints.map(mp => {
        const slavePos = mp.pos * gr;
        const slaveVel = mp.vel * gr;
        const slaveAcc = mp.acc * gr;
        const slaveJerk = mp.jerk * gr;
        const torque = calculateMotorTorque(slaveAcc, slaveVel, 0);

        return {
          t: mp.t,
          masterPos: mp.pos,
          pos: slavePos,
          vel: slaveVel,
          acc: slaveAcc,
          jerk: slaveJerk,
          torque: torque
        };
      });
    } catch (e) {
      console.error("Master / Camming simulation failed", e);
    }
  }

  // 2. Time-Based Discrete Motion Profile
  if (!segments || segments.length === 0) return [];

  const points: TimePoint[] = [];
  let currentT = 0;
  let currentPos = 0;
  let runningVelocity = 0;

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
        j = 0;
      } else if (seg.type === 'S-Curve') {
        // Cycloidal S-Curve transition:
        // Smooth jerk-bounded transition from v0 to v1 or rest to rest
        if (Math.abs(v1 - v0) > 0.001) {
          const deltaV = v1 - v0;
          v = v0 + deltaV * (t / T - Math.sin((2 * Math.PI * t) / T) / (2 * Math.PI));
          s = v0 * t + deltaV * ((t * t) / (2 * T) + (T / (4 * Math.PI * Math.PI)) * (Math.cos((2 * Math.PI * t) / T) - 1));
          a = (deltaV / T) * (1 - Math.cos((2 * Math.PI * t) / T));
          j = ((2 * Math.PI * deltaV) / (T * T)) * Math.sin((2 * Math.PI * t) / T);
        } else {
          // Rest to rest move across distance S
          s = S * (t / T - Math.sin((2 * Math.PI * t) / T) / (2 * Math.PI));
          v = (S / T) * (1 - Math.cos((2 * Math.PI * t) / T));
          a = ((2 * Math.PI * S) / (T * T)) * Math.sin((2 * Math.PI * t) / T);
          j = ((4 * Math.PI * Math.PI * S) / Math.pow(T, 3)) * Math.cos((2 * Math.PI * t) / T);
          v1 = 0;
        }
      } else if (seg.type === 'Trapezoid') {
        const ta = T * 0.25;
        const td = T * 0.25;
        const tc = T - ta - td;
        const vp = S / (T - ta);
        if (t <= ta) {
          a = vp / ta;
          v = a * t;
          s = 0.5 * a * t * t;
        } else if (t <= ta + tc) {
          a = 0;
          v = vp;
          s = (0.5 * vp * ta) + vp * (t - ta);
        } else {
          const tr = t - (ta + tc);
          a = -vp / td;
          v = vp + a * tr;
          s = (S - (0.5 * vp * td)) + (vp * tr + 0.5 * a * tr * tr);
        }
        j = 0;
        v1 = 0;
      } else if (seg.type === 'Sine') {
        s = S * (t / T - (1 / (2 * Math.PI)) * Math.sin((2 * Math.PI * t) / T));
        v = (S / T) * (1 - Math.cos((2 * Math.PI * t) / T));
        a = ((2 * Math.PI * S) / (T * T)) * Math.sin((2 * Math.PI * t) / T);
        j = ((4 * Math.pow(Math.PI, 2) * S) / Math.pow(T, 3)) * Math.cos((2 * Math.PI * t) / T);
        v1 = 0;
      } else if (seg.type === 'Triangle') {
        const vPeak = (2 * S) / T;
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
        j = 0;
        v1 = 0;
      } else if (seg.type === 'Dwell/Traverse') {
        v = 0;
        a = 0;
        s = 0;
        j = 0;
        v1 = 0;
      } else {
        v = S / T;
        a = 0;
        s = v * t;
        v1 = v;
        j = 0;
      }

      if (i > 0 || points.length === 0) {
        const torque = calculateMotorTorque(a, v, seg.payload || 0);
        points.push({
          t: parseFloat((currentT + t).toFixed(5)),
          masterPos: 0,
          pos: currentPos + s,
          vel: v,
          acc: a,
          jerk: j,
          torque: torque,
        });
      }
    }

    currentT += T;
    currentPos = points.length > 0 ? points[points.length - 1].pos : 0;
    runningVelocity = v1;
  });

  return points;
};

if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent) => {
    const { 
      segments, 
      totalInertia, 
      profileType, 
      gearRatio, 
      masterProfileData, 
      friction, 
      efficiency, 
      gravityForce, 
      camTable,
      axisUsage,
      feedConstant 
    } = e.data;
    
    const result = simulateMotion(
      segments, 
      totalInertia, 
      profileType, 
      gearRatio, 
      masterProfileData, 
      friction, 
      efficiency, 
      gravityForce, 
      camTable,
      axisUsage,
      feedConstant
    );
    
    self.postMessage(result);
  };
}
