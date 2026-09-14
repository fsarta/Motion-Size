import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Clock, PlayCircle } from 'lucide-react';
import { TreeNode } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { IsometricTrajectory } from './IsometricTrajectory';

export const PathPlannerForm = ({ params, onUpdate, groupNode }: { params: any, onUpdate: (p: any) => void, groupNode: TreeNode }) => {
  const { updateNode } = useProjectStore();

  const defaultPath = [
    { id: '1', name: 'P1 (Pick)', x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, vel: 500, acc: 2000, blend: 0, dwell: 100 },
    { id: '2', name: 'P2', x: 0, y: 0, z: 50, rx: 0, ry: 0, rz: 0, vel: 1000, acc: 4000, blend: 10, dwell: 0 },
    { id: '3', name: 'P3', x: 300, y: 0, z: 50, rx: 0, ry: 0, rz: 90, vel: 1000, acc: 4000, blend: 10, dwell: 0 },
    { id: '4', name: 'P4 (Place)', x: 300, y: 0, z: 0, rx: 0, ry: 0, rz: 90, vel: 500, acc: 2000, blend: 0, dwell: 100 }
  ];

  const pathData = params.pathPlannerData || defaultPath;

  const [speedOverride, setSpeedOverride] = useState(100);
  const [tcpOffset, setTcpOffset] = useState({ x: 0, y: 0, z: 0 });
  const [payload, setPayload] = useState(0);
  const [envelope, setEnvelope] = useState({ x: 500, y: 500, z: 500 });
  const [scrubTime, setScrubTime] = useState(0);

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
    if (pathData.length < 2) return { time: 0, segments: [], actualBlends: [] };
    
    const dist3D = (p1: any, p2: any) => Math.sqrt(((p1.x||0)-(p2.x||0))**2 + ((p1.y||0)-(p2.y||0))**2 + ((p1.z||0)-(p2.z||0))**2);
    
    let totalTime = 0;
    const segments = [];

    // Precalculate mathematically valid blend radii
    const actualBlends = pathData.map((p: any, i: number) => {
      if (i === 0 || i === pathData.length - 1) return 0;
      const d1 = dist3D(pathData[i-1], p);
      const d2 = dist3D(p, pathData[i+1]);
      return Math.min(parseFloat(p.blend) || 0, d1 / 2, d2 / 2);
    });

    for (let i = 1; i < pathData.length; i++) {
      const p0 = pathData[i - 1];
      const p1 = pathData[i];
      
      const dist = dist3D(p0, p1) || 0.1;
      
      const rawV = parseFloat(p1.vel) || 500;
      const rawA = parseFloat(p1.acc) || 2000;
      
      const overrideRatio = speedOverride / 100;
      const v = Math.max(0.1, rawV * overrideRatio);
      const a = Math.max(0.1, rawA * overrideRatio);
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
      
      const actualBlend = actualBlends[i];
      let blendSavings = 0;
      if (actualBlend > 0 && v > 0) {
         blendSavings = (actualBlend / v); 
      }
      
      moveTime = Math.max(0.01, moveTime - blendSavings);
      const segmentTime = moveTime + (dwell / 1000);
      totalTime += segmentTime;
      
      segments.push({ moveTime, dwell });
    }
    
    return { time: totalTime, segments, actualBlends };
  }, [pathData, speedOverride]);

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
        
        if (seg.moveTime > 0) {
          motionProfile.push({
            id: crypto.randomUUID(),
            type: "S-Curve",
            duration: Number(seg.moveTime.toFixed(3)),
            distance: Number(delta.toFixed(3)),
            velocity: Number(((delta / seg.moveTime) * 2).toFixed(3)),
            accel: 0, decel: 0, jerk: 0, payload: payload,
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
            accel: 0, decel: 0, jerk: 0, payload: payload,
            calcTarget: "velocity"
          });
        }
      }

      updateNode(axisId, { motionProfileData: JSON.stringify(motionProfile), profileType: 'Time Based' });
    });

    alert("Motion profiles generated successfully for all mapped axes! Check the 'Motion Profile' tab on each axis.");
  };

  const [showVelocityHeatmap, setShowVelocityHeatmap] = useState(true);

  return (
    <div className="flex h-full font-sans text-xs select-none space-x-4">
      {/* Left Column: 3D Visualization & Metrics */}
      <div className="w-1/3 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-200 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-blue-800">3D Trajectory</h3>
              <label className="flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded shadow-sm border border-blue-200 ml-2">
                <input type="checkbox" checked={showVelocityHeatmap} onChange={e => setShowVelocityHeatmap(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-[9px] uppercase font-bold text-gray-600">Heatmap</span>
              </label>
            </div>
            <p className="text-xs text-blue-600">Kinematic path preview</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
            <Clock className="text-blue-500" size={18} />
            <div>
              <div className="text-[10px] text-gray-500 font-bold leading-none uppercase">Est. Time</div>
              <div className="text-sm font-black text-gray-800 leading-none">{cycleEstimation.time.toFixed(3)}s</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 relative bg-[#f8fafc] flex flex-col min-h-[300px]">
          <div className="flex-1 flex items-center justify-center p-4">
            <IsometricTrajectory 
              pathData={pathData} 
              showVelocityHeatmap={showVelocityHeatmap}
              scrubTime={scrubTime}
              envelope={envelope}
              tcpOffset={tcpOffset}
            />
          </div>
          <div className="bg-white border-t border-gray-200 p-2 shrink-0 flex items-center space-x-3">
             <div className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Playback</div>
             <input 
               type="range" min="0" max="100" step="0.1" value={scrubTime} 
               onChange={e => setScrubTime(Number(e.target.value))}
               className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
             />
             <div className="text-xs font-bold text-gray-700 w-12 text-right">{scrubTime.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Right Column: Waypoint Table & Actions */}
      <div className="w-2/3 flex flex-col space-y-4">
        
        {/* Global Settings Panel */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 grid grid-cols-4 gap-4">
           {/* Speed Override */}
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                Speed Override <span>{speedOverride}%</span>
             </label>
             <input 
               type="range" min="1" max="100" value={speedOverride} 
               onChange={e => setSpeedOverride(Number(e.target.value))}
               className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2" 
             />
           </div>
           
           {/* TCP Offset */}
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">TCP Offset (X,Y,Z)</label>
             <div className="flex space-x-1">
               <input type="number" value={tcpOffset.x} onChange={e => setTcpOffset({...tcpOffset, x: Number(e.target.value)})} className="w-1/3 border rounded text-xs p-1 text-center" placeholder="X" />
               <input type="number" value={tcpOffset.y} onChange={e => setTcpOffset({...tcpOffset, y: Number(e.target.value)})} className="w-1/3 border rounded text-xs p-1 text-center" placeholder="Y" />
               <input type="number" value={tcpOffset.z} onChange={e => setTcpOffset({...tcpOffset, z: Number(e.target.value)})} className="w-1/3 border rounded text-xs p-1 text-center" placeholder="Z" />
             </div>
           </div>

           {/* Work Envelope */}
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Work Env. (X,Y,Z Max)</label>
             <div className="flex space-x-1">
               <input type="number" value={envelope.x} onChange={e => setEnvelope({...envelope, x: Number(e.target.value)})} className="w-1/3 border rounded text-xs p-1 text-center" />
               <input type="number" value={envelope.y} onChange={e => setEnvelope({...envelope, y: Number(e.target.value)})} className="w-1/3 border rounded text-xs p-1 text-center" />
               <input type="number" value={envelope.z} onChange={e => setEnvelope({...envelope, z: Number(e.target.value)})} className="w-1/3 border rounded text-xs p-1 text-center" />
             </div>
           </div>

           {/* Payload */}
           <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Payload (kg)</label>
             <input type="number" value={payload} onChange={e => setPayload(Number(e.target.value))} className="w-full border rounded text-xs p-1 text-center" />
           </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="bg-gray-100 p-2 border-b text-xs font-bold text-gray-600 uppercase flex justify-between items-center shrink-0">
            <span>Waypoint Sequence</span>
            <button onClick={addPoint} className="flex items-center text-xs bg-white border border-gray-300 px-2 py-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors">
              <Plus size={14} className="mr-1" /> Add Point
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase border-b sticky top-0 z-10">
                <tr>
                  <th className="p-2 w-8"></th>
                  <th className="p-2 min-w-[100px]">Point Name</th>
                  <th className="p-2 text-center">X</th>
                  <th className="p-2 text-center">Y</th>
                  <th className="p-2 text-center border-r">Z</th>
                  <th className="p-2 text-center">Rx</th>
                  <th className="p-2 text-center">Ry</th>
                  <th className="p-2 text-center border-r">Rz</th>
                  <th className="p-2 text-center bg-blue-50/50">Vel</th>
                  <th className="p-2 text-center bg-blue-50/50 border-r">Acc</th>
                  <th className="p-2 text-center bg-orange-50/50">Blend</th>
                  <th className="p-2 text-center bg-green-50/50 border-r">Dwell</th>
                  <th className="p-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {pathData.map((p: any, idx: number) => (
                  <tr key={p.id} className="border-b hover:bg-blue-50/30 transition-colors group">
                    <td className="p-1 font-bold text-gray-400 text-center text-[10px]">{idx + 1}</td>
                    <td className="p-1">
                      <input type="text" value={p.name} onChange={(e) => updatePoint(p.id, 'name', e.target.value)} className="w-full border border-transparent hover:border-gray-300 focus:border-blue-500 p-1 rounded text-xs bg-transparent focus:bg-white outline-none" />
                    </td>
                    <td className="p-1"><input type="number" value={p.x || 0} onChange={(e) => updatePoint(p.id, 'x', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block bg-transparent hover:bg-white" /></td>
                    <td className="p-1"><input type="number" value={p.y || 0} onChange={(e) => updatePoint(p.id, 'y', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block bg-transparent hover:bg-white" /></td>
                    <td className="p-1 border-r"><input type="number" value={p.z || 0} onChange={(e) => updatePoint(p.id, 'z', Number(e.target.value))} className="w-12 border p-1 rounded text-xs text-center mx-auto block bg-transparent hover:bg-white" /></td>
                    
                    <td className="p-1"><input type="number" value={p.rx || 0} onChange={(e) => updatePoint(p.id, 'rx', Number(e.target.value))} className="w-10 border p-1 rounded text-[10px] text-center mx-auto block text-gray-500 bg-transparent hover:bg-white" /></td>
                    <td className="p-1"><input type="number" value={p.ry || 0} onChange={(e) => updatePoint(p.id, 'ry', Number(e.target.value))} className="w-10 border p-1 rounded text-[10px] text-center mx-auto block text-gray-500 bg-transparent hover:bg-white" /></td>
                    <td className="p-1 border-r"><input type="number" value={p.rz || 0} onChange={(e) => updatePoint(p.id, 'rz', Number(e.target.value))} className="w-10 border p-1 rounded text-[10px] text-center mx-auto block text-gray-500 bg-transparent hover:bg-white" /></td>
                    
                    <td className="p-1 bg-blue-50/20"><input type="number" min="0" value={p.vel} onChange={(e) => updatePoint(p.id, 'vel', Math.max(0, Number(e.target.value)))} className="w-14 border border-blue-200 p-1 rounded text-xs text-center mx-auto block bg-white" disabled={idx === 0} /></td>
                    <td className="p-1 bg-blue-50/20 border-r"><input type="number" min="0" value={p.acc} onChange={(e) => updatePoint(p.id, 'acc', Math.max(0, Number(e.target.value)))} className="w-14 border border-blue-200 p-1 rounded text-xs text-center mx-auto block bg-white" disabled={idx === 0} /></td>
                    
                    <td className={`p-1 ${idx > 0 && idx < pathData.length - 1 && p.blend > cycleEstimation.actualBlends[idx] ? 'bg-red-50' : 'bg-orange-50/20'}`}>
                      <input 
                        type="number" 
                        min="0"
                        value={p.blend} 
                        onChange={(e) => updatePoint(p.id, 'blend', Math.max(0, Number(e.target.value)))} 
                        className={`w-12 border p-1 rounded text-xs text-center mx-auto block bg-white ${(idx > 0 && idx < pathData.length - 1 && p.blend > cycleEstimation.actualBlends[idx]) ? 'border-red-400 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-orange-200'}`} 
                        title={(idx > 0 && idx < pathData.length - 1 && p.blend > cycleEstimation.actualBlends[idx]) ? `Max allowed blend is ${cycleEstimation.actualBlends[idx].toFixed(1)} mm` : ''}
                      />
                    </td>
                    <td className="p-1 bg-green-50/20 border-r"><input type="number" min="0" value={p.dwell} onChange={(e) => updatePoint(p.id, 'dwell', Math.max(0, Number(e.target.value)))} className="w-14 border border-green-200 p-1 rounded text-xs text-center mx-auto block bg-white" /></td>
                    
                    <td className="p-1 text-center">
                      <button onClick={() => removePoint(p.id)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end shrink-0">
           <button onClick={handleBuildProfiles} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm font-medium transition-colors">
              <PlayCircle size={18} className="mr-2"/> Build Motion Profiles
           </button>
        </div>
      </div>
    </div>
  );
};
