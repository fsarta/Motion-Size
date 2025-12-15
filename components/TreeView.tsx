import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Server, Box, Disc, Activity } from 'lucide-react';
import { TreeNode } from '../types';

const INITIAL_DATA: TreeNode[] = [
  {
    id: 'root',
    label: 'Power Group',
    icon: 'group',
    expanded: true,
    children: [
      { id: 'm', label: 'Master', icon: 'drive' },
      { 
        id: 'x', 
        label: 'X Axis', 
        icon: 'axis',
        expanded: true,
        children: [
           { id: 'xc', label: 'Conveyor', icon: 'component' },
           { id: 'xg', label: 'T1: Gearbox', icon: 'component' },
           { id: 'xd', label: 'Drive & Motor', icon: 'drive' },
        ]
      },
      { 
        id: 'y', 
        label: 'Y Axis', 
        icon: 'axis',
        expanded: true,
        children: [
           { id: 'yc', label: 'Conveyor', icon: 'component' },
           { id: 'yg', label: 'T1: Gearbox', icon: 'component' },
           { id: 'yd', label: 'Drive & Motor', icon: 'drive' },
        ]
      },
      { 
        id: 'z', 
        label: 'Z Axis', 
        icon: 'axis',
        children: [
           { id: 'zc', label: 'Conveyor', icon: 'component' },
           { id: 'zg', label: 'T1: Gearbox', icon: 'component' },
           { id: 'zd', label: 'Drive & Motor', icon: 'drive' },
        ]
      },
    ]
  }
];

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle: (id: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, onToggle }) => {
  const hasChildren = node.children && node.children.length > 0;
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'group': return <Server size={14} className="text-gray-600" />;
      case 'axis': return <Box size={14} className="text-blue-900 fill-blue-900" />;
      case 'component': return <Disc size={14} className="text-blue-600" />;
      case 'drive': return <Activity size={14} className="text-cyan-700" />;
      default: return <Folder size={14} />;
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center py-0.5 hover:bg-win-hover cursor-pointer border border-transparent hover:border-win-border text-sm select-none ${node.id === 'root' ? 'bg-gray-200 font-semibold' : ''}`}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <div className="w-4 h-4 flex items-center justify-center mr-1">
          {hasChildren && (
            node.expanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />
          )}
        </div>
        <div className="mr-1.5">{getIcon(node.icon)}</div>
        <span className="truncate">{node.label}</span>
      </div>
      {node.expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeItem key={child.id} node={child} level={level + 1} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = () => {
  const [data, setData] = useState(INITIAL_DATA);

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

  return (
    <div className="w-64 bg-white border-r border-gray-300 h-full flex flex-col shrink-0">
      <div className="bg-gray-600 text-white text-xs px-2 py-1 font-bold flex justify-between items-center">
        <span>Power Group</span>
        <span className="bg-green-500 text-white px-1 rounded text-[10px]">79%</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {data.map(node => (
          <TreeItem key={node.id} node={node} level={0} onToggle={toggleNode} />
        ))}
      </div>
    </div>
  );
};