import React from 'react';
import { Zap, Play, Settings2, ArrowRightLeft, ChevronsUp } from 'lucide-react';

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
  <div className="flex flex-col items-center mx-2 relative group">
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
  </div>
);

const Visualizer = () => {
  return (
    <div className="h-1/2 bg-white border-b border-gray-300 p-4 relative overflow-hidden flex flex-col">
       {/* Title Overlay */}
       <div className="absolute top-0 left-0 bg-win-blue/10 text-win-blue font-bold px-2 py-0.5 text-xs border-r border-b border-win-blue/20">
         Power Group
       </div>

       {/* System Diagram */}
       <div className="flex-1 flex items-center justify-center">
         {/* Supply Unit */}
         <div className="mr-8 flex flex-col items-center justify-end h-full pb-10">
            <div className="w-12 h-32 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-400 shadow-md flex items-center justify-center">
               <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center">
                 <div className="w-0.5 h-3 bg-black transform rotate-45"></div>
               </div>
            </div>
         </div>

         {/* Connection Bus */}
         <div className="absolute top-[35%] left-[20%] right-[20%] h-1 bg-gray-800 -z-10"></div>

         {/* Drives */}
         <div className="flex items-end">
            <div className="flex flex-col items-center -mt-16">
              <EfficiencyBar value={77} />
              <DriveUnit label="X" />
            </div>
            <div className="flex flex-col items-center -mt-16">
              <EfficiencyBar value={79} />
              <DriveUnit label="Y" />
            </div>
            <div className="flex flex-col items-center -mt-16">
              <EfficiencyBar value={59} />
              <DriveUnit label="Z" />
            </div>
         </div>
       </div>
    </div>
  );
};

/* --- Form Components --- */

const InputGroup = ({ label, children, unit, checkbox }: { label: string, children?: React.ReactNode, unit?: string, checkbox?: boolean }) => (
  <div className="flex items-center mb-1.5">
    <div className="w-40 text-xs text-win-blue font-medium truncate pr-2 flex items-center">
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

const ConfigurationForm = () => {
  return (
    <div className="h-1/2 bg-win-bg p-2 overflow-y-auto">
      {/* Toolbar for the form */}
      <div className="flex space-x-1 mb-3">
         <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Settings2 size={16} className="text-orange-600" /></button>
         <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Play size={16} className="text-blue-600" /></button>
         <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><ArrowRightLeft size={16} className="text-green-600" /></button>
         <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><ChevronsUp size={16} /></button>
      </div>

      <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">Power Group</div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        
        {/* Left Column */}
        <div className="flex flex-col">
          <InputGroup label="Cycle time" unit="s">
            <NumberInput value="10" />
          </InputGroup>
          
          <InputGroup label="Sequence Type">
             <Select value="Master Follower" options={['Independent', 'Coupled']} />
          </InputGroup>

          <div className="h-2"></div>

          <InputGroup label="Sample time" unit="ms">
            <div className="flex w-full space-x-1">
               <NumberInput value="5" className="w-16" />
               <Select value="Quick" options={['Detailed', 'Custom']} />
            </div>
          </InputGroup>
          
          <InputGroup label="Number of samples">
            <NumberInput value="2,000" />
          </InputGroup>

          <div className="h-4 border-b border-gray-300 mb-2"></div>
          
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
                    <span className="text-gray-400 mr-1">}</span>
                    <input type="checkbox" checked className="mr-1" />
                    <span className="text-xs">Auto</span>
                 </div>
            </div>
          </InputGroup>
          
          <InputGroup label="Threshold bus voltage" unit="Vdc">
             <NumberInput value="780" />
          </InputGroup>

           <InputGroup label="Total bus capacitance" unit="mF">
             <Select value="2.93" options={[]} />
          </InputGroup>

          <InputGroup label="Max bus stored energy" unit="J">
             <Select value="464" options={[]} />
          </InputGroup>

        </div>

        {/* Right Column */}
        <div className="flex flex-col border-l border-gray-200 pl-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Master Axis</div>
          
          <InputGroup label="Sequence Type">
             <Select value="Const Vel" options={['Trapezoidal', 'S-Curve']} />
          </InputGroup>
          
          <InputGroup label="Modulo distance" unit="°">
             <NumberInput value="360" />
          </InputGroup>

          <InputGroup label="Time per rotation" unit="s">
             <NumberInput value="10" />
          </InputGroup>

          <InputGroup label="Velocity" unit="°/s">
             <NumberInput value="36" />
          </InputGroup>

          <div className="h-4 border-b border-gray-300 mb-2 mt-4"></div>

          <InputGroup label="Peak Power Optimization" checkbox>
              <div />
          </InputGroup>

          <InputGroup label="Infeed Peak Power" unit="%">
             <div className="flex items-center w-full">
                <span className="mr-2 text-xs text-gray-500">Ppf</span>
                <NumberInput value="0" />
             </div>
          </InputGroup>

          <InputGroup label="Target Bus Voltage" unit="Vdc">
             <div className="flex items-center w-full">
                <span className="mr-2 text-xs text-gray-500">Vt</span>
                <NumberInput value="0" />
             </div>
          </InputGroup>

        </div>
      </div>
    </div>
  );
};

export const WorkArea = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      <Visualizer />
      <ConfigurationForm />
    </div>
  );
};