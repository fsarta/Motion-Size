
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
  allowableInertiaRatio?: number;

  // Drive
  driveVendor?: string;
  driveModel?: string;
  driveSupplyVoltage?: number;
  driveMaxCurrent?: number;
  pwmFrequency?: number;
  
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
  model: string;
  ratedSpeed: number; // rpm
  peakSpeed: number; // rpm
  ratedTorque: number; // Nm
  peakTorque: number; // Nm
  ratedPower: number; // kW
  ratedCurrent: number; // Arms
  efficiency: number; // %
  powerFactor: number;
  inertia: number; // kg cm^2
  allowableInertiaRatio: number;
  costIndex: number; // Relative cost factor
}

export interface DriveSpec {
  vendor: string;
  model: string;
  supplyVoltage: number; // V
  maxCurrent: number; // A
  pwmFrequency: number; // kHz
}

export interface GearboxSpec {
  vendor: string;
  model: string;
  ratio: number;
  efficiency: number;
  inertia: number;
  backlash: number; // arcmin
  maxInputSpeed: number;
}

export interface SizingMetrics {
  rmsTorque: number;  // Nm
  peakTorque: number; // Nm  
  rmsSpeed: number;   // RPM
  peakSpeed: number;  // RPM
}
