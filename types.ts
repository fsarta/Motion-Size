export type NodeType = 'group' | 'axis' | 'mechanism' | 'gearbox' | 'motor_drive';

export interface TreeNode {
  id: string;
  label: string;
  icon: 'group' | 'axis' | 'component' | 'drive';
  type: NodeType;
  children?: TreeNode[];
  expanded?: boolean;
}

export interface DriveData {
  id: number;
  efficiency: number;
  name: string;
}
