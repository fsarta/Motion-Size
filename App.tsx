import React, { useState, useCallback } from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { WizardPanel } from './components/WizardPanel';
import { HelpCircle, AlertTriangle } from 'lucide-react';
import { TreeNode } from './types';
import { initialData } from './initialData';

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
    <div>
      {/* Right side status items could go here */}
    </div>
  </div>
);

const DeleteConfirmationModal = ({ node, onConfirm, onCancel }: { node: TreeNode | null, onConfirm: () => void, onCancel: () => void }) => {
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

const App = () => {
  const [data, setData] = useState<TreeNode[]>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [clipboard, setClipboard] = useState<TreeNode | null>(null);
  
  // State for delete confirmation
  const [nodeToDelete, setNodeToDelete] = useState<TreeNode | null>(null);

  const toggleNode = (id: string) => {
    const toggleRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleRecursive(node.children) };
        }
        return node;
      });
    };
    setData(toggleRecursive(data));
  };

  const handleSelect = (id: string) => {
    setSelectedNodeId(id);
  };

  // Helper to find parent node
  const findParent = (nodes: TreeNode[], childId: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.children) {
        if (node.children.some(c => c.id === childId)) return node;
        const found = findParent(node.children, childId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to find a node
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

  // Function to update the parameters of a specific node
  const handleUpdateNode = (id: string, newParams: Record<string, any>) => {
    
    // Check for Duplicate Name Constraint inside a group
    if (newParams.axisName !== undefined) {
      const parent = findParent(data, id);
      if (parent && parent.children) {
         const nameExists = parent.children.some(sibling => 
            sibling.id !== id && 
            sibling.type === 'axis' && 
            sibling.parameters?.axisName === newParams.axisName
         );

         if (nameExists) {
            alert(`An axis with the name "${newParams.axisName}" already exists in this group. Please choose a unique name.`);
            return; // Prevent update
         }
      }
    }

    const updateRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          const updatedNode = { ...node, parameters: { ...node.parameters, ...newParams } };
          
          // Synchronize Tree Label with axisName if it exists in the update
          if (newParams.axisName !== undefined) {
            updatedNode.label = newParams.axisName;
          }
          
          return updatedNode;
        }
        if (node.children) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };
    setData(updateRecursive(data));
  };

  /* --- CRUD Operations --- */

  // Helper to deep clone and regenerate IDs so pasted nodes are unique
  const regenerateIds = (node: TreeNode): TreeNode => {
    const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    // If it's a copy of a group, update label slightly or keep same? Usually Keep same for copy/paste
    return {
      ...node,
      id: newId,
      children: node.children ? node.children.map(regenerateIds) : []
    };
  };

  const handleRequestDelete = (id: string) => {
    const node = findNode(data, id);
    if (node) {
      setNodeToDelete(node);
    }
  };

  const confirmDelete = () => {
    if (!nodeToDelete) return;
    const id = nodeToDelete.id;

    const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => ({
          ...node,
          children: node.children ? deleteRecursive(node.children) : undefined
        }));
    };
    setData(deleteRecursive(data));
    if (selectedNodeId === id) setSelectedNodeId('root');
    setNodeToDelete(null);
  };

  const cancelDelete = () => {
    setNodeToDelete(null);
  };

  const handleCopyNode = (id: string) => {
    const node = findNode(data, id);
    if (node) {
      // Deep clone to avoid reference issues
      const clone = JSON.parse(JSON.stringify(node));
      setClipboard(clone);
    }
  };

  const handlePasteNode = (targetId: string | null) => {
    if (!clipboard) return;

    const newNode = regenerateIds(clipboard);

    // Ensure unique name on paste if it's an axis
    if (clipboard.type === 'axis') {
         // This is tricky because we don't know the parent until we find the target group.
         // For now, we'll append "Copy" to ensure basic uniqueness visualy.
         // A stricter check would happen if we scanned the target group first.
         newNode.label = newNode.label + " (Copy)";
         if (newNode.parameters) newNode.parameters.axisName = newNode.label;
    }

    // Scenario 1: Pasting a Group. It always goes to the Root level.
    if (clipboard.type === 'group') {
      newNode.label = `${newNode.label} (Copy)`;
      setData(prev => [...prev, newNode]);
      return;
    }

    // Scenario 2: Pasting an Axis. Must act on a target Group.
    if (clipboard.type === 'axis' && targetId) {
       // Find the target group
       const updateRecursive = (nodes: TreeNode[]): TreeNode[] => {
         return nodes.map(node => {
           // If target is the group, push to its children
           if (node.id === targetId && node.type === 'group') {
             
             // Extra check: ensure uniqueness within this target group
             let uniqueLabel = newNode.label;
             let counter = 1;
             while (node.children?.some(c => c.type === 'axis' && c.label === uniqueLabel)) {
                uniqueLabel = `${newNode.label} (${counter})`;
                counter++;
             }
             newNode.label = uniqueLabel;
             if (newNode.parameters) newNode.parameters.axisName = uniqueLabel;

             return {
               ...node,
               children: [...(node.children || []), newNode],
               expanded: true
             };
           }
           // If children exist, recurse
           if (node.children) {
             return { ...node, children: updateRecursive(node.children) };
           }
           return node;
         });
       };
       setData(updateRecursive(data));
    }
  };

  const addAxis = () => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      
      let targetGroup: TreeNode | undefined = undefined;

      // Helper to check if a node is a descendant of the group
      const isDescendant = (node: TreeNode, targetId: string): boolean => {
        if (node.id === targetId) return true;
        if (node.children) {
          return node.children.some(child => isDescendant(child, targetId));
        }
        return false;
      };

      // Find the group related to selection
      for (const group of newData) {
        if (group.type === 'group') {
          if (group.id === selectedNodeId || (group.children && group.children.some(child => isDescendant(child, selectedNodeId)))) {
            targetGroup = group;
            break;
          }
        }
      }

      // Default to first group if no context found
      if (!targetGroup && newData.length > 0 && newData[0].type === 'group') {
        targetGroup = newData[0];
      }

      if (targetGroup && targetGroup.children) {
        const existingAxes = targetGroup.children.filter((c: TreeNode) => c.type === 'axis');
        const count = existingAxes.length;
        
        let axisLabel = `Axis ${count + 1}`;
        // Verify uniqueness for new axis
        let uniqueCounter = count + 1;
        while(existingAxes.some((a: TreeNode) => a.label === axisLabel)) {
            uniqueCounter++;
            axisLabel = `Axis ${uniqueCounter}`;
        }

        const newId = `axis_${Date.now()}`;

        const newAxis: TreeNode = {
          id: newId,
          label: axisLabel,
          icon: 'axis',
          type: 'axis',
          expanded: true,
          parameters: {
             axisName: axisLabel,
             profileType: 'Time Based'
          },
          children: [
            { 
              id: `${newId}_c`, 
              label: 'Mechanism', 
              icon: 'component', 
              type: 'mechanism',
              parameters: {
                mechanismType: "Conveyor",
                massLoad: "10.0",
                massBelt: "1.0",
                frictionCoeff: "0.1",
                inclineAngle: "0",
                pulleyRadius: "25.0",
                additionalForce: "0"
              }
            },
            { 
              id: `${newId}_g`, 
              label: 'Gearbox', 
              icon: 'component', 
              type: 'gearbox',
              parameters: {
               vendor: "Generic",
               model: "G-10-1",
               ratio: "1.0",
               efficiency: "98",
               inertia: "0.1",
               backlash: "5",
               maxInputSpeed: "4000"
             }
            },
            { 
              id: `${newId}_d`, 
              label: 'Drive & Motor', 
              icon: 'drive', 
              type: 'motor_drive',
              parameters: {
               motorVendor: "Generic",
               motorModel: "Motor-X",
               ratedSpeed: "3000",
               ratedTorque: "1.0",
               ratedPower: "0.5",
               ratedCurrent: "1.2",
               motorEfficiency: "90.0",
               powerFactor: "0.85",
               motorInertia: "0.5",
               driveVendor: "Generic",
               driveModel: "Drive-X",
               driveSupplyVoltage: "230",
               pwmFrequency: "8",
               driveMaxCurrent: "5.0"
             }
            },
          ]
        };

        targetGroup.children.push(newAxis);
        targetGroup.expanded = true;
      }
      return newData;
    });
  };

  const addGroup = () => {
    const newId = `group_${Date.now()}`;
    const newGroup: TreeNode = {
      id: newId,
      label: `Power Group ${data.length + 1}`,
      icon: 'group',
      type: 'group',
      expanded: true,
      parameters: {
        cycleTime: "10",
        configuration: "Multi-Axis",
        supplyVoltage: "400",
        supplyPhase: "3",
        nominalBusVoltage: "540",
        infeedPeakPower: "0",
        targetBusVoltage: "0"
      },
      children: []
    };
    setData([...data, newGroup]);
  };

  const selectedNode = findNode(data, selectedNodeId) || data[0];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      <DeleteConfirmationModal 
        node={nodeToDelete} 
        onConfirm={confirmDelete} 
        onCancel={cancelDelete} 
      />

      <Ribbon onAddAxis={addAxis} />
      
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView 
          data={data} 
          onToggle={toggleNode} 
          onSelect={handleSelect} 
          selectedId={selectedNodeId} 
          onAddGroup={addGroup}
          onDeleteNode={handleRequestDelete}
          onCopyNode={handleCopyNode}
          onPasteNode={handlePasteNode}
          clipboard={clipboard}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <WorkArea 
            data={data} 
            selectedNode={selectedNode} 
            onUpdateNode={handleUpdateNode}
          />
        </div>

        <WizardPanel />
      </div>

      <Footer />
    </div>
  );
};

export default App;
