import React from 'react';
import { X, Printer, Download, CheckCircle2, AlertTriangle, FileText, Cpu, Zap, Cog, ShieldCheck } from 'lucide-react';
import { TreeNode } from '../../types';
import { calculateAxisDynamics, calculateMaxStop, calculateEquivalentBearingLife } from '../../utils/physics';

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

          {/* Detailed Certified Component Datasheets & Verification */}
          <div className="mb-6 break-before-page">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1 mb-4">
              4. Certified Component Technical Datasheets & Mechanical Verification
            </h2>

            <div className="space-y-6">
              {axes.map((axis, idx) => {
                const p = axis.parameters || {};
                const dyn = calculateAxisDynamics(p);
                const motorBearing = calculateEquivalentBearingLife(
                  20000,
                  p.maxRadialForce || 750,
                  p.ratedSpeed || 3000,
                  (p.maxRadialForce || 750) * 0.45,
                  (p.ratedSpeed || 3000) * 0.7,
                  'ball'
                );

                const gearboxBearing = calculateEquivalentBearingLife(
                  20000,
                  p.gearboxMaxRadialForce || 1650,
                  Math.max(100, (p.gearboxMaxInputSpeed || 5000) / dyn.gearboxRatio),
                  (p.gearboxMaxRadialForce || 1650) * 0.45,
                  Math.max(10, ((p.ratedSpeed || 3000) / dyn.gearboxRatio) * 0.7),
                  'ball'
                );

                return (
                  <div key={axis.id} className="border border-slate-300 rounded p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                        <span className="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">Axis {idx + 1}</span>
                        <span>{axis.label}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Mechanism: {p.mechanismType || 'Belt'} | Total Moving Mass: {dyn.totalMovingMassKg} kg
                      </div>
                    </div>

                    {/* Motor Datasheet Section */}
                    {p.motorModel ? (
                      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-xs text-blue-900 flex items-center">
                            <Cpu size={14} className="mr-1.5 text-blue-600" />
                            Servo Motor: {p.motorVendor} {p.motorModel}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Insulation: {p.insulationClass || 'Class F (155°C)'} | Protection: {p.protectionClass || 'IP65'}
                          </div>
                        </div>

                        {/* Motor Specs Grid */}
                        <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2 rounded">
                          <div><span className="text-slate-500">Rated Power:</span> <strong className="font-mono">{p.ratedPower || '-'} kW</strong></div>
                          <div><span className="text-slate-500">Rated Torque (MN):</span> <strong className="font-mono text-emerald-800">{p.ratedTorque || '-'} Nm</strong></div>
                          <div><span className="text-slate-500">Peak Torque (Mmax):</span> <strong className="font-mono text-amber-800">{p.peakTorque || '-'} Nm</strong></div>
                          <div><span className="text-slate-500">Rated Speed:</span> <strong className="font-mono">{p.ratedSpeed || '-'} RPM</strong></div>

                          <div><span className="text-slate-500">Rated Current:</span> <strong className="font-mono">{p.ratedCurrent || '-'} Arms</strong></div>
                          <div><span className="text-slate-500">Torque Const. (Kt):</span> <strong className="font-mono">{p.torqueConstant || '-'} Nm/A</strong></div>
                          <div><span className="text-slate-500">Voltage Const. (Ke):</span> <strong className="font-mono">{p.voltageConstant || '-'} V/krpm</strong></div>
                          <div><span className="text-slate-500">Rotor Inertia (JM):</span> <strong className="font-mono">{p.motorInertia || '-'} kg·cm²</strong></div>

                          <div><span className="text-slate-500">Motor Mass:</span> <strong className="font-mono">{p.motorMass || '-'} kg</strong></div>
                          <div><span className="text-slate-500">Flange Size:</span> <strong className="font-mono">{p.flangeSize || '-'} mm</strong></div>
                          <div><span className="text-slate-500">Shaft Dimensions:</span> <strong className="font-mono">Dia {p.shaftDiameter || '-'}x{p.shaftLength || '-'} mm</strong></div>
                          <div><span className="text-slate-500">Permissible Fr:</span> <strong className="font-mono text-blue-900">{p.maxRadialForce || 750} N</strong></div>
                        </div>

                        {/* Motor Bearing Life */}
                        <div className="flex items-center justify-between text-[10px] bg-blue-50/50 p-2 rounded border border-blue-100">
                          <span className="text-slate-700">
                            <strong>ISO 281 Motor Bearing Service Life (L10h):</strong> {motorBearing.lifeHours.toLocaleString()} operating hours ({motorBearing.lifeYears} years @ 4,000 h/yr)
                          </span>
                          <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                            {motorBearing.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Servo Motor not configured for this axis.</div>
                    )}

                    {/* Drive Datasheet Section */}
                    {p.driveModel && (
                      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
                        <div className="font-bold text-xs text-slate-800 flex items-center">
                          <Zap size={14} className="mr-1.5 text-amber-600" />
                          Servo Inverter: {p.driveVendor} {p.driveModel}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2 rounded">
                          <div><span className="text-slate-500">Supply Voltage:</span> <strong className="font-mono">{p.driveSupplyVoltage || 400} V AC</strong></div>
                          <div><span className="text-slate-500">Peak Output Current:</span> <strong className="font-mono text-amber-800">{p.driveMaxCurrent || '-'} Arms</strong></div>
                          <div><span className="text-slate-500">PWM Frequency:</span> <strong className="font-mono">{p.pwmFrequency || 8} kHz</strong></div>
                          <div><span className="text-slate-500">DC Bus Capacitance:</span> <strong className="font-mono">{p.driveInternalBusCapacitance || 220} uF</strong></div>
                        </div>
                      </div>
                    )}

                    {/* Gearbox Datasheet Section */}
                    {p.gearboxModel && (
                      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
                        <div className="font-bold text-xs text-slate-800 flex items-center">
                          <Cog size={14} className="mr-1.5 text-blue-600" />
                          Precision Gearbox: {p.gearboxVendor} {p.gearboxModel}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2 rounded">
                          <div><span className="text-slate-500">Ratio (i):</span> <strong className="font-mono text-blue-900">{dyn.gearboxRatio}:1</strong></div>
                          <div><span className="text-slate-500">Nominal Torque (T2N):</span> <strong className="font-mono text-emerald-800">{p.gearboxNominalTorque || '-'} Nm</strong></div>
                          <div><span className="text-slate-500">Max Accel Torque:</span> <strong className="font-mono text-amber-800">{p.gearboxMaxTorque || '-'} Nm</strong></div>
                          <div><span className="text-slate-500">Torsional Backlash:</span> <strong className="font-mono">{p.gearboxBacklash || '-'} arcmin</strong></div>

                          <div><span className="text-slate-500">Torsional Rigidity:</span> <strong className="font-mono">{p.gearboxTorsionalRigidity || '-'} Nm/arcmin</strong></div>
                          <div><span className="text-slate-500">Efficiency:</span> <strong className="font-mono">{p.gearboxEfficiency || 97}%</strong></div>
                          <div><span className="text-slate-500">Input Inertia (J1):</span> <strong className="font-mono">{p.gearboxInertia || '-'} kg·cm²</strong></div>
                          <div><span className="text-slate-500">Output Permissible Fr2:</span> <strong className="font-mono text-blue-900">{p.gearboxMaxRadialForce || 1650} N</strong></div>
                        </div>

                        {/* Gearbox Bearing Life */}
                        <div className="flex items-center justify-between text-[10px] bg-blue-50/50 p-2 rounded border border-blue-100">
                          <span className="text-slate-700">
                            <strong>Output Shaft Bearing Service Life (L10h):</strong> {gearboxBearing.lifeHours.toLocaleString()} operating hours ({gearboxBearing.lifeYears} years @ 4,000 h/yr)
                          </span>
                          <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                            {gearboxBearing.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
