import React, { useState, useEffect } from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { HelpCircle, X, ShieldAlert, Cpu } from 'lucide-react';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { CamTableManagerModal } from './components/modals/CamTableManagerModal';
import { WizardPanel } from './components/WizardPanel';
import { GlobalBomModal } from './components/modals/GlobalBomModal';
import { SystemCheckModal } from './components/modals/SystemCheckModal';
import { MaxStopModal } from './components/modals/MaxStopModal';
import { ProjectNotesModal } from './components/modals/ProjectNotesModal';
import { TechnicalReportModal } from './components/modals/TechnicalReportModal';
import { DocModal } from './components/modals/DocModal';
import { AboutModal } from './components/modals/AboutModal';
import { CatalogExplorerModal } from './components/modals/CatalogExplorerModal';
import { ComponentDatasheetModal } from './components/modals/ComponentDatasheetModal';
import { MotorSpec, DriveSpec, GearboxSpec } from './types';

import { useProjectStore } from './store/useProjectStore';
import { downloadProjectFile, openProjectFile } from './utils/projectIO';
import { initialData } from './initialData';

const Footer = ({ 
  currentLang, 
  onOpenDoc 
}: { 
  currentLang: string; 
  onOpenDoc: () => void 
}) => (
  <div className="h-6 bg-win-blue/10 border-t border-gray-300 flex items-center px-2 text-xs text-gray-600 justify-between shrink-0">
    <div className="flex items-center space-x-4">
      <div 
        onClick={onOpenDoc}
        className="flex items-center cursor-pointer hover:text-blue-700"
      >
        <HelpCircle size={12} className="mr-1 text-blue-600" />
        <span>{currentLang === 'it' ? 'Premi F1 per la Guida Tecnica' : 'Press F1 for Help & Theory'}</span>
      </div>
      <div className="border-l border-gray-300 pl-4 h-3 flex items-center">
        <span>ISO / IEC 60034 Standard Compliance</span>
      </div>
    </div>
    <div className="flex items-center space-x-3 text-[11px] text-gray-500">
      <span>Language: <strong>{currentLang.toUpperCase()}</strong></span>
      <span>Motion-Size v2.5.0 Professional</span>
    </div>
  </div>
);

const App = () => {
  const [isBOMOpen, setIsBOMOpen] = useState(false);
  const [isSystemCheckOpen, setIsSystemCheckOpen] = useState(false);
  const [isMaxStopOpen, setIsMaxStopOpen] = useState(false);
  const [isProjectNotesOpen, setIsProjectNotesOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [datasheetModal, setDatasheetModal] = useState<{ isOpen: boolean; type: 'motor' | 'drive' | 'gearbox'; item: any }>({
    isOpen: false,
    type: 'motor',
    item: null
  });
  const [currentLang, setCurrentLang] = useState<'en' | 'it'>('it');

  const {
    data,
    selectedNodeId,
    clipboard,
    nodeToDelete,
    isCamManagerOpen,
    isWizardOpen,
    camTables,
    addCamTable,
    deleteCamTable,
    updateCamTable,
    setNodeToDelete,
    setIsCamManagerOpen,
    setIsWizardOpen,
    toggleNode,
    addAxis,
    addGroup,
    deleteNode,
    pasteNode,
    moveNode,
    setClipboard,
    setSelectedNodeId,
    loadProject,
  } = useProjectStore();

  // F1 Global Keyboard Shortcut for Documentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsDocOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = () => downloadProjectFile(data, camTables, 'MotionSize Project');

  const handleOpen = async () => {
    try {
      const project = await openProjectFile();
      loadProject(project.data, project.camTables);
    } catch (e) {
      console.error('Failed to open project:', e);
    }
  };

  const handleNew = () => {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      loadProject(initialData, []);
    }
  };

  const handleCopy = (id: string) => {
    const node = findNode(data, id);
    if (node) setClipboard({ node: JSON.parse(JSON.stringify(node)), isCut: false });
  };

  const handleCut = (id: string) => {
    const node = findNode(data, id);
    if (node) setClipboard({ node: JSON.parse(JSON.stringify(node)), isCut: true });
  };

  const findNode = (nodes: any[], id: string): any => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleExplorerSelectMotor = (motor: MotorSpec) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, {
        motorVendor: motor.vendor,
        motorModel: motor.model,
        ratedSpeed: motor.ratedSpeed,
        ratedTorque: motor.ratedTorque,
        ratedPower: motor.ratedPower,
        ratedCurrent: motor.ratedCurrent,
        motorEfficiency: motor.efficiency,
        powerFactor: motor.powerFactor,
        motorInertia: motor.inertia,
        peakTorque: motor.peakTorque,
        peakSpeed: motor.peakSpeed,
        stallTorque: motor.stallTorque,
        stallCurrent: motor.stallCurrent,
        peakCurrent: motor.peakCurrent,
        torqueConstant: motor.torqueConstant,
        voltageConstant: motor.voltageConstant,
        windingResistance: motor.windingResistance,
        windingInductance: motor.windingInductance,
        electricalTimeConstant: motor.electricalTimeConstant,
        mechanicalTimeConstant: motor.mechanicalTimeConstant,
        thermalTimeConstant: motor.thermalTimeConstant,
        polePairs: motor.polePairs,
        insulationClass: motor.insulationClass,
        coolingType: motor.coolingType,
        motorMass: motor.motorMass,
        flangeSize: motor.flangeSize,
        shaftDiameter: motor.shaftDiameter,
        shaftLength: motor.shaftLength,
        keyway: motor.keyway,
        maxRadialForce: motor.maxRadialForce,
        maxAxialForce: motor.maxAxialForce,
        protectionClass: motor.protectionClass,
        hasBrakeOption: motor.hasBrakeOption,
        brakeTorque: motor.brakeTorque,
        brakeInertia: motor.brakeInertia,
        allowableInertiaRatio: motor.allowableInertiaRatio
      });
    }
  };

  const handleExplorerSelectDrive = (drive: DriveSpec) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, {
        driveVendor: drive.vendor,
        driveModel: drive.model,
        driveSupplyVoltage: drive.supplyVoltage,
        driveMaxCurrent: drive.maxCurrent,
        pwmFrequency: drive.pwmFrequency,
        driveNominalBusVoltage: drive.nominalBusVoltage,
        driveInternalBusCapacitance: drive.internalBusCapacitance,
        driveRatedCurrent: drive.ratedOutputCurrent,
        driveDimensions: drive.dimensions,
        driveWeight: drive.weight
      });
    }
  };

  const handleExplorerSelectGearbox = (gearbox: GearboxSpec) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, {
        gearboxVendor: gearbox.vendor,
        gearboxModel: gearbox.model,
        gearboxRatio: gearbox.ratio,
        gearboxEfficiency: gearbox.efficiency,
        gearboxInertia: gearbox.inertia,
        gearboxBacklash: gearbox.backlash,
        gearboxMaxInputSpeed: gearbox.maxInputSpeed,
        gearboxMass: gearbox.mass,
        gearboxNominalTorque: gearbox.nominalTorque,
        gearboxMaxTorque: gearbox.maxAccelerationTorque,
        gearboxMaxRadialForce: gearbox.maxRadialForce,
        gearboxMaxAxialForce: gearbox.maxAxialForce,
        gearboxTorsionalRigidity: gearbox.torsionalRigidity,
        gearboxOutputShaftDiameter: gearbox.outputShaftDiameter
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      {/* Modals */}
      <ConfirmationModal
        isOpen={!!nodeToDelete}
        title="Confirm Delete"
        message={<>Are you sure you want to delete <br/><span className="font-bold">"{nodeToDelete?.label}"</span>?</>}
        onConfirm={deleteNode}
        onCancel={() => setNodeToDelete(null)}
        variant="danger"
      />

      <CamTableManagerModal 
        isOpen={isCamManagerOpen} 
        onClose={() => setIsCamManagerOpen(false)} 
        camTables={camTables} 
        onAdd={(name) => addCamTable(name)}
        onDelete={(id) => deleteCamTable(id)}
        onUpdateTable={(table) => updateCamTable(table.id, table)}
      />

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
          <div className="w-full h-full max-w-[1400px] max-h-[900px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
            <button onClick={() => setIsWizardOpen(false)} className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full z-10">
              <X size={20} className="text-gray-500" />
            </button>
            <WizardPanel />
          </div>
        </div>
      )}

      <GlobalBomModal isOpen={isBOMOpen} onClose={() => setIsBOMOpen(false)} data={data} />
      <SystemCheckModal 
        isOpen={isSystemCheckOpen} 
        onClose={() => setIsSystemCheckOpen(false)} 
        data={data}
        onSelectAxis={(id) => setSelectedNodeId(id)}
      />
      <MaxStopModal isOpen={isMaxStopOpen} onClose={() => setIsMaxStopOpen(false)} data={data} />
      <ProjectNotesModal isOpen={isProjectNotesOpen} onClose={() => setIsProjectNotesOpen(false)} />
      <TechnicalReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} data={data} />
      <DocModal isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <CatalogExplorerModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        activeAxisName={findNode(data, selectedNodeId)?.label || 'Selected Axis'}
        onSelectMotor={handleExplorerSelectMotor}
        onSelectDrive={handleExplorerSelectDrive}
        onSelectGearbox={handleExplorerSelectGearbox}
        onOpenDatasheet={(type, item) => setDatasheetModal({ isOpen: true, type: type as any, item })}
      />

      <ComponentDatasheetModal
        isOpen={datasheetModal.isOpen}
        onClose={() => setDatasheetModal({ isOpen: false, type: 'motor', item: null })}
        type={datasheetModal.type}
        motor={datasheetModal.type === 'motor' ? datasheetModal.item : undefined}
        drive={datasheetModal.type === 'drive' ? datasheetModal.item : undefined}
        gearbox={datasheetModal.type === 'gearbox' ? datasheetModal.item : undefined}
      />

      {/* Main Layout */}
      <Ribbon 
        onAddAxis={addAxis} 
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenCamManager={() => setIsCamManagerOpen(true)} 
        onSave={handleSave} 
        onOpen={handleOpen} 
        onNew={handleNew} 
        onOpenBOM={() => setIsBOMOpen(true)}
        onOpenSystemCheck={() => setIsSystemCheckOpen(true)}
        onOpenMaxStop={() => setIsMaxStopOpen(true)}
        onOpenProjectNotes={() => setIsProjectNotesOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenDoc={() => setIsDocOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        currentLang={currentLang}
        onLangChange={(lang: any) => setCurrentLang(lang)}
      />

      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView 
          data={data} 
          onToggle={toggleNode} 
          onSelect={setSelectedNodeId} 
          selectedId={selectedNodeId} 
          onAddGroup={addGroup} 
          onAddAxis={addAxis}
          onDeleteNode={(id) => setNodeToDelete(findNode(data, id))} 
          onCopyNode={handleCopy} 
          onCutNode={handleCut} 
          onPasteNode={pasteNode} 
          onMoveNode={moveNode} 
          clipboard={clipboard?.node || null} 
        />
        <div className="flex-1 flex flex-col relative min-w-0">
          <WorkArea />
        </div>
      </div>
      <Footer currentLang={currentLang} onOpenDoc={() => setIsDocOpen(true)} />
    </div>
  );
};

export default App;
