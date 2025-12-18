
import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { UnitInput, InputGroup, Select } from './Common';
import { InertiaCalculatorModal } from './InertiaCalculatorModal';

interface TransmissionComponent {
  id: number;
  type: 'Shaft' | 'Coupling' | 'Gear box' | 'Pulley' | 'Chain';
  name: string;
  motorSideRatio: number;
  loadSideRatio: number;
  inertia: number; // kg cm^2
  torque: number; // Nm
  efficiency: number;
}

interface TransmissionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (inertia: string, ratio: string, efficiency: string) => void;
  title: string;
}

const COMPONENT_TYPES = ['Shaft', 'Coupling', 'Gear box', 'Pulley', 'Chain'];

export const TransmissionCalculatorModal: React.FC<TransmissionCalculatorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  title
}) => {
  const [components, setComponents] = useState<TransmissionComponent[]>([
    { id: 1, type: 'Shaft', name: 'Main Shaft', motorSideRatio: 1, loadSideRatio: 1, inertia: 0, torque: 0, efficiency: 1 }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInertiaCalcOpen, setIsInertiaCalcOpen] = useState(false);

  const currentComp = components[currentIndex];

  const updateCurrent = (field: keyof TransmissionComponent, value: any) => {
    setComponents(prev => prev.map((c, i) => i === currentIndex ? { ...c, [field]: value } : c));
  };

  const addComponent = () => {
    const newId = components.length + 1;
    setComponents([...components, { id: newId, type: 'Shaft', name: `Comp ${newId}`, motorSideRatio: 1, loadSideRatio: 1, inertia: 0, torque: 0, efficiency: 1 }]);
    setCurrentIndex(components.length);
  };

  const removeComponent = () => {
    if (components.length <= 1) return;
    const newComponents = components.filter((_, i) => i !== currentIndex);
    setComponents(newComponents);
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  // Results Calculation
  const results = components.reduce((acc, c) => {
    const stageRatio = c.loadSideRatio !== 0 ? c.motorSideRatio / c.loadSideRatio : 1;
    const prevRatio = acc.ratio;
    const newTotalRatio = prevRatio * stageRatio;
    
    // Inertia reflected to motor
    const reflectedInertia = acc.inertia + (c.inertia / Math.pow(newTotalRatio, 2));
    
    return {
      ratio: newTotalRatio,
      inertia: reflectedInertia,
      torque: acc.torque + (c.torque / newTotalRatio),
      efficiency: acc.efficiency * c.efficiency
    };
  }, { ratio: 1, inertia: 0, torque: 0, efficiency: 1 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <InertiaCalculatorModal 
        isOpen={isInertiaCalcOpen} 
        onClose={() => setIsInertiaCalcOpen(false)} 
        onAccept={(val) => {
          updateCurrent('inertia', parseFloat(val));
          setIsInertiaCalcOpen(false);
        }}
        title={`Inertia for ${currentComp.name}`}
      />

      <div className="bg-win-bg w-[800px] shadow-2xl border border-gray-400 flex flex-col text-xs font-sans rounded-sm">
        {/* Header */}
        <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 flex items-center justify-between px-2 select-none">
          <div className="font-bold text-gray-700 pl-2">{title}</div>
          <div className="flex items-center space-x-1">
             <HelpCircle size={16} className="text-blue-600 cursor-pointer" />
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white p-1 rounded-sm transition-colors"><X size={16} /></button>
          </div>
        </div>

        {/* Top Content: Visual and Results Panel */}
        <div className="flex border-b border-gray-300 bg-white">
          <div className="flex-1 h-56 flex items-center justify-center p-4 border-r border-gray-300">
             <svg width="400" height="180" viewBox="0 0 400 150">
                <rect x="10" y="40" width="60" height="70" fill="#4b5563" stroke="#111" />
                <rect x="70" y="65" width="10" height="20" fill="#9ca3af" stroke="#111" />
                <rect x="80" y="72" width="240" height="6" fill="#d1d5db" stroke="#374151" />
                {currentComp.type === 'Shaft' && <rect x="120" y="70" width="160" height="10" fill="#9ca3af" stroke="#111" strokeDasharray="2,1" />}
                {currentComp.type === 'Coupling' && <rect x="180" y="60" width="40" height="30" fill="#374151" stroke="#111" rx="2" />}
                {currentComp.type === 'Gear box' && <rect x="160" y="45" width="80" height="60" fill="#6b7280" stroke="#111" />}
                {currentComp.type === 'Pulley' && <circle cx="200" cy="75" r="25" fill="#9ca3af" stroke="#111" />}
                {currentComp.type === 'Chain' && <path d="M180,55 L220,55 L220,95 L180,95 Z" fill="#4b5563" stroke="#111" />}
                <rect x="320" y="60" width="30" height="30" fill="#1f2937" stroke="#111" />
                <rect x="350" y="72" width="20" height="6" fill="#9ca3af" stroke="#111" />
             </svg>
          </div>
          <div className="w-80 p-6 flex flex-col justify-center bg-gray-50">
             <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-300 pb-2 text-right">Results</h3>
             <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-600">Gear Ratio:</span>
                    <span className="font-mono font-bold">{results.ratio.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-600">Inertia (kg·cm²):</span>
                    <span className="font-mono font-bold text-win-blue">{results.inertia.toFixed(4)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-600">Torque (N·m):</span>
                    <span className="font-mono font-bold">{results.torque.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-600">Efficiency:</span>
                    <span className="font-mono font-bold">{results.efficiency.toFixed(2)}</span>
                 </div>
             </div>
          </div>
        </div>

        {/* Bottom Section: Component Configuration */}
        <div className="p-6 bg-win-bg flex flex-col space-y-8">
           <div className="flex items-center space-x-12">
               <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Selected Component</span>
                  <div className="flex items-center border border-gray-400 bg-white rounded-sm overflow-hidden h-7">
                    <input 
                      type="number" 
                      className="w-12 h-full text-center outline-none font-bold text-blue-800" 
                      value={currentIndex + 1} 
                      readOnly
                    />
                    <div className="flex flex-col border-l border-gray-400 h-full">
                      <button onClick={() => setCurrentIndex(Math.min(components.length - 1, currentIndex + 1))} className="px-2 hover:bg-gray-100 border-b border-gray-300 h-1/2 flex items-center justify-center"><ChevronRight size={10}/></button>
                      <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="px-2 hover:bg-gray-100 h-1/2 flex items-center justify-center"><ChevronLeft size={10}/></button>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                     <button onClick={addComponent} className="bg-white border border-gray-400 px-3 h-7 hover:bg-gray-50 text-[10px] font-bold rounded-sm">+ ADD</button>
                     <button onClick={removeComponent} className="bg-white border border-gray-400 px-3 h-7 hover:bg-red-50 hover:border-red-500 rounded-sm text-[10px] font-bold text-red-600">DELETE</button>
                  </div>
               </div>
               <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Component Type</span>
                  <Select 
                    className="w-40 h-7" 
                    options={COMPONENT_TYPES} 
                    value={currentComp.type} 
                    onChange={(e) => updateCurrent('type', e.target.value)} 
                  />
               </div>
               <div className="flex items-center space-x-3 flex-1">
                  <span className="font-bold text-gray-700 whitespace-nowrap">Name</span>
                  <input 
                    className="border border-gray-400 px-3 h-7 w-full outline-none focus:border-blue-500 bg-white" 
                    value={currentComp.name} 
                    onChange={(e) => updateCurrent('name', e.target.value)} 
                  />
               </div>
           </div>

           <div className="grid grid-cols-2 gap-x-20">
              {/* Ratios */}
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="text-[10px] font-bold text-win-blue uppercase border-b border-blue-100 pb-1">Velocity Ratio</div>
                    <div className="flex items-center space-x-6 pl-4">
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-500 mb-1 font-bold">Motor Side</span>
                          <input 
                             className="w-24 border border-gray-400 h-8 text-right px-2 outline-none focus:border-blue-500 font-mono text-sm" 
                             type="number" 
                             value={currentComp.motorSideRatio} 
                             onChange={(e) => updateCurrent('motorSideRatio', parseFloat(e.target.value))}
                          />
                       </div>
                       <span className="pt-5 text-2xl font-bold text-gray-400">:</span>
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-500 mb-1 font-bold">Load Side</span>
                          <input 
                             className="w-24 border border-gray-400 h-8 text-right px-2 outline-none focus:border-blue-500 font-mono text-sm" 
                             type="number" 
                             value={currentComp.loadSideRatio} 
                             onChange={(e) => updateCurrent('loadSideRatio', parseFloat(e.target.value))}
                          />
                       </div>
                    </div>
                 </div>
                 <div className="pt-2 pl-4 flex items-end">
                    <InputGroup label="Gear Ratio" className="!mb-0">
                       <div className="flex items-center">
                          <input 
                            className="w-24 border border-gray-400 h-8 bg-gray-100 px-2 outline-none font-bold text-gray-700 text-center" 
                            value={(currentComp.loadSideRatio !== 0 ? currentComp.motorSideRatio / currentComp.loadSideRatio : 1).toFixed(2)} 
                            readOnly
                          />
                          <input 
                             className="ml-1 w-12 border border-gray-400 h-8 bg-gray-100 px-1 text-[10px] font-bold text-center outline-none" 
                             value=":1" 
                             readOnly 
                          />
                       </div>
                    </InputGroup>
                 </div>
              </div>

              {/* Physical Parameters */}
              <div className="space-y-3 bg-white p-4 border border-gray-300 rounded-sm">
                 <div className="flex justify-end mb-2">
                    <button 
                      onClick={() => setIsInertiaCalcOpen(true)}
                      className="flex items-center space-x-2 px-4 py-1.5 bg-gray-100 border border-gray-400 hover:bg-win-hover hover:border-blue-500 rounded-sm shadow-sm transition-all"
                    >
                       <Calculator size={16} className="text-blue-600" />
                       <span className="text-xs font-bold text-gray-800">Inertia Calculator</span>
                    </button>
                 </div>
                 <InputGroup label="Component Inertia">
                    <UnitInput type="inertia" value={currentComp.inertia} onChange={(v) => updateCurrent('inertia', parseFloat(v))} />
                 </InputGroup>
                 <InputGroup label="Added Torque">
                    <UnitInput type="torque" value={currentComp.torque} onChange={(v) => updateCurrent('torque', parseFloat(v))} />
                 </InputGroup>
                 <InputGroup label="Efficiency">
                    <div className="flex-1 flex items-center bg-white border border-gray-400 h-7 overflow-hidden">
                        <input 
                         type="number" 
                         step="0.01"
                         className="flex-1 px-2 h-full outline-none text-right font-mono text-xs" 
                         value={currentComp.efficiency} 
                         onChange={(e) => updateCurrent('efficiency', parseFloat(e.target.value))}
                        />
                        <div className="bg-gray-50 h-full px-2 flex items-center text-[10px] text-gray-500 border-l border-gray-400 font-bold uppercase">Factor</div>
                    </div>
                 </InputGroup>
              </div>
           </div>
        </div>

        {/* Footer Buttons */}
        <div className="h-16 bg-gray-100 border-t border-gray-300 flex items-center justify-end px-6 space-x-4">
           <button onClick={() => onAccept(results.inertia.toString(), results.ratio.toString(), results.efficiency.toString())} className="px-12 py-2 bg-blue-600 border border-blue-700 hover:bg-blue-700 text-white font-bold rounded shadow-md">Accept</button>
           <button onClick={onClose} className="px-12 py-2 bg-white border border-gray-400 hover:bg-gray-50 text-gray-800 font-bold rounded shadow-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};
