import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Activity, ArrowRight } from 'lucide-react';
import { TreeNode } from '../../types';
import { calculateAxisDynamics } from '../../utils/physics';

interface SystemCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TreeNode[];
  onSelectAxis?: (id: string) => void;
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  axisLabel: string;
  axisId: string;
  message: string;
  recommendation: string;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({ 
  isOpen, 
  onClose, 
  data,
  onSelectAxis 
}) => {
  if (!isOpen) return null;

  const axes: TreeNode[] = [];
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'axis') axes.push(node);
      if (node.children) traverse(node.children);
    }
  };
  traverse(data);

  const issues: Issue[] = [];

  axes.forEach(axis => {
    const p = axis.parameters || {};
    const label = axis.label || 'Axis';
    const dyn = calculateAxisDynamics(p);

    // 1. Missing Motor
    if (!p.motorModel) {
      issues.push({
        type: 'error',
        axisLabel: label,
        axisId: axis.id,
        message: 'No servomotor has been selected for this axis.',
        recommendation: 'Go to the Motor tab and choose a motor from the catalog matching your torque/speed requirements.'
      });
    }

    // 2. Missing Drive
    if (!p.driveModel) {
      issues.push({
        type: 'error',
        axisLabel: label,
        axisId: axis.id,
        message: 'No servo drive / inverter has been selected for this axis.',
        recommendation: 'Go to the Drive tab and select a drive with sufficient rated current.'
      });
    }

    // 3. Drive Current compatibility
    if (p.motorModel && p.driveModel) {
      const motorI = parseFloat(String(p.ratedCurrent || 0));
      const driveI = parseFloat(String(p.driveMaxCurrent || 0));
      if (driveI > 0 && motorI > 0 && driveI < motorI) {
        issues.push({
          type: 'error',
          axisLabel: label,
          axisId: axis.id,
          message: `Drive max current (${driveI} A) is less than motor rated current (${motorI} A).`,
          recommendation: 'Select a larger drive to avoid power limitation and inverter tripping.'
        });
      }
    }

    // 4. Inertia Ratio Check
    if (p.motorModel && p.motorInertia) {
      const allowedRatio = parseFloat(String(p.allowableInertiaRatio || 10));
      const currentRatio = dyn.inertiaRatio;
      if (currentRatio > allowedRatio) {
        issues.push({
          type: 'warning',
          axisLabel: label,
          axisId: axis.id,
          message: `Inertia ratio (${currentRatio.toFixed(1)}:1) exceeds recommended limit (${allowedRatio}:1).`,
          recommendation: 'Increase gearbox reduction ratio, select a motor with larger rotor inertia, or reduce moving load mass.'
        });
      }
    }

    // 5. Gearbox max input speed check
    if (p.gearboxModel && p.gearboxMaxInputSpeed && p.peakSpeed) {
      const gbMax = parseFloat(String(p.gearboxMaxInputSpeed));
      const motorPeak = parseFloat(String(p.peakSpeed));
      if (motorPeak > gbMax) {
        issues.push({
          type: 'warning',
          axisLabel: label,
          axisId: axis.id,
          message: `Motor peak speed (${motorPeak} RPM) exceeds gearbox max input speed (${gbMax} RPM).`,
          recommendation: 'Choose a gearbox model rated for higher input speeds or limit motion profile speed.'
        });
      }
    }

    // 6. Inclination without brake
    if (parseFloat(String(p.inclineAngle || 0)) > 20 && dyn.gravityTorqueNm > 0.5) {
      issues.push({
        type: 'info',
        axisLabel: label,
        axisId: axis.id,
        message: `Inclined axis (${p.inclineAngle}°) generates significant static gravity torque (${dyn.gravityTorqueNm.toFixed(2)} Nm).`,
        recommendation: 'Ensure motor is equipped with an integrated holding brake (failsafe) or counterweight.'
      });
    }
  });

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const isHealthy = errorCount === 0 && warningCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[850px] max-h-[85vh] bg-white rounded shadow-2xl border border-gray-300 flex flex-col overflow-hidden font-sans text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-100 border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="text-blue-600" size={18} />
            <h2 className="text-sm font-bold text-gray-800">Comprehensive System Diagnostics & Health Check</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-600"><X size={16} /></button>
        </div>

        {/* Status Banner */}
        <div className={`p-4 border-b flex items-center justify-between ${isHealthy ? 'bg-green-50 border-green-200 text-green-900' : errorCount > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
          <div className="flex items-center space-x-3">
            {isHealthy ? <CheckCircle2 size={24} className="text-green-600"/> : errorCount > 0 ? <XCircle size={24} className="text-red-600"/> : <AlertTriangle size={24} className="text-amber-600"/>}
            <div>
              <div className="font-bold text-sm">
                {isHealthy ? 'All Systems Validated & Compliant' : `${errorCount} Critical Errors, ${warningCount} Engineering Warnings Detected`}
              </div>
              <div className="text-xs opacity-80">
                {isHealthy ? 'All axes have valid motor/drive selections and conform to dynamic and thermal constraints.' : 'Review the diagnostic list below to correct potential dimensioning issues.'}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-white rounded border border-gray-300 font-bold">{axes.length} Axes Checked</span>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {issues.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-green-500 opacity-60" />
              <p className="font-bold text-gray-700">No issues found!</p>
              <p className="text-xs text-gray-500">The electromechanical sizing parameters are valid and ready for commissioning.</p>
            </div>
          ) : (
            issues.map((issue, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded border text-xs flex items-start space-x-3 ${issue.type === 'error' ? 'bg-red-50/50 border-red-200' : issue.type === 'warning' ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/50 border-blue-200'}`}
              >
                <div className="mt-0.5">
                  {issue.type === 'error' ? <XCircle size={16} className="text-red-600" /> : issue.type === 'warning' ? <AlertTriangle size={16} className="text-amber-600" /> : <Activity size={16} className="text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-800">{issue.axisLabel}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${issue.type === 'error' ? 'bg-red-100 text-red-700' : issue.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {issue.type}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium mb-1">{issue.message}</p>
                  <p className="text-gray-500 text-[11px]"><strong>Recommendation:</strong> {issue.recommendation}</p>
                </div>
                {onSelectAxis && (
                  <button 
                    onClick={() => { onSelectAxis(issue.axisId); onClose(); }}
                    className="flex items-center text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-gray-300 px-2 py-1 rounded shadow-sm shrink-0"
                  >
                    Fix Axis <ArrowRight size={10} className="ml-1"/>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-300 flex justify-end">
          <button onClick={onClose} className="px-5 py-1.5 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
