import { TreeNode } from '../types';

export function exportProjectToCSV(data: TreeNode[]): string {
  const headers = ['Axis Name', 'Mechanism', 'Gearbox Vendor', 'Gearbox Model', 'Motor Vendor', 'Motor Model', 'Drive Vendor', 'Drive Model'];
  const rows: string[][] = [headers];

  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'axis') {
        const p = node.parameters || {};
        rows.push([
          node.label || '',
          p.mechanismType || '',
          p.gearboxVendor || '',
          p.gearboxModel || '',
          p.motorVendor || '',
          p.motorModel || '',
          p.driveVendor || '',
          p.driveModel || ''
        ].map(val => `"${val}"`)); // wrap in quotes to escape commas
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  };

  traverse(data);

  return rows.map(r => r.join(',')).join('\n');
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
