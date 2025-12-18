
import React, { useState, useCallback } from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { HelpCircle } from 'lucide-react';
import { TreeNode, CamTable } from './types';
import { initialData } from './initialData';
import { DeleteConfirmationModal } from './components/modals/DeleteConfirmationModal';
import { CamTableManagerModal } from './components/modals/CamTableManagerModal';

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
  const [data, setData] = useState<TreeNode[]>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [clipboard, setClipboard] = useState<{ node: TreeNode, isCut: boolean } | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<TreeNode | null>(null);
  const [isCamManagerOpen, setIsCamManagerOpen] = useState(false);

  const [camTables, setCamTables] = useState<CamTable[]>([
    { 
        id: 'Cam_1', 
        name: 'RotaryShear_3', 
        masterRange: 360, 
        sectors: [
            { id: '1', masterStart: 0, masterEnd: 90, slaveStart: 0, slaveEnd: 30, law: 'Poly5' },
            { id: '2', masterStart: 90, masterEnd: 270, slaveStart: 30, slaveEnd: 30, law: 'Straight Line' },
            { id: '3', masterStart: 270, masterEnd: 360, slaveStart: 30, slaveEnd: 0, law: 'Poly5' }
        ]
    }
  ]);

  const toggleNode = (id: string) => {
    const toggleRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, expanded: !node.expanded };
        if (node.children) return { ...node, children: toggleRecursive(node.children) };
        return node;
      });
    };
    setData(toggleRecursive(data));
  };

  const handleSelect = (id: string) => setSelectedNodeId(id);

  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleUpdateNode = (id: string, newParams: Record<string, any>) => {
    setData(prev => {
      const updateRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            const updatedNode = { ...node, parameters: { ...node.parameters, ...newParams } };
            if (newParams.axisName !== undefined) updatedNode.label = newParams.axisName;
            return updatedNode;
          }
          if (node.children) return { ...node, children: updateRecursive(node.children) };
          return node;
        });
      };
      return updateRecursive(prev);
    });
  };

  const addAxis = () => {
    setData(prev => {
      const newData = [...prev];
      const targetGroup = newData.find(n => n.type === 'group' && (n.id === selectedNodeId || n.children?.some(c => c.id === selectedNodeId))) || newData[0];

      if (targetGroup && targetGroup.children) {
        const count = targetGroup.children.length + 1;
        const axisLabel = `Axis ${count}`;
        const newAxis: TreeNode = {
          id: `axis_${Date.now()}`,
          label: axisLabel,
          icon: 'axis',
          type: 'axis',
          parameters: {
             axisName: axisLabel,
             profileType: 'Time Based',
             mechanismType: 'Ball Screw'
          }
        };
        targetGroup.children.push(newAxis);
        targetGroup.expanded = true;
      }
      return newData;
    });
  };

  const addGroup = () => {
    const newGroup: TreeNode = {
      id: `group_${Date.now()}`,
      label: `Power Group ${data.length + 1}`,
      icon: 'group',
      type: 'group',
      expanded: true,
      parameters: { cycleTime: "10" },
      children: []
    };
    setData([...data, newGroup]);
  };

  const handleDeleteConfirm = () => {
    if (!nodeToDelete) return;
    setData(prev => {
      const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.filter(n => n.id !== nodeToDelete.id).map(n => ({
          ...n,
          children: n.children ? removeRecursive(n.children) : undefined
        }));
      };
      return removeRecursive(prev);
    });
    setNodeToDelete(null);
    if (selectedNodeId === nodeToDelete.id) setSelectedNodeId('root');
  };

  const handleCopy = (id: string) => {
    const node = findNode(data, id);
    if (node) setClipboard({ node: JSON.parse(JSON.stringify(node)), isCut: false });
  };

  const handleCut = (id: string) => {
    const node = findNode(data, id);
    if (node) setClipboard({ node: JSON.parse(JSON.stringify(node)), isCut: true });
  };

  const handlePaste = (targetId: string | null) => {
    if (!clipboard) return;
    setData(prev => {
      let newData = [...prev];
      if (clipboard.isCut) {
        const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.filter(n => n.id !== clipboard.node.id).map(n => ({
            ...n,
            children: n.children ? removeRecursive(n.children) : undefined
          }));
        };
        newData = removeRecursive(newData);
      }

      const newNode = JSON.parse(JSON.stringify(clipboard.node));
      newNode.id = `${newNode.type}_${Date.now()}`;
      if (!clipboard.isCut) newNode.label += " (Copy)";
      
      const target = targetId ? findNode(newData, targetId) : newData[0];
      if (target) {
        if (newNode.type === 'group') {
           newData.push(newNode);
        } else if (newNode.type === 'axis') {
           const group = target.type === 'group' ? target : findParentGroup(newData, target.id);
           if (group && group.children) group.children.push(newNode);
        }
      }
      return newData;
    });
    if (clipboard.isCut) setClipboard(null);
  };

  const findParentGroup = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.type === 'group' && node.children?.some(c => c.id === id)) return node;
      if (node.children) {
        const found = findParentGroup(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleMoveNode = (draggedId: string, targetGroupId: string) => {
    if (draggedId === targetGroupId) return;
    setData(prev => {
      let newData = [...prev];
      const nodeToMove = findNode(newData, draggedId);
      if (!nodeToMove) return prev;

      const removeRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.filter(n => n.id !== draggedId).map(n => ({
          ...n,
          children: n.children ? removeRecursive(n.children) : undefined
        }));
      };
      newData = removeRecursive(newData);

      const targetGroup = findNode(newData, targetGroupId);
      if (targetGroup && targetGroup.children) {
        targetGroup.children.push(nodeToMove);
      }
      return newData;
    });
  };

  const selectedNode = findNode(data, selectedNodeId) || data[0];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      <DeleteConfirmationModal node={nodeToDelete} onConfirm={handleDeleteConfirm} onCancel={() => setNodeToDelete(null)} />
      <CamTableManagerModal isOpen={isCamManagerOpen} onClose={() => setIsCamManagerOpen(false)} camTables={camTables} onAdd={() => {}} onDelete={() => {}} onUpdateTable={() => {}} />
      <Ribbon onAddAxis={addAxis} onOpenCamManager={() => setIsCamManagerOpen(true)} />
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView 
          data={data} 
          onToggle={toggleNode} 
          onSelect={handleSelect} 
          selectedId={selectedNodeId} 
          onAddGroup={addGroup} 
          onDeleteNode={(id) => setNodeToDelete(findNode(data, id))} 
          onCopyNode={handleCopy} 
          onCutNode={handleCut} 
          onPasteNode={handlePaste} 
          onMoveNode={handleMoveNode} 
          clipboard={clipboard?.node || null} 
        />
        <div className="flex-1 flex flex-col relative min-w-0">
          <WorkArea data={data} selectedNode={selectedNode} onUpdateNode={handleUpdateNode} camTables={camTables} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;
