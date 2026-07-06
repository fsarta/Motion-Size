import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TreeNode, CamTable } from '../types';
import { initialData } from '../initialData';

interface ProjectState {
  data: TreeNode[];
  selectedNodeId: string;
  clipboard: { node: TreeNode, isCut: boolean } | null;
  nodeToDelete: TreeNode | null;
  camTables: CamTable[];
  isCamManagerOpen: boolean;
  
  // Actions
  setData: (data: TreeNode[]) => void;
  setSelectedNodeId: (id: string) => void;
  setClipboard: (clipboard: { node: TreeNode, isCut: boolean } | null) => void;
  setNodeToDelete: (node: TreeNode | null) => void;
  setIsCamManagerOpen: (isOpen: boolean) => void;
  setCamTables: (tables: CamTable[]) => void;
  
  toggleNode: (id: string) => void;
  updateNode: (id: string, newParams: Record<string, any>) => void;
  addAxis: () => void;
  addGroup: () => void;
  deleteNode: () => void;
  pasteNode: (targetId: string | null) => void;
  moveNode: (draggedId: string, targetId: string) => void;
}

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

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    data: initialData,
    selectedNodeId: 'root',
    clipboard: null,
    nodeToDelete: null,
    camTables: [
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
    ],
    isCamManagerOpen: false,

    setData: (data) => set({ data }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setClipboard: (clipboard) => set({ clipboard }),
    setNodeToDelete: (nodeToDelete) => set({ nodeToDelete }),
    setIsCamManagerOpen: (isCamManagerOpen) => set({ isCamManagerOpen }),
    setCamTables: (camTables) => set({ camTables }),

    toggleNode: (id) => set((state) => {
      const node = findNode(state.data, id);
      if (node) {
        node.expanded = !node.expanded;
      }
    }),

    updateNode: (id, newParams) => set((state) => {
      const node = findNode(state.data, id);
      if (node) {
        node.parameters = { ...node.parameters, ...newParams };
        if (newParams.axisName !== undefined) {
          node.label = newParams.axisName;
        }
      }
    }),

    addAxis: () => set((state) => {
      let targetGroup = findNode(state.data, state.selectedNodeId);
      if (!targetGroup || targetGroup.type !== 'group') {
          targetGroup = state.data.find((n: any) => n.type === 'group') || state.data[0];
      }

      if (targetGroup && targetGroup.children) {
        const count = targetGroup.children.filter((c: any) => c.type === 'axis').length + 1;
        const axisLabel = `Axis ${count}`;
        const newAxis: TreeNode = {
          id: `axis_${Date.now()}`,
          label: axisLabel,
          icon: 'axis',
          type: 'axis',
          parameters: {
             axisName: axisLabel,
             profileType: 'Time Based',
             mechanismType: 'Ball Screw',
             gearRatioNum: 1,
             gearRatioDen: 1
          }
        };
        targetGroup.children.push(newAxis);
        targetGroup.expanded = true;
      }
    }),

    addGroup: () => set((state) => {
      const newGroup: TreeNode = {
        id: `group_${Date.now()}`,
        label: `Power Group ${state.data.length + 1}`,
        icon: 'group',
        type: 'group',
        expanded: true,
        parameters: { cycleTime: "10" },
        children: []
      };
      state.data.push(newGroup);
    }),

    deleteNode: () => set((state) => {
      if (!state.nodeToDelete) return;
      const idToDelete = state.nodeToDelete.id;
      
      const removeRecursive = (nodes: TreeNode[]) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === idToDelete) {
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].children) {
            if (removeRecursive(nodes[i].children!)) return true;
          }
        }
        return false;
      };
      removeRecursive(state.data);
      
      if (state.selectedNodeId === idToDelete) {
        state.selectedNodeId = 'root';
      }
      state.nodeToDelete = null;
    }),

    pasteNode: (targetId) => set((state) => {
      if (!state.clipboard) return;
      
      if (state.clipboard.isCut) {
        const idToRemove = state.clipboard.node.id;
        const removeRecursive = (nodes: TreeNode[]) => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === idToRemove) {
              nodes.splice(i, 1);
              return true;
            }
            if (nodes[i].children) {
              if (removeRecursive(nodes[i].children!)) return true;
            }
          }
          return false;
        };
        removeRecursive(state.data);
      }

      // JSON parse/stringify is safe here to deep clone the clipboard node
      const newNode = JSON.parse(JSON.stringify(state.clipboard.node));
      newNode.id = `${newNode.type}_${Date.now()}`;
      if (!state.clipboard.isCut) newNode.label += " (Copy)";
      
      if (newNode.type === 'group') {
         state.data.push(newNode);
      } else {
         const target = targetId ? findNode(state.data, targetId) : state.data[0];
         const group = (target?.type === 'group') ? target : findParentGroup(state.data, targetId || '');
         if (group && group.children) {
             group.children.push(newNode);
             group.expanded = true;
         }
      }
      
      if (state.clipboard.isCut) {
        state.clipboard = null;
      }
    }),

    moveNode: (draggedId, targetId) => set((state) => {
      if (draggedId === targetId) return;
      const draggedNode = findNode(state.data, draggedId);
      if (!draggedNode) return;
      
      // JSON clone the dragged node to insert it later
      const nodeToInsert = JSON.parse(JSON.stringify(draggedNode));

      // Remove from current pos
      const removeRecursive = (nodes: TreeNode[]) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === draggedId) {
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].children) {
            if (removeRecursive(nodes[i].children!)) return true;
          }
        }
        return false;
      };
      removeRecursive(state.data);

      const target = findNode(state.data, targetId);
      if (target?.type === 'group') {
        if (!target.children) target.children = [];
        target.children.push(nodeToInsert);
        target.expanded = true;
      } else {
        const group = findParentGroup(state.data, targetId);
        if (group && group.children) {
          const targetIndex = group.children.findIndex(c => c.id === targetId);
          if (targetIndex !== -1) {
            group.children.splice(targetIndex + 1, 0, nodeToInsert);
          } else {
            group.children.push(nodeToInsert);
          }
        } else if (!group && draggedNode.type === 'group') {
          // If we're dropping a group onto another group... wait groups are top level
          const targetIndex = state.data.findIndex(c => c.id === targetId);
          if (targetIndex !== -1) {
            state.data.splice(targetIndex + 1, 0, nodeToInsert);
          } else {
            state.data.push(nodeToInsert);
          }
        }
      }
    })
  }))
);
