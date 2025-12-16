import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, Server, Box, Disc, Activity, Plus, Trash2, Copy, ClipboardPaste } from 'lucide-react';
import { TreeNode } from '../types';

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, onToggle, onSelect, selectedId, onContextMenu }) => {
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
        onContextMenu={(e) => onContextMenu(e, node)}
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
              onContextMenu={onContextMenu}
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
  onDeleteNode: (id: string) => void;
  onCopyNode: (id: string) => void;
  onPasteNode: (targetId: string | null) => void;
  clipboard: TreeNode | null;
}

export const TreeView: React.FC<TreeViewProps> = ({ 
  data, 
  onToggle, 
  onSelect, 
  selectedId, 
  onAddGroup,
  onDeleteNode,
  onCopyNode,
  onPasteNode,
  clipboard
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: TreeNode | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    // Only allow context menu on Groups and Axes
    if (node.type === 'group' || node.type === 'axis') {
        onSelect(node.id); // Auto-select on right click
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    } else {
        setContextMenu(null);
    }
  };

  const handleGlobalContextMenu = (e: React.MouseEvent) => {
    // If clicking on empty space, allow pasting a group
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node: null });
  }

  const handleDelete = () => {
    if (contextMenu?.node) {
      onDeleteNode(contextMenu.node.id);
    }
    setContextMenu(null);
  };

  const handleCopy = () => {
    if (contextMenu?.node) {
      onCopyNode(contextMenu.node.id);
    }
    setContextMenu(null);
  };

  const handlePaste = () => {
    const targetId = contextMenu?.node ? contextMenu.node.id : null;
    onPasteNode(targetId);
    setContextMenu(null);
  };

  // Determine if Paste is valid
  let canPaste = false;
  if (clipboard) {
      if (clipboard.type === 'group') {
          // Can paste a group anywhere (it appends to root)
          canPaste = true;
      } else if (clipboard.type === 'axis') {
          // Can only paste axis onto a group
          if (contextMenu?.node?.type === 'group') {
              canPaste = true;
          }
      }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-300 h-full flex flex-col shrink-0 relative" onContextMenu={handleGlobalContextMenu}>
      <div className="bg-gray-600 text-white text-xs px-2 py-1 font-bold flex justify-between items-center select-none" onContextMenu={(e) => e.stopPropagation()}>
        <span>Project Overview</span>
        <span className="bg-green-500 text-white px-1 rounded text-[10px]">79%</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1" onContextMenu={(e) => e.stopPropagation()}>
        {data.map(node => (
          <TreeItem 
            key={node.id} 
            node={node} 
            level={0} 
            onToggle={onToggle} 
            onSelect={onSelect}
            selectedId={selectedId}
            onContextMenu={handleContextMenu}
          />
        ))}
        {/* Empty area click handling for adding groups */}
        <div className="h-full min-h-[50px]" onContextMenu={handleGlobalContextMenu}></div>
      </div>
      <div className="p-1 border-t border-gray-300 bg-gray-50" onContextMenu={(e) => e.stopPropagation()}>
        <button 
          onClick={onAddGroup}
          className="flex items-center justify-center w-full py-1 text-xs text-gray-700 hover:bg-gray-200 border border-transparent hover:border-gray-300 rounded-sm"
        >
          <Plus size={12} className="mr-1" /> Add Group
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-400 shadow-lg py-1 rounded-sm min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
           {contextMenu.node && (
               <>
                <div 
                    className="px-3 py-1 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 cursor-pointer flex items-center"
                    onClick={handleCopy}
                >
                    <Copy size={12} className="mr-2"/> Copy {contextMenu.node.type === 'group' ? 'Group' : 'Axis'}
                </div>
                <div 
                    className="px-3 py-1 text-xs text-red-700 hover:bg-red-50 cursor-pointer flex items-center"
                    onClick={handleDelete}
                >
                    <Trash2 size={12} className="mr-2"/> Delete
                </div>
                <div className="h-px bg-gray-200 my-1"></div>
               </>
           )}
           
           <div 
                className={`px-3 py-1 text-xs flex items-center
                    ${canPaste ? 'text-gray-700 hover:bg-blue-100 cursor-pointer' : 'text-gray-400 cursor-default'}
                `}
                onClick={canPaste ? handlePaste : undefined}
           >
                <ClipboardPaste size={12} className="mr-2"/> Paste
           </div>
        </div>
      )}
    </div>
  );
};
