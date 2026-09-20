import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

interface DocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocModal: React.FC<DocModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'guidelines' | 'shortcuts'>('theory');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[850px] max-h-[85vh] bg-white rounded shadow-2xl border border-gray-300 flex flex-col overflow-hidden font-sans text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-100 border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-800">
            <BookOpen size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold">Motion-Size Documentation & Engineering Reference</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-600"><X size={16} /></button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2 space-x-2">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 font-bold border-b-2 text-xs ${activeTab === 'theory' ? 'border-blue-600 text-blue-600 bg-white rounded-t' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Physical Equations & Laws
          </button>
          <button 
            onClick={() => setActiveTab('guidelines')}
            className={`px-3 py-1.5 font-bold border-b-2 text-xs ${activeTab === 'guidelines' ? 'border-blue-600 text-blue-600 bg-white rounded-t' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Servo Sizing Guidelines
          </button>
          <button 
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 font-bold border-b-2 text-xs ${activeTab === 'shortcuts' ? 'border-blue-600 text-blue-600 bg-white rounded-t' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Shortcuts & Navigation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'theory' && (
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <h3 className="font-bold text-sm text-gray-900 border-b pb-1">1. Translating Load to Rotary Inertia Reflection</h3>
              <p>
                When a mass m moves linearly, its equivalent reflected inertia at the load shaft is determined by:
              </p>
              <div className="bg-slate-50 p-3 rounded font-mono border text-center font-bold text-slate-800">
                {"J_mass = m · r_eff² = m · (feedConstant / 2π)² [kg·m²]"}
              </div>
              <p>
                Reflected through a speed reducer with ratio i (i = motor_speed / load_speed):
              </p>
              <div className="bg-slate-50 p-3 rounded font-mono border text-center font-bold text-slate-800">
                {"J_reflected = J_load / i²   |   J_total = J_reflected + J_gearbox + J_motor"}
              </div>

              <h3 className="font-bold text-sm text-gray-900 border-b pb-1 mt-4">2. 4-Quadrant Dynamic Torque Equations</h3>
              <p>
                The mechanical motor torque accounts for acceleration, Coulomb friction, gravity component, and transmission efficiency in motoring versus generating modes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Motoring Mode (P_mech &ge; 0):</strong> T_motor = J_tot · &alpha; + (T_load / &eta;)</li>
                <li><strong>Regenerating Mode (P_mech &lt; 0):</strong> T_motor = J_tot · &alpha; + T_load · &eta;</li>
              </ul>

              <h3 className="font-bold text-sm text-gray-900 border-b pb-1 mt-4">3. VDI 2143 Cam Motion Laws</h3>
              <p>
                The Electronic Camming engine supports normalized jerk-continuous curves:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Poly5 (5th Order Polynomial):</strong> Continuous velocity and acceleration, zero jerk jump at dwell boundaries.</li>
                <li><strong>Sine (Cycloidal):</strong> Lowest peak jerk among trigonometric laws.</li>
                <li><strong>Modified Trapezoid (VDI 2143):</strong> Minimizes peak acceleration for high inertia transfers.</li>
                <li><strong>Modified Sine (VDI 2143):</strong> Low peak velocity and smooth torque distribution.</li>
              </ul>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <h3 className="font-bold text-sm text-gray-900 border-b pb-1">Industry Sizing Rules of Thumb</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-bold text-blue-900 mb-1">1. Inertia Ratio (J_L / J_M) Selection:</div>
                  <p className="text-blue-800">
                    - High precision / dynamic contouring (CNC, robotics): J_L / J_M &le; 3:1<br/>
                    - Standard automation, pick-and-place, conveyors: J_L / J_M &le; 10:1<br/>
                    - Heavy machinery with compliant mechanics: J_L / J_M &le; 20:1
                  </p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-bold text-green-900 mb-1">2. Continuous Thermal Verification (T_RMS):</div>
                  <p className="text-green-800">
                    The root-mean-square torque over the complete machine cycle must remain below the continuous motor rating (T_RMS &le; T_rated) to prevent winding overheating.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="font-bold text-amber-900 mb-1">3. Peak Torque Safety Factor:</div>
                  <p className="text-amber-800">
                    Peak acceleration torque during rapid moves should not exceed 80% of the motor peak capability (Safety Factor &ge; 1.25) to leave margin for voltage drops and mechanical wear.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-900 border-b pb-1">Keyboard & Mouse Navigation</h3>
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead className="bg-gray-100 font-bold uppercase text-[9px]">
                  <tr><th className="p-2 border">Action</th><th className="p-2 border">Shortcut / Gesture</th></tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border font-mono">F1</td><td className="p-2 border">Open Help & Documentation</td></tr>
                  <tr><td className="p-2 border font-mono">Ctrl + Z</td><td className="p-2 border">Undo last modification</td></tr>
                  <tr><td className="p-2 border font-mono">Ctrl + Y</td><td className="p-2 border">Redo undone modification</td></tr>
                  <tr><td className="p-2 border font-mono">Right Click</td><td className="p-2 border">Context menu on Axis or Group (Cut, Copy, Delete, Paste)</td></tr>
                  <tr><td className="p-2 border font-mono">Drag & Drop</td><td className="p-2 border">Drag axes to reorder or move between power groups</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-300 flex justify-end">
          <button onClick={onClose} className="px-5 py-1.5 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
