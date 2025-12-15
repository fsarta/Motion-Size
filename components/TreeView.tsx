import React from 'react';
import { ChevronRight, ChevronDown, Folder, Server, Box, Disc, Activity, Plus } from 'lucide-react';
import { TreeNode } from '../types';

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, onToggle, onSelect, selectedId }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;
  
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
        className={`flex items-center py-0.5 cursor-pointer border border-transparent text-sm select-none
          ${isSelected ? 'bg-win-select border-win-border' : 'hover:bg-win-hover hover:border-win-border'}
          ${node.id === 'root' && !isSelected ? 'bg-gray-100 font-semibold' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => onSelect(node.id)}
      >
        <div 
          className="w-4 h-4 flex items-center justify-center mr-1"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
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
            <TreeItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeViewProps {
  data: TreeNode[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string;
  onAddGroup: () => void;
}

export const TreeView: React.FC<TreeViewProps> = ({ data, onToggle, onSelect, selectedId, onAddGroup }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-300 h-full flex flex-col shrink-0">
      <div className="bg-gray-600 text-white text-xs px-2 py-1 font-bold flex justify-between items-center">
        <span>Project Overview</span>
        <span className="bg-green-500 text-white px-1 rounded text-[10px]">79%</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {data.map(node => (
          <TreeItem 
            key={node.id} 
            node={node} 
            level={0} 
            onToggle={onToggle} 
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
      </div>
      <div className="p-1 border-t border-gray-300 bg-gray-50">
        <button 
          onClick={onAddGroup}
          className="flex items-center justify-center w-full py-1 text-xs text-gray-700 hover:bg-gray-200 border border-transparent hover:border-gray-300 rounded-sm"
        >
          <Plus size={12} className="mr-1" /> Add Group
        </button>
      </div>
    </div>
  );
};