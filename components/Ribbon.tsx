import React from 'react';
import { 
  File, FolderOpen, Save, Printer, Settings, 
  Activity, Play, StopCircle, Calculator, 
  HelpCircle, Box, Zap, PlusSquare, Table,
  Undo2, Redo2, Wand2, Boxes
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

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
  const { undo, redo, history, setIsWizardOpen, selectedNodeId, setNodeToDelete, data } = useProjectStore();
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action: () => void) => {
    setActiveMenu(null);
    action();
  };

  const Dropdown = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return (
      <div className="absolute top-full left-0 mt-0 bg-white border border-gray-300 shadow-lg py-1 min-w-[150px] z-50 text-xs">
        {children}
      </div>
    );
  };

  const MenuItem = ({ label, onClick, disabled, hasSub }: { label: string, onClick?: () => void, disabled?: boolean, hasSub?: boolean }) => (
    <div 
      className={`px-4 py-1.5 flex justify-between items-center ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-100 cursor-pointer'}`}
      onClick={(e) => {
        if (!disabled && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <span>{label}</span>
      {hasSub && <span className="text-gray-400">▶</span>}
    </div>
  );

  const MenuDivider = () => <div className="h-px bg-gray-200 my-1"></div>;

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    const findNode = (nodes: any[], id: string): any => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) { const f = findNode(node.children, id); if (f) return f; }
      }
      return null;
    };
    const node = findNode(data, selectedNodeId);
    if (node) setNodeToDelete(node);
  };

  return (
    <div className="flex flex-col w-full bg-gray-50 border-b border-gray-300 shadow-sm shrink-0">
      
      {/* Top Menu Bar */}
      <div className="relative flex items-center space-x-1 px-2 py-1 bg-white border-b border-gray-200 text-xs text-gray-700 select-none" ref={menuRef}>
        
        {/* FILE */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer ${activeMenu === 'File' ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('File')}>File</div>
          <Dropdown show={activeMenu === 'File'}>
            <MenuItem label="New Project" onClick={() => handleAction(() => onNew && onNew())} />
            <MenuItem label="Open Project..." onClick={() => handleAction(() => onOpen && onOpen())} />
            <MenuDivider />
            <MenuItem label="Save" onClick={() => handleAction(() => onSave && onSave())} />
            <MenuItem label="Save As..." onClick={() => handleAction(() => onSave && onSave())} />
            <MenuDivider />
            <MenuItem label="Print Report" onClick={() => handleAction(() => window.print())} />
            <MenuItem label="Export Global BOM" onClick={() => handleAction(() => onOpenBOM && onOpenBOM())} />
            <MenuDivider />
            <MenuItem label="Exit" onClick={() => handleAction(() => window.close())} />
          </Dropdown>
        </div>

        {/* EDIT */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer ${activeMenu === 'Edit' ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Edit')}>Edit</div>
          <Dropdown show={activeMenu === 'Edit'}>
            <MenuItem label="Undo" disabled={!canUndo} onClick={() => handleAction(undo)} />
            <MenuItem label="Redo" disabled={!canRedo} onClick={() => handleAction(redo)} />
            <MenuDivider />
            <MenuItem label="Delete Selected" disabled={!selectedNodeId} onClick={() => handleAction(handleDeleteSelected)} />
          </Dropdown>
        </div>

        {/* AXIS */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer ${activeMenu === 'Axis' ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Axis')}>Axis</div>
          <Dropdown show={activeMenu === 'Axis'}>
            <MenuItem label="Add New Axis" onClick={() => handleAction(() => onAddAxis && onAddAxis())} />
            <MenuItem label="Manage Axes..." disabled onClick={() => {}} />
          </Dropdown>
        </div>

        {/* VIEW */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer ${activeMenu === 'View' ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('View')}>View</div>
          <Dropdown show={activeMenu === 'View'}>
            <MenuItem label="Toggle Ribbon" disabled onClick={() => {}} />
            <MenuItem label="Zoom In" disabled onClick={() => {}} />
            <MenuItem label="Zoom Out" disabled onClick={() => {}} />
            <MenuDivider />
            <div className="relative group">
              <MenuItem label="Languages" hasSub onClick={() => {}} />
              <div className="absolute left-[95%] top-0 hidden group-hover:block bg-white border border-gray-300 shadow-lg py-1 min-w-[120px] z-50">
                <MenuItem label="English" onClick={() => handleAction(() => {})} />
                <MenuItem label="Italiano" onClick={() => handleAction(() => {})} />
                <MenuItem label="Deutsch" onClick={() => handleAction(() => {})} />
              </div>
            </div>
          </Dropdown>
        </div>

        {/* TOOLS */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer ${activeMenu === 'Tools' ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Tools')}>Tools</div>
          <Dropdown show={activeMenu === 'Tools'}>
            <MenuItem label="Cam Tables Manager" onClick={() => handleAction(() => onOpenCamManager && onOpenCamManager())} />
            <MenuItem label="EasySize Wizard" onClick={() => handleAction(() => setIsWizardOpen(true))} />
            <MenuItem label="System Check" disabled onClick={() => {}} />
            <MenuItem label="Project Notes" disabled onClick={() => {}} />
          </Dropdown>
        </div>

        {/* HELP */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer ${activeMenu === 'Help' ? 'bg-blue-100' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Help')}>Help</div>
          <Dropdown show={activeMenu === 'Help'}>
            <MenuItem label="Documentation" disabled onClick={() => {}} />
            <MenuItem label="Keyboard Shortcuts" disabled onClick={() => {}} />
            <MenuDivider />
            <MenuItem label="About Motion-Size" disabled onClick={() => {}} />
          </Dropdown>
        </div>
      </div>

      <div className="flex items-center p-1 h-16 overflow-x-auto">
        <RibbonButton icon={<File size={20} />} label="New" onClick={onNew} />
        <RibbonButton icon={<FolderOpen size={20} />} label="Open" onClick={onOpen} />
        <RibbonButton icon={<Save size={20} />} label="Save" onClick={onSave} />
        <RibbonButton icon={<Printer size={20} />} label="Print" onClick={() => window.print()} />
        
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