export type NodeType = 'group' | 'axis' | 'mechanism' | 'gearbox' | 'motor_drive';

export interface TreeNode {
  id: string;
  label: string;
  icon: 'group' | 'axis' | 'component' | 'drive';
  type: NodeType;
  children?: TreeNode[];
  expanded?: boolean;
  parameters?: Record<string, string | number | boolean>;
}

export interface CamTable {
  id: string;
  name: string;
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
  ratedTorque: number; // Nm
  ratedPower: number; // kW
  ratedCurrent: number; // Arms
  efficiency: number; // %
  powerFactor: number;
  inertia: number; // kg cm^2
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