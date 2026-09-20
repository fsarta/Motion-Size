
import React, { useState, useMemo, useEffect } from 'react';
import { Gauge, Activity, Cpu, Settings, Zap, Boxes, ShoppingCart } from 'lucide-react';
import { TreeNode, CamTable, SizingMetrics } from '../types';
import { ProfileEditor } from './ProfileEditor';
import { FormTabs } from './Common';
import { Visualizer } from './Visualizer';
import { UnitType } from '../utils/unitConversion';
import { calculateAxisDynamics } from '../utils/physics';

import { useProjectStore } from '../store/useProjectStore';

// Forms
import { PowerGroupForm } from './forms/PowerGroupForm';
import { MechanismForm } from './forms/MechanismForm';
import { GearboxForm } from './forms/GearboxForm';
import { MotorDriveForm } from './forms/MotorDriveForm';
import { AxisForm } from './forms/AxisForm';
import { RoboticKinematicsForm } from './forms/RoboticKinematicsForm';
import { PathPlannerForm } from './forms/PathPlannerForm';

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
            <tr><td className="p-2 border font-semibold">Gearbox</td><td className="p-2 border">{params.gearboxModel || 'Not selected'}</td><td className="p-2 border">{params.gearboxVendor || '-'}</td></tr>
            <tr><td className="p-2 border font-semibold">Motor</td><td className="p-2 border">{params.motorModel || 'Not selected'}</td><td className="p-2 border">{params.motorVendor || '-'}</td></tr>
            <tr><td className="p-2 border font-semibold">Drive</td><td className="p-2 border">{params.driveModel || 'Not selected'}</td><td className="p-2 border">{params.driveVendor || '-'}</td></tr>
        </tbody>
    </table>
  </div>
);

export const WorkArea = () => {
  const [activeTab, setActiveTab] = useState('System Data');
  const [activeGroupTab, setActiveGroupTab] = useState('Configuration');
  const [sizingMetrics, setSizingMetrics] = useState<SizingMetrics | null>(null);
  
  const { data, selectedNodeId, updateNode, camTables, setSelectedNodeId } = useProjectStore();
  
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

  const selectedNode = findNode(data, selectedNodeId);

  useEffect(() => {
    setActiveTab('System Data');
    setActiveGroupTab('Configuration');
  }, [selectedNode?.id]);

  const { totalAxes, incompleteAxes, completeAxes } = useMemo(() => {
    let total = 0;
    let incomplete = 0;
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'axis') {
          total++;
          const params = node.parameters || {};
          if (!params.motorModel || !params.driveModel) {
            incomplete++;
          }
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(data);
    return { totalAxes: total, incompleteAxes: incomplete, completeAxes: total - incomplete };
  }, [data]);

  const statusBar = (
    <div className="h-8 bg-slate-50 border-b border-gray-200 flex items-center px-4 text-xs shrink-0 z-20 justify-between">
      <div className="flex items-center text-gray-700 font-medium">
        <Activity size={14} className="mr-2 text-blue-600" />
        System Health Summary
      </div>
      <div className="flex space-x-4">
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Total Axes:</span>
          <span className="font-semibold">{totalAxes}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Fully Sized:</span>
          <span className="font-semibold text-green-600">{completeAxes}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Incomplete:</span>
          <span className={`font-semibold ${incompleteAxes > 0 ? 'text-amber-500' : 'text-gray-600'}`}>
            {incompleteAxes}
          </span>
        </div>
      </div>
    </div>
  );

  if (!selectedNode) return (
    <div className="flex-1 flex flex-col h-full bg-win-bg overflow-hidden">
      {statusBar}
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a project node.</div>
    </div>
  );

  const params = selectedNode.parameters || {};
  const handleUpdate = (newParams: any) => updateNode(selectedNode.id, newParams);

  const availableMasters = useMemo(() => {
     const masters: string[] = [];
     const traverse = (nodes: TreeNode[], groupName: string) => {
        nodes.forEach(node => {
            if (node.type === 'group') {
                traverse(node.children || [], node.label);
            } else if (node.type === 'axis') {
                if (node.id !== selectedNode.id) {
                    masters.push(`${groupName} > ${node.label}`);
                }
            }
        });
     };
     traverse(data, "");
     return masters;
  }, [data, selectedNode.id]);

  const masterProfileData = useMemo(() => {
    if (!params.masterAxis || params.masterAxis === 'Virtual Master') return null;
    const axisLabel = String(params.masterAxis).includes('>') ? String(params.masterAxis).split('>')[1].trim() : String(params.masterAxis);
    
    const findAxisProfile = (nodes: TreeNode[]): string | null => {
        for (const node of nodes) {
            if (node.type === 'axis' && node.label === axisLabel) {
                const mp = node.parameters?.motionProfileData as string;
                return (mp && mp !== 'undefined') ? mp : null;
            }
            if (node.children) {
                const found = findAxisProfile(node.children);
                if (found) return found;
            }
        }
        return null;
    };
    return findAxisProfile(data);
  }, [data, params.masterAxis]);

  const axisDynamics = useMemo(() => calculateAxisDynamics(params), [params]);
  const totalInertia = axisDynamics.totalInertiaKgM2;
  const friction = axisDynamics.frictionTorqueNm;
  const efficiency = axisDynamics.combinedEfficiency;
  const gravityForce = axisDynamics.gravityTorqueNm;

  const profileType = params.profileType || 'Time Based';
  const masterAxisFullName = String(params.masterAxis || 'Virtual Master');
  const masterAxisName = masterAxisFullName.includes('>') ? masterAxisFullName.split('>')[1].trim() : masterAxisFullName;
  const gearRatioNum = parseFloat(String(params.gearRatioNum)) || 1;
  const gearRatioDen = parseFloat(String(params.gearRatioDen)) || 1;
  const gearRatio = gearRatioDen !== 0 ? gearRatioNum / gearRatioDen : 1;
  
  // Logic to determine if we use degrees or millimeters based on AxisForm selection
  const posUnitType: UnitType = params.axisUsage === 'Linear' ? 'length' : 'angle';
  const isReadOnly = profileType !== 'Time Based';

  if (selectedNode.type === 'axis') {
    const tabs = ['System Data', 'Mechanism', 'Motion Profile', 'Motor', 'Drive', 'Gearbox', 'BOM'];
    
    return (
      <div className="flex-1 flex flex-col h-full bg-win-bg overflow-hidden">
        {statusBar}
        <div className="h-10 bg-white border-b border-win-border flex items-center px-4 shrink-0 shadow-sm z-10">
           <Activity size={16} className="text-win-blue mr-2"/>
           <span className="text-sm font-bold text-gray-700">{selectedNode.label} Configuration</span>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <FormTabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
          <div className="flex-1 overflow-hidden">
             <div className="h-full bg-win-panel p-4 border border-win-border m-2 rounded shadow-sm overflow-hidden">
                {activeTab === 'System Data' && <AxisForm params={params} onUpdate={handleUpdate} availableMasters={availableMasters} camTables={camTables} />}
                {activeTab === 'Mechanism' && <MechanismForm params={params} onUpdate={handleUpdate} />}
                {activeTab === 'Motion Profile' && (
                  <div className="h-full -m-4">
                    <ProfileEditor 
                       profileType={profileType as any} 
                       masterAxisName={masterAxisName}
                       gearRatio={gearRatio}
                       posUnitType={posUnitType}
                       isReadOnly={isReadOnly}
                       savedProfileData={(params.motionProfileData && String(params.motionProfileData) !== 'undefined') ? String(params.motionProfileData) : null}
                       masterProfileData={masterProfileData}
                       totalInertia={totalInertia}
                       onSizingMetricsChange={setSizingMetrics}
                       onProfileChange={(json) => handleUpdate({ motionProfileData: json })}
                       friction={friction}
                       efficiency={efficiency}
                       gravityForce={gravityForce}
                       params={params}
                     />
                  </div>
                )}
                {activeTab === 'Motor' && <MotorForm params={params} onUpdate={handleUpdate} sizingMetrics={sizingMetrics} />}
                {activeTab === 'Drive' && <DriveForm params={params} onUpdate={handleUpdate} sizingMetrics={sizingMetrics} />}
                {activeTab === 'Gearbox' && <GearboxForm params={params} onUpdate={handleUpdate} />}
                {activeTab === 'BOM' && <BOMView params={params} />}
             </div>
          </div>
        </div>
      </div>
    );
  }

  const groupTabs = params.configuration === 'Robotic' ? ['Configuration', 'Robotic Kinematics', 'Path Planner'] : ['Configuration'];

  return (
    <div className="flex-1 flex flex-col h-full bg-win-bg overflow-hidden">
      {statusBar}
      <Visualizer 
        axes={selectedNode.children || []} 
        selectedAxisId={selectedNodeId}
        onSelectAxis={setSelectedNodeId}
      />
      
      <div className="flex-1 flex flex-col min-h-0 bg-win-panel border-t border-win-border">
        <FormTabs tabs={groupTabs} activeTab={activeGroupTab} onTabClick={setActiveGroupTab} />
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeGroupTab === 'Configuration' && (
            <PowerGroupForm params={params} onUpdate={handleUpdate} groupNode={selectedNode} />
          )}
          
          {activeGroupTab === 'Robotic Kinematics' && params.configuration === 'Robotic' && (
            <RoboticKinematicsForm params={params} onUpdate={handleUpdate} groupNode={selectedNode} />
          )}

          {activeGroupTab === 'Path Planner' && params.configuration === 'Robotic' && (
            <PathPlannerForm params={params} onUpdate={handleUpdate} groupNode={selectedNode} />
          )}
        </div>
      </div>
    </div>
  );
};
