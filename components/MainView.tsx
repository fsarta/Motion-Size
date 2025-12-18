
import React, { useState, useMemo, useEffect } from 'react';
import { Play, Settings2, ArrowRightLeft, ChevronsUp, BarChart3, Database, Gauge, Activity } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('Data');

  // Reset tab when switching nodes
  useEffect(() => {
    setActiveTab('Data');
  }, [selectedNode?.id]);

  if (!selectedNode) {
      return (
        <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden items-center justify-center text-gray-400 text-sm select-none">
           Select an item from the project tree to configure.
        </div>
      );
  }

  const findParentAxis = (nodes: TreeNode[], targetId: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.children) {
        if (node.children.some(c => c.id === targetId)) {
          return node.type === 'axis' ? node : findParentAxis(data, node.id);
        }
        const found = findParentAxis(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const parentAxis = useMemo(() => {
    if (selectedNode.type === 'axis') return selectedNode;
    return findParentAxis(data, selectedNode.id);
  }, [data, selectedNode]);

  const rootNode = data.find(n => n.id === 'root');
  let activeGroup = rootNode;
  if (selectedNode) {
     const findGroup = (nodes: TreeNode[]): TreeNode | null => {
        for(const node of nodes) {
           if (node.type === 'group') {
              const hasNode = (p: TreeNode, target: string): boolean => {
                 if (p.id === target) return true;
                 if (p.children) return p.children.some(c => hasNode(c, target));
                 return false;
              }
              if (node.id === selectedNode.id || (node.children && node.children.some(c => hasNode(c, selectedNode.id)))) return node;
           }
        }
        return null;
     }
     const found = findGroup(data);
     if (found) activeGroup = found;
  }
  const axes = activeGroup?.children?.filter(n => n.icon === 'axis') || [];

  const availableMasters = useMemo(() => {
     const masters: string[] = [];
     const traverse = (nodes: TreeNode[], groupName: string) => {
        nodes.forEach(node => {
            if (node.type === 'group') traverse(node.children || [], node.label);
            else if (node.type === 'axis') {
               if (node.id !== (parentAxis?.id || selectedNode.id)) {
                   masters.push(`${groupName} > ${node.label}`);
               }
            }
        });
     };
     traverse(data, "");
     return masters;
  }, [data, selectedNode.id, parentAxis?.id]);

  const params = selectedNode.parameters || {};
  const handleNodeUpdate = (newParams: any) => onUpdateNode(selectedNode.id, newParams);

  const axisParams = parentAxis?.parameters || {};
  const profileType = axisParams.profileType || 'Time Based';
  const masterAxisFullName = String(axisParams.masterAxis || 'Virtual Master');
  const masterAxisName = masterAxisFullName.includes('>') ? masterAxisFullName.split('>')[1].trim() : masterAxisFullName;
  const gearRatio = (parseFloat(String(axisParams.gearRatioDen)) !== 0) ? parseFloat(String(axisParams.gearRatioNum)) / parseFloat(String(axisParams.gearRatioDen)) : 1;
  const cycleTime = parseFloat(String(rootNode?.parameters?.cycleTime)) || 10;

  const masterProfileData = useMemo(() => {
     if (masterAxisFullName === 'Virtual Master') return null;
     let foundData: string | null = null;
     const search = (nodes: TreeNode[]) => {
        for (const node of nodes) {
           if (node.type === 'axis' && node.label === masterAxisName) {
               const mechanismChild = node.children?.find(c => c.type === 'mechanism');
               if (mechanismChild?.parameters?.motionProfileData) foundData = String(mechanismChild.parameters.motionProfileData);
               return;
           }
           if (node.children) search(node.children);
        }
     };
     search(data);
     return foundData;
  }, [data, masterAxisFullName, masterAxisName]);

  const getTitle = () => {
    if (selectedNode.type === 'mechanism') return `Mechanism Configuration: ${selectedNode.label}`;
    if (selectedNode.type === 'gearbox') return `Gearbox: ${selectedNode.label}`;
    if (selectedNode.type === 'motor_drive') return `Drive & Motor: ${selectedNode.label}`;
    return selectedNode.label;
  };

  // 1. AXIS VIEW (Data Only, No Graphics)
  if (selectedNode.type === 'axis') {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
        <div className="flex-1 bg-win-bg p-2 overflow-y-auto flex flex-col min-h-0">
          <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0 flex justify-between items-center">
            <span>{selectedNode.label} - System Data</span>
            <span className="flex items-center text-[10px] font-normal text-gray-500"><Gauge size={10} className="mr-1"/> Logic Engine Active</span>
          </div>
          <div className="flex-1 bg-white p-4 border border-gray-200 rounded shadow-sm overflow-y-auto">
             <AxisForm params={params} onUpdate={handleNodeUpdate} availableMasters={availableMasters} camTables={camTables} />
          </div>
        </div>
      </div>
    );
  }

  // 2. MECHANISM VIEW (Tabbed: Data / Profile)
  if (selectedNode.type === 'mechanism') {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
        <div className="flex-1 bg-win-bg p-2 flex flex-col min-h-0 overflow-hidden">
          <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0 flex justify-between items-center">
            <span className="flex items-center"><Activity size={14} className="mr-2 text-blue-600"/>{getTitle()}</span>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <FormTabs tabs={['Data', 'Motion Profile', 'Notes']} activeTab={activeTab} onTabClick={setActiveTab} />
            <div className="flex-1 overflow-hidden">
               {activeTab === 'Data' && (
                  <div className="h-full bg-white p-4 border border-gray-200 rounded shadow-sm overflow-y-auto">
                    <MechanismForm params={params} onUpdate={handleNodeUpdate} />
                  </div>
               )}
               {activeTab === 'Motion Profile' && (
                  <div className="h-full bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col">
                    <ProfileEditor 
                       profileType={profileType as any} 
                       masterAxisName={masterAxisName}
                       gearRatio={gearRatio}
                       cycleTime={cycleTime}
                       savedProfileData={params.motionProfileData ? String(params.motionProfileData) : null}
                       masterProfileData={masterProfileData}
                       onProfileChange={(json) => handleNodeUpdate({ motionProfileData: json })}
                     />
                  </div>
               )}
               {activeTab === 'Notes' && (
                  <div className="h-full bg-white p-4 border border-gray-200 rounded shadow-sm">
                    <textarea className="w-full h-full p-2 text-xs border border-gray-200 focus:outline-none focus:border-blue-500 resize-none" placeholder="Notes for this mechanism..." />
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. OTHER VIEWS (Group, Gearbox, Motor)
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      {selectedNode.type === 'group' && <Visualizer axes={axes} />}
      <div className="flex-1 bg-win-bg p-2 overflow-y-auto flex flex-col min-h-0">
        <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0">{getTitle()}</div>
        <FormTabs tabs={['Data', 'Environment', 'Notes']} activeTab={activeTab} onTabClick={setActiveTab} />
        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'Data' ? (
            <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
                {selectedNode.type === 'group' ? <PowerGroupForm params={params} onUpdate={handleNodeUpdate} /> :
                 selectedNode.type === 'gearbox' ? <GearboxForm params={params} onUpdate={handleNodeUpdate} /> :
                 selectedNode.type === 'motor_drive' ? <MotorDriveForm params={params} onUpdate={handleNodeUpdate} /> :
                 <div className="text-gray-400 italic">Configuration view</div>}
            </div>
          ) : <div className="p-8 text-center text-gray-400 italic">No data in {activeTab}</div>}
        </div>
      </div>
    </div>
  );
};
