
import React, { useState, useMemo, useEffect } from 'react';
import { Gauge, Activity, Cpu, Settings, Zap, Boxes, ShoppingCart } from 'lucide-react';
import { TreeNode, CamTable } from '../types';
import { ProfileEditor } from './ProfileEditor';
import { FormTabs } from './Common';
import { Visualizer } from './Visualizer';

// Forms
import { PowerGroupForm } from './forms/PowerGroupForm';
import { MechanismForm } from './forms/MechanismForm';
import { GearboxForm } from './forms/GearboxForm';
import { MotorDriveForm } from './forms/MotorDriveForm';
import { AxisForm } from './forms/AxisForm';

// Simple placeholders for split Motor/Drive and BOM
const MotorForm = (props: any) => <MotorDriveForm {...props} onlyMotor={true} />;
const DriveForm = (props: any) => <MotorDriveForm {...props} onlyDrive={true} />;
const BOMView = ({ params }: { params: any }) => (
  <div className="p-4">
    <div className="text-sm font-bold mb-4 text-gray-700">Bill of Materials - {params.axisName}</div>
    <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-gray-100">
            <tr><th className="p-2 border">Category</th><th className="p-2 border">Selected Component</th><th className="p-2 border">Vendor</th></tr>
        </thead>
        <tbody>
            <tr><td className="p-2 border font-semibold">Mechanism</td><td className="p-2 border">{params.mechanismType}</td><td className="p-2 border">-</td></tr>
            <tr><td className="p-2 border font-semibold">Gearbox</td><td className="p-2 border">{params.model || 'Not selected'}</td><td className="p-2 border">{params.vendor || '-'}</td></tr>
            <tr><td className="p-2 border font-semibold">Motor</td><td className="p-2 border">{params.motorModel || 'Not selected'}</td><td className="p-2 border">{params.motorVendor || '-'}</td></tr>
            <tr><td className="p-2 border font-semibold">Drive</td><td className="p-2 border">{params.driveModel || 'Not selected'}</td><td className="p-2 border">{params.driveVendor || '-'}</td></tr>
        </tbody>
    </table>
  </div>
);

export const WorkArea = ({ 
  data, 
  selectedNode, 
  onUpdateNode,
  camTables
}: { 
  data: TreeNode[], 
  selectedNode: TreeNode | undefined, 
  onUpdateNode: (id: string, params: any) => void,
  camTables: CamTable[]
}) => {
  const [activeTab, setActiveTab] = useState('System Data');

  useEffect(() => {
    setActiveTab('System Data');
  }, [selectedNode?.id]);

  if (!selectedNode) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a project node.</div>;

  const rootNode = data.find(n => n.id === 'root');
  const params = selectedNode.parameters || {};
  const handleUpdate = (newParams: any) => onUpdateNode(selectedNode.id, newParams);

  // Available Masters: Search through all groups for all axes
  const availableMasters = useMemo(() => {
     const masters: string[] = [];
     const traverse = (nodes: TreeNode[], groupName: string) => {
        nodes.forEach(node => {
            if (node.type === 'group') {
                traverse(node.children || [], node.label);
            } else if (node.type === 'axis') {
                // Don't include itself as a master
                if (node.id !== selectedNode.id) {
                    masters.push(`${groupName} > ${node.label}`);
                }
            }
        });
     };
     traverse(data, "");
     return masters;
  }, [data, selectedNode.id]);

  // Profile data helpers
  const profileType = params.profileType || 'Time Based';
  const masterAxisFullName = String(params.masterAxis || 'Virtual Master');
  const masterAxisName = masterAxisFullName.includes('>') ? masterAxisFullName.split('>')[1].trim() : masterAxisFullName;
  const gearRatio = (parseFloat(String(params.gearRatioDen)) !== 0) ? parseFloat(String(params.gearRatioNum)) / parseFloat(String(params.gearRatioDen)) : 1;
  const cycleTime = parseFloat(String(rootNode?.parameters?.cycleTime)) || 10;

  if (selectedNode.type === 'axis') {
    const tabs = ['System Data', 'Mechanism', 'Motion Profile', 'Motor', 'Drive', 'Gearbox', 'BOM'];
    
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
        <div className="h-10 bg-white border-b border-gray-300 flex items-center px-4 shrink-0 shadow-sm z-10">
           <Activity size={16} className="text-blue-600 mr-2"/>
           <span className="text-sm font-bold text-gray-700">{selectedNode.label} Configuration</span>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <FormTabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
          <div className="flex-1 overflow-hidden">
             <div className="h-full bg-white p-4 border border-gray-200 m-2 rounded shadow-sm overflow-y-auto">
                {activeTab === 'System Data' && <AxisForm params={params} onUpdate={handleUpdate} availableMasters={availableMasters} camTables={camTables} />}
                {activeTab === 'Mechanism' && <MechanismForm params={params} onUpdate={handleUpdate} />}
                {activeTab === 'Motion Profile' && (
                  <div className="h-full -m-4">
                    <ProfileEditor 
                       profileType={profileType as any} 
                       masterAxisName={masterAxisName}
                       gearRatio={gearRatio}
                       cycleTime={cycleTime}
                       savedProfileData={params.motionProfileData ? String(params.motionProfileData) : null}
                       onProfileChange={(json) => handleUpdate({ motionProfileData: json })}
                     />
                  </div>
                )}
                {activeTab === 'Motor' && <MotorForm params={params} onUpdate={handleUpdate} />}
                {activeTab === 'Drive' && <DriveForm params={params} onUpdate={handleUpdate} />}
                {activeTab === 'Gearbox' && <GearboxForm params={params} onUpdate={handleUpdate} />}
                {activeTab === 'BOM' && <BOMView params={params} />}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      <Visualizer axes={selectedNode.children || []} />
      <div className="flex-1 p-4 overflow-y-auto">
        <SectionHeader title="Power Group Data" />
        <PowerGroupForm params={params} onUpdate={handleUpdate} />
      </div>
    </div>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 uppercase tracking-wide">
    {title}
  </div>
);
