import React from 'react';
import { X, Printer, Download, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { TreeNode } from '../../types';
import { calculateAxisDynamics, calculateMaxStop } from '../../utils/physics';

interface TechnicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TreeNode[];
}

export const TechnicalReportModal: React.FC<TechnicalReportModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const rootNode = data[0];
  const rootParams = rootNode?.parameters || {};
  const projectTitle = rootParams.projectTitle || 'Electromechanical Sizing Technical Report';
  const author = rootParams.projectAuthor || 'Automation Engineering';
  const company = rootParams.projectCompany || 'Motion Engineering Department';
  const date = rootParams.projectDate || new Date().toISOString().split('T')[0];
  const notes = rootParams.projectNotes || '';

  const axes: TreeNode[] = [];
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'axis') axes.push(node);
      if (node.children) traverse(node.children);
    }
  };
  traverse(data);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[1000px] max-h-[92vh] bg-white rounded shadow-2xl border border-gray-400 flex flex-col overflow-hidden font-sans text-xs">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-5 py-3 bg-slate-800 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-blue-400" />
            <span className="font-bold text-sm">Formal Technical Calculation Report Preview</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrint}
              className="flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white shadow transition-colors"
            >
              <Printer size={14} className="mr-1.5" /> Print / Save as PDF
            </button>
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-gray-300"><X size={18} /></button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-10 bg-white print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{projectTitle}</h1>
                <p className="text-sm font-semibold text-slate-600">Servo Sizing & Kinematic Verification Sheet</p>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-0.5">
                <div><strong>Document Date:</strong> {date}</div>
                <div><strong>Company:</strong> {company}</div>
                <div><strong>Lead Engineer:</strong> {author}</div>
              </div>
            </div>
          </div>

          {/* Project Engineering Notes */}
          {notes && (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <h3 className="font-bold text-slate-700 uppercase text-[10px] mb-1">Design Specifications & Notes</h3>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed font-mono text-[11px]">{notes}</p>
            </div>
          )}

          {/* Power Group Overview */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1 mb-3">
              1. Electrical Supply & DC Bus System
            </h2>
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 border border-slate-200 rounded">
              <div><span className="text-slate-500 font-medium">Mains Supply:</span> <span className="font-bold">{rootParams.supplyVoltage || 400} Vac ({rootParams.supplyPhase || 3}-Phase)</span></div>
              <div><span className="text-slate-500 font-medium">Nominal DC Bus:</span> <span className="font-bold">{rootParams.nominalBusVoltage || 540} Vdc</span></div>
              <div><span className="text-slate-500 font-medium">Configuration:</span> <span className="font-bold">{rootParams.configuration || 'Multi-Axis'}</span></div>
              <div><span className="text-slate-500 font-medium">Cycle Time:</span> <span className="font-bold">{rootParams.cycleTime || 10} s</span></div>
            </div>
          </div>

          {/* Axis Sizing & Physical Verification Table */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1 mb-3">
              2. Axis Electromechanical Dimensioning Summary
            </h2>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border border-slate-300 text-left">Axis Name</th>
                  <th className="p-2 border border-slate-300 text-left">Mechanism</th>
                  <th className="p-2 border border-slate-300 text-center">Load Mass</th>
                  <th className="p-2 border border-slate-300 text-center">Gearbox</th>
                  <th className="p-2 border border-slate-300 text-left">Motor Selected</th>
                  <th className="p-2 border border-slate-300 text-center">Rated Torque</th>
                  <th className="p-2 border border-slate-300 text-center">Peak Torque</th>
                  <th className="p-2 border border-slate-300 text-center">Inertia Ratio (J_L / J_M)</th>
                  <th className="p-2 border border-slate-300 text-left">Drive Selected</th>
                  <th className="p-2 border border-slate-300 text-center">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {axes.map(axis => {
                  const p = axis.parameters || {};
                  const dyn = calculateAxisDynamics(p);
                  const isConfigured = !!p.motorModel && !!p.driveModel;
                  const ratioPass = dyn.inertiaRatio <= parseFloat(String(p.allowableInertiaRatio || 10));

                  return (
                    <tr key={axis.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-200 font-bold text-slate-800">{axis.label}</td>
                      <td className="p-2 border border-slate-200">{p.mechanismType || 'Ball Screw'} ({p.axisUsage || 'Linear'})</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{dyn.totalMovingMassKg} kg</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{p.gearboxModel || 'Direct'} ({dyn.gearboxRatio}:1)</td>
                      <td className="p-2 border border-slate-200 font-semibold text-blue-900">{p.motorModel || 'Not Configured'}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{p.ratedTorque ? `${p.ratedTorque} Nm` : '-'}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{p.peakTorque ? `${p.peakTorque} Nm` : '-'}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                        {dyn.inertiaRatio.toFixed(1)} : 1
                      </td>
                      <td className="p-2 border border-slate-200 font-semibold text-slate-800">{p.driveModel || 'Not Configured'}</td>
                      <td className="p-2 border border-slate-200 text-center">
                        {isConfigured && ratioPass ? (
                          <span className="text-green-700 font-bold">✓ PASSED</span>
                        ) : (
                          <span className="text-amber-600 font-bold">⚠ ATTENTION</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Emergency Braking Analysis */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1 mb-3">
              3. Emergency Stop (Max-Stop) Safety Analysis
            </h2>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-2 border border-slate-300 text-left">Axis</th>
                  <th className="p-2 border border-slate-300 text-center">Max Operating Speed</th>
                  <th className="p-2 border border-slate-300 text-center">Reflected Inertia (J_total)</th>
                  <th className="p-2 border border-slate-300 text-center">Decel Stop Time</th>
                  <th className="p-2 border border-slate-300 text-center">Machine Stop Distance</th>
                  <th className="p-2 border border-slate-300 text-center">Recommended Safety Overtravel</th>
                </tr>
              </thead>
              <tbody>
                {axes.map(axis => {
                  const p = axis.parameters || {};
                  const dyn = calculateAxisDynamics(p);
                  const isLinear = p.axisUsage === 'Linear';
                  const maxSpeed = parseFloat(String(p.peakSpeed || p.ratedSpeed || 3000));
                  const peakTorque = parseFloat(String(p.peakTorque || 10));
                  const stop = calculateMaxStop(
                    dyn.totalInertiaKgM2,
                    maxSpeed,
                    peakTorque,
                    dyn.frictionTorqueNm,
                    parseFloat(String(p.feedConstant || 10)),
                    dyn.gearboxRatio,
                    isLinear
                  );
                  const unit = isLinear ? 'mm' : '°';

                  return (
                    <tr key={axis.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-200 font-bold">{axis.label}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{maxSpeed} RPM</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{dyn.totalInertiaKgCm2.toFixed(2)} kg·cm²</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold text-red-700">{stop.stopTimeSec} s</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold">{stop.stopDistanceMm} {unit}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-semibold text-slate-600">≥ {(stop.stopDistanceMm * 1.5).toFixed(0)} {unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signoff / Certification Footer */}
          <div className="mt-12 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold">Prepared by: {author || 'Lead Engineer'}</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold">Verified by: Technical Safety Office</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold">Approved for Procurement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
