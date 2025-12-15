import React, { useState } from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { WizardPanel } from './components/WizardPanel';
import { HelpCircle } from 'lucide-react';
import { TreeNode } from './types';

const INITIAL_DATA: TreeNode[] = [
  {
    id: 'root',
    label: 'Power Group',
    icon: 'group',
    type: 'group',
    expanded: true,
    children: [
      { 
        id: 'x', 
        label: 'Axis 1', 
        icon: 'axis',
        type: 'axis',
        expanded: true,
        children: [
           { id: 'xc', label: 'Conveyor', icon: 'component', type: 'mechanism' },
           { id: 'xg', label: 'T1: Gearbox', icon: 'component', type: 'gearbox' },
           { id: 'xd', label: 'Drive & Motor', icon: 'drive', type: 'motor_drive' },
        ]
      },
      { 
        id: 'y', 
        label: 'Axis 2', 
        icon: 'axis',
        type: 'axis',
        expanded: true,
        children: [
           { id: 'yc', label: 'Rack & Pinion', icon: 'component', type: 'mechanism' },
           { id: 'yg', label: 'T1: Gearbox', icon: 'component', type: 'gearbox' },
           { id: 'yd', label: 'Drive & Motor', icon: 'drive', type: 'motor_drive' },
        ]
      },
    ]
  }
];

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
  const [data, setData] = useState<TreeNode[]>(INITIAL_DATA);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');

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
          children: [
            { id: `${newId}_c`, label: 'Mechanism', icon: 'component', type: 'mechanism' },
            { id: `${newId}_g`, label: 'Gearbox', icon: 'component', type: 'gearbox' },
            { id: `${newId}_d`, label: 'Drive & Motor', icon: 'drive', type: 'motor_drive' },
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
      children: []
    };
    setData([...data, newGroup]);
  };

  // Helper to find the selected node object
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
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <WorkArea data={data} selectedNode={selectedNode} />
        </div>

        <WizardPanel />
      </div>

      <Footer />
    </div>
  );
};

export default App;