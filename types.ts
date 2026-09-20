
import { z } from 'zod';

export type NodeType = 'group' | 'axis' | 'mechanism' | 'gearbox' | 'motor_drive';

export interface AxisParameters {
  // System Data
  axisUsage?: 'Rotary' | 'Linear';
  loadType?: 'Continuous' | 'Intermittent';
  supplyVoltage?: number;
  ambientTemp?: number;
  
  // Mechanism
  mechanismType?: string;
  screwInertia?: number;
  driverInertia?: number;
  rotatingInertia?: number;
  transInertia?: number;
  mechanismEfficiency?: number;
  kineticFriction?: number;

  // Gearbox
  gearboxVendor?: string;
  gearboxModel?: string;
  gearboxRatio?: number;
  gearboxEfficiency?: number;
  gearboxInertia?: number;
  gearboxBacklash?: number;
  gearboxMaxInputSpeed?: number;
  gearboxMass?: number;
  gearboxNominalTorque?: number;
  gearboxMaxTorque?: number;
  gearboxMaxRadialForce?: number;
  gearboxMaxAxialForce?: number;
  gearboxTorsionalRigidity?: number;
  gearboxOutputShaftDiameter?: number;
  
  // Motor
  motorVendor?: string;
  motorModel?: string;
  ratedSpeed?: number;
  ratedTorque?: number;
  ratedPower?: number;
  ratedCurrent?: number;
  motorEfficiency?: number;
  powerFactor?: number;
  motorInertia?: number;
  peakTorque?: number;
  peakSpeed?: number;
  stallTorque?: number;
  stallCurrent?: number;
  peakCurrent?: number;
  torqueConstant?: number;
  voltageConstant?: number;
  windingResistance?: number;
  windingInductance?: number;
  electricalTimeConstant?: number;
  mechanicalTimeConstant?: number;
  thermalTimeConstant?: number;
  polePairs?: number;
  coolingType?: string;
  insulationClass?: string;
  motorMass?: number;
  flangeSize?: number;
  shaftDiameter?: number;
  shaftLength?: number;
  keyway?: boolean;
  maxRadialForce?: number;
  maxAxialForce?: number;
  protectionClass?: string;
  hasBrakeOption?: boolean;
  brakeTorque?: number;
  brakeInertia?: number;
  allowableInertiaRatio?: number;

  // Drive
  driveVendor?: string;
  driveModel?: string;
  driveSupplyVoltage?: number;
  driveMaxCurrent?: number;
  pwmFrequency?: number;
  driveNominalBusVoltage?: number;
  driveInternalBusCapacitance?: number;
  driveRatedCurrent?: number;
  driveDimensions?: { width: number; height: number; depth: number };
  driveWeight?: number;
  
  // Motion Profile
  profileType?: ProfileType;
  masterAxis?: string;
  gearRatioNum?: number;
  gearRatioDen?: number;
  motionProfileData?: string; // JSON string of MotionSegment[]
}

export interface GroupParameters {
  infeedPeakPower?: number;
  infeedContinuousPower?: number;
  busVoltage?: number;
  regenCapacity?: number;
  // Any other group params
}

export interface TreeNode {
  id: string;
  label: string;
  icon: 'group' | 'axis' | 'component' | 'drive';
  type: NodeType;
  children?: TreeNode[];
  expanded?: boolean;
  parameters?: AxisParameters & GroupParameters & Record<string, any>;
}

export type CamMotionLaw = 'Straight Line' | 'Poly5' | 'Sine' | 'Modified Sine' | 'Modified Trapezoid';

export type SegmentType = 'Accel/Decel' | 'Trapezoid' | 'Triangle' | 'S-Curve' | 'Dwell/Traverse' | 'Sine';
export type CalcTarget = 'duration' | 'distance' | 'velocity';
export type ProfileType = 'Time Based' | 'Master/Follower' | 'Camming';

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

export interface TimePoint {
  t: number;
  masterPos: number;
  pos: number;
  vel: number;
  acc: number;
  jerk: number;
  torque: number;
}

export interface CamSector {
  id: string;
  masterStart: number; // x start
  masterEnd: number;   // x end
  slaveStart: number;  // y start
  slaveEnd: number;    // y end
  law: CamMotionLaw;
}

export interface CamTable {
  id: string;
  name: string;
  masterRange: number; // e.g. 360
  sectors: CamSector[];
}

export interface DriveData {
  id: number;
  efficiency: number;
  name: string;
}

/* --- Catalog Interfaces --- */

export interface MotorSpec {
  vendor: string;
  series?: string;
  model: string;
  description?: string;
  
  // Electrical Specifications
  ratedVoltage?: number; // V
  ratedSpeed: number; // rpm
  peakSpeed: number; // rpm
  stallTorque?: number; // M0 (Nm)
  ratedTorque: number; // MN (Nm)
  peakTorque: number; // Mmax (Nm)
  ratedPower: number; // kW
  ratedCurrent: number; // IN (Arms)
  stallCurrent?: number; // I0 (Arms)
  peakCurrent?: number; // Imax (Arms)
  torqueConstant?: number; // Kt (Nm/Arms)
  voltageConstant?: number; // Ke (V / 1000 rpm)
  windingResistance?: number; // Rph-ph (Ohm)
  windingInductance?: number; // Lph-ph (mH)
  electricalTimeConstant?: number; // tau_e (ms)
  mechanicalTimeConstant?: number; // tau_m (ms)
  thermalTimeConstant?: number; // tau_th (min)
  polePairs?: number; // p
  efficiency: number; // %
  powerFactor: number; // cos phi
  insulationClass?: string; // e.g. Class F (155°C)
  coolingType?: 'Natural' | 'Forced Air' | 'Liquid Cooled';

  // Mechanical Specifications
  inertia: number; // rotor inertia in kg cm^2
  motorMass?: number; // kg
  flangeSize?: number; // mm (e.g. 40, 55, 70, 80, 100, 130, 160, 180)
  shaftDiameter?: number; // mm
  shaftLength?: number; // mm
  keyway?: boolean; // true = with key DIN 6885, false = smooth shaft
  maxRadialForce?: number; // Fr,max (N)
  maxAxialForce?: number; // Fa,max (N)
  protectionClass?: string; // e.g. IP65 / IP67
  vibrationGrade?: string; // e.g. Grade A
  radialRunout?: number; // um

  // Brake Option
  hasBrakeOption?: boolean;
  brakeTorque?: number; // Nm
  brakeInertia?: number; // kg cm^2
  brakeMass?: number; // kg
  brakePower?: number; // W
  brakeEngagementTime?: number; // ms
  brakeReleaseTime?: number; // ms

  allowableInertiaRatio: number;
  costIndex: number; // Relative cost factor
}

export interface DriveSpec {
  vendor: string;
  series?: string;
  model: string;
  driveType?: 'Single Axis' | 'Double Axis' | 'Multi-Axis Module' | 'Compact';
  
  // Electrical - Supply & Input
  supplyVoltage: number; // V
  supplyVoltageMin?: number; // V
  supplyVoltageMax?: number; // V
  supplyPhases?: number; // 1 | 3
  inputFrequency?: string; // e.g. 47-63 Hz
  ratedInputCurrent?: number; // A

  // Electrical - Output & DC Bus
  nominalBusVoltage?: number; // VDC
  internalBusCapacitance?: number; // uF
  ratedOutputCurrent?: number; // Arms
  maxCurrent: number; // A (Peak output current)
  peakDuration?: number; // s (e.g. 3s, 5s)
  continuousOutputPower?: number; // kW
  peakOutputPower?: number; // kW
  pwmFrequency: number; // kHz
  maxPwmFrequency?: number; // kHz

  // Braking Chopper
  hasInternalChopper?: boolean;
  minBrakeResistor?: number; // Ohm
  internalResistorPower?: number; // W continuous

  // Control & Fieldbus & Safety
  feedbackInterfaces?: string[]; // e.g. ['DRIVE-CLiQ', 'EnDat 2.2', 'Hiperface DSL', 'Resolver']
  fieldbus?: string[]; // e.g. ['PROFINET IRT', 'EtherCAT', 'EtherNet/IP', 'CANopen']
  safetyFunctions?: string[]; // e.g. ['STO (SIL 3 / PL e)', 'SS1', 'SLS', 'SBC']

  // Mechanical
  dimensions?: { width: number; height: number; depth: number }; // mm
  weight?: number; // kg
  mounting?: string; // e.g. Booksize Cabinet, Cold plate, Wall mount
  cooling?: string; // e.g. Internal Fan, Cold Plate, External heatsink
  powerLoss?: number; // W
  protectionClass?: string; // IP20
}

export interface GearboxSpec {
  vendor: string;
  series?: string;
  model: string;
  gearboxType?: 'Planetary In-line' | 'Right-angle Bevel' | 'Hypoid' | 'Harmonic' | 'Direct Drive';
  
  // Kinematics
  ratio: number;
  stages?: number; // 1, 2, 3

  // Torques & Speeds
  nominalTorque?: number; // T2N (Nm)
  maxAccelerationTorque?: number; // T2B (Nm)
  emergencyStopTorque?: number; // T2NOT (Nm)
  nominalInputSpeed?: number; // n1N (rpm)
  maxInputSpeed: number; // n1max (rpm)
  efficiency: number; // %

  // Backlash & Stiffness
  backlash: number; // standard backlash in arcmin
  reducedBacklash?: number; // arcmin
  torsionalRigidity?: number; // Nm / arcmin

  // Mechanical & Forces
  inertia: number; // kg cm^2 at input
  mass?: number; // kg
  maxRadialForce?: number; // Fr2,max (N)
  maxAxialForce?: number; // Fa2,max (N)
  outputShaftType?: string; // e.g. Solid with key DIN 6885, Solid smooth, Flange ISO 9409-1
  outputShaftDiameter?: number; // mm
  outputShaftLength?: number; // mm
  serviceLife?: number; // L10h (hours, e.g. 20000)
  noiseLevel?: number; // dB(A)
  lubrication?: string; // e.g. Synthetic grease, Food-grade NSF H1
  protectionClass?: string; // IP64 / IP65
}

export interface SizingMetrics {
  rmsTorque: number;  // Nm
  peakTorque: number; // Nm  
  rmsSpeed: number;   // RPM
  peakSpeed: number;  // RPM
}
