import { MotorSpec, DriveSpec, GearboxSpec } from './types';

export const defaultMotorCatalog: MotorSpec[] = [
  // YASKAWA SGM7A (High speed / low inertia)
  { vendor: "Yaskawa", model: "SGM7A-04D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 1.27, peakTorque: 3.82, ratedPower: 0.4, ratedCurrent: 2.8, efficiency: 90.0, powerFactor: 0.90, inertia: 0.26, allowableInertiaRatio: 15, costIndex: 0.75 },
  { vendor: "Yaskawa", model: "SGM7A-08D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 2.39, peakTorque: 7.16, ratedPower: 0.75, ratedCurrent: 4.8, efficiency: 91.0, powerFactor: 0.92, inertia: 0.67, allowableInertiaRatio: 15, costIndex: 0.85 },
  { vendor: "Yaskawa", model: "SGM7A-15D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 4.77, peakTorque: 14.3, ratedPower: 1.5, ratedCurrent: 8.9, efficiency: 91.5, powerFactor: 0.93, inertia: 2.38, allowableInertiaRatio: 10, costIndex: 0.95 },
  { vendor: "Yaskawa", model: "SGM7A-25D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 7.96, peakTorque: 23.9, ratedPower: 2.5, ratedCurrent: 14.2, efficiency: 92.0, powerFactor: 0.95, inertia: 12.4, allowableInertiaRatio: 10, costIndex: 1.06 },
  { vendor: "Yaskawa", model: "SGM7A-30D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 9.80, peakTorque: 29.4, ratedPower: 3.0, ratedCurrent: 18.2, efficiency: 92.5, powerFactor: 0.95, inertia: 15.6, allowableInertiaRatio: 5, costIndex: 1.28 },
  { vendor: "Yaskawa", model: "SGM7A-40D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 12.6, peakTorque: 37.8, ratedPower: 4.0, ratedCurrent: 24.5, efficiency: 93.0, powerFactor: 0.95, inertia: 21.2, allowableInertiaRatio: 5, costIndex: 1.33 },
  { vendor: "Yaskawa", model: "SGM7A-50D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 15.8, peakTorque: 47.6, ratedPower: 5.0, ratedCurrent: 30.1, efficiency: 93.5, powerFactor: 0.95, inertia: 28.5, allowableInertiaRatio: 5, costIndex: 1.53 },
  { vendor: "Yaskawa", model: "SGM7A-70D*F", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 22.3, peakTorque: 54.0, ratedPower: 7.0, ratedCurrent: 38.0, efficiency: 94.0, powerFactor: 0.95, inertia: 42.0, allowableInertiaRatio: 15, costIndex: 2.07 },
  
  // YASKAWA SGM7G (Medium inertia)
  { vendor: "Yaskawa", model: "SGM7G-13D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 8.34, peakTorque: 23.3, ratedPower: 1.3, ratedCurrent: 10.8, efficiency: 91.5, powerFactor: 0.94, inertia: 14.5, allowableInertiaRatio: 5, costIndex: 1.00 },
  { vendor: "Yaskawa", model: "SGM7G-20D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 11.5, peakTorque: 28.7, ratedPower: 2.0, ratedCurrent: 14.5, efficiency: 92.0, powerFactor: 0.94, inertia: 22.1, allowableInertiaRatio: 5, costIndex: 1.06 },
  { vendor: "Yaskawa", model: "SGM7G-30D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 18.6, peakTorque: 45.1, ratedPower: 3.0, ratedCurrent: 21.2, efficiency: 92.5, powerFactor: 0.94, inertia: 34.5, allowableInertiaRatio: 5, costIndex: 1.23 },
  { vendor: "Yaskawa", model: "SGM7G-44D*F", ratedSpeed: 1500, peakSpeed: 3000, ratedTorque: 28.4, peakTorque: 71.1, ratedPower: 4.4, ratedCurrent: 32.4, efficiency: 93.0, powerFactor: 0.94, inertia: 58.2, allowableInertiaRatio: 5, costIndex: 1.47 },
  
  // SIEMENS 1FK7 (Synchronous Servomotors)
  { vendor: "Siemens", model: "1FK7032-2AK71", ratedSpeed: 6000, peakSpeed: 8000, ratedTorque: 0.85, peakTorque: 3.4, ratedPower: 0.53, ratedCurrent: 1.5, efficiency: 89.0, powerFactor: 0.91, inertia: 0.45, allowableInertiaRatio: 10, costIndex: 0.82 },
  { vendor: "Siemens", model: "1FK7042-2AK71", ratedSpeed: 6000, peakSpeed: 8000, ratedTorque: 2.6, peakTorque: 10.5, ratedPower: 1.63, ratedCurrent: 3.6, efficiency: 91.0, powerFactor: 0.92, inertia: 1.56, allowableInertiaRatio: 10, costIndex: 0.98 },
  { vendor: "Siemens", model: "1FK7060-2AC71", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 6.0, peakTorque: 18.0, ratedPower: 1.88, ratedCurrent: 4.2, efficiency: 93.0, powerFactor: 0.92, inertia: 3.4, allowableInertiaRatio: 10, costIndex: 1.15 },
  { vendor: "Siemens", model: "1FK7063-2AC71", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 9.1, peakTorque: 27.0, ratedPower: 2.86, ratedCurrent: 6.1, efficiency: 93.5, powerFactor: 0.93, inertia: 5.4, allowableInertiaRatio: 8, costIndex: 1.30 },
  { vendor: "Siemens", model: "1FK7080-2AF71", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 12.0, peakTorque: 36.0, ratedPower: 3.5, ratedCurrent: 7.8, efficiency: 94.5, powerFactor: 0.94, inertia: 6.2, allowableInertiaRatio: 8, costIndex: 1.45 },
  { vendor: "Siemens", model: "1FK7083-2AF71", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 16.0, peakTorque: 50.0, ratedPower: 5.0, ratedCurrent: 10.5, efficiency: 94.8, powerFactor: 0.94, inertia: 11.2, allowableInertiaRatio: 6, costIndex: 1.70 },
  { vendor: "Siemens", model: "1FK7101-2AF71", ratedSpeed: 3000, peakSpeed: 5000, ratedTorque: 27.0, peakTorque: 80.0, ratedPower: 8.5, ratedCurrent: 17.5, efficiency: 95.0, powerFactor: 0.95, inertia: 22.0, allowableInertiaRatio: 5, costIndex: 2.15 },

  // BECKHOFF AM8000
  { vendor: "Beckhoff", model: "AM8032-0E20", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 2.37, peakTorque: 9.8, ratedPower: 0.74, ratedCurrent: 2.2, efficiency: 91.0, powerFactor: 0.92, inertia: 1.05, allowableInertiaRatio: 10, costIndex: 0.90 },
  { vendor: "Beckhoff", model: "AM8042-0F20", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 5.5, peakTorque: 22.0, ratedPower: 1.73, ratedCurrent: 4.8, efficiency: 92.5, powerFactor: 0.93, inertia: 3.12, allowableInertiaRatio: 8, costIndex: 1.10 },
  { vendor: "Beckhoff", model: "AM8052-0H20", ratedSpeed: 3000, peakSpeed: 5000, ratedTorque: 10.5, peakTorque: 42.0, ratedPower: 3.3, ratedCurrent: 8.5, efficiency: 93.5, powerFactor: 0.94, inertia: 8.50, allowableInertiaRatio: 6, costIndex: 1.40 },

  // SEW-EURODRIVE CMP
  { vendor: "SEW-Eurodrive", model: "CMP50S", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 2.4, peakTorque: 9.6, ratedPower: 0.75, ratedCurrent: 2.3, efficiency: 91.0, powerFactor: 0.91, inertia: 0.74, allowableInertiaRatio: 10, costIndex: 0.92 },
  { vendor: "SEW-Eurodrive", model: "CMP63M", ratedSpeed: 3000, peakSpeed: 6000, ratedTorque: 5.3, peakTorque: 21.4, ratedPower: 1.66, ratedCurrent: 4.6, efficiency: 92.0, powerFactor: 0.93, inertia: 2.76, allowableInertiaRatio: 8, costIndex: 1.12 },
  { vendor: "SEW-Eurodrive", model: "CMP71L", ratedSpeed: 3000, peakSpeed: 4500, ratedTorque: 13.1, peakTorque: 52.4, ratedPower: 4.1, ratedCurrent: 10.2, efficiency: 93.8, powerFactor: 0.94, inertia: 9.20, allowableInertiaRatio: 6, costIndex: 1.55 }
];

export const defaultDriveCatalog: DriveSpec[] = [
  // Siemens Sinamics S120
  { vendor: "Siemens", model: "S120-Booksize-3A", supplyVoltage: 400, maxCurrent: 6.0, pwmFrequency: 8 },
  { vendor: "Siemens", model: "S120-Booksize-5A", supplyVoltage: 400, maxCurrent: 10.0, pwmFrequency: 8 },
  { vendor: "Siemens", model: "S120-Booksize-9A", supplyVoltage: 400, maxCurrent: 18.0, pwmFrequency: 8 },
  { vendor: "Siemens", model: "S120-Booksize-18A", supplyVoltage: 400, maxCurrent: 36.0, pwmFrequency: 8 },
  { vendor: "Siemens", model: "S120-Booksize-30A", supplyVoltage: 400, maxCurrent: 60.0, pwmFrequency: 8 },

  // Yaskawa Servopack SGD7S
  { vendor: "Yaskawa", model: "SGD7S-1R6A", supplyVoltage: 200, maxCurrent: 3.5, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-2R8A", supplyVoltage: 200, maxCurrent: 6.0, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-5R5A", supplyVoltage: 200, maxCurrent: 11.5, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-120A", supplyVoltage: 400, maxCurrent: 24.0, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-200A", supplyVoltage: 400, maxCurrent: 40.0, pwmFrequency: 8 },
  { vendor: "Yaskawa", model: "SGD7S-330A", supplyVoltage: 400, maxCurrent: 65.0, pwmFrequency: 8 },

  // Beckhoff AX5000
  { vendor: "Beckhoff", model: "AX5103-0000", supplyVoltage: 400, maxCurrent: 6.0, pwmFrequency: 8 },
  { vendor: "Beckhoff", model: "AX5106-0000", supplyVoltage: 400, maxCurrent: 12.0, pwmFrequency: 8 },
  { vendor: "Beckhoff", model: "AX5112-0000", supplyVoltage: 400, maxCurrent: 24.0, pwmFrequency: 8 },
  { vendor: "Beckhoff", model: "AX5125-0000", supplyVoltage: 400, maxCurrent: 50.0, pwmFrequency: 8 },

  // SEW Movidrive MDX61B
  { vendor: "SEW-Eurodrive", model: "MDX61B0005-5A3", supplyVoltage: 400, maxCurrent: 4.0, pwmFrequency: 8 },
  { vendor: "SEW-Eurodrive", model: "MDX61B0015-5A3", supplyVoltage: 400, maxCurrent: 8.0, pwmFrequency: 8 },
  { vendor: "SEW-Eurodrive", model: "MDX61B0040-5A3", supplyVoltage: 400, maxCurrent: 19.0, pwmFrequency: 8 },
  { vendor: "SEW-Eurodrive", model: "MDX61B0075-5A3", supplyVoltage: 400, maxCurrent: 32.0, pwmFrequency: 8 }
];

export const defaultGearboxCatalog: GearboxSpec[] = [
  // Direct Coupling (1:1)
  { vendor: "Direct Drive", model: "Direct Coupling 1:1", ratio: 1, efficiency: 100, inertia: 0.05, backlash: 0, maxInputSpeed: 8000 },

  // Wittenstein Alpha LP+
  { vendor: "Wittenstein", model: "LP+ 070 (i=3)", ratio: 3, efficiency: 97, inertia: 0.35, backlash: 8, maxInputSpeed: 6000 },
  { vendor: "Wittenstein", model: "LP+ 070 (i=5)", ratio: 5, efficiency: 97, inertia: 0.28, backlash: 8, maxInputSpeed: 6000 },
  { vendor: "Wittenstein", model: "LP+ 070 (i=10)", ratio: 10, efficiency: 97, inertia: 0.22, backlash: 8, maxInputSpeed: 6000 },
  { vendor: "Wittenstein", model: "LP+ 090 (i=5)", ratio: 5, efficiency: 97, inertia: 0.85, backlash: 7, maxInputSpeed: 5000 },
  { vendor: "Wittenstein", model: "LP+ 090 (i=10)", ratio: 10, efficiency: 97, inertia: 0.65, backlash: 7, maxInputSpeed: 5000 },
  { vendor: "Wittenstein", model: "LP+ 090 (i=25)", ratio: 25, efficiency: 94, inertia: 0.45, backlash: 10, maxInputSpeed: 5000 },
  { vendor: "Wittenstein", model: "LP+ 120 (i=10)", ratio: 10, efficiency: 97, inertia: 2.10, backlash: 6, maxInputSpeed: 4500 },
  { vendor: "Wittenstein", model: "LP+ 120 (i=20)", ratio: 20, efficiency: 94, inertia: 1.65, backlash: 9, maxInputSpeed: 4500 },

  // Neugart PLE
  { vendor: "Neugart", model: "PLE060 (i=3)", ratio: 3, efficiency: 96, inertia: 0.22, backlash: 10, maxInputSpeed: 6000 },
  { vendor: "Neugart", model: "PLE060 (i=5)", ratio: 5, efficiency: 96, inertia: 0.16, backlash: 10, maxInputSpeed: 6000 },
  { vendor: "Neugart", model: "PLE060 (i=10)", ratio: 10, efficiency: 96, inertia: 0.12, backlash: 10, maxInputSpeed: 6000 },
  { vendor: "Neugart", model: "PLE080 (i=5)", ratio: 5, efficiency: 96, inertia: 0.55, backlash: 8, maxInputSpeed: 5000 },
  { vendor: "Neugart", model: "PLE080 (i=10)", ratio: 10, efficiency: 96, inertia: 0.42, backlash: 8, maxInputSpeed: 5000 },
  { vendor: "Neugart", model: "PLE080 (i=20)", ratio: 20, efficiency: 94, inertia: 0.35, backlash: 12, maxInputSpeed: 5000 },
  { vendor: "Neugart", model: "PLE120 (i=10)", ratio: 10, efficiency: 96, inertia: 1.80, backlash: 7, maxInputSpeed: 4000 },

  // Apex Dynamics AB
  { vendor: "Apex Dynamics", model: "AB060 (i=5)", ratio: 5, efficiency: 97, inertia: 0.18, backlash: 5, maxInputSpeed: 6000 },
  { vendor: "Apex Dynamics", model: "AB060 (i=10)", ratio: 10, efficiency: 97, inertia: 0.14, backlash: 5, maxInputSpeed: 6000 },
  { vendor: "Apex Dynamics", model: "AB090 (i=5)", ratio: 5, efficiency: 97, inertia: 0.62, backlash: 5, maxInputSpeed: 5000 },
  { vendor: "Apex Dynamics", model: "AB090 (i=10)", ratio: 10, efficiency: 97, inertia: 0.48, backlash: 5, maxInputSpeed: 5000 },
  { vendor: "Apex Dynamics", model: "AB090 (i=25)", ratio: 25, efficiency: 94, inertia: 0.38, backlash: 7, maxInputSpeed: 5000 },

  // SEW-Eurodrive PSF
  { vendor: "SEW-Eurodrive", model: "PSF321 (i=5)", ratio: 5, efficiency: 97, inertia: 0.30, backlash: 6, maxInputSpeed: 6000 },
  { vendor: "SEW-Eurodrive", model: "PSF321 (i=10)", ratio: 10, efficiency: 97, inertia: 0.24, backlash: 6, maxInputSpeed: 6000 },
  { vendor: "SEW-Eurodrive", model: "PSF521 (i=10)", ratio: 10, efficiency: 97, inertia: 0.72, backlash: 5, maxInputSpeed: 5000 },
  { vendor: "SEW-Eurodrive", model: "PSF521 (i=20)", ratio: 20, efficiency: 94, inertia: 0.55, backlash: 8, maxInputSpeed: 5000 },

  // Generic
  { vendor: "Generic", model: "G-10-1", ratio: 10, efficiency: 95, inertia: 0.5, backlash: 5, maxInputSpeed: 4000 }
];

export const gearboxCatalog: GearboxSpec[] = defaultGearboxCatalog;

export function getMotorCatalog(): MotorSpec[] {
  try {
    const custom = localStorage.getItem('custom-motors');
    const customMotors: MotorSpec[] = custom ? JSON.parse(custom) : [];
    return [...defaultMotorCatalog, ...customMotors];
  } catch {
    return defaultMotorCatalog;
  }
}

export function getDriveCatalog(): DriveSpec[] {
  try {
    const custom = localStorage.getItem('custom-drives');
    const customDrives: DriveSpec[] = custom ? JSON.parse(custom) : [];
    return [...defaultDriveCatalog, ...customDrives];
  } catch {
    return defaultDriveCatalog;
  }
}

export function getGearboxCatalog(): GearboxSpec[] {
  try {
    const custom = localStorage.getItem('custom-gearboxes');
    const customGearboxes: GearboxSpec[] = custom ? JSON.parse(custom) : [];
    return [...defaultGearboxCatalog, ...customGearboxes];
  } catch {
    return defaultGearboxCatalog;
  }
}

export function addCustomMotor(motor: MotorSpec) {
  try {
    const custom = localStorage.getItem('custom-motors');
    const customMotors: MotorSpec[] = custom ? JSON.parse(custom) : [];
    customMotors.push(motor);
    localStorage.setItem('custom-motors', JSON.stringify(customMotors));
  } catch (e) {
    console.error('Failed to save custom motor', e);
  }
}

export function addCustomDrive(drive: DriveSpec) {
  try {
    const custom = localStorage.getItem('custom-drives');
    const customDrives: DriveSpec[] = custom ? JSON.parse(custom) : [];
    customDrives.push(drive);
    localStorage.setItem('custom-drives', JSON.stringify(customDrives));
  } catch (e) {
    console.error('Failed to save custom drive', e);
  }
}

export function addCustomGearbox(gb: GearboxSpec) {
  try {
    const custom = localStorage.getItem('custom-gearboxes');
    const customGearboxes: GearboxSpec[] = custom ? JSON.parse(custom) : [];
    customGearboxes.push(gb);
    localStorage.setItem('custom-gearboxes', JSON.stringify(customGearboxes));
  } catch (e) {
    console.error('Failed to save custom gearbox', e);
  }
}
