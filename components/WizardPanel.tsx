import React from 'react';
import { ArrowLeft, ArrowRight, HelpCircle, FileText } from 'lucide-react';

const WizardButton = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
  <button className="flex flex-col items-center justify-center p-1 px-2 border border-gray-300 bg-gray-100 hover:bg-gray-200 rounded shadow-sm text-xs min-w-[60px]">
    <div className="mb-0.5 text-gray-700">{icon}</div>
    <span>{label}</span>
  </button>
);

export const WizardPanel = () => {
  return (
    <div className="w-64 bg-white border-l border-gray-300 h-full flex flex-col shrink-0 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-100 px-2 py-1 border-b border-gray-300 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-700">EasySize Wizard</span>
        <div className="transform rotate-45 text-gray-400">📌</div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Start</h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          The EasySize Wizard provides step-by-step instructions for setting up your project. At any time, you can launch the wizard, jump to any step or exit the wizard.
        </p>
      </div>

      {/* Tip Box */}
      <div className="p-3 bg-yellow-50 border-t border-b border-yellow-100 mb-auto">
        <h4 className="text-xs font-bold text-gray-700 mb-1">Tip</h4>
        <p className="text-[11px] text-gray-600">
          Press F1 or click the help button to open the help file at the appropriate topic.
        </p>
      </div>

      {/* Footer Nav */}
      <div className="p-2 bg-gray-50 border-t border-gray-300 grid grid-cols-4 gap-1">
         <WizardButton label="Go to" icon={<FileText size={16} className="text-blue-600" />} />
         <WizardButton label="Previous" icon={<ArrowLeft size={16} className="text-green-700" />} />
         <WizardButton label="Next" icon={<ArrowRight size={16} className="text-green-700" />} />
         <WizardButton label="Help" icon={<HelpCircle size={16} className="text-blue-600" />} />
      </div>
    </div>
  );
};