import React from 'react';
import { X, Download } from 'lucide-react';
import { TreeNode } from '../../types';
import { exportProjectToCSV, downloadCSV } from '../../utils/exportUtils';

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
    downloadCSV(csvContent, 'Global_BOM.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[900px] max-h-[80vh] bg-white flex flex-col shadow-2xl rounded border border-gray-300">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-800">Global Bill of Materials (BOM)</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="p-2 border border-gray-200">Axis Name</th>
                <th className="p-2 border border-gray-200">Mechanism</th>
                <th className="p-2 border border-gray-200">Gearbox</th>
                <th className="p-2 border border-gray-200">Motor</th>
                <th className="p-2 border border-gray-200">Drive</th>
              </tr>
            </thead>
            <tbody>
              {axes.map(axis => {
                const p = axis.parameters || {};
                const gearbox = p.gearboxVendor ? `${p.gearboxVendor} ${p.gearboxModel}` : '-';
                const motor = p.motorVendor ? `${p.motorVendor} ${p.motorModel}` : '-';
                const drive = p.driveVendor ? `${p.driveVendor} ${p.driveModel}` : '-';

                return (
                  <tr key={axis.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 border border-gray-200">{axis.label}</td>
                    <td className="p-2 border border-gray-200">{p.mechanismType || '-'}</td>
                    <td className="p-2 border border-gray-200">{gearbox}</td>
                    <td className="p-2 border border-gray-200">{motor}</td>
                    <td className="p-2 border border-gray-200">{drive}</td>
                  </tr>
                );
              })}
              {axes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500 border border-gray-200">
                    No axes found in the project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};
