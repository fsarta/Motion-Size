import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Clock, PlayCircle } from 'lucide-react';
import { TreeNode } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

export const PathPlannerForm = ({ params, onUpdate, groupNode }: { params: any, onUpdate: (p: any) => void, groupNode: TreeNode }) => {
  const { updateNode } = useProjectStore();

  const defaultPath = [
    { id: '1', name: 'P1 (Pick)', x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, vel: 500, acc: 2000, blend: 0, dwell: 100 },
    { id: '2', name: 'P2', x: 0, y: 0, z: 50, rx: 0, ry: 0, rz: 0, vel: 1000, acc: 4000, blend: 10, dwell: 0 },
    { id: '3', name: 'P3', x: 300, y: 0, z: 50, rx: 0, ry: 0, rz: 90, vel: 1000, acc: 4000, blend: 10, dwell: 0 },
    { id: '4', name: 'P4 (Place)', x: 300, y: 0, z: 0, rx: 0, ry: 0, rz: 90, vel: 500, acc: 2000, blend: 0, dwell: 100 }
  ];

  const pathData = params.pathPlannerData || defaultPath;

  const updatePath = (newData: any[]) => {
    onUpdate({ pathPlannerData: newData });
  };

  const addPoint = () => {
    const newPoint = { 
      id: crypto.randomUUID(), 
      name: `P${pathData.length + 1}`, 
      x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0,
      vel: 500, acc: 2000, blend: 0, dwell: 0 
    };
    updatePath([...pathData, newPoint]);
  };

  const removePoint = (id: string) => {
    updatePath(pathData.filter((p: any) => p.id !== id));
  };

  const updatePoint = (id: string, field: string, value: any) => {
    updatePath(pathData.map((p: any) => p.id === id ? { ...p, [field]: value } : p));
  };

  const cycleEstimation = useMemo(() => {
    if (pathData.length < 2) return { time: 0, segments: [] };
    
    let totalTime = 0;
    const segments = [];

    for (let i = 1; i < pathData.length; i++) {
      const p0 = pathData[i - 1];
      const p1 = pathData[i];
      
      const dx = (p1.x || 0) - (p0.x || 0);
      const dy = (p1.y || 0) - (p0.y || 0);
      const dz = (p1.z || 0) - (p0.z || 0);
      // Rough estimation using translational distance primarily
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.1; // avoid division by zero
      
      const v = parseFloat(p1.vel) || 500;
      const a = parseFloat(p1.acc) || 2000;
      const dwell = parseFloat(p1.dwell) || 0;
      
      let moveTime = 0;
      if (dist > 0 && v > 0 && a > 0) {
        const d_accel = (v * v) / (2 * a);
        const d_decel = d_accel; 
        
        if (dist > d_accel + d_decel) {
          const d_const = dist - d_accel - d_decel;
          moveTime = (v / a) * 2 + (d_const / v);
        } else {
          moveTime = Math.sqrt(dist / a) * 2;
        }
      }
      
      const blend = parseFloat(p1.blend) || 0;
      let blendSavings = 0;
      if (blend > 0 && i < pathData.length - 1 && v > 0) {
         blendSavings = (blend / v); 
      }
      
      moveTime = Math.max(0.01, moveTime - blendSavings);
      const segmentTime = moveTime + (dwell / 1000);
      totalTime += segmentTime;
      
      segments.push({ moveTime, dwell });
    }
    
    return { time: totalTime, segments };
  }, [pathData]);

  const handleBuildProfiles = () => {
    if (!params.jointMapping || Object.keys(params.jointMapping).length === 0) {
      alert("Please map joints to axes in the 'Robotic Kinematics' tab first.");
      return;
    }

    const joints = Object.keys(params.jointMapping); // ['J1', 'J2', ...]
    const coordinateKeys = ['x', 'y', 'z', 'rx', 'ry', 'rz'];

    joints.forEach((joint, idx) => {
      const axisId = params.jointMapping[joint];
      if (!axisId) return;

      const coordKey = coordinateKeys[idx] || 'x';
      const motionProfile = [];

      for (let i = 1; i < pathData.length; i++) {
        const p0 = pathData[i - 1];
        const p1 = pathData[i];
        
        const delta = (p1[coordKey] || 0) - (p0[coordKey] || 0);
        const seg = cycleEstimation.segments[i - 1];
        
        // 1. Move segment
        if (seg.moveTime > 0) {
          motionProfile.push({
            id: crypto.randomUUID(),
            type: "Accel/Decel",
            duration: Number(seg.moveTime.toFixed(3)),
            distance: Number(delta.toFixed(3)),
            velocity: Number(((delta / seg.moveTime) * 2).toFixed(3)), // arbitrary triangular fallback
            accel: 0, decel: 0, jerk: 0, payload: 0,
            calcTarget: "velocity"
          });
        }
        
        // 2. Dwell segment
        if (seg.dwell > 0) {
          motionProfile.push({
            id: crypto.randomUUID(),
            type: "Dwell/Traverse",
            duration: Number((seg.dwell / 1000).toFixed(3)),
            distance: 0,
            velocity: 0,
            accel: 0, decel: 0, jerk: 0, payload: 0,
            calcTarget: "velocity"
          });
        }
      }

      updateNode(axisId, { motionProfileData: JSON.stringify(motionProfile), profileType: 'Time Based' });
    });

    alert("Motion profiles generated successfully for all mapped axes! Check the 'Motion Profile' tab on each axis.");
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center bg-blue-50 p-4 border border-blue-200 rounded">
        <div>
          <h3 className="text-sm font-bold text-blue-800">Trajectory Cycle Estimator</h3>
          <p className="text-xs text-blue-600">Define the Cartesian waypoints. The engine calculates the theoretical kinematic minimum cycle time.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-blue-200 shadow-sm">
          <Clock className="text-blue-500" size={24} />
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase">Est. Cycle Time</div>
            <div className="text-xl font-black text-gray-800">{cycleEstimation.time.toFixed(3)} s</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase border-b">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="p-2 min-w-[100px]">Point Name</th>
                <th className="p-2 text-center">X (mm)</th>
                <th className="p-2 text-center">Y (mm)</th>
                <th className="p-2 text-center">Z (mm)</th>
                <th className="p-2 text-center">Rx (deg)</th>
                <th className="p-2 text-center">Ry (deg)</th>
                <th className="p-2 text-center">Rz (deg)</th>
                <th className="p-2 text-center bg-blue-50">Vel (mm/s)</th>
                <th className="p-2 text-center bg-blue-50">Acc (mm/s²)</th>
                <th className="p-2 text-center bg-orange-50">Blend (mm)</th>
                <th className="p-2 text-center bg-green-50">Dwell (ms)</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pathData.map((p: any, idx: number) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-2 font-bold text-gray-400 text-center text-xs">{idx + 1}</td>
                  <td className="p-1">
                    <input type="text" value={p.name} onChange={(e) => updatePoint(p.id, 'name', e.target.value)} className="w-full border border-transparent hover:border-gray-300 focus:border-blue-500 p-1 rounded text-xs bg-transparent focus:bg-white outline-none" />
                  </td>
                  <td className="p-1"><input type="number" value={p.x || 0} onChange={(e) => updatePoint(p.id, 'x', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1"><input type="number" value={p.y || 0} onChange={(e) => updatePoint(p.id, 'y', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1"><input type="number" value={p.z || 0} onChange={(e) => updatePoint(p.id, 'z', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1"><input type="number" value={p.rx || 0} onChange={(e) => updatePoint(p.id, 'rx', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1"><input type="number" value={p.ry || 0} onChange={(e) => updatePoint(p.id, 'ry', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1"><input type="number" value={p.rz || 0} onChange={(e) => updatePoint(p.id, 'rz', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1 bg-blue-50/30"><input type="number" value={p.vel} onChange={(e) => updatePoint(p.id, 'vel', Number(e.target.value))} className="w-16 border border-blue-200 p-1 rounded text-xs text-center mx-auto block" disabled={idx === 0} /></td>
                  <td className="p-1 bg-blue-50/30"><input type="number" value={p.acc} onChange={(e) => updatePoint(p.id, 'acc', Number(e.target.value))} className="w-16 border border-blue-200 p-1 rounded text-xs text-center mx-auto block" disabled={idx === 0} /></td>
                  <td className="p-1 bg-orange-50/30"><input type="number" value={p.blend} onChange={(e) => updatePoint(p.id, 'blend', Number(e.target.value))} className="w-14 border border-orange-200 p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-1 bg-green-50/30"><input type="number" value={p.dwell} onChange={(e) => updatePoint(p.id, 'dwell', Number(e.target.value))} className="w-14 border border-green-200 p-1 rounded text-xs text-center mx-auto block" /></td>
                  <td className="p-2 text-right">
                    <button onClick={() => removePoint(p.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t bg-gray-50">
          <button onClick={addPoint} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
            <Plus size={16} className="mr-1" /> Add Waypoint
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-4">
         <button onClick={handleBuildProfiles} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm font-medium">
            <PlayCircle size={18} className="mr-2"/> Build Motion Profiles
         </button>
      </div>
    </div>
  );
};
