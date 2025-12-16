import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TreeNode } from '../../types';

export const DeleteConfirmationModal = ({ node, onConfirm, onCancel }: { node: TreeNode | null, onConfirm: () => void, onCancel: () => void }) => {
  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
      <div className="bg-win-bg border border-gray-400 shadow-xl w-80 font-sans text-xs">
        <div className="bg-gradient-to-r from-red-100 to-gray-100 px-2 py-1 border-b border-gray-300 flex items-center text-gray-700 font-bold">
          <AlertTriangle size={14} className="mr-2 text-red-600" />
          Confirm Delete
        </div>
        <div className="p-4 bg-white flex flex-col items-center text-center">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete <br/>
            <span className="font-bold">"{node.label}"</span>?
          </p>
          <div className="flex space-x-3 w-full justify-center">
             <button 
               onClick={onConfirm}
               className="px-4 py-1 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 rounded shadow-sm text-gray-700 font-medium w-20"
             >
               Yes
             </button>
             <button 
               onClick={onCancel}
               className="px-4 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded shadow-sm text-gray-700 w-20"
             >
               No
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}