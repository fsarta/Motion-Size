import React from 'react';
import { 
  File, FolderOpen, Save, Printer, Settings, 
  Activity, Play, StopCircle, Calculator, 
  HelpCircle, Box, Zap, PlusSquare, Table,
  Undo2, Redo2, Wand2, Boxes
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

const MenuBar = () => (
  <div className="flex items-center space-x-2 px-2 py-1 bg-white border-b border-gray-200 text-xs text-gray-700">
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">File</span>
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">Edit</span>
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">Axis</span>
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">View</span>
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">Tools</span>
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">Languages</span>
    <span className="hover:bg-gray-100 px-2 py-0.5 cursor-pointer">Help</span>
  </div>
);

const RibbonButton: React.FC<{ icon: React.ReactNode; label: string; sub?: boolean; onClick?: () => void; disabled?: boolean }> = ({ icon, label, sub, onClick, disabled }) => (
  <div 
    onClick={disabled ? undefined : onClick}
    className={`flex flex-col items-center justify-center px-3 py-1 border border-transparent rounded-sm h-full select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-win-hover hover:border-win-select cursor-pointer group'}`}
  >
    <div className={`mb-0.5 ${disabled ? 'text-gray-400' : 'text-gray-600 group-hover:text-blue-600'}`}>
      {icon}
    </div>
    <span className={`text-xxs text-center leading-none ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-black'}`}>
      {label}
    </span>
    {sub && <div className="text-[8px] text-gray-400">▼</div>}
  </div>
);

const Separator = () => <div className="w-px h-10 bg-gray-300 mx-1"></div>;

interface RibbonProps {
  onAddAxis?: () => void;
  onOpenCamManager?: () => void;
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onOpenBOM?: () => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ onAddAxis, onOpenCamManager, onSave, onOpen, onNew, onOpenBOM }) => {
  const { undo, redo, history, setIsWizardOpen } = useProjectStore();
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="flex flex-col w-full bg-gray-50 border-b border-gray-300 shadow-sm shrink-0">
      <MenuBar />
      <div className="flex items-center p-1 h-16 overflow-x-auto">
        <RibbonButton icon={<File size={20} />} label="New" onClick={onNew} />
        <RibbonButton icon={<FolderOpen size={20} />} label="Open" onClick={onOpen} />
        <RibbonButton icon={<Save size={20} />} label="Save" onClick={onSave} />
        <RibbonButton icon={<Printer size={20} />} label="Print" />
        
        <Separator />
        
        <RibbonButton icon={<Undo2 size={20} />} label="Undo" onClick={undo} disabled={!canUndo} />
        <RibbonButton icon={<Redo2 size={20} />} label="Redo" onClick={redo} disabled={!canRedo} />
        
        <Separator />
        
        <RibbonButton icon={<PlusSquare size={20} className="text-green-600" />} label="Add Axis" onClick={onAddAxis} />
        <RibbonButton icon={<Settings size={20} />} label="Manage Axes" />
        <RibbonButton icon={<Table size={20} className="text-purple-600" />} label="Cam Tables" onClick={onOpenCamManager} />
        <RibbonButton icon={<Activity size={20} className="text-yellow-600" />} label="System Check" />
        <RibbonButton icon={<Box size={20} />} label="Project Notes" />
        <RibbonButton icon={<Calculator size={20} />} label="BOM" />
        <RibbonButton icon={<Boxes size={20} className="text-blue-600" />} label="Global BOM" onClick={onOpenBOM} />
        
        <Separator />
        
        <RibbonButton icon={<Wand2 size={20} className="text-purple-500" />} label="EasySize Wizard" onClick={() => setIsWizardOpen(true)} />
        <RibbonButton icon={<StopCircle size={20} className="text-red-500" />} label="Max-Stop" />
        <RibbonButton icon={<div className="font-bold text-blue-700 bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">v4</div>} label="v4 Mode" />

        <div className="ml-auto flex items-center space-x-2">
           <div className="flex items-center text-xs text-gray-600 hover:bg-white border border-transparent hover:border-gray-300 px-2 py-1 cursor-pointer">
             <span className="mr-1">✉️</span> Request Vendor Product Data
           </div>
        </div>
      </div>
    </div>
  );
};