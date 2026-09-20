import React, { useState } from 'react';
import { X, StopCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { TreeNode } from '../../types';
import { calculateAxisDynamics, calculateMaxStop } from '../../utils/physics';

interface MaxStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TreeNode[];
}

export const MaxStopModal: React.FC<MaxStopModalProps> = ({ isOpen, onClose, data }) => {
  const [safetyBufferFactor, setSafetyBufferFactor] = useState(1.2); // 20% safety margin

  if (!isOpen) return null;

  const axes: TreeNode[] = [];
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'axis') axes.push(node);
      if (node.children) traverse(node.children);
    }
  };
  traverse(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[900px] max-h-[85vh] bg-white rounded shadow-2xl border border-gray-300 flex flex-col overflow-hidden font-sans text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-red-800">
            <StopCircle size={20} className="text-red-600" />
            <h2 className="text-sm font-bold">Max-Stop: Emergency Braking & Stopping Distance Analysis</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-100 rounded text-gray-600"><X size={16} /></button>
        </div>

        {/* Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <p className="text-xs text-gray-700 max-w-xl">
            Calculates worst-case stopping time and machine travel during emergency stop (Cat. 1 / Cat. 0) at maximum operating speed using full motor peak deceleration torque and friction.
          </p>
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-gray-300 rounded shadow-sm">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Safety Factor:</span>
            <select 
              value={safetyBufferFactor} 
              onChange={e => setSafetyBufferFactor(Number(e.target.value))}
              className="text-xs font-bold border-none bg-transparent outline-none cursor-pointer"
            >
              <option value={1.0}>1.0 (Nominal)</option>
              <option value={1.2}>1.2 (+20% Buffer)</option>
              <option value={1.5}>1.5 (+50% Safety)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[9px] border-b border-gray-300">
              <tr>
                <th className="p-2 border">Axis</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border text-center">Max Speed</th>
                <th className="p-2 border text-center">Peak Torque</th>
                <th className="p-2 border text-center">Total J (kg·cm²)</th>
                <th className="p-2 border text-center bg-red-50 text-red-800">Stop Time</th>
                <th className="p-2 border text-center bg-red-50 text-red-800">Motor Revs</th>
                <th className="p-2 border text-center bg-amber-50 text-amber-900">Stop Travel</th>
                <th className="p-2 border text-center">Recommended Buffer</th>
              </tr>
            </thead>
            <tbody>
              {axes.map(axis => {
                const p = axis.parameters || {};
                const isLinear = p.axisUsage === 'Linear';
                const dyn = calculateAxisDynamics(p);
                const maxSpeedRpm = parseFloat(String(p.peakSpeed || p.ratedSpeed || 3000));
                const peakTorqueNm = parseFloat(String(p.peakTorque || 10));
                const feedConstantMm = parseFloat(String(p.feedConstant || p.screwLead || 10));
                const gearRatio = dyn.gearboxRatio;

                const stop = calculateMaxStop(
                  dyn.totalInertiaKgM2,
                  maxSpeedRpm,
                  peakTorqueNm,
                  dyn.frictionTorqueNm,
                  feedConstantMm,
                  gearRatio,
                  isLinear
                );

                const stopTimeWithSafety = (stop.stopTimeSec * safetyBufferFactor).toFixed(3);
                const stopDistWithSafety = (stop.stopDistanceMm * safetyBufferFactor).toFixed(1);
                const unit = isLinear ? 'mm' : '°';

                return (
                  <tr key={axis.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border font-bold text-gray-800">{axis.label}</td>
                    <td className="p-2 border text-gray-600">{p.axisUsage || 'Rotary'}</td>
                    <td className="p-2 border text-center font-mono">{maxSpeedRpm} RPM</td>
                    <td className="p-2 border text-center font-mono">{peakTorqueNm.toFixed(1)} Nm</td>
                    <td className="p-2 border text-center font-mono">{dyn.totalInertiaKgCm2.toFixed(2)}</td>
                    <td className="p-2 border text-center font-mono font-bold text-red-700 bg-red-50/40">
                      {stopTimeWithSafety} s
                    </td>
                    <td className="p-2 border text-center font-mono text-red-700 bg-red-50/40">
                      {(stop.stopRev * safetyBufferFactor).toFixed(2)} rev
                    </td>
                    <td className="p-2 border text-center font-mono font-bold text-amber-800 bg-amber-50/40">
                      {stopDistWithSafety} {unit}
                    </td>
                    <td className="p-2 border text-center text-gray-500 font-mono">
                      ≥ {(stop.stopDistanceMm * (safetyBufferFactor + 0.3)).toFixed(0)} {unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start space-x-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Safety Note:</strong> Mechanical end-stops and limit switches must be located at a distance greater than the recommended buffer past maximum software limit positions to ensure fail-safe stopping without mechanical collision.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-300 flex justify-end">
          <button onClick={onClose} className="px-5 py-1.5 bg-gray-800 text-white font-bold rounded shadow hover:bg-black">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
