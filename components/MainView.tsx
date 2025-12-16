import React, { useState, useMemo } from 'react';
import { Play, Settings2, ArrowRightLeft, ChevronsUp, BarChart3, Database, Gauge } from 'lucide-react';
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
  // Safe check
  if (!selectedNode) {
      return (
        <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden items-center justify-center text-gray-400 text-sm select-none">
           Select an item from the project tree to configure.
        </div>
      );
  }

  // Extract axes from the tree structure for visualizer
  const rootNode = data.find(n => n.id === 'root');
  
  // Find the active group based on selection
  let activeGroup = rootNode;
  if (selectedNode) {
     const findGroup = (nodes: TreeNode[]): TreeNode | null => {
        for(const node of nodes) {
           if (node.type === 'group') {
              if (node.id === selectedNode.id) return node;
              // check descendants
              const hasNode = (p: TreeNode, target: string): boolean => {
                 if (p.id === target) return true;
                 if (p.children) return p.children.some(c => hasNode(c, target));
                 return false;
              }
              if (node.children && node.children.some(c => hasNode(c, selectedNode.id))) return node;
           }
        }
        return null;
     }
     const found = findGroup(data);
     if (found) activeGroup = found;
  }

  const axes = activeGroup?.children?.filter(n => n.icon === 'axis') || [];
  
  // -- Calculate Available Masters --
  // Traverse entire tree to find all axes.
  // Format: "GroupName > AxisName"
  const availableMasters = useMemo(() => {
     const masters: string[] = [];
     
     const traverse = (nodes: TreeNode[], groupName: string) => {
        nodes.forEach(node => {
            if (node.type === 'group') {
               traverse(node.children || [], node.label);
            } else if (node.type === 'axis') {
               // Exclude self if selected
               if (node.id !== selectedNode.id) {
                   masters.push(`${groupName} > ${node.label}`);
               }
            }
        });
     };

     traverse(data, "");
     return masters;
  }, [data, selectedNode.id]);

  
  const [activeTab, setActiveTab] = useState('Data');

  const params = selectedNode.parameters || {};

  // Wrapper for child components to update the specific node
  const handleNodeUpdate = (newParams: any) => {
    onUpdateNode(selectedNode.id, newParams);
  };

  const renderFormContent = () => {
    // We add a key to the component to force re-render when selectedNode changes, 
    // ensuring defaultValues are updated from the new params.
    switch (selectedNode.type) {
      case 'group': return <React.Fragment key={selectedNode.id}><PowerGroupForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'mechanism': return <React.Fragment key={selectedNode.id}><MechanismForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'gearbox': return <React.Fragment key={selectedNode.id}><GearboxForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'motor_drive': return <React.Fragment key={selectedNode.id}><MotorDriveForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'axis': return <React.Fragment key={selectedNode.id}><AxisForm params={params} onUpdate={handleNodeUpdate} availableMasters={availableMasters} camTables={camTables} /></React.Fragment>;
      default: return <div className="text-gray-400 italic p-4">Select an item to configure</div>;
    }
  };

  const getTitle = () => {
    if (!selectedNode) return 'Configuration';
    if (selectedNode.type === 'mechanism') return `Mechanism: ${selectedNode.label}`;
    if (selectedNode.type === 'gearbox') return `Gearbox: ${selectedNode.label}`;
    if (selectedNode.type === 'motor_drive') return `Drive & Motor: ${selectedNode.label}`;
    return selectedNode.label;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      {selectedNode.type === 'group' && <Visualizer axes={axes} />}
      
      <div className="flex-1 bg-win-bg p-2 overflow-y-auto flex flex-col min-h-0">
        {/* Toolbar for the form */}
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
          <div className="flex space-x-2 text-[10px] font-normal text-gray-500">
             <span className="flex items-center"><Gauge size={10} className="mr-1"/> Status: OK</span>
          </div>
        </div>

        <FormTabs 
          tabs={['Data', 'Motion Profile', 'Environment', 'Notes']} 
          activeTab={activeTab} 
          onTabClick={setActiveTab} 
        />

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'Data' ? (
            renderFormContent()
          ) : activeTab === 'Motion Profile' ? (
            <div className="h-full flex flex-col">
              <ProfileEditor />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic border border-gray-200 border-dashed rounded bg-gray-50">
              {activeTab} view not implemented in this demo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};