export interface TreeNode {
  id: string;
  label: string;
  icon: 'group' | 'axis' | 'component' | 'drive';
  children?: TreeNode[];
  expanded?: boolean;
}

export interface DriveData {
  id: number;
  efficiency: number;
  name: string;
}
