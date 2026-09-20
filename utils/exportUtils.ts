import { TreeNode } from '../types';
import { calculateAxisDynamics } from './physics';

export function exportProjectToCSV(data: TreeNode[]): string {
  const headers = [
    'Axis Name',
    'Motion Type',
    'Mechanism',
    'Load Mass (kg)',
    'Gearbox Vendor',
    'Gearbox Model',
    'Gear Ratio',
    'Motor Vendor',
    'Motor Model',
    'Rated Torque (Nm)',
    'Peak Torque (Nm)',
    'Rated Speed (RPM)',
    'Inertia Ratio (JL/JM)',
    'Drive Vendor',
    'Drive Model',
    'Drive Max Current (A)'
  ];

  const rows: string[][] = [headers];

  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'axis') {
        const p = node.parameters || {};
        const dyn = calculateAxisDynamics(p);
        
        rows.push([
          node.label || '',
          p.axisUsage || 'Rotary',
          p.mechanismType || '',
          String(dyn.totalMovingMassKg),
          p.gearboxVendor || '',
          p.gearboxModel || '',
          String(dyn.gearboxRatio),
          p.motorVendor || '',
          p.motorModel || '',
          String(p.ratedTorque || ''),
          String(p.peakTorque || ''),
          String(p.ratedSpeed || ''),
          dyn.inertiaRatio.toFixed(2),
          p.driveVendor || '',
          p.driveModel || '',
          String(p.driveMaxCurrent || '')
        ].map(val => `"${val.replace(/"/g, '""')}"`));
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
