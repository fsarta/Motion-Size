import { MotorSpec, DriveSpec, GearboxSpec } from './types';

export const motorCatalog: MotorSpec[] = [
  // SIEMENS
  { vendor: "Siemens", model: "1FK7060-2AC71", ratedSpeed: 3000, ratedTorque: 6.0, ratedPower: 1.88, ratedCurrent: 4.2, efficiency: 93.0, powerFactor: 0.92, inertia: 3.4 },
  { vendor: "Siemens", model: "1FK7080-2AF71", ratedSpeed: 3000, ratedTorque: 12.0, ratedPower: 3.5, ratedCurrent: 7.8, efficiency: 94.5, powerFactor: 0.94, inertia: 6.2 },
  { vendor: "Siemens", model: "1FK7101-5AF71", ratedSpeed: 2000, ratedTorque: 22.0, ratedPower: 4.8, ratedCurrent: 11.0, efficiency: 95.0, powerFactor: 0.93, inertia: 18.0 },
  
  // BOSCH REXROTH
  { vendor: "Bosch Rexroth", model: "MSK050C-0600", ratedSpeed: 4500, ratedTorque: 5.0, ratedPower: 1.5, ratedCurrent: 3.8, efficiency: 91.0, powerFactor: 0.90, inertia: 2.8 },
  { vendor: "Bosch Rexroth", model: "MSK071D-0300", ratedSpeed: 3000, ratedTorque: 10.5, ratedPower: 3.2, ratedCurrent: 8.5, efficiency: 93.5, powerFactor: 0.92, inertia: 9.1 },

  // ROCKWELL AUTOMATION
  { vendor: "Rockwell", model: "VPL-B1003T", ratedSpeed: 3000, ratedTorque: 7.2, ratedPower: 2.1, ratedCurrent: 4.9, efficiency: 92.0, powerFactor: 0.91, inertia: 4.1 },
  { vendor: "Rockwell", model: "VPL-B1153F", ratedSpeed: 3500, ratedTorque: 13.5, ratedPower: 4.0, ratedCurrent: 8.2, efficiency: 94.0, powerFactor: 0.93, inertia: 7.5 },
  
  // YASKAWA
  { vendor: "Yaskawa", model: "SGM7J-08A", ratedSpeed: 3000, ratedTorque: 2.39, ratedPower: 0.75, ratedCurrent: 4.4, efficiency: 89.0, powerFactor: 0.95, inertia: 1.2 },
  { vendor: "Yaskawa", model: "SGM7G-13A", ratedSpeed: 1500, ratedTorque: 8.34, ratedPower: 1.3, ratedCurrent: 10.8, efficiency: 91.5, powerFactor: 0.94, inertia: 14.5 }
];

export const driveCatalog: DriveSpec[] = [
  // SIEMENS
  { vendor: "Siemens", model: "S120-3A-400V-9A", supplyVoltage: 400, maxCurrent: 9.0, pwmFrequency: 8 },
  { vendor: "Siemens", model: "S120-3A-400V-18A", supplyVoltage: 400, maxCurrent: 18.0, pwmFrequency: 8 },
  { vendor: "Siemens", model: "S120-3A-400V-30A", supplyVoltage: 400, maxCurrent: 30.0, pwmFrequency: 4 },

  // BOSCH REXROTH
  { vendor: "Bosch Rexroth", model: "HCS01.1E-W0018", supplyVoltage: 400, maxCurrent: 18.0, pwmFrequency: 8 },
  { vendor: "Bosch Rexroth", model: "HCS01.1E-W0054", supplyVoltage: 400, maxCurrent: 54.0, pwmFrequency: 4 },

  // ROCKWELL
  { vendor: "Rockwell", model: "2198-H025-ERS", supplyVoltage: 480, maxCurrent: 8.0, pwmFrequency: 4 },
  { vendor: "Rockwell", model: "2198-H070-ERS", supplyVoltage: 480, maxCurrent: 22.0, pwmFrequency: 4 },
  
  // GENERIC
  { vendor: "Generic", model: "Drive-X", supplyVoltage: 230, maxCurrent: 5.0, pwmFrequency: 8 }
];

export const gearboxCatalog: GearboxSpec[] = [
  { vendor: "Generic", model: "G-10-1", ratio: 10, efficiency: 95, inertia: 0.5, backlash: 5, maxInputSpeed: 4000 },
  { vendor: "Stober", model: "P321-10", ratio: 10, efficiency: 96, inertia: 0.6, backlash: 3, maxInputSpeed: 6000 },
  { vendor: "Stober", model: "P321-5", ratio: 5, efficiency: 97, inertia: 0.4, backlash: 3, maxInputSpeed: 6000 },
  { vendor: "Wittenstein", model: "CP060-10", ratio: 10, efficiency: 95, inertia: 0.3, backlash: 8, maxInputSpeed: 5000 },
  { vendor: "Neugart", model: "PLE60-10", ratio: 10, efficiency: 96, inertia: 0.25, backlash: 6, maxInputSpeed: 5500 }
];
