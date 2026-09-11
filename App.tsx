import React from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { HelpCircle, X } from 'lucide-react';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { CamTableManagerModal } from './components/modals/CamTableManagerModal';
import { WizardPanel } from './components/WizardPanel';
import { useProjectStore } from './store/useProjectStore';
import { downloadProjectFile, openProjectFile, loadAutoSave } from './utils/projectIO';
import { initialData } from './initialData';
import { GlobalBomModal } from './components/modals/GlobalBomModal';

const Footer = () => (
  <div className="h-6 bg-win-blue/10 border-t border-gray-300 flex items-center px-2 text-xs text-gray-600 justify-between shrink-0">
    <div className="flex items-center space-x-4">
      <div className="flex items-center cursor-pointer hover:text-black">
        <HelpCircle size={12} className="mr-1 text-blue-600" />
        <span>Press F1 for Help</span>
      </div>
      <div className="border-l border-gray-300 pl-4 h-3 flex items-center">
         Country: all
      </div>
    </div>
  </div>
);

const App = () => {
  const [isBOMOpen, setIsBOMOpen] = React.useState(false);
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
    updateNode,
    addAxis,
    addGroup,
    deleteNode,
    pasteNode,
    moveNode,
    setClipboard,
    setSelectedNodeId,
    loadProject,
  } = useProjectStore();

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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[800px] h-[600px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
            <button onClick={() => setIsWizardOpen(false)} className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full z-10">
              <X size={20} className="text-gray-500" />
            </button>
            <WizardPanel />
          </div>
        </div>
      )}
      <GlobalBomModal isOpen={isBOMOpen} onClose={() => setIsBOMOpen(false)} data={data} />
      <Ribbon onAddAxis={addAxis} onOpenCamManager={() => setIsCamManagerOpen(true)} onSave={handleSave} onOpen={handleOpen} onNew={handleNew} onOpenBOM={() => setIsBOMOpen(true)} />
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView 
          data={data} 
          onToggle={toggleNode} 
          onSelect={setSelectedNodeId} 
          selectedId={selectedNodeId} 
          onAddGroup={addGroup} 
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
      <Footer />
    </div>
  );
};

export default App;
