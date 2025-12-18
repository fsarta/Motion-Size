
import { MotorSpec, DriveSpec, GearboxSpec } from './types';

export const motorCatalog: MotorSpec[] = [
  // YASKAWA (Matching image exactly)
  { vendor: "Yaskawa", model: "SGM7A-25D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 7.96, peakTorque: 23.9, ratedPower: 2.5, ratedCurrent: 14.2, efficiency: 92.0, powerFactor: 0.95, inertia: 12.4, allowableInertiaRatio: 10, costIndex: 1.06 },
  { vendor: "Yaskawa", model: "SGM7A-30D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 9.80, peakTorque: 29.4, ratedPower: 3.0, ratedCurrent: 18.2, efficiency: 92.5, powerFactor: 0.95, inertia: 15.6, allowableInertiaRatio: 5, costIndex: 1.28 },
  { vendor: "Yaskawa", model: "SGM7A-40D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 12.6, peakTorque: 37.8, ratedPower: 4.0, ratedCurrent: 24.5, efficiency: 93.0, powerFactor: 0.95, inertia: 21.2, allowableInertiaRatio: 5, costIndex: 1.33 },
  { vendor: "Yaskawa", model: "SGM7A-50D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 15.8, peakTorque: 47.6, ratedPower: 5.0, ratedCurrent: 30.1, efficiency: 93.5, powerFactor: 0.95, inertia: 28.5, allowableInertiaRatio: 5, costIndex: 1.53 },
  { vendor: "Yaskawa", model: "SGM7A-70D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 22.3, peakTorque: 54.0, ratedPower: 7.0, ratedCurrent: 38.0, efficiency: 94.0, powerFactor: 0.95, inertia: 42.0, allowableInertiaRatio: 15, costIndex: 2.07 },
  { vendor: "Yaskawa", model: "SGM7G-13D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 8.34, peakTorque: 23.3, ratedPower: 1.3, ratedCurrent: 10.8, efficiency: 91.5, powerFactor: 0.94, inertia: 14.5, allowableInertiaRatio: 5, costIndex: 1.00 },
  { vendor: "Yaskawa", model: "SGM7G-20D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 11.5, peakTorque: 28.7, ratedPower: 2.0, ratedCurrent: 14.5, efficiency: 92.0, powerFactor: 0.94, inertia: 22.1, allowableInertiaRatio: 5, costIndex: 1.06 },
  { vendor: "Yaskawa", model: "SGM7G-30D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 18.6, peakTorque: 45.1, ratedPower: 3.0, ratedCurrent: 21.2, efficiency: 92.5, powerFactor: 0.94, inertia: 34.5, allowableInertiaRatio: 5, costIndex: 1.23 },
  { vendor: "Yaskawa", model: "SGM7G-44D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 28.4, peakTorque: 71.1, ratedPower: 4.4, ratedCurrent: 32.4, efficiency: 93.0, powerFactor: 0.94, inertia: 58.2, allowableInertiaRatio: 5, costIndex: 1.47 },
  
  // SIEMENS
  { vendor: "Siemens", model: "1FK7060-2AC71", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 6.0, peakTorque: 18.0, ratedPower: 1.88, ratedCurrent: 4.2, efficiency: 93.0, powerFactor: 0.92, inertia: 3.4, allowableInertiaRatio: 10, costIndex: 1.15 },
  { vendor: "Siemens", model: "1FK7080-2AF71", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 12.0, peakTorque: 36.0, ratedPower: 3.5, ratedCurrent: 7.8, efficiency: 94.5, powerFactor: 0.94, inertia: 6.2, allowableInertiaRatio: 8, costIndex: 1.45 }
];

export const driveCatalog: DriveSpec[] = [
  { vendor: "Siemens", model: "S120-3A-400V-18A", supplyVoltage: 400, maxCurrent: 18.0, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-200A", supplyVoltage: 200, maxCurrent: 20.0, pwmFrequency: 8 }
];

export const gearboxCatalog: GearboxSpec[] = [
  { vendor: "Generic", model: "G-10-1", ratio: 10, efficiency: 95, inertia: 0.5, backlash: 5, maxInputSpeed: 4000 }
];
