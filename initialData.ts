
import { TreeNode } from './types';

export const initialData: TreeNode[] = [
  {
    id: "root",
    label: "Power Group",
    icon: "group",
    type: "group",
    expanded: true,
    parameters: {
      cycleTime: "10",
      configuration: "Multi-Axis",
      supplyVoltage: "400",
      supplyPhase: "3",
      nominalBusVoltage: "540",
      infeedPeakPower: "0",
      targetBusVoltage: "0"
    },
    children: [
      { 
        id: "axis_1", 
        label: "Axis 1", 
        icon: "axis",
        type: "axis",
        expanded: true,
        parameters: {
          axisName: "Axis 1",
          profileType: "Master/Follower",
          mechanismType: "Conveyor",
          massLoad: "50.0",
          frictionCoeff: "0.15",
          inclineAngle: "0",
          pulleyRadius: "45.0",
          motorVendor: "Siemens",
          motorModel: "1FK7060-2AC71",
          gearRatio: "10.0"
        }
      },
      { 
        id: "axis_2", 
        label: "Axis 2", 
        icon: "axis",
        type: "axis",
        expanded: true,
        parameters: {
          axisName: "Axis 2",
          profileType: "Time Based",
          mechanismType: "Ball Screw",
          massLoad: "120.0",
          screwLead: "10",
          motorVendor: "Siemens",
          motorModel: "1FK7080-2AF71"
        }
      }
    ]
  }
];
