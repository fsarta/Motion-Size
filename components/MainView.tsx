import React, { useState } from 'react';
import { Zap, Play, Settings2, ArrowRightLeft, ChevronsUp, BarChart3, List, Database, Gauge } from 'lucide-react';
import { TreeNode } from '../types';

/* --- Visualization Components --- */

const EfficiencyBar = ({ value }: { value: number }) => (
  <div className="flex flex-col items-center">
    <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 rounded-sm mb-1 border border-green-600 shadow-sm">
      {value}%
    </div>
    <div className="h-4 w-px bg-gray-400"></div>
  </div>
);

const DriveUnit = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center mx-2 relative group min-w-[60px]">
    {/* Connection line top */}
    <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-400"></div>
    
    {/* Inverter Box */}
    <div className="w-16 h-24 bg-gray-50 border border-gray-400 shadow-sm relative flex flex-col items-center justify-between p-1">
      <div className="w-full h-4 bg-gray-800 text-red-500 font-mono text-[8px] flex items-center justify-center">88</div>
      <div className="flex-1 flex items-center justify-center">
        <Zap size={16} className="text-gray-400" />
      </div>
      <div className="w-full flex justify-around">
         <div className="w-1.5 h-1.5 bg-green-700 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
    </div>

    {/* Cable */}
    <div className="h-6 w-1 bg-green-700 my-0.5"></div>

    {/* Motor */}
    <div className="w-16 h-10 bg-gray-700 rounded-sm border border-black relative flex items-center justify-center shadow-md">
       <div className="absolute -left-2 w-4 h-6 bg-gray-600 rounded-l-sm border-l border-t border-b border-black"></div>
       <div className="w-10 h-0.5 bg-gray-500 opacity-30"></div>
       <div className="w-10 h-0.5 bg-gray-500 opacity-30 mt-1"></div>
    </div>
    
    <div className="mt-1 text-xs font-bold text-gray-600">{label}</div>
  </div>
);

const Visualizer = ({ axes }: { axes: TreeNode[] }) => {
  return (
    <div className="h-1/3 bg-white border-b border-gray-300 p-4 relative overflow-hidden flex flex-col shrink-0">
       {/* Title Overlay */}
       <div className="absolute top-0 left-0 bg-win-blue/10 text-win-blue font-bold px-2 py-0.5 text-xs border-r border-b border-win-blue/20">
         Power Group
       </div>

       {/* System Diagram */}
       <div className="flex-1 flex items-center justify-center overflow-x-auto">
         {/* Supply Unit */}
         <div className="mr-8 flex flex-col items-center justify-end h-full pb-10 shrink-0">
            <div className="w-12 h-32 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-400 shadow-md flex items-center justify-center">
               <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center">
                 <div className="w-0.5 h-3 bg-black transform rotate-45"></div>
               </div>
            </div>
         </div>

         {/* Connection Bus */}
         <div className="absolute top-[35%] left-[20%] right-[5%] h-1 bg-gray-800 -z-10"></div>

         {/* Drives */}
         <div className="flex items-end overflow-x-auto pb-2 px-4 scrollbar-thin">
            {axes.map((axis, index) => {
               const efficiency = 60 + (axis.label.length * 5 + index * 3) % 35;
               return (
                <div key={axis.id} className="flex flex-col items-center -mt-16 shrink-0">
                  <EfficiencyBar value={efficiency} />
                  <DriveUnit label={axis.label.split(' ')[0]} />
                </div>
               );
            })}
         </div>
       </div>
    </div>
  );
};

/* --- Form Components --- */

const InputGroup = ({ label, children, unit, checkbox, className="" }: { label: string, children?: React.ReactNode, unit?: string, checkbox?: boolean, className?: string }) => (
  <div className={`flex items-center mb-1.5 ${className}`}>
    <div className="w-40 text-xs text-win-blue font-medium truncate pr-2 flex items-center text-right justify-end">
        {checkbox && <input type="checkbox" className="mr-1.5 h-3 w-3" />}
        {label}
    </div>
    <div className="flex-1 flex items-center">
      {children}
      {unit && <span className="ml-1.5 text-xs text-gray-600 w-8">{unit}</span>}
    </div>
  </div>
);

const Select = ({ value, options }: { value: string, options: string[] }) => (
  <select className="w-full text-xs border border-gray-300 bg-white px-1 py-0.5 focus:outline-none focus:border-blue-500 h-6">
    <option>{value}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const NumberInput = ({ value, className = "w-full" }: { value: string, className?: string }) => (
  <input type="text" defaultValue={value} className={`${className} text-right text-xs border border-gray-300 bg-white px-1 py-0.5 focus:outline-none focus:border-blue-500 h-6`} />
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="text-xs font-bold text-gray-700 mb-3 border-b border-gray-300 pb-1 mt-2">
    {title}
  </div>
);

const FormTabs = ({ tabs, activeTab, onTabClick }: { tabs: string[], activeTab: string, onTabClick: (t: string) => void }) => (
  <div className="flex border-b border-gray-300 mb-3 bg-gray-100">
    {tabs.map(tab => (
      <div 
        key={tab}
        onClick={() => onTabClick(tab)}
        className={`px-3 py-1.5 text-xs cursor-pointer border-r border-gray-300 hover:bg-gray-50
          ${activeTab === tab ? 'bg-white font-bold border-t-2 border-t-blue-500 border-b-white translate-y-[1px]' : 'text-gray-600'}
        `}
      >
        {tab}
      </div>
    ))}
  </div>
);

/* --- Specific Node Forms --- */

const PowerGroupForm = () => (
  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
    <div>
      <InputGroup label="Cycle time" unit="s">
        <NumberInput value="10" />
      </InputGroup>
      <InputGroup label="Configuration">
         <Select value="Multi-Axis" options={['Multi-Axis', 'Independent', 'Robotic']} />
      </InputGroup>
      
      <div className="h-4 border-b border-gray-300 mb-2 mt-1"></div>

      <InputGroup label="Supply" unit="Ø">
         <div className="flex w-full space-x-1 items-center">
           <Select value="400" options={['230', '480']} />
           <span className="text-xs text-red-700 mx-1">Vac</span>
           <Select value="3" options={['1']} />
         </div>
      </InputGroup>
      <InputGroup label="Nominal bus voltage" unit="Vdc">
        <div className="flex w-full items-center">
             <NumberInput value="540" className="flex-1" />
             <div className="ml-2 flex items-center">
                <input type="checkbox" checked className="mr-1" />
                <span className="text-xs">Auto</span>
             </div>
        </div>
      </InputGroup>
    </div>
    <div>
      <InputGroup label="Infeed Peak Power" unit="%">
         <NumberInput value="0" />
      </InputGroup>
      <InputGroup label="Target Bus Voltage" unit="Vdc">
         <NumberInput value="0" />
      </InputGroup>
    </div>
  </div>
);

const MechanismForm = () => (
  <div>
    <div className="grid grid-cols-2 gap-8">
      <div>
        <InputGroup label="Mechanism Type">
          <Select value="Conveyor" options={['Rack & Pinion', 'Ball Screw', 'Rotary Table']} />
        </InputGroup>
        <InputGroup label="Mass of Load" unit="kg">
          <NumberInput value="50.0" />
        </InputGroup>
        <InputGroup label="Mass of Belt" unit="kg">
          <NumberInput value="5.2" />
        </InputGroup>
        <InputGroup label="Friction Coeff" unit="µ">
          <NumberInput value="0.15" />
        </InputGroup>
      </div>
      <div>
        <InputGroup label="Incline Angle" unit="°">
          <NumberInput value="0" />
        </InputGroup>
        <InputGroup label="Drive Pulley Radius" unit="mm">
          <NumberInput value="45.0" />
        </InputGroup>
        <InputGroup label="Additional Force" unit="N">
          <NumberInput value="0" />
        </InputGroup>
      </div>
    </div>
    <div className="mt-4 p-2 border border-gray-300 bg-white">
        <div className="text-xs font-bold text-gray-500 mb-2">Thrust / Velocity Profile</div>
        <div className="h-32 bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed text-gray-400 text-xs">
           Chart Preview Area
        </div>
    </div>
  </div>
);

const GearboxForm = () => (
  <div className="grid grid-cols-2 gap-8">
    <div>
      <InputGroup label="Vendor">
        <Select value="Generic" options={['Stober', 'Wittenstein', 'Neugart']} />
      </InputGroup>
      <InputGroup label="Ratio (i)">
        <NumberInput value="10.0" />
      </InputGroup>
      <InputGroup label="Efficiency" unit="%">
        <NumberInput value="95" />
      </InputGroup>
    </div>
    <div>
      <InputGroup label="Inertia" unit="kg·cm²">
        <NumberInput value="0.5" />
      </InputGroup>
      <InputGroup label="Backlash" unit="arcmin">
        <NumberInput value="4" />
      </InputGroup>
      <InputGroup label="Max Input Speed" unit="rpm">
        <NumberInput value="6000" />
      </InputGroup>
    </div>
  </div>
);

const MotorDriveForm = () => (
  <div>
    <div className="grid grid-cols-2 gap-8 mb-4">
      <div>
        <SectionHeader title="Motor Selection" />
        <InputGroup label="Vendor">
          <Select value="Siemens" options={['Bosch Rexroth', 'Beckhoff', 'Yaskawa']} />
        </InputGroup>
        <InputGroup label="Model">
           <div className="flex w-full gap-1">
             <input className="w-full text-xs border border-gray-300 px-1" value="1FK7060-2AC71" readOnly />
             <button className="px-2 bg-gray-200 border border-gray-300 text-xs hover:bg-gray-300">...</button>
           </div>
        </InputGroup>
        <InputGroup label="Rated Speed" unit="rpm">
          <NumberInput value="3000" />
        </InputGroup>
        <InputGroup label="Rated Torque" unit="Nm">
          <NumberInput value="6.0" />
        </InputGroup>
        <InputGroup label="Inertia" unit="kg·cm²">
          <NumberInput value="3.4" />
        </InputGroup>
      </div>
      <div>
        <SectionHeader title="Drive / Inverter" />
        <InputGroup label="Model">
           <div className="flex w-full gap-1">
             <input className="w-full text-xs border border-gray-300 px-1" value="S120-3A-400V" readOnly />
             <button className="px-2 bg-gray-200 border border-gray-300 text-xs hover:bg-gray-300">...</button>
           </div>
        </InputGroup>
        <InputGroup label="Supply Voltage" unit="V">
          <NumberInput value="400" />
        </InputGroup>
        <InputGroup label="PWM Frequency" unit="kHz">
          <Select value="8" options={['4', '8', '16']} />
        </InputGroup>
        <InputGroup label="Max Current" unit="A">
          <NumberInput value="18.0" />
        </InputGroup>
      </div>
    </div>
    
    <SectionHeader title="Performance Curves" />
    <div className="grid grid-cols-2 gap-4">
       <div className="border border-gray-300 bg-white h-48 relative p-2">
          <div className="text-[10px] text-gray-500 absolute top-1 left-1">Torque vs Speed</div>
          <div className="w-full h-full flex items-end">
             {/* Fake Curve */}
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0,10 L40,10 L80,50 L100,90" fill="none" stroke="red" strokeWidth="2" />
               <path d="M0,90 L100,90" stroke="black" strokeWidth="1" />
               <path d="M0,0 L0,100" stroke="black" strokeWidth="1" />
             </svg>
          </div>
       </div>
       <div className="border border-gray-300 bg-white h-48 relative p-2">
          <div className="text-[10px] text-gray-500 absolute top-1 left-1">Current vs Speed</div>
          <div className="w-full h-full flex items-end">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,90 L60,80 L100,20" fill="none" stroke="blue" strokeWidth="2" />
                <path d="M0,90 L100,90" stroke="black" strokeWidth="1" />
                <path d="M0,0 L0,100" stroke="black" strokeWidth="1" />
             </svg>
          </div>
       </div>
    </div>
  </div>
);

const AxisForm = () => (
  <div>
    <div className="p-4 bg-yellow-50 border border-yellow-200 mb-4 rounded-sm text-xs text-yellow-800">
      Select a specific component (Mechanism, Gearbox, Motor) from the tree to edit its parameters.
    </div>
    <div className="grid grid-cols-2 gap-8">
      <div>
        <InputGroup label="Axis Name">
          <input type="text" className="w-full text-xs border border-gray-300 px-1 h-6" defaultValue="Axis 1" />
        </InputGroup>
        <InputGroup label="Profile Type">
           <Select value="Master/Follower" options={['Time Based', 'Master/Follower', 'Camming']} />
        </InputGroup>
      </div>
    </div>
  </div>
);

/* --- Main Form Container --- */

export const WorkArea = ({ data, selectedNode }: { data: TreeNode[], selectedNode: TreeNode }) => {
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
  
  const [activeTab, setActiveTab] = useState('Data');

  const renderFormContent = () => {
    switch (selectedNode.type) {
      case 'group': return <PowerGroupForm />;
      case 'mechanism': return <MechanismForm />;
      case 'gearbox': return <GearboxForm />;
      case 'motor_drive': return <MotorDriveForm />;
      case 'axis': return <AxisForm />;
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
      <Visualizer axes={axes} />
      
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
          tabs={['Data', 'Charts', 'Environment', 'Notes']} 
          activeTab={activeTab} 
          onTabClick={setActiveTab} 
        />

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'Data' ? (
            renderFormContent()
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