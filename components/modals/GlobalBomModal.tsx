import React from 'react';
import { X, Download, Boxes, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TreeNode } from '../../types';
import { exportProjectToCSV, downloadCSV } from '../../utils/exportUtils';
import { calculateAxisDynamics } from '../../utils/physics';

interface GlobalBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TreeNode[];
}

export const GlobalBomModal: React.FC<GlobalBomModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const axes: TreeNode[] = [];
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'axis') {
        axes.push(node);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  };
  traverse(data);

  const handleExport = () => {
    const csvContent = exportProjectToCSV(data);
    downloadCSV(csvContent, 'Motion_Size_Global_BOM.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[1050px] max-h-[85vh] bg-white flex flex-col shadow-2xl rounded border border-gray-300 font-sans text-xs">
        <div className="flex justify-between items-center px-4 py-2.5 bg-slate-100 border-b border-gray-300">
          <div className="flex items-center space-x-2 text-slate-800">
            <Boxes size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold">Global Bill of Materials (BOM) & Equipment List</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-300 text-gray-700 font-bold uppercase text-[9px]">
                <th className="p-2 border">Axis Name</th>
                <th className="p-2 border">Mechanism</th>
                <th className="p-2 border">Gearbox</th>
                <th className="p-2 border">Ratio</th>
                <th className="p-2 border">Motor Model</th>
                <th className="p-2 border text-center">Rated Torque</th>
                <th className="p-2 border text-center">Peak Torque</th>
                <th className="p-2 border text-center">Rated Speed</th>
                <th className="p-2 border">Drive Model</th>
                <th className="p-2 border text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {axes.map(axis => {
                const p = axis.parameters || {};
                const dyn = calculateAxisDynamics(p);
                const gearbox = p.gearboxModel ? `${p.gearboxVendor || ''} ${p.gearboxModel}` : 'Direct Coupling (1:1)';
                const motor = p.motorModel ? `${p.motorVendor || ''} ${p.motorModel}` : '-';
                const drive = p.driveModel ? `${p.driveVendor || ''} ${p.driveModel}` : '-';
                const isConfigured = !!p.motorModel && !!p.driveModel;

                return (
                  <tr key={axis.id} className="border-b border-gray-200 hover:bg-blue-50/40">
                    <td className="p-2 border font-bold text-gray-800">{axis.label}</td>
                    <td className="p-2 border text-gray-600">{p.mechanismType || 'Ball Screw'} ({p.axisUsage || 'Linear'})</td>
                    <td className="p-2 border text-gray-700">{gearbox}</td>
                    <td className="p-2 border font-mono text-center">{dyn.gearboxRatio}:1</td>
                    <td className="p-2 border font-semibold text-blue-900">{motor}</td>
                    <td className="p-2 border text-center font-mono">{p.ratedTorque ? `${p.ratedTorque} Nm` : '-'}</td>
                    <td className="p-2 border text-center font-mono">{p.peakTorque ? `${p.peakTorque} Nm` : '-'}</td>
                    <td className="p-2 border text-center font-mono">{p.ratedSpeed ? `${p.ratedSpeed} RPM` : '-'}</td>
                    <td className="p-2 border font-medium text-gray-700">{drive}</td>
                    <td className="p-2 border text-center">
                      {isConfigured ? (
                        <span className="inline-flex items-center text-green-700 font-bold text-[10px] bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                          <CheckCircle2 size={11} className="mr-1"/> Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <AlertTriangle size={11} className="mr-1"/> Incomplete
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {axes.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-400">
                    No axes found in the current project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-300 flex justify-between items-center">
          <div className="text-[11px] text-gray-500">
            Total Axes: <strong>{axes.length}</strong> | Fully Sized: <strong>{axes.filter(a => a.parameters?.motorModel && a.parameters?.driveModel).length}</strong>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow"
          >
            <Download size={14} className="mr-1.5" />
            Export Equipment List (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
