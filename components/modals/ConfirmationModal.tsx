import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

type ModalVariant = 'danger' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = "Yes", 
  cancelLabel = "No",
  variant = 'info'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
      <div className="bg-win-bg border border-gray-400 shadow-xl w-80 font-sans text-xs">
        <div className={`px-2 py-1 border-b border-gray-300 flex items-center font-bold
            ${isDanger ? 'bg-gradient-to-r from-red-100 to-gray-100 text-gray-700' : 'bg-gradient-to-r from-blue-100 to-gray-100 text-gray-700'}
        `}>
          {isDanger ? (
            <AlertTriangle size={14} className="mr-2 text-red-600" />
          ) : (
            <Info size={14} className="mr-2 text-blue-600" />
          )}
          {title}
        </div>
        <div className="p-4 bg-white flex flex-col items-center text-center">
          <div className="mb-4 text-gray-700">
            {message}
          </div>
          <div className="flex space-x-3 w-full justify-center">
             <button 
               onClick={onConfirm}
               className={`px-4 py-1 bg-white border border-gray-300 rounded shadow-sm font-medium w-20
                 ${isDanger ? 'hover:bg-red-50 hover:border-red-300 text-gray-700' : 'hover:bg-blue-50 hover:border-blue-300 text-gray-700'}
               `}
             >
               {confirmLabel}
             </button>
             <button 
               onClick={onCancel}
               className="px-4 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded shadow-sm text-gray-700 w-20"
             >
               {cancelLabel}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
