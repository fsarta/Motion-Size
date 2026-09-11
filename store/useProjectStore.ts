import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TreeNode, CamTable } from '../types';
import { initialData } from '../initialData';
import { loadAutoSave, autoSave } from '../utils/projectIO';

const savedProject = loadAutoSave();
const startData = savedProject?.data || initialData;
const startCamTables = savedProject?.camTables || [
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
];

interface ProjectState {
  data: TreeNode[];
  selectedNodeId: string;
  clipboard: { node: TreeNode, isCut: boolean } | null;
  nodeToDelete: TreeNode | null;
  camTables: CamTable[];
  isCamManagerOpen: boolean;
  isWizardOpen: boolean;
  history: {
    past: { data: TreeNode[]; camTables: CamTable[] }[];
    future: { data: TreeNode[]; camTables: CamTable[] }[];
  };
  
  // Actions
  loadProject: (data: TreeNode[], camTables: CamTable[]) => void;
  undo: () => void;
  redo: () => void;
  saveHistoryState: () => void;
  
  addCamTable: (name: string) => void;
  deleteCamTable: (id: string) => void;
  updateCamTable: (id: string, updated: CamTable) => void;

  setData: (data: TreeNode[]) => void;
  setSelectedNodeId: (id: string) => void;
  setClipboard: (clipboard: { node: TreeNode, isCut: boolean } | null) => void;
  setNodeToDelete: (node: TreeNode | null) => void;
  setIsCamManagerOpen: (isOpen: boolean) => void;
  setIsWizardOpen: (isOpen: boolean) => void;
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
    data: startData,
    selectedNodeId: 'root',
    clipboard: null,
    nodeToDelete: null,
    camTables: startCamTables,
    isCamManagerOpen: false,
    isWizardOpen: false,
    history: { past: [], future: [] },

    loadProject: (data, camTables) => set((state) => {
      state.data = data;
      state.camTables = camTables;
      state.selectedNodeId = data[0]?.id || 'root';
      state.clipboard = null;
      state.nodeToDelete = null;
      state.history = { past: [], future: [] };
    }),

    saveHistoryState: () => set((state) => {
      // Create deep copies to avoid immer proxy issues or reference mutations
      const pastState = {
        data: JSON.parse(JSON.stringify(state.data)),
        camTables: JSON.parse(JSON.stringify(state.camTables))
      };
      state.history.past.push(pastState);
      if (state.history.past.length > 50) {
        state.history.past.shift();
      }
      state.history.future = [];
    }),

    undo: () => set((state) => {
      if (state.history.past.length > 0) {
        const previousState = state.history.past.pop()!;
        const currentState = {
          data: JSON.parse(JSON.stringify(state.data)),
          camTables: JSON.parse(JSON.stringify(state.camTables))
        };
        state.history.future.push(currentState);
        
        state.data = previousState.data;
        state.camTables = previousState.camTables;
      }
    }),

    redo: () => set((state) => {
      if (state.history.future.length > 0) {
        const nextState = state.history.future.pop()!;
        const currentState = {
          data: JSON.parse(JSON.stringify(state.data)),
          camTables: JSON.parse(JSON.stringify(state.camTables))
        };
        state.history.past.push(currentState);
        
        state.data = nextState.data;
        state.camTables = nextState.camTables;
      }
    }),

    setData: (data) => set((state) => { state.saveHistoryState(); state.data = data; }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setClipboard: (clipboard) => set({ clipboard }),
    setNodeToDelete: (nodeToDelete) => set({ nodeToDelete }),
    setIsCamManagerOpen: (isCamManagerOpen) => set({ isCamManagerOpen }),
    setIsWizardOpen: (isWizardOpen) => set({ isWizardOpen }),
    setCamTables: (camTables) => set((state) => { state.saveHistoryState(); state.camTables = camTables; }),

    addCamTable: (name) => set((state) => {
      state.saveHistoryState();
      state.camTables.push({
        id: `cam_${crypto.randomUUID()}`,
        name,
        masterRange: 360,
        sectors: [
          { id: '1', masterStart: 0, masterEnd: 180, slaveStart: 0, slaveEnd: 100, law: 'Poly5' },
          { id: '2', masterStart: 180, masterEnd: 360, slaveStart: 100, slaveEnd: 0, law: 'Poly5' }
        ]
      });
    }),

    deleteCamTable: (id) => set((state) => {
      state.saveHistoryState();
      state.camTables = state.camTables.filter(t => t.id !== id);
    }),

    updateCamTable: (id, updated) => set((state) => {
      state.saveHistoryState();
      const idx = state.camTables.findIndex(t => t.id === id);
      if (idx !== -1) state.camTables[idx] = updated;
    }),

    toggleNode: (id) => set((state) => {
      const node = findNode(state.data, id);
      if (node) {
        node.expanded = !node.expanded;
      }
    }),

    updateNode: (id, newParams) => set((state) => {
      state.saveHistoryState();
      const node = findNode(state.data, id);
      if (node) {
        node.parameters = { ...node.parameters, ...newParams };
        if (newParams.axisName !== undefined) {
          node.label = newParams.axisName;
        }
      }
    }),

    addAxis: () => set((state) => {
      state.saveHistoryState();
      let targetGroup = findNode(state.data, state.selectedNodeId);
      if (!targetGroup || targetGroup.type !== 'group') {
          targetGroup = state.data.find((n: any) => n.type === 'group') || state.data[0];
      }

      if (targetGroup && targetGroup.children) {
        const count = targetGroup.children.filter((c: any) => c.type === 'axis').length + 1;
        const axisLabel = `Axis ${count}`;
        const newAxis: TreeNode = {
          id: `axis_${crypto.randomUUID()}`,
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
      state.saveHistoryState();
      const newGroup: TreeNode = {
        id: `group_${crypto.randomUUID()}`,
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
      state.saveHistoryState();
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
      state.saveHistoryState();
      
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
      const newNode = state.clipboard.node ? JSON.parse(JSON.stringify(state.clipboard.node)) : null;
      if (!newNode) return;
      newNode.id = `${newNode.type}_${crypto.randomUUID()}`;
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
      
      state.saveHistoryState();

      
      // JSON clone the dragged node to insert it later
      const nodeToInsert = draggedNode ? JSON.parse(JSON.stringify(draggedNode)) : null;
      if (!nodeToInsert) return;

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

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
useProjectStore.subscribe((state) => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    autoSave(state.data, state.camTables);
  }, 2000);
});
