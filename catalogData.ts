
import { MotorSpec, DriveSpec, GearboxSpec } from './types';

export const motorCatalog: MotorSpec[] = [
  // YASKAWA (Matching image)
  { vendor: "Yaskawa", model: "SGM7A-25D*F", ratedSpeed: 3000, ratedTorque: 7.96, ratedPower: 2.5, ratedCurrent: 14.2, efficiency: 92.0, powerFactor: 0.95, inertia: 12.4 },
  { vendor: "Yaskawa", model: "SGM7A-30D*F", ratedSpeed: 3000, ratedTorque: 9.80, ratedPower: 3.0, ratedCurrent: 18.2, efficiency: 92.5, powerFactor: 0.95, inertia: 15.6 },
  { vendor: "Yaskawa", model: "SGM7A-40D*F", ratedSpeed: 3000, ratedTorque: 12.6, ratedPower: 4.0, ratedCurrent: 24.5, efficiency: 93.0, powerFactor: 0.95, inertia: 21.2 },
  { vendor: "Yaskawa", model: "SGM7A-50D*F", ratedSpeed: 3000, ratedTorque: 15.8, ratedPower: 5.0, ratedCurrent: 30.1, efficiency: 93.5, powerFactor: 0.95, inertia: 28.5 },
  { vendor: "Yaskawa", model: "SGM7G-13D*F", ratedSpeed: 1500, ratedTorque: 8.34, ratedPower: 1.3, ratedCurrent: 10.8, efficiency: 91.5, powerFactor: 0.94, inertia: 14.5 },
  { vendor: "Yaskawa", model: "SGM7G-20D*F", ratedSpeed: 1500, ratedTorque: 11.5, ratedPower: 2.0, ratedCurrent: 14.5, efficiency: 92.0, powerFactor: 0.94, inertia: 22.1 },
  { vendor: "Yaskawa", model: "SGM7G-30D*F", ratedSpeed: 1500, ratedTorque: 18.6, ratedPower: 3.0, ratedCurrent: 21.2, efficiency: 92.5, powerFactor: 0.94, inertia: 34.5 },
  { vendor: "Yaskawa", model: "SGM7G-44D*F", ratedSpeed: 1500, ratedTorque: 28.4, ratedPower: 4.4, ratedCurrent: 32.4, efficiency: 93.0, powerFactor: 0.94, inertia: 58.2 },
  
  // SIEMENS
  { vendor: "Siemens", model: "1FK7060-2AC71", ratedSpeed: 3000, ratedTorque: 6.0, ratedPower: 1.88, ratedCurrent: 4.2, efficiency: 93.0, powerFactor: 0.92, inertia: 3.4 },
  { vendor: "Siemens", model: "1FK7080-2AF71", ratedSpeed: 3000, ratedTorque: 12.0, ratedPower: 3.5, ratedCurrent: 7.8, efficiency: 94.5, powerFactor: 0.94, inertia: 6.2 },
  { vendor: "Siemens", model: "1FK7101-5AF71", ratedSpeed: 2000, ratedTorque: 22.0, ratedPower: 4.8, ratedCurrent: 11.0, efficiency: 95.0, powerFactor: 0.93, inertia: 18.0 },
  
  // BOSCH REXROTH
  { vendor: "Bosch Rexroth", model: "MSK050C-0600", ratedSpeed: 4500, ratedTorque: 5.0, ratedPower: 1.5, ratedCurrent: 3.8, efficiency: 91.0, powerFactor: 0.90, inertia: 2.8 },
  { vendor: "Bosch Rexroth", model: "MSK071D-0300", ratedSpeed: 3000, ratedTorque: 10.5, ratedPower: 3.2, ratedCurrent: 8.5, efficiency: 93.5, powerFactor: 0.92, inertia: 9.1 },

  // ROCKWELL AUTOMATION
  { vendor: "Rockwell", model: "VPL-B1003T", ratedSpeed: 3000, ratedTorque: 7.2, ratedPower: 2.1, ratedCurrent: 4.9, efficiency: 92.0, powerFactor: 0.91, inertia: 4.1 },
  { vendor: "Rockwell", model: "VPL-B1153F", ratedSpeed: 3500, ratedTorque: 13.5, ratedPower: 4.0, ratedCurrent: 8.2, efficiency: 94.0, powerFactor: 0.93, inertia: 7.5 }
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
  
  // YASKAWA
  { vendor: "Yaskawa", model: "SGD7S-120A", supplyVoltage: 200, maxCurrent: 12.0, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-200A", supplyVoltage: 200, maxCurrent: 20.0, pwmFrequency: 8 },
  
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
