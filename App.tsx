import React, { useState, useCallback } from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { WizardPanel } from './components/WizardPanel';
import { HelpCircle } from 'lucide-react';
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

const App = () => {
  const [data, setData] = useState<TreeNode[]>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [clipboard, setClipboard] = useState<TreeNode | null>(null);

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

  // Function to update the parameters of a specific node
  const handleUpdateNode = (id: string, newParams: Record<string, any>) => {
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

  const handleDeleteNode = (id: string) => {
    // Cannot delete root if you want to keep at least one group, but let's allow deleting everything for now
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

    // Scenario 1: Pasting a Group. It always goes to the Root level, regardless of target.
    // Or, if specifically requested, we could nest groups, but usually Power Groups are top level.
    if (clipboard.type === 'group') {
      // Rename to Copy of... ? Optional.
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
        const axisLabel = `Axis ${count + 1}`;
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
      <Ribbon onAddAxis={addAxis} />
      
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView 
          data={data} 
          onToggle={toggleNode} 
          onSelect={handleSelect} 
          selectedId={selectedNodeId} 
          onAddGroup={addGroup}
          onDeleteNode={handleDeleteNode}
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
