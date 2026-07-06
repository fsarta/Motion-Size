
import { z } from 'zod';

export type NodeType = 'group' | 'axis' | 'mechanism' | 'gearbox' | 'motor_drive';

export const GroupParametersSchema = z.object({
  cycleTime: z.string().optional(),
}).catchall(z.any());

export const AxisParametersSchema = z.object({
  axisName: z.string().optional(),
  profileType: z.string().optional(),
  mechanismType: z.string().optional(),
  gearRatioNum: z.number().optional(),
  gearRatioDen: z.number().optional(),
  motorModel: z.string().optional(),
  motorVendor: z.string().optional(),
  driveModel: z.string().optional(),
}).catchall(z.any());

export type GroupParameters = z.infer<typeof GroupParametersSchema>;
export type AxisParameters = z.infer<typeof AxisParametersSchema>;

export interface TreeNode {
  id: string;
  label: string;
  icon: 'group' | 'axis' | 'component' | 'drive';
  type: NodeType;
  children?: TreeNode[];
  expanded?: boolean;
  parameters?: any; // We can type this strictly later, but for now allow any
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
