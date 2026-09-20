import { TreeNode } from './types';

export const initialData: TreeNode[] = [
  {
    id: "root",
    label: "Power Group 1",
    icon: "group",
    type: "group",
    expanded: true,
    parameters: {
      projectTitle: "Industrial 2-Axis Motion System",
      projectAuthor: "Lead Motion Engineer",
      projectCompany: "Advanced Automation Technologies",
      projectDate: new Date().toISOString().split('T')[0],
      projectNotes: "Master-Slave Cartesian Synchronization.\nAxis 1 operates as linear pick-and-place conveyor.\nAxis 2 operates as rotary indexing table.",
      cycleTime: 8,
      configuration: "Multi-Axis",
      supplyVoltage: 400,
      supplyPhase: 3,
      nominalBusVoltage: 540,
      infeedPeakPower: 12.5,
      targetBusVoltage: 560
    },
    children: [
      { 
        id: "axis_1", 
        label: "Axis 1 (Feed Conveyor)", 
        icon: "axis",
        type: "axis",
        expanded: true,
        parameters: {
          axisName: "Axis 1 (Feed Conveyor)",
          axisUsage: "Linear",
          feedConstant: 100, // 100 mm per rev
          profileType: "Time Based",
          mechanismType: "Belt",
          driverDiameter: 31.83, // mm (pi * D = 100mm)
          massLoad: 35.0,
          beltMass: 2.5,
          frictionCoeff: 0.12,
          inclineAngle: 0,
          gearboxVendor: "Wittenstein",
          gearboxModel: "LP+ 070 (i=5)",
          gearboxRatio: 5,
          gearboxEfficiency: 97,
          gearboxInertia: 0.28,
          gearboxBacklash: 8,
          gearboxMaxInputSpeed: 6000,
          motorVendor: "Siemens",
          motorModel: "1FK7060-2AC71",
          ratedSpeed: 3000,
          peakSpeed: 6000,
          ratedTorque: 6.0,
          peakTorque: 18.0,
          ratedPower: 1.88,
          ratedCurrent: 4.2,
          motorEfficiency: 93.0,
          powerFactor: 0.92,
          motorInertia: 3.4,
          allowableInertiaRatio: 10,
          driveVendor: "Siemens",
          driveModel: "S120-Booksize-5A",
          driveSupplyVoltage: 400,
          driveMaxCurrent: 10.0,
          pwmFrequency: 8,
          motionProfileData: JSON.stringify([
            { id: "1", type: "S-Curve", duration: 1.2, distance: 300, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "distance" },
            { id: "2", type: "Dwell/Traverse", duration: 0.8, distance: 0, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "duration" },
            { id: "3", type: "Trapezoid", duration: 1.2, distance: -300, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "distance" },
            { id: "4", type: "Dwell/Traverse", duration: 0.8, distance: 0, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "duration" }
          ])
        }
      },
      { 
        id: "axis_2", 
        label: "Axis 2 (Index Table)", 
        icon: "axis",
        type: "axis",
        expanded: true,
        parameters: {
          axisName: "Axis 2 (Index Table)",
          axisUsage: "Rotary",
          feedConstant: 360,
          cycleMin: 0,
          cycleMax: 360,
          profileType: "Time Based",
          mechanismType: "Rotation Table",
          rotatingInertia: 85.0,
          frictionCoeff: 0.08,
          gearboxVendor: "Neugart",
          gearboxModel: "PLE080 (i=10)",
          gearboxRatio: 10,
          gearboxEfficiency: 96,
          gearboxInertia: 0.42,
          gearboxBacklash: 8,
          gearboxMaxInputSpeed: 5000,
          motorVendor: "Siemens",
          motorModel: "1FK7080-2AF71",
          ratedSpeed: 3000,
          peakSpeed: 6000,
          ratedTorque: 12.0,
          peakTorque: 36.0,
          ratedPower: 3.5,
          ratedCurrent: 7.8,
          motorEfficiency: 94.5,
          powerFactor: 0.94,
          motorInertia: 6.2,
          allowableInertiaRatio: 8,
          driveVendor: "Siemens",
          driveModel: "S120-Booksize-9A",
          driveSupplyVoltage: 400,
          driveMaxCurrent: 18.0,
          pwmFrequency: 8,
          motionProfileData: JSON.stringify([
            { id: "1", type: "S-Curve", duration: 0.8, distance: 90, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "distance" },
            { id: "2", type: "Dwell/Traverse", duration: 1.2, distance: 0, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "duration" },
            { id: "3", type: "S-Curve", duration: 0.8, distance: 90, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "distance" },
            { id: "4", type: "Dwell/Traverse", duration: 1.2, distance: 0, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: "duration" }
          ])
        }
      }
    ]
  }
];
