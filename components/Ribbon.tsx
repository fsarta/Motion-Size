import React from 'react';
import { 
  File, FolderOpen, Save, Printer, Settings, 
  Activity, Play, StopCircle, Calculator, 
  HelpCircle, Box, Zap, PlusSquare, Table,
  Undo2, Redo2, Wand2, Boxes, Check, Globe,
  SlidersHorizontal
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

const RibbonButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  sub?: boolean; 
  onClick?: () => void; 
  disabled?: boolean;
  highlight?: boolean;
}> = ({ icon, label, sub, onClick, disabled, highlight }) => (
  <div 
    onClick={disabled ? undefined : onClick}
    className={`flex flex-col items-center justify-center px-3 py-1 border rounded-sm h-full select-none transition-colors ${
      disabled 
        ? 'opacity-40 cursor-not-allowed border-transparent' 
        : highlight 
          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer text-blue-900 group'
          : 'border-transparent hover:bg-win-hover hover:border-win-select cursor-pointer group'
    }`}
  >
    <div className={`mb-0.5 ${disabled ? 'text-gray-400' : 'text-gray-600 group-hover:text-blue-600'}`}>
      {icon}
    </div>
    <span className={`text-xxs text-center leading-none ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-black font-medium'}`}>
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
  onOpenSystemCheck?: () => void;
  onOpenMaxStop?: () => void;
  onOpenProjectNotes?: () => void;
  onOpenReport?: () => void;
  onOpenCatalog?: () => void;
  onOpenDoc?: () => void;
  onOpenAbout?: () => void;
  currentLang?: string;
  onLangChange?: (lang: string) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ 
  onAddAxis, 
  onOpenCamManager, 
  onSave, 
  onOpen, 
  onNew, 
  onOpenBOM,
  onOpenSystemCheck,
  onOpenMaxStop,
  onOpenProjectNotes,
  onOpenReport,
  onOpenCatalog,
  onOpenDoc,
  onOpenAbout,
  currentLang = 'en',
  onLangChange
}) => {
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

  const handleAction = (action?: () => void) => {
    setActiveMenu(null);
    if (action) action();
  };

  const Dropdown = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return (
      <div className="absolute top-full left-0 mt-0 bg-white border border-gray-300 shadow-xl py-1 min-w-[170px] z-50 text-xs rounded-sm">
        {children}
      </div>
    );
  };

  const MenuItem = ({ 
    label, 
    onClick, 
    disabled, 
    hasSub,
    checked 
  }: { 
    label: string, 
    onClick?: () => void, 
    disabled?: boolean, 
    hasSub?: boolean,
    checked?: boolean 
  }) => (
    <div 
      className={`px-4 py-1.5 flex justify-between items-center ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-900 cursor-pointer'}`}
      onClick={(e) => {
        if (!disabled && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <span className="flex items-center">
        {checked && <Check size={12} className="mr-1.5 text-blue-600" />}
        {label}
      </span>
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
          <div className={`px-2 py-0.5 cursor-pointer rounded ${activeMenu === 'File' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('File')}>File</div>
          <Dropdown show={activeMenu === 'File'}>
            <MenuItem label="New Project" onClick={() => handleAction(onNew)} />
            <MenuItem label="Open Project..." onClick={() => handleAction(onOpen)} />
            <MenuDivider />
            <MenuItem label="Save Project" onClick={() => handleAction(onSave)} />
            <MenuItem label="Save Project As..." onClick={() => handleAction(onSave)} />
            <MenuDivider />
            <MenuItem label="Print Technical Report..." onClick={() => handleAction(onOpenReport)} />
            <MenuItem label="Export Global BOM (CSV)..." onClick={() => handleAction(onOpenBOM)} />
            <MenuDivider />
            <MenuItem label="Project Notes..." onClick={() => handleAction(onOpenProjectNotes)} />
          </Dropdown>
        </div>

        {/* EDIT */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer rounded ${activeMenu === 'Edit' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Edit')}>Edit</div>
          <Dropdown show={activeMenu === 'Edit'}>
            <MenuItem label="Undo" disabled={!canUndo} onClick={() => handleAction(undo)} />
            <MenuItem label="Redo" disabled={!canRedo} onClick={() => handleAction(redo)} />
            <MenuDivider />
            <MenuItem label="Delete Selected Item" disabled={!selectedNodeId} onClick={() => handleAction(handleDeleteSelected)} />
          </Dropdown>
        </div>

        {/* AXIS */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer rounded ${activeMenu === 'Axis' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Axis')}>Axis</div>
          <Dropdown show={activeMenu === 'Axis'}>
            <MenuItem label="Add New Axis" onClick={() => handleAction(onAddAxis)} />
            <MenuItem label="EasySize Wizard..." onClick={() => handleAction(() => setIsWizardOpen(true))} />
            <MenuDivider />
            <MenuItem label="Emergency Stop Analysis (Max-Stop)..." onClick={() => handleAction(onOpenMaxStop)} />
          </Dropdown>
        </div>

        {/* TOOLS */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer rounded ${activeMenu === 'Tools' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Tools')}>Tools</div>
          <Dropdown show={activeMenu === 'Tools'}>
            <MenuItem label="System Diagnostics Check" onClick={() => handleAction(onOpenSystemCheck)} />
            <MenuItem label="Cam Tables Manager..." onClick={() => handleAction(onOpenCamManager)} />
            <MenuItem label="EasySize Wizard..." onClick={() => handleAction(() => setIsWizardOpen(true))} />
            <MenuItem label="Max-Stop Braking Analysis..." onClick={() => handleAction(onOpenMaxStop)} />
            <MenuDivider />
            <MenuItem label="Project Notes & Documentation..." onClick={() => handleAction(onOpenProjectNotes)} />
            <MenuItem label="Bill of Materials (BOM)..." onClick={() => handleAction(onOpenBOM)} />
          </Dropdown>
        </div>

        {/* VIEW / LANGUAGE */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer rounded ${activeMenu === 'View' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('View')}>View</div>
          <Dropdown show={activeMenu === 'View'}>
            <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase">Languages</div>
            <MenuItem label="English" checked={currentLang === 'en'} onClick={() => handleAction(() => onLangChange?.('en'))} />
            <MenuItem label="Italiano" checked={currentLang === 'it'} onClick={() => handleAction(() => onLangChange?.('it'))} />
            <MenuDivider />
            <MenuItem label="Technical Report Sheet" onClick={() => handleAction(onOpenReport)} />
          </Dropdown>
        </div>

        {/* HELP */}
        <div className="relative">
          <div className={`px-2 py-0.5 cursor-pointer rounded ${activeMenu === 'Help' ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-gray-100'}`} onClick={() => handleMenuClick('Help')}>Help</div>
          <Dropdown show={activeMenu === 'Help'}>
            <MenuItem label="Documentation & Formulas (F1)..." onClick={() => handleAction(onOpenDoc)} />
            <MenuItem label="Keyboard Shortcuts..." onClick={() => handleAction(onOpenDoc)} />
            <MenuDivider />
            <MenuItem label="About Motion-Size..." onClick={() => handleAction(onOpenAbout)} />
          </Dropdown>
        </div>
      </div>

      {/* Main Ribbon Buttons Area */}
      <div className="flex items-center p-1 h-16 overflow-x-auto">
        <RibbonButton icon={<File size={20} className="text-blue-600" />} label="New" onClick={onNew} />
        <RibbonButton icon={<FolderOpen size={20} className="text-amber-600" />} label="Open" onClick={onOpen} />
        <RibbonButton icon={<Save size={20} className="text-green-600" />} label="Save" onClick={onSave} />
        <RibbonButton icon={<Printer size={20} className="text-gray-700" />} label="Report" onClick={onOpenReport} />
        
        <Separator />
        
        <RibbonButton icon={<Undo2 size={20} />} label="Undo" onClick={undo} disabled={!canUndo} />
        <RibbonButton icon={<Redo2 size={20} />} label="Redo" onClick={redo} disabled={!canRedo} />
        
        <Separator />
        
        <RibbonButton icon={<PlusSquare size={20} className="text-emerald-600" />} label="Add Axis" onClick={onAddAxis} />
        <RibbonButton icon={<SlidersHorizontal size={20} className="text-sky-600" />} label="Catalog" onClick={onOpenCatalog} />
        <RibbonButton icon={<Table size={20} className="text-purple-600" />} label="Cam Tables" onClick={onOpenCamManager} />
        <RibbonButton icon={<Activity size={20} className="text-blue-600" />} label="System Check" onClick={onOpenSystemCheck} highlight={true} />
        <RibbonButton icon={<Box size={20} className="text-indigo-600" />} label="Project Notes" onClick={onOpenProjectNotes} />
        <RibbonButton icon={<Boxes size={20} className="text-teal-600" />} label="Global BOM" onClick={onOpenBOM} />
        <RibbonButton icon={<StopCircle size={20} className="text-red-600" />} label="Max-Stop" onClick={onOpenMaxStop} />

        <Separator />

        <RibbonButton icon={<Wand2 size={20} className="text-purple-600" />} label="EasySize Wizard" onClick={() => setIsWizardOpen(true)} highlight={true} />

        {/* Right side Language and Help */}
        <div className="ml-auto flex items-center space-x-3 pr-2">
          <button 
            onClick={() => onLangChange?.(currentLang === 'en' ? 'it' : 'en')}
            className="flex items-center space-x-1 text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 shadow-sm text-gray-700 font-bold"
            title="Switch Language (EN / IT)"
          >
            <Globe size={13} className="text-blue-600" />
            <span>{currentLang === 'en' ? 'EN' : 'IT'}</span>
          </button>

          <button 
            onClick={onOpenDoc}
            className="flex items-center space-x-1 text-xs px-2 py-1 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-blue-800 font-medium"
          >
            <HelpCircle size={14} className="text-blue-600" />
            <span>Help (F1)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
