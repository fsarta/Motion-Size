import { AxisParameters } from '../types';

export interface InertiaComponent {
  id: string;
  name: string;
  type: 'Solid Cylinder' | 'Hollow Cylinder' | 'Cuboid' | 'Solid Sphere' | 'Hollow Sphere' | 'Solid Cone' | 'User Spec.';
  quantity: number;
  ratio: number;
  mass: number; // kg (Base unit)
  volume: number; // m3 (Base unit)
  material: string;
  density: number; // kg/m3
  // Dimensions (stored in Base Unit: mm)
  d1: number; // Outer Diameter
  d2: number; // Inner Diameter
  h: number; // Height
  w: number; // Width
  l: number; // Length (Depth)
  r_offset: number; // Distance from axis
  inertia: number; // kg cm^2 (Base unit)
}

export const MATERIALS = [
  { name: 'Aluminum', density: 2700 },
  { name: 'Brass', density: 8500 },
  { name: 'Hard Wood (Oak)', density: 750 },
  { name: 'Iron (Cast)', density: 7200 },
  { name: 'Nylon', density: 1150 },
  { name: 'POM (Delrin)', density: 1410 },
  { name: 'Steel (Carbon Tool)', density: 7850 },
  { name: 'Steel (Stainless)', density: 8000 },
  { name: 'User Spec.', density: 0 }
];

export const DEFAULT_INERTIA_ROW: InertiaComponent = {
  id: '1',
  name: 'NewComponent',
  type: 'Solid Cylinder',
  quantity: 1,
  ratio: 1,
  mass: 0,
  volume: 0,
  material: 'Steel (Carbon Tool)',
  density: 7850,
  d1: 100, // 100mm
  d2: 0,
  h: 100, // 100mm
  w: 100,
  l: 100,
  r_offset: 0,
  inertia: 0
};

export function calculateInertiaPhysics(comp: InertiaComponent): InertiaComponent {
  if (comp.type === 'User Spec.') {
    return comp; 
  }

  // 1. Dimensions to SI Units (Meters)
  const d1_m = comp.d1 / 1000;
  const d2_m = comp.d2 / 1000;
  const h_m = comp.h / 1000;
  const w_m = comp.w / 1000;
  const l_m = comp.l / 1000;
  const r_offset_m = comp.r_offset / 1000;

  // 2. Calculate Volume (m^3)
  let vol_m3 = 0;
  if (comp.type === 'Solid Cylinder') {
    const radius = d1_m / 2;
    vol_m3 = Math.PI * Math.pow(radius, 2) * h_m;
  } else if (comp.type === 'Hollow Cylinder') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    vol_m3 = Math.PI * (Math.pow(r_out, 2) - Math.pow(r_in, 2)) * h_m;
  } else if (comp.type === 'Cuboid') {
    vol_m3 = w_m * l_m * h_m;
  } else if (comp.type === 'Solid Sphere') {
    const radius = d1_m / 2;
    vol_m3 = (4/3) * Math.PI * Math.pow(radius, 3);
  } else if (comp.type === 'Hollow Sphere') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    vol_m3 = (4/3) * Math.PI * (Math.pow(r_out, 3) - Math.pow(r_in, 3));
  } else if (comp.type === 'Solid Cone') {
    const radius = d1_m / 2;
    vol_m3 = (1/3) * Math.PI * Math.pow(radius, 2) * h_m;
  }

  // 3. Calculate Mass (kg)
  const mass = vol_m3 * comp.density;

  // 4. Calculate Base Inertia (kg*m^2) around Center of Mass
  let I_cm_si = 0;
  if (comp.type === 'Solid Cylinder') {
    const radius = d1_m / 2;
    I_cm_si = 0.5 * mass * Math.pow(radius, 2);
  } else if (comp.type === 'Hollow Cylinder') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    I_cm_si = 0.5 * mass * (Math.pow(r_out, 2) + Math.pow(r_in, 2));
  } else if (comp.type === 'Cuboid') {
    I_cm_si = (mass * (Math.pow(l_m, 2) + Math.pow(w_m, 2))) / 12;
  } else if (comp.type === 'Solid Sphere') {
    const radius = d1_m / 2;
    I_cm_si = (2/5) * mass * Math.pow(radius, 2);
  } else if (comp.type === 'Hollow Sphere') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    const num = Math.pow(r_out, 5) - Math.pow(r_in, 5);
    const den = Math.pow(r_out, 3) - Math.pow(r_in, 3);
    if (den > 0) {
      I_cm_si = (2/5) * mass * (num / den);
    }
  } else if (comp.type === 'Solid Cone') {
    const radius = d1_m / 2;
    I_cm_si = (3/10) * mass * Math.pow(radius, 2);
  }

  // 5. Parallel Axis Theorem & Transmission (kg*m^2)
  const I_parallel_si = I_cm_si + (mass * Math.pow(r_offset_m, 2));
  const I_total_si = I_parallel_si * comp.quantity * Math.pow(comp.ratio, 2);

  // 6. Convert SI Inertia (kg*m^2) to App Base Unit (kg*cm^2)
  const I_total_storage = I_total_si * 10000;

  return {
    ...comp,
    volume: vol_m3,
    mass: mass,
    inertia: I_total_storage
  };
}

/* =========================================================================
   COMPREHENSIVE ELECTROMECHANICAL MOTION SIZING & DYNAMICS
   ========================================================================= */

export interface AxisDynamicModel {
  isLinear: boolean;
  totalMovingMassKg: number;
  effectiveRadiusM: number;       // Linear to angular transmission radius r = v / omega
  linearFeedPerRevMm: number;     // Feed per revolution (lead or pi*D)
  massInertiaKgCm2: number;       // Equivalent inertia of translating mass
  mechInertiaKgCm2: number;       // Rotating mechanism parts inertia (screw, pinion, etc.)
  transInertiaKgCm2: number;      // Transmission reflected inertia
  loadSideInertiaKgCm2: number;   // Total inertia on load side (before gearbox)
  gearboxRatio: number;
  gearboxInertiaKgCm2: number;
  motorInertiaKgCm2: number;
  reflectedLoadInertiaKgCm2: number; // Load inertia reflected to motor shaft
  totalInertiaKgCm2: number;      // Total system inertia at motor shaft in kg*cm^2
  totalInertiaKgM2: number;       // Total system inertia at motor shaft in SI (kg*m^2)
  inertiaRatio: number;           // J_reflected_load / J_motor
  gravityForceN: number;          // Gravitational force along axis
  gravityTorqueNm: number;        // Gravitational torque reflected to motor shaft
  frictionForceN: number;         // Friction force
  frictionTorqueNm: number;       // Friction torque reflected to motor shaft
  combinedEfficiency: number;     // Total mechanical efficiency (0 - 1)
}

/**
 * Calculates complete reflected inertia, static gravitational load, 
 * and friction load at the motor shaft according to classical machine dynamics.
 */
export function calculateAxisDynamics(params: AxisParameters & Record<string, any>): AxisDynamicModel {
  const isLinear = params.axisUsage === 'Linear';
  const mechType = params.mechanismType || 'Ball Screw';
  
  // 1. Moving mass evaluation
  const massLoad = parseFloat(String(params.massLoad || 0));
  const slideMass = parseFloat(String(params.slideMass || params.beltMass || params.rackMass || params.chainMass || 0));
  const cwMass = parseFloat(String(params.cwMass || 0));
  const totalMovingMassKg = Math.max(0, massLoad + slideMass);

  // 2. Kinematic transmission constant (Lead / Pitch / Radius)
  let feedPerRevMm = parseFloat(String(params.feedConstant || 0));
  let effRadiusM = 0;

  if (mechType === 'Ball Screw') {
    const leadMm = parseFloat(String(params.screwLead || feedPerRevMm || 10));
    feedPerRevMm = leadMm;
    effRadiusM = (leadMm / 1000) / (2 * Math.PI); // r = p / (2*pi)
  } else if (mechType === 'Belt') {
    const diaMm = parseFloat(String(params.driverDiameter || 0));
    if (diaMm > 0) {
      effRadiusM = (diaMm / 1000) / 2;
      feedPerRevMm = Math.PI * diaMm;
    } else if (feedPerRevMm > 0) {
      effRadiusM = (feedPerRevMm / 1000) / (2 * Math.PI);
    } else {
      effRadiusM = 0.025; // default 50mm dia
      feedPerRevMm = 50 * Math.PI;
    }
  } else if (mechType === 'Rack and Pinion' || mechType === 'Rack & Pinion') {
    const diaMm = parseFloat(String(params.pinionPCD || 0));
    if (diaMm > 0) {
      effRadiusM = (diaMm / 1000) / 2;
      feedPerRevMm = Math.PI * diaMm;
    } else if (feedPerRevMm > 0) {
      effRadiusM = (feedPerRevMm / 1000) / (2 * Math.PI);
    } else {
      effRadiusM = 0.03; // default 60mm PCD
      feedPerRevMm = 60 * Math.PI;
    }
  } else if (mechType === 'Chain and Sprocket') {
    const diaMm = parseFloat(String(params.sprocketPCD || 0));
    effRadiusM = diaMm > 0 ? (diaMm / 1000) / 2 : (feedPerRevMm > 0 ? (feedPerRevMm / 1000) / (2 * Math.PI) : 0.03);
    feedPerRevMm = effRadiusM * 2 * 1000 * Math.PI;
  } else if (mechType === 'Roll Feeder' || mechType === 'Roll Feed') {
    const diaMm = parseFloat(String(params.drivingRollerDia || 0));
    effRadiusM = diaMm > 0 ? (diaMm / 1000) / 2 : (feedPerRevMm > 0 ? (feedPerRevMm / 1000) / (2 * Math.PI) : 0.05);
    feedPerRevMm = effRadiusM * 2 * 1000 * Math.PI;
  } else if (isLinear) {
    effRadiusM = feedPerRevMm > 0 ? (feedPerRevMm / 1000) / (2 * Math.PI) : 0.0159; // 100mm / 2pi
    if (feedPerRevMm <= 0) feedPerRevMm = 100;
  }

  // 3. Translating Mass reflected to rotating load shaft (kg*cm^2):
  // J = m * r^2  (in SI: kg*m^2 -> * 10000 for kg*cm^2)
  let massInertiaKgCm2 = 0;
  if (isLinear && effRadiusM > 0) {
    const massInertiaKgM2 = totalMovingMassKg * Math.pow(effRadiusM, 2);
    massInertiaKgCm2 = massInertiaKgM2 * 10000;
  }

  // 4. Intrinsic rotating mechanism inertia (kg*cm^2)
  const mechInertiaKgCm2 = parseFloat(String(
    params.screwInertia || 
    params.driverInertia || 
    params.sprocketInertia || 
    params.pinionInertia || 
    params.crankInertia || 
    params.rotatingInertia || 
    params.drivingInertia || 0
  ));

  const transInertiaKgCm2 = parseFloat(String(params.transInertia || 0));
  const loadSideInertiaKgCm2 = massInertiaKgCm2 + mechInertiaKgCm2 + transInertiaKgCm2;

  // 5. Gearbox and Motor reflection
  const gearboxRatio = Math.max(0.001, parseFloat(String(params.gearboxRatio || 1)));
  const gearboxInertiaKgCm2 = parseFloat(String(params.gearboxInertia || 0));
  const motorInertiaKgCm2 = parseFloat(String(params.motorInertia || 0));

  const reflectedLoadInertiaKgCm2 = loadSideInertiaKgCm2 / Math.pow(gearboxRatio, 2);
  const totalInertiaKgCm2 = reflectedLoadInertiaKgCm2 + gearboxInertiaKgCm2 + motorInertiaKgCm2;
  const totalInertiaKgM2 = totalInertiaKgCm2 * 0.0001; // kg*cm^2 to kg*m^2

  const inertiaRatio = motorInertiaKgCm2 > 0 ? reflectedLoadInertiaKgCm2 / motorInertiaKgCm2 : 0;

  // 6. Efficiency
  const mechEff = Math.max(0.05, Math.min(1.0, parseFloat(String(params.mechanismEfficiency || 100)) / 100));
  const gbEff = Math.max(0.05, Math.min(1.0, parseFloat(String(params.gearboxEfficiency || 100)) / 100));
  const transEff = Math.max(0.05, Math.min(1.0, parseFloat(String(params.transEfficiency || 100)) / 100));
  const combinedEfficiency = mechEff * gbEff * transEff;

  // 7. Gravity calculations
  const inclineAngleDeg = parseFloat(String(params.inclineAngle || 0));
  const inclineRad = (inclineAngleDeg * Math.PI) / 180;
  const netGravityMassKg = (massLoad + slideMass) - cwMass;
  const gravityForceN = netGravityMassKg * 9.80665 * Math.sin(inclineRad);
  
  // Gravitational torque reflected to motor shaft
  let gravityTorqueNm = 0;
  if (isLinear && effRadiusM > 0) {
    gravityTorqueNm = (gravityForceN * effRadiusM) / gearboxRatio;
  } else if (!isLinear && params.externalTorque) {
    gravityTorqueNm = parseFloat(String(params.externalTorque || 0)) / gearboxRatio;
  }

  // 8. Friction calculations
  const mu = parseFloat(String(params.frictionCoeff || params.kineticFriction || 0));
  const normalForceN = (massLoad + slideMass) * 9.80665 * Math.cos(inclineRad);
  const frictionForceN = (mu * normalForceN) + parseFloat(String(params.frictionForce || params.externalForce || 0));
  
  let frictionTorqueNm = 0;
  if (isLinear && effRadiusM > 0) {
    frictionTorqueNm = (frictionForceN * effRadiusM) / gearboxRatio;
  } else {
    // Rotary friction
    frictionTorqueNm = parseFloat(String(params.kineticFriction || params.frictionForce || 0)) / gearboxRatio;
  }
  const addTorque = parseFloat(String(params.transAddTorque || 0)) / gearboxRatio;
  frictionTorqueNm += addTorque;

  return {
    isLinear,
    totalMovingMassKg,
    effectiveRadiusM: effRadiusM,
    linearFeedPerRevMm: feedPerRevMm,
    massInertiaKgCm2,
    mechInertiaKgCm2,
    transInertiaKgCm2,
    loadSideInertiaKgCm2,
    gearboxRatio,
    gearboxInertiaKgCm2,
    motorInertiaKgCm2,
    reflectedLoadInertiaKgCm2,
    totalInertiaKgCm2,
    totalInertiaKgM2,
    inertiaRatio,
    gravityForceN,
    gravityTorqueNm,
    frictionForceN,
    frictionTorqueNm,
    combinedEfficiency
  };
}

/**
 * Ambient temperature derating factor according to IEC 60034 standards.
 * Standard servo motors are rated for 40°C ambient.
 */
export function calculateThermalDerating(ambientTempC: number = 40): number {
  if (ambientTempC <= 40) return 1.0;
  // Standard rule of thumb: ~1.2% per °C between 40°C and 60°C
  const derated = 1.0 - 0.012 * (ambientTempC - 40);
  return Math.max(0.5, parseFloat(derated.toFixed(3)));
}

/**
 * Calculates Emergency / Max Stop time and distance based on motor peak braking torque.
 */
export function calculateMaxStop(
  totalInertiaKgM2: number,
  maxSpeedRpm: number,
  peakTorqueNm: number,
  frictionTorqueNm: number = 0,
  feedConstantMm: number = 10,
  gearRatio: number = 1,
  isLinear: boolean = false
): { stopTimeSec: number; stopRev: number; stopDistanceMm: number } {
  const omega0 = (maxSpeedRpm * 2 * Math.PI) / 60; // rad/s
  const totalBrakingTorque = Math.max(0.1, peakTorqueNm + Math.abs(frictionTorqueNm));
  const stopTimeSec = (totalInertiaKgM2 * omega0) / totalBrakingTorque;
  const stopRev = (maxSpeedRpm / 60) * 0.5 * stopTimeSec;
  
  let stopDistanceMm = stopRev * 360; // default degrees
  if (isLinear) {
    // Linear stop distance in mm
    stopDistanceMm = (stopRev / gearRatio) * feedConstantMm;
  }

  return {
    stopTimeSec: parseFloat(stopTimeSec.toFixed(3)),
    stopRev: parseFloat(stopRev.toFixed(2)),
    stopDistanceMm: parseFloat(stopDistanceMm.toFixed(1))
  };
}

/**
 * Regenerative braking energy and Braking Resistor sizing for a motion profile.
 */
export function calculateRegenEnergyAndResistor(
  torquesNm: number[],
  speedsRpm: number[],
  dtSec: number,
  cycleTimeSec: number = 10,
  busVoltageV: number = 560
): {
  totalRegenEnergyJoules: number;
  peakRegenPowerWatts: number;
  continuousRegenPowerWatts: number;
  recommendedResistorOhm: number;
} {
  let totalRegenJoules = 0;
  let peakRegenWatts = 0;

  for (let i = 0; i < torquesNm.length; i++) {
    const t = torquesNm[i];
    const n = speedsRpm[i];
    const omega = (n * 2 * Math.PI) / 60;
    const power = t * omega; // Watts (mechanical)

    // Negative power means motor is regenerating (acting as generator)
    if (power < 0) {
      const regenWatts = Math.abs(power);
      totalRegenJoules += regenWatts * dtSec;
      if (regenWatts > peakRegenWatts) {
        peakRegenWatts = regenWatts;
      }
    }
  }

  const effectiveCycle = Math.max(cycleTimeSec, torquesNm.length * dtSec, 0.1);
  const continuousRegenWatts = totalRegenJoules / effectiveCycle;
  
  // Braking chopper turns on typically at 1.15x nominal bus voltage
  const chopperVoltage = busVoltageV * 1.15;
  const recommendedOhm = peakRegenWatts > 10 ? Math.max(10, Math.round((chopperVoltage * chopperVoltage) / (peakRegenWatts * 1.2))) : 50;

  return {
    totalRegenEnergyJoules: parseFloat(totalRegenJoules.toFixed(1)),
    peakRegenPowerWatts: parseFloat(peakRegenWatts.toFixed(1)),
    continuousRegenPowerWatts: parseFloat(continuousRegenWatts.toFixed(1)),
    recommendedResistorOhm: recommendedOhm
  };
}

/**
 * Closed-form analytical Inverse Kinematics for SCARA robot (2R planar arms + Z + Roll).
 * Returns joint values [theta1_deg, theta2_deg, z_mm, roll_deg]
 */
export function solveScaraIK(
  x: number, 
  y: number, 
  z: number, 
  rzDeg: number = 0,
  l1: number = 250, 
  l2: number = 250
): { theta1Deg: number; theta2Deg: number; zMm: number; rollDeg: number; reachable: boolean } {
  const d2 = x * x + y * y;
  const cosTheta2 = (d2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);

  if (cosTheta2 < -1.0001 || cosTheta2 > 1.0001) {
    return { theta1Deg: 0, theta2Deg: 0, zMm: z, rollDeg: rzDeg, reachable: false };
  }

  const clampedCos = Math.max(-1, Math.min(1, cosTheta2));
  // Right-arm elbow configuration (positive sin)
  const sinTheta2 = Math.sqrt(1 - clampedCos * clampedCos);
  const theta2Rad = Math.atan2(sinTheta2, clampedCos);

  const k1 = l1 + l2 * clampedCos;
  const k2 = l2 * sinTheta2;
  const theta1Rad = Math.atan2(y, x) - Math.atan2(k2, k1);

  const t1Deg = (theta1Rad * 180) / Math.PI;
  const t2Deg = (theta2Rad * 180) / Math.PI;
  const rollDeg = rzDeg - (t1Deg + t2Deg);

  return {
    theta1Deg: parseFloat(t1Deg.toFixed(2)),
    theta2Deg: parseFloat(t2Deg.toFixed(2)),
    zMm: z,
    rollDeg: parseFloat(rollDeg.toFixed(2)),
    reachable: true
  };
}

export interface BearingLifeResult {
  equivalentRadialForceN: number;
  averageSpeedRpm: number;
  lifeHours: number;
  lifeYears: number; // based on 4000 operating hours per year (2 shifts x 250 days)
  status: 'optimal' | 'acceptable' | 'critical';
  warningMessage?: string;
}

/**
 * Calculates bearing theoretical service life (L10h) based on ISO 281 dynamic load spectrum.
 * 
 * L10h = L10h_catalog * (n_catalog / n_avg) * (F_r_catalog / F_r_eq)^p
 * 
 * where p = 3 for ball bearings (standard for servo motors and planetary output)
 */
export function calculateEquivalentBearingLife(
  catalogNominalLifeHours: number = 20000,
  catalogPermissibleRadialForceN: number = 1000,
  catalogSpeedRpm: number = 3000,
  actualRadialForceN: number = 500,
  actualAverageSpeedRpm: number = 1500,
  bearingType: 'ball' | 'roller' = 'ball'
): BearingLifeResult {
  const p = bearingType === 'ball' ? 3.0 : 10.0 / 3.0;

  const nAvg = Math.max(actualAverageSpeedRpm, 1);
  const nCat = Math.max(catalogSpeedRpm, 100);
  const frPerm = Math.max(catalogPermissibleRadialForceN, 1);
  const frEq = Math.max(actualRadialForceN, 1);

  // Speed factor: lower average speed increases bearing lifetime proportionally
  const speedFactor = nCat / nAvg;
  // Load factor: lifetime depends on the p-th power of load ratio
  const loadFactor = Math.pow(frPerm / frEq, p);

  let lifeHours = catalogNominalLifeHours * speedFactor * loadFactor;
  // Cap at grease/lubricant fatigue limit (100,000 h)
  lifeHours = Math.min(Math.max(lifeHours, 50), 100000);

  const lifeYears = parseFloat((lifeHours / 4000).toFixed(1)); // 4000 h/year = 16h/day * 250d

  let status: 'optimal' | 'acceptable' | 'critical' = 'optimal';
  let warningMessage: string | undefined = undefined;

  if (lifeHours < 10000) {
    status = 'critical';
    warningMessage = 'Critical bearing life (< 10,000 h). Risk of premature fatigue; consider reducing radial load or selecting larger frame size.';
  } else if (lifeHours < 20000) {
    status = 'acceptable';
    warningMessage = 'Acceptable bearing life, but below 20,000 h standard industrial target. Periodic maintenance recommended.';
  }

  return {
    equivalentRadialForceN: parseFloat(frEq.toFixed(1)),
    averageSpeedRpm: parseFloat(nAvg.toFixed(0)),
    lifeHours: parseFloat(lifeHours.toFixed(0)),
    lifeYears,
    status,
    warningMessage
  };
}
