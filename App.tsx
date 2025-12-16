import React, { useState, useCallback } from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { WizardPanel } from './components/WizardPanel';
import { HelpCircle, AlertTriangle, Table, Plus, Trash2, X } from 'lucide-react';
import { TreeNode, CamTable } from './types';
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

const CamTableManagerModal = ({ isOpen, onClose, camTables, onAdd, onDelete }: { isOpen: boolean, onClose: () => void, camTables: CamTable[], onAdd: (name: string) => void, onDelete: (id: string) => void }) => {
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
       <div className="bg-win-bg border border-gray-400 shadow-xl w-96 font-sans text-xs flex flex-col h-[400px]">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-2 py-1 border-b border-gray-300 flex items-center justify-between text-gray-700 font-bold select-none">
             <div className="flex items-center"><Table size={14} className="mr-2 text-blue-600" /> Cam Table Manager</div>
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white rounded-sm p-0.5"><X size={14}/></button>
          </div>
          
          <div className="p-2 border-b border-gray-300 bg-gray-50 flex space-x-2">
             <input 
               type="text" 
               className="flex-1 border border-gray-300 px-2 py-1 outline-none focus:border-blue-500"
               placeholder="New Table Name..."
               value={newName}
               onChange={(e) => setNewName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
             />
             <button onClick={handleAdd} className="flex items-center px-3 py-1 bg-white border border-gray-300 hover:bg-blue-50 rounded-sm shadow-sm text-gray-700">
               <Plus size={12} className="mr-1"/> Add
             </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-2">
             {camTables.length === 0 ? (
               <div className="text-gray-400 italic text-center mt-10">No Cam Tables defined.</div>
             ) : (
               <div className="border border-gray-200">
                  <div className="grid grid-cols-[1fr_40px] bg-gray-100 border-b border-gray-200 font-semibold p-1">
                     <div>Name</div>
                     <div className="text-center">Action</div>
                  </div>
                  {camTables.map(cam => (
                    <div key={cam.id} className="grid grid-cols-[1fr_40px] border-b border-gray-100 p-1 hover:bg-gray-50 items-center">
                       <div className="px-2">{cam.name}</div>
                       <div className="flex justify-center">
                          <button onClick={() => onDelete(cam.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12}/></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
          
          <div className="p-2 bg-gray-100 border-t border-gray-300 flex justify-end">
             <button onClick={onClose} className="px-4 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm shadow-sm">Close</button>
          </div>
       </div>
    </div>
  );
}

const App = () => {
  const [data, setData] = useState<TreeNode[]>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  
  // Clipboard state
  const [clipboard, setClipboard] = useState<{ node: TreeNode, isCut: boolean } | null>(null);

  const [camTables, setCamTables] = useState<CamTable[]>([
    { id: 'Cam_1', name: 'RotaryShear_3' },
    { id: 'Cam_2', name: 'FlyingSaw_1' }
  ]);
  const [isCamManagerOpen, setIsCamManagerOpen] = useState(false);
  
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

  const deleteNodeById = (id: string) => {
      const deleteRecursive = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => ({
          ...node,
          children: node.children ? deleteRecursive(node.children) : undefined
        }));
    };
    setData(prev => deleteRecursive(prev));
    if (selectedNodeId === id) setSelectedNodeId('root');
  }

  const confirmDelete = () => {
    if (!nodeToDelete) return;
    deleteNodeById(nodeToDelete.id);
    setNodeToDelete(null);
  };

  const cancelDelete = () => {
    setNodeToDelete(null);
  };

  const handleCopyNode = (id: string) => {
    const node = findNode(data, id);
    if (node) {
      const clone = JSON.parse(JSON.stringify(node));
      setClipboard({ node: clone, isCut: false });
    }
  };

  const handleCutNode = (id: string) => {
    const node = findNode(data, id);
    if (node) {
        const clone = JSON.parse(JSON.stringify(node));
        setClipboard({ node: clone, isCut: true });
    }
  }

  const handlePasteNode = (targetId: string | null) => {
    if (!clipboard) return;

    // Determine the node to insert. If it was a 'Cut', we reuse it (with new ID to be safe or original ID?), 
    // actually if we move, we might want to keep ID or regenerate. 
    // Standard clipboard practice: Paste creates new entity. 
    // BUT if it's "Move", we are essentially re-parenting.
    
    // Let's stick to regenerate for safety to avoid ID collisions if user pastes multiple times (even though cut implies once).
    // If it is cut, we delete the original AFTER successful paste.
    
    const newNode = regenerateIds(clipboard.node);
    const nodeToPasteType = clipboard.node.type;

    // Ensure unique name on paste if it's an axis and we are copying
    if (nodeToPasteType === 'axis' && !clipboard.isCut) {
         newNode.label = newNode.label + " (Copy)";
         if (newNode.parameters) newNode.parameters.axisName = newNode.label;
    }

    let success = false;

    // Scenario 1: Pasting a Group. It always goes to the Root level.
    if (nodeToPasteType === 'group') {
      if (!clipboard.isCut) newNode.label = `${newNode.label} (Copy)`;
      setData(prev => [...prev, newNode]);
      success = true;
    }

    // Scenario 2: Pasting an Axis. Must act on a target Group.
    if (nodeToPasteType === 'axis' && targetId) {
       // Find the target group
       // We need to use a temp variable to update state once
       let updatedData = [...data];
       
       const updateRecursive = (nodes: TreeNode[]): TreeNode[] => {
         return nodes.map(node => {
           // If target is the group, push to its children
           if (node.id === targetId && node.type === 'group') {
             
             // Check for name uniqueness in target group
             let uniqueLabel = newNode.label;
             let counter = 1;
             while (node.children?.some(c => c.type === 'axis' && c.label === uniqueLabel)) {
                uniqueLabel = `${newNode.label} (${counter})`;
                counter++;
             }
             newNode.label = uniqueLabel;
             if (newNode.parameters) newNode.parameters.axisName = uniqueLabel;

             success = true;
             return {
               ...node,
               children: [...(node.children || []), newNode],
               expanded: true
             };
           }
           if (node.children) {
             return { ...node, children: updateRecursive(node.children) };
           }
           return node;
         });
       };
       updatedData = updateRecursive(updatedData);
       if (success) setData(updatedData);
    }

    // If Paste was successful and it was a Cut operation, delete the original
    if (success && clipboard.isCut) {
        deleteNodeById(clipboard.node.id);
        setClipboard(null); // Clear clipboard after move
    }
  };

  const handleMoveNode = (draggedId: string, targetGroupId: string) => {
      // 1. Find Dragged Node
      const draggedNode = findNode(data, draggedId);
      if (!draggedNode) return;

      // 2. Validate move (cannot move group into itself, etc - but here we only drag axes to groups)
      if (draggedNode.type !== 'axis') return; 

      // 3. Clone and Regenerate (or keep ID? For move, usually keep ID unless conflict)
      // Let's regenerate ID to avoid any ghost conflict in React keys during transition
      const nodeToMove = JSON.parse(JSON.stringify(draggedNode));
      const newNode = regenerateIds(nodeToMove);
      // Keep name same

      // 4. Insert into Target
      let success = false;
      const dataWithInsert = data.map(function recurse(node): TreeNode {
          if (node.id === targetGroupId && node.type === 'group') {
              // Check name uniqueness
              let uniqueLabel = newNode.label;
              let counter = 1;
              while (node.children?.some(c => c.type === 'axis' && c.label === uniqueLabel)) {
                  uniqueLabel = `${newNode.label} (${counter})`;
                  counter++;
              }
              newNode.label = uniqueLabel;
              if (newNode.parameters) newNode.parameters.axisName = uniqueLabel;
              
              success = true;
              return {
                  ...node,
                  children: [...(node.children || []), newNode],
                  expanded: true
              }
          }
          if (node.children) {
              return { ...node, children: node.children.map(recurse) };
          }
          return node;
      });

      // 5. If inserted, remove original
      if (success) {
          // Remove original
           const finalData = dataWithInsert.map(function recurseDel(node): TreeNode {
             // We need to filter out the OLD id
             if (node.children) {
                 return {
                     ...node,
                     children: node.children.filter(c => c.id !== draggedId).map(recurseDel)
                 }
             }
             return node;
           });
           
           setData(finalData);
           setSelectedNodeId(newNode.id); // Select the moved node
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

  /* --- Cam Table Handlers --- */
  const handleAddCam = (name: string) => {
    setCamTables(prev => [...prev, { id: `Cam_${Date.now()}`, name }]);
  };

  const handleDeleteCam = (id: string) => {
    setCamTables(prev => prev.filter(c => c.id !== id));
  };

  const selectedNode = findNode(data, selectedNodeId) || data[0];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      <DeleteConfirmationModal 
        node={nodeToDelete} 
        onConfirm={confirmDelete} 
        onCancel={cancelDelete} 
      />

      <CamTableManagerModal
        isOpen={isCamManagerOpen}
        onClose={() => setIsCamManagerOpen(false)}
        camTables={camTables}
        onAdd={handleAddCam}
        onDelete={handleDeleteCam}
      />

      <Ribbon 
        onAddAxis={addAxis} 
        onOpenCamManager={() => setIsCamManagerOpen(true)}
      />
      
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView 
          data={data} 
          onToggle={toggleNode} 
          onSelect={handleSelect} 
          selectedId={selectedNodeId} 
          onAddGroup={addGroup}
          onDeleteNode={handleRequestDelete}
          onCopyNode={handleCopyNode}
          onCutNode={handleCutNode}
          onPasteNode={handlePasteNode}
          onMoveNode={handleMoveNode}
          clipboard={clipboard ? clipboard.node : null}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <WorkArea 
            data={data} 
            selectedNode={selectedNode} 
            onUpdateNode={handleUpdateNode}
            camTables={camTables}
          />
        </div>

        <WizardPanel />
      </div>

      <Footer />
    </div>
  );
};

export default App;