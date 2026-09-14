import React, { useEffect } from 'react';
import { Select } from '../Common';
import { TreeNode } from '../../types';
import { Plus, X } from 'lucide-react';

interface DynAxis {
  id: string;
  type: 'main' | 'prime' | 'aux';
  logicalJoint: string;
  physicalAxisId: string;
  isFixed?: boolean;
}

const DynamicKinematicsBuilder = ({ params, onUpdate, axes, robotType, currentDof, config }: { params: any, onUpdate: (p: any) => void, axes: TreeNode[], robotType: string, currentDof: number, config: any }) => {
  const configList: DynAxis[] = params.dynamicAxes || [];

  // Initialize or re-initialize dynamicAxes when robot type or DOF changes
  useEffect(() => {
    if (params._lastRobotType !== robotType || params._lastDof !== currentDof) {
      const joints = config.getJoints(currentDof);
      const initialAxes: DynAxis[] = joints.map((j: string) => ({
        id: crypto.randomUUID(),
        type: 'main',
        logicalJoint: j,
        physicalAxisId: '',
        isFixed: true
      }));
      onUpdate({ dynamicAxes: initialAxes, _lastRobotType: robotType, _lastDof: currentDof });
    }
  }, [robotType, currentDof]);

  if (params._lastRobotType !== robotType || params._lastDof !== currentDof) {
    return null; // Wait for useEffect to sync state before rendering
  }

  const updateList = (newList: DynAxis[]) => {
    onUpdate({ dynamicAxes: newList });
  };

  const addAxis = (type: 'main' | 'prime' | 'aux', logicalJoint: string = 'J1 (X)', parentIndex?: number) => {
    const newAxis: DynAxis = {
      id: crypto.randomUUID(),
      type,
      logicalJoint,
      physicalAxisId: '',
      isFixed: false
    };

    if (type === 'prime' && parentIndex !== undefined) {
      const newList = [...configList];
      newList.splice(parentIndex + 1, 0, newAxis);
      updateList(newList);
    } else {
      updateList([...configList, newAxis]);
    }
  };

  const removeAxis = (id: string) => {
    updateList(configList.filter(a => a.id !== id));
  };

  const updateAxis = (id: string, field: keyof DynAxis, value: any) => {
    let newList = [...configList];
    const index = newList.findIndex(a => a.id === id);
    if (index === -1) return;
    
    const oldLogical = newList[index].logicalJoint;
    newList[index] = { ...newList[index], [field]: value };
    
    if (field === 'logicalJoint' && newList[index].type === 'main') {
      for (let i = index + 1; i < newList.length; i++) {
        if (newList[i].type === 'prime' && newList[i].logicalJoint === oldLogical) {
          newList[i] = { ...newList[i], logicalJoint: value };
        } else if (newList[i].type !== 'prime') {
          break;
        }
      }
    }
    
    updateList(newList);
  };

  const getAvailableAxes = (currentId: string) => {
    const assigned = configList.map(a => a.physicalAxisId).filter(Boolean);
    return axes.filter(ax => !assigned.includes(ax.id) || currentId === ax.id);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        {configList.map((ax, idx) => (
          <div key={ax.id} className={`flex items-center space-x-2 ${ax.type === 'prime' ? 'pl-8 border-l-2 border-blue-200' : ''} ${ax.type === 'aux' ? '-mx-2 px-2 py-1.5 bg-gray-50 rounded border border-gray-100' : ''}`}>
            
            <div className="w-32 shrink-0">
              {ax.type === 'prime' ? (
                <div className="text-xs font-bold text-gray-500">{ax.logicalJoint}' (Prime)</div>
              ) : ax.type === 'aux' ? (
                <div className="text-xs font-bold text-gray-500">Auxiliary</div>
              ) : (
                <div className="text-sm font-medium text-gray-700">{ax.logicalJoint}</div>
              )}
            </div>

            <div className="flex-1">
              <select 
                className="w-full border border-gray-300 rounded p-1 text-sm bg-white"
                value={ax.physicalAxisId}
                onChange={(e) => updateAxis(ax.id, 'physicalAxisId', e.target.value)}
              >
                <option value="">-- Assign Physical Axis --</option>
                {getAvailableAxes(ax.physicalAxisId).map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>

            {ax.type === 'main' && (
              <button 
                onClick={() => addAxis('prime', ax.logicalJoint, idx)}
                className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                title="Add Prime (Slave) Axis"
              >
                <Plus size={16} />
              </button>
            )}

            {!ax.isFixed && (
              <button 
                onClick={() => removeAxis(ax.id)}
                className="p-1 hover:bg-red-50 text-red-500 rounded"
                title="Remove Axis"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <button 
          onClick={() => addAxis('aux', 'Aux')}
          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-gray-700"
        >
          Add Auxiliary Axis
        </button>
      </div>
    </div>
  );
};

export const RoboticKinematicsForm = ({ params, onUpdate, groupNode }: { params: any, onUpdate: (p: any) => void, groupNode: TreeNode }) => {
  const robotType = params.robotType || 'Scara';
  const dof = params.dof;

  const handleRobotTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ robotType: e.target.value, dof: undefined });
  };

  const handleDofChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ dof: Number(e.target.value) });
  };

  const axes = groupNode.children?.filter(c => c.type === 'axis') || [];

  const robotConfigs: Record<string, { allowedDof?: number[], defaultDof?: number, isDynamic?: boolean, getJoints: (d: number) => string[], image: React.ReactNode, desc: string }> = {
    'Scara': {
      getJoints: () => ['J1 (Shoulder)', 'J2 (Elbow)', 'J3 (Z-Axis)', 'J4 (Roll)'],
      desc: 'Selective Compliance Assembly Robot Arm. Excellent for fast pick and place.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M50 90 L50 70 L20 40 L60 20 L60 10" /><circle cx="50" cy="70" r="4"/><circle cx="20" cy="40" r="4"/><circle cx="60" cy="20" r="4"/></svg>
    },
    'Delta': {
      allowedDof: [2, 3, 4, 5],
      defaultDof: 4,
      getJoints: (d) => {
        if (d === 2) return ['J1 (Base 1)', 'J2 (Base 2)'];
        if (d === 3) return ['J1 (Base 1)', 'J2 (Base 2)', 'J3 (Base 3)'];
        if (d === 5) return ['J1 (Base 1)', 'J2 (Base 2)', 'J3 (Base 3)', 'J4 (Rotary)', 'J5 (Tilt)'];
        return ['J1 (Base 1)', 'J2 (Base 2)', 'J3 (Base 3)', 'J4 (Rotary)'];
      },
      desc: 'Parallel robot for very fast top-down picking operations.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M20 20 L50 50 L80 20" /><path d="M50 20 L50 50" /><rect x="40" y="50" width="20" height="5" /></svg>
    },
    'Stewart Platform': {
      allowedDof: [4, 6],
      defaultDof: 6,
      getJoints: (d) => Array.from({ length: d }).map((_, i) => `Actuator ${i + 1}`),
      desc: 'Parallel manipulator using prismatic actuators for high-rigidity multi-DOF motion.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-1 fill-none"><polygon points="30,80 70,80 80,40 20,40" /><line x1="30" y1="80" x2="50" y2="20" /><line x1="70" y1="80" x2="50" y2="20" /></svg>
    },
    'Gantry': {
      allowedDof: [2, 3, 4, 5, 6],
      defaultDof: 3,
      getJoints: (d) => ['J1 (X)', 'J2 (Y)', 'J3 (Z)', 'J4 (Rx)', 'J5 (Ry)', 'J6 (Rz)'].slice(0, d),
      desc: 'Cartesian coordinate robot operating on a gantry structure. Supports dynamic prime (slave) and auxiliary axes.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><rect x="10" y="10" width="80" height="80" /><line x1="10" y1="30" x2="90" y2="30" /><circle cx="50" cy="30" r="4" /></svg>
    },

    'H-Bot': {
      getJoints: () => ['Motor A', 'Motor B'],
      desc: 'XY planar robot utilizing a single continuous belt.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><rect x="20" y="20" width="60" height="60" /><line x1="20" y1="50" x2="80" y2="50" /><circle cx="50" cy="50" r="4" /></svg>
    },
    'T-Bot': {
      getJoints: () => ['Motor A', 'Motor B'],
      desc: 'CoreXY variant forming a T-shape belt routing.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M20 20 L80 20 L50 80 Z" /></svg>
    },

    'Articulated (6 DOF)': {
      getJoints: () => ['J1 (Base)', 'J2 (Shoulder)', 'J3 (Elbow)', 'J4 (Pitch)', 'J5 (Yaw)', 'J6 (Roll)'],
      desc: 'Standard 6-axis industrial robot arm.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M50 90 L50 70 L30 40 L60 20 L80 20" /><circle cx="50" cy="70" r="4"/><circle cx="30" cy="40" r="4"/><circle cx="60" cy="20" r="4"/></svg>
    },
    'Cylindrical': {
      getJoints: () => ['J1 (Rotary Base)', 'J2 (Z-Lift)', 'J3 (Radial Extend)'],
      desc: 'Robot operating in cylindrical coordinates.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><ellipse cx="50" cy="80" rx="30" ry="10" /><line x1="50" y1="80" x2="50" y2="20" /><line x1="50" y1="40" x2="90" y2="40" /></svg>
    },
    'Spherical': {
      getJoints: () => ['J1 (Polar)', 'J2 (Elevation)', 'J3 (Radial)'],
      desc: 'Robot operating in spherical coordinates.',
      image: <svg viewBox="0 0 100 100" className="w-full h-full stroke-blue-800 stroke-2 fill-none"><path d="M50 90 L50 70 L80 40" /><circle cx="50" cy="70" r="4"/></svg>
    }
  };

  const config = robotConfigs[robotType] || robotConfigs['Scara'];
  const currentDof = dof ?? (config.defaultDof || config.getJoints(0).length);
  const activeJoints = config.getJoints(currentDof);



  return (
    <div className="flex space-x-6 h-full p-4">
      <div className="w-1/2 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Kinematics Configuration</h3>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Robot Type</label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Select 
                value={robotType} 
                onChange={handleRobotTypeChange} 
                options={Object.keys(robotConfigs)} 
              />
            </div>
            {config.allowedDof && (
              <div className="w-20 shrink-0">
                <Select 
                  value={currentDof.toString()} 
                  onChange={handleDofChange} 
                  options={config.allowedDof.map(d => d.toString())}
                />
              </div>
            )}
          </div>
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
        <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mb-4">Map Joints to Project Axes</h3>
        <p className="text-xs text-gray-500 mb-4">
          Assign a physical axis from this group to each mechanical joint of the selected robot.
        </p>

        {axes.length === 0 ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm">
            There are no axes in this group. Add axes to map them to robot joints.
          </div>
        ) : (
          <DynamicKinematicsBuilder 
            params={params} 
            onUpdate={onUpdate} 
            axes={axes} 
            robotType={robotType}
            currentDof={currentDof}
            config={config}
          />
        )}
      </div>
    </div>
  );
};
