
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

  // Reset tab when switching between different nodes to avoid state carry-over
  useEffect(() => {
    setActiveTab('Data');
  }, [selectedNode?.id]);

  // Safe check
  if (!selectedNode) {
      return (
        <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden items-center justify-center text-gray-400 text-sm select-none">
           Select an item from the project tree to configure.
        </div>
      );
  }

  // Find the parent axis if the current node is a component (mechanism, gearbox, etc)
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

  // Find the active group based on selection for visualizer
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

  // Available Masters
  const availableMasters = useMemo(() => {
     const masters: string[] = [];
     const traverse = (nodes: TreeNode[], groupName: string) => {
        nodes.forEach(node => {
            if (node.type === 'group') {
               traverse(node.children || [], node.label);
            } else if (node.type === 'axis') {
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
  const handleNodeUpdate = (newParams: any) => {
    onUpdateNode(selectedNode.id, newParams);
  };

  // Helper values for Profile Editor
  const axisParams = parentAxis?.parameters || {};
  const profileType = axisParams.profileType || 'Time Based';
  const masterAxisFullName = String(axisParams.masterAxis || 'Virtual Master');
  const masterAxisName = masterAxisFullName.includes('>') ? masterAxisFullName.split('>')[1].trim() : masterAxisFullName;
  const gearNum = parseFloat(String(axisParams.gearRatioNum || '1'));
  const gearDen = parseFloat(String(axisParams.gearRatioDen || '1'));
  const gearRatio = (gearDen !== 0 && !isNaN(gearDen) && !isNaN(gearNum)) ? gearNum / gearDen : 1;
  
  let cycleTime = 10;
  if (rootNode?.parameters?.cycleTime) {
      const val = parseFloat(String(rootNode.parameters.cycleTime));
      if (!isNaN(val) && val > 0) cycleTime = val;
  }

  const masterProfileData = useMemo(() => {
     if (masterAxisFullName === 'Virtual Master') return null;
     let foundData: string | null = null;
     const search = (nodes: TreeNode[]) => {
        for (const node of nodes) {
           if (node.type === 'axis' && node.label === masterAxisName) {
               // Profile is now on the mechanism child of the axis
               const mechanismChild = node.children?.find(c => c.type === 'mechanism');
               if (mechanismChild?.parameters?.motionProfileData) {
                   foundData = String(mechanismChild.parameters.motionProfileData);
               }
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

  // RENDER LOGIC
  
  // 1. AXIS PAGE: Only Data (No Visualizer, No Tabs)
  if (selectedNode.type === 'axis') {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
        <div className="flex-1 bg-win-bg p-2 overflow-y-auto flex flex-col min-h-0">
          <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0 flex justify-between items-center">
            <span>{selectedNode.label} Configuration</span>
            <span className="flex items-center text-[10px] font-normal text-gray-500"><Gauge size={10} className="mr-1"/> Status: OK</span>
          </div>
          <div className="flex-1 bg-white p-4 border border-gray-200 rounded shadow-sm overflow-y-auto">
             <AxisForm params={params} onUpdate={handleNodeUpdate} availableMasters={availableMasters} camTables={camTables} />
          </div>
        </div>
      </div>
    );
  }

  // 2. MECHANISM PAGE: Tabbed view (Data / Motion Profile)
  if (selectedNode.type === 'mechanism') {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
        <div className="flex-1 bg-win-bg p-2 flex flex-col min-h-0 overflow-hidden">
          <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0 flex justify-between items-center">
            <span className="flex items-center"><Activity size={14} className="mr-2 text-blue-600"/>{getTitle()}</span>
            <span className="text-[10px] font-normal text-gray-500 italic">Sync mode inherited from parent {parentAxis?.label}</span>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <FormTabs 
              tabs={['Data', 'Motion Profile', 'Notes']} 
              activeTab={activeTab} 
              onTabClick={setActiveTab} 
            />

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
                    <textarea 
                      className="w-full h-full p-2 text-xs border border-gray-200 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Add technical notes for this mechanism..."
                    />
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. OTHER PAGES (Gearbox, Motor, Group)
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      {selectedNode.type === 'group' && <Visualizer axes={axes} />}
      
      <div className="flex-1 bg-win-bg p-2 overflow-y-auto flex flex-col min-h-0">
        <div className="flex space-x-1 mb-3 shrink-0">
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Settings2 size={16} className="text-orange-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Play size={16} className="text-blue-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><ArrowRightLeft size={16} className="text-green-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><ChevronsUp size={16} /></button>
           <div className="w-px h-6 bg-gray-300 mx-1"></div>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Database size={16} className="text-purple-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><BarChart3 size={16} className="text-blue-500" /></button>
        </div>

        <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0 flex justify-between items-center">
          <span>{getTitle()}</span>
        </div>

        <FormTabs 
          tabs={['Data', 'Environment', 'Notes']} 
          activeTab={activeTab} 
          onTabClick={setActiveTab} 
        />

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'Data' ? (
            <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
                {selectedNode.type === 'group' ? <PowerGroupForm params={params} onUpdate={handleNodeUpdate} /> :
                 selectedNode.type === 'gearbox' ? <GearboxForm params={params} onUpdate={handleNodeUpdate} /> :
                 selectedNode.type === 'motor_drive' ? <MotorDriveForm params={params} onUpdate={handleNodeUpdate} /> :
                 <div className="text-gray-400 italic">Configuration view</div>}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic border border-gray-200 border-dashed rounded bg-gray-50 p-12">
              {activeTab} view for this component is not implemented in this demo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
