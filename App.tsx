
import React from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { HelpCircle } from 'lucide-react';
import { DeleteConfirmationModal } from './components/modals/DeleteConfirmationModal';
import { CamTableManagerModal } from './components/modals/CamTableManagerModal';
import { useProjectStore } from './store/useProjectStore';

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
  const {
    data,
    selectedNodeId,
    clipboard,
    nodeToDelete,
    isCamManagerOpen,
    camTables,
    setNodeToDelete,
    setIsCamManagerOpen,
    toggleNode,
    updateNode,
    addAxis,
    addGroup,
    deleteNode,
    pasteNode,
    moveNode,
    setClipboard,
    setSelectedNodeId,
  } = useProjectStore();

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

  const selectedNode = findNode(data, selectedNodeId) || data[0];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      <DeleteConfirmationModal node={nodeToDelete} onConfirm={deleteNode} onCancel={() => setNodeToDelete(null)} />
      <CamTableManagerModal isOpen={isCamManagerOpen} onClose={() => setIsCamManagerOpen(false)} camTables={camTables} onAdd={() => {}} onDelete={() => {}} onUpdateTable={() => {}} />
      <Ribbon onAddAxis={addAxis} onOpenCamManager={() => setIsCamManagerOpen(true)} />
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
