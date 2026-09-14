import React from 'react';
import { Select } from '../Common';
import { TreeNode } from '../../types';

export const RoboticKinematicsForm = ({ params, onUpdate, groupNode }: { params: any, onUpdate: (p: any) => void, groupNode: TreeNode }) => {
  const robotType = params.robotType || 'Scara';
  const jointMapping = params.jointMapping || {};

  const handleRobotTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ robotType: e.target.value, jointMapping: {} });
  };

  const handleMappingChange = (joint: string, axisId: string) => {
    onUpdate({ jointMapping: { ...jointMapping, [joint]: axisId } });
  };

  const axes = groupNode.children?.filter(c => c.type === 'axis') || [];

  const robotConfigs: Record<string, { joints: string[], image: React.ReactNode, desc: string }> = {
    'Scara': {
      joints: ['J1 (Shoulder)', 'J2 (Elbow)', 'J3 (Z-Axis)', 'J4 (Roll)'],
      desc: 'Selective Compliance Assembly Robot Arm. Excellent for fast pick and place.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M50 90 L50 70 L20 40 L60 20 L60 10" /><circle cx="50" cy="70" r="4"/><circle cx="20" cy="40" r="4"/><circle cx="60" cy="20" r="4"/></svg>
    },
    'Delta': {
      joints: ['J1 (Base 1)', 'J2 (Base 2)', 'J3 (Base 3)', 'J4 (Rotary)'],
      desc: 'Parallel robot for very fast top-down picking operations.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M20 20 L50 50 L80 20" /><path d="M50 20 L50 50" /><rect x="40" y="50" width="20" height="5" /></svg>
    },
    'Gantry': {
      joints: ['X-Axis', 'Y-Axis', 'Z-Axis'],
      desc: 'Cartesian coordinate robot operating on a gantry structure.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><rect x="10" y="10" width="80" height="80" /><line x1="10" y1="30" x2="90" y2="30" /><circle cx="50" cy="30" r="4" /></svg>
    },
    'Stewart (Hexapod)': {
      joints: ['Actuator 1', 'Actuator 2', 'Actuator 3', 'Actuator 4', 'Actuator 5', 'Actuator 6'],
      desc: 'Parallel manipulator using 6 prismatic actuators for 6 DOF.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-1 fill-none"><polygon points="30,80 70,80 80,40 20,40" /><line x1="30" y1="80" x2="50" y2="20" /><line x1="70" y1="80" x2="50" y2="20" /></svg>
    },
    'H-Bot': {
      joints: ['Motor A', 'Motor B'],
      desc: 'XY planar robot utilizing a single continuous belt.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><rect x="20" y="20" width="60" height="60" /><line x1="20" y1="50" x2="80" y2="50" /><circle cx="50" cy="50" r="4" /></svg>
    },
    'T-Bot': {
      joints: ['Motor A', 'Motor B'],
      desc: 'CoreXY variant forming a T-shape belt routing.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M20 20 L80 20 L50 80 Z" /></svg>
    },
    'Cartesian 2D': {
      joints: ['X-Axis', 'Y-Axis'],
      desc: 'Simple 2-axis linear system (XY or XZ).',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><line x1="20" y1="80" x2="80" y2="80" /><line x1="20" y1="80" x2="20" y2="20" /></svg>
    },
    'Cartesian 3D': {
      joints: ['X-Axis', 'Y-Axis', 'Z-Axis'],
      desc: 'Standard 3-axis linear system.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><line x1="50" y1="50" x2="20" y2="80" /><line x1="50" y1="50" x2="90" y2="50" /><line x1="50" y1="50" x2="50" y2="10" /></svg>
    },
    'Articulated (6 DOF)': {
      joints: ['J1 (Base)', 'J2 (Shoulder)', 'J3 (Elbow)', 'J4 (Pitch)', 'J5 (Yaw)', 'J6 (Roll)'],
      desc: 'Standard 6-axis industrial robot arm.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M50 90 L50 70 L30 40 L60 20 L80 20" /><circle cx="50" cy="70" r="4"/><circle cx="30" cy="40" r="4"/><circle cx="60" cy="20" r="4"/></svg>
    },
    'Cylindrical': {
      joints: ['J1 (Rotary Base)', 'J2 (Z-Lift)', 'J3 (Radial Extend)'],
      desc: 'Robot operating in cylindrical coordinates.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><ellipse cx="50" cy="80" rx="30" ry="10" /><line x1="50" y1="80" x2="50" y2="20" /><line x1="50" y1="40" x2="90" y2="40" /></svg>
    },
    'Spherical': {
      joints: ['J1 (Polar)', 'J2 (Elevation)', 'J3 (Radial)'],
      desc: 'Robot operating in spherical coordinates.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M50 90 L50 70 L80 40" /><circle cx="50" cy="70" r="4"/></svg>
    }
  };

  const config = robotConfigs[robotType];

  return (
    <div className="flex space-x-6 h-full p-4">
      <div className="w-1/2 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Kinematics Configuration</h3>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Robot Type</label>
          <Select 
            value={robotType} 
            onChange={handleRobotTypeChange} 
            options={Object.keys(robotConfigs)} 
          />
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-200 text-sm text-blue-800 rounded">
          {config.desc}
        </div>

        <div className="mt-4 border border-gray-200 rounded p-4 flex justify-center items-center bg-white" style={{ height: '250px' }}>
          <div className="w-48 h-48">
            {config.image}
          </div>
        </div>
      </div>

      <div className="w-1/2">
        <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mb-4">Joint to Axis Mapping</h3>
        <p className="text-xs text-gray-500 mb-4">
          Assign a physical axis from this group to each mechanical joint of the selected robot.
        </p>

        {axes.length === 0 ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm">
            There are no axes in this group. Add axes to map them to robot joints.
          </div>
        ) : (
          <div className="space-y-3 bg-white p-4 border border-gray-200 rounded">
            {config.joints.map((joint, idx) => {
              // Create a list of axes that are either currently assigned to THIS joint, or not assigned to ANY joint.
              const assignedAxisIds = Object.values(jointMapping).filter(Boolean);
              const availableAxes = axes.filter(axis => 
                !assignedAxisIds.includes(axis.id) || jointMapping[joint] === axis.id
              );

              return (
                <div key={idx} className="flex items-center space-x-4">
                  <div className="w-1/3 text-sm font-medium text-gray-700 text-right">{joint}</div>
                  <div className="w-2/3">
                    <select 
                      className="w-full border border-gray-300 rounded p-1 text-sm bg-white"
                      value={jointMapping[joint] || ''}
                      onChange={(e) => handleMappingChange(joint, e.target.value)}
                    >
                      <option value="">-- Unassigned --</option>
                      {availableAxes.map(axis => (
                        <option key={axis.id} value={axis.id}>{axis.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
