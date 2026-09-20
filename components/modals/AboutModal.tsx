import React from 'react';
import { X, Activity, Cpu, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[500px] bg-white rounded shadow-2xl border border-gray-300 flex flex-col overflow-hidden font-sans text-xs">
        <div className="px-4 py-3 bg-slate-800 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="text-blue-400" size={18} />
            <h2 className="text-sm font-bold">About Motion-Size</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-gray-300"><X size={16} /></button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Cpu size={32} />
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Motion-Size Suite</h3>
            <p className="text-xs text-gray-500 font-mono">Version 2.5.0 - Professional Electromechanical Sizing</p>
          </div>

          <p className="text-gray-600 text-xs leading-relaxed max-w-sm mx-auto">
            High-fidelity electromechanical motion sizing and simulation platform. Featuring real-time dynamics simulation, multi-axis grouping, VDI 2143 electronic camming, 3D robotics path planning, and comprehensive motor & inverter catalog selection.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-left space-y-1 text-[11px] text-gray-600">
            <div><strong>Physics Engine:</strong> 4-Quadrant Machine Dynamics & Reflected Inertia</div>
            <div><strong>Camming Solver:</strong> VDI 2143 (Poly5, Modified Sine, Modified Trapezoid)</div>
            <div><strong>Kinematics:</strong> Closed-Form Analytical SCARA & Cartesian IK</div>
            <div><strong>Standards:</strong> IEC 60034 Thermal Verification & Cat. 1 Max-Stop</div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-5 py-1.5 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
