import React, { useState, useEffect, useMemo } from 'react';
import { X, HelpCircle, Database, RotateCcw } from 'lucide-react';
import { UnitInput, InputGroup, Select } from './Common';

interface FrictionPair {
  id: string;
  material1: string;
  material2: string;
  condition: 'Dry' | 'Lubricated' | 'Greased';
  staticCoeff: number;
  kineticCoeff: number;
}

interface FrictionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (value: string) => void;
  initialValue?: string;
  title: string;
}

// Common engineering values
const FRICTION_DB: FrictionPair[] = [
  { id: '1', material1: 'Steel', material2: 'Steel', condition: 'Dry', staticCoeff: 0.78, kineticCoeff: 0.42 },
  { id: '2', material1: 'Steel', material2: 'Steel', condition: 'Lubricated', staticCoeff: 0.16, kineticCoeff: 0.08 },
  { id: '3', material1: 'Steel', material2: 'Aluminum', condition: 'Dry', staticCoeff: 0.61, kineticCoeff: 0.47 },
  { id: '4', material1: 'Steel', material2: 'Brass', condition: 'Dry', staticCoeff: 0.51, kineticCoeff: 0.44 },
  { id: '5', material1: 'Steel', material2: 'Cast Iron', condition: 'Dry', staticCoeff: 0.4, kineticCoeff: 0.23 },
  { id: '6', material1: 'Steel', material2: 'Bronze', condition: 'Lubricated', staticCoeff: 0.16, kineticCoeff: 0.16 },
  { id: '7', material1: 'Aluminum', material2: 'Aluminum', condition: 'Dry', staticCoeff: 1.05, kineticCoeff: 1.4 },
  { id: '8', material1: 'Rubber', material2: 'Concrete', condition: 'Dry', staticCoeff: 1.0, kineticCoeff: 0.8 },
  { id: '9', material1: 'Wood', material2: 'Wood', condition: 'Dry', staticCoeff: 0.5, kineticCoeff: 0.3 },
  { id: '10', material1: 'Plastic (Nylon)', material2: 'Steel', condition: 'Dry', staticCoeff: 0.35, kineticCoeff: 0.25 },
  { id: '11', material1: 'Teflon (PTFE)', material2: 'Steel', condition: 'Dry', staticCoeff: 0.04, kineticCoeff: 0.04 },
];

export const FrictionCalculatorModal: React.FC<FrictionCalculatorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  initialValue,
  title
}) => {
  // --- Selection State ---
  const [mat1, setMat1] = useState<string>('');
  const [mat2, setMat2] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  
  // --- Calculation State ---
  // If true, we ignore DB selection and use force calc
  const [mode, setMode] = useState<'database' | 'force' | 'manual'>('database');
  
  const [customCoeff, setCustomCoeff] = useState<number>(parseFloat(initialValue || '0.1'));
  const [normalForce, setNormalForce] = useState<number>(100);
  const [frictionForce, setFrictionForce] = useState<number>(10);

  // --- Derived Lists for Cascading Selects ---
  const uniqueMat1 = useMemo(() => Array.from(new Set(FRICTION_DB.map(i => i.material1))).sort(), []);
  
  const availableMat2 = useMemo(() => {
    return Array.from(new Set(FRICTION_DB.filter(i => i.material1 === mat1).map(i => i.material2))).sort();
  }, [mat1]);

  const availableConditions = useMemo(() => {
    return FRICTION_DB.filter(i => i.material1 === mat1 && i.material2 === mat2).map(i => i.condition);
  }, [mat1, mat2]);

  // --- Effects ---

  // Initialize form
  useEffect(() => {
    if (isOpen) {
        setCustomCoeff(parseFloat(initialValue || '0.1'));
        // Try to match current value to DB? (Skipped for simplicity, defaulted to first in DB)
        if (!mat1) {
             const defaultItem = FRICTION_DB[0];
             setMat1(defaultItem.material1);
             setMat2(defaultItem.material2);
             setCondition(defaultItem.condition);
        }
    }
  }, [isOpen, initialValue]);

  // Auto-select children when parent changes
  useEffect(() => {
      if (mat1 && !availableMat2.includes(mat2)) {
          setMat2(availableMat2[0] || '');
      }
  }, [mat1, availableMat2, mat2]);

  useEffect(() => {
      // Cast condition to any to avoid TS error: Argument of type 'string' is not assignable to parameter of type '"Dry" | "Lubricated" | "Greased"'
      if (mat1 && mat2 && !availableConditions.includes(condition as any)) {
          setCondition(availableConditions[0] || '');
      }
  }, [mat1, mat2, availableConditions, condition]);

  // Update Coefficient from Database Selection
  useEffect(() => {
    if (mode === 'database' && mat1 && mat2 && condition) {
        const found = FRICTION_DB.find(i => i.material1 === mat1 && i.material2 === mat2 && i.condition === condition);
        if (found) {
            setCustomCoeff(found.kineticCoeff);
        }
    }
  }, [mat1, mat2, condition, mode]);

  // Update Coefficient from Force Calculation
  useEffect(() => {
    if (mode === 'force') {
      if (normalForce > 0) {
        const val = frictionForce / normalForce;
        setCustomCoeff(parseFloat(val.toFixed(3)));
      } else {
        setCustomCoeff(0);
      }
    }
  }, [normalForce, frictionForce, mode]);

  // --- Handlers ---

  const handleManualChange = (val: string) => {
      setMode('manual');
      setCustomCoeff(parseFloat(val));
  };

  const currentDbItem = FRICTION_DB.find(i => i.material1 === mat1 && i.material2 === mat2 && i.condition === condition);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <div className="bg-win-bg w-[800px] h-[500px] shadow-2xl border border-gray-400 flex flex-col text-xs font-sans">
        {/* Window Header */}
        <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 flex items-center justify-between px-2 select-none">
          <div className="font-bold text-gray-700 pl-2">
            {title || 'Friction Coefficient Calculator'}
          </div>
          <div className="flex items-center space-x-1">
             <HelpCircle size={16} className="text-blue-600 cursor-pointer" />
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white p-1 rounded-sm"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 bg-win-bg flex overflow-hidden">
           
           {/* Left: Input / Calculator Section */}
           <div className="w-[450px] p-4 border-r border-gray-300 flex flex-col overflow-y-auto">
              
              {/* Database Selection Group */}
              <div 
                className={`mb-4 p-3 border rounded-sm transition-all duration-200
                  ${mode === 'database' ? 'bg-white border-blue-300 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-80'}
                `}
                onClick={() => setMode('database')}
              >
                 <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-1">
                    <h4 className={`font-bold flex items-center ${mode === 'database' ? 'text-blue-700' : 'text-gray-600'}`}>
                        <Database size={12} className="mr-1.5"/> Material Database
                    </h4>
                    {mode === 'database' && <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 rounded">Active</span>}
                 </div>

                 <div className="space-y-2 pl-1">
                    <InputGroup label="Material 1">
                       <Select 
                          value={mat1} 
                          options={uniqueMat1} 
                          onChange={(e) => setMat1(e.target.value)} 
                          className={mode !== 'database' ? 'text-gray-500 bg-gray-50' : ''}
                       />
                    </InputGroup>
                    <InputGroup label="Material 2">
                       <Select 
                          value={mat2} 
                          options={availableMat2} 
                          onChange={(e) => setMat2(e.target.value)} 
                          className={mode !== 'database' ? 'text-gray-500 bg-gray-50' : ''}
                       />
                    </InputGroup>
                    <InputGroup label="Condition">
                       <Select 
                          value={condition} 
                          options={availableConditions} 
                          onChange={(e) => setCondition(e.target.value)} 
                          className={mode !== 'database' ? 'text-gray-500 bg-gray-50' : ''}
                       />
                    </InputGroup>

                    {/* DB Reference Values */}
                    <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                         <div className="flex justify-between bg-gray-50 px-2 py-1 border border-gray-200 rounded-sm">
                            <span className="text-gray-500">Static µ:</span>
                            <span className="font-semibold text-gray-700">{currentDbItem?.staticCoeff ?? '-'}</span>
                         </div>
                         <div className={`flex justify-between px-2 py-1 border rounded-sm ${mode === 'database' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="text-gray-500">Kinetic µ:</span>
                            <span className="font-bold text-gray-800">{currentDbItem?.kineticCoeff ?? '-'}</span>
                         </div>
                    </div>
                 </div>
              </div>

              {/* Force Calculator Group */}
              <div 
                className={`mb-4 p-3 border rounded-sm transition-all duration-200
                  ${mode === 'force' ? 'bg-white border-blue-300 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-80'}
                `}
                onClick={() => setMode('force')}
              >
                 <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-1">
                    <h4 className={`font-bold flex items-center ${mode === 'force' ? 'text-blue-700' : 'text-gray-600'}`}>
                        <RotateCcw size={12} className="mr-1.5"/> Calculate from Forces
                    </h4>
                    {mode === 'force' && <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 rounded">Active</span>}
                 </div>
                 
                 <div className="space-y-2 pl-1">
                    <InputGroup label="Friction Force (Ff)">
                       <UnitInput 
                         type="force" 
                         value={frictionForce} 
                         onChange={(val) => setFrictionForce(parseFloat(val))} 
                         readOnly={mode !== 'force'}
                       />
                    </InputGroup>
                    <InputGroup label="Normal Force (N)">
                       <UnitInput 
                         type="force" 
                         value={normalForce} 
                         onChange={(val) => setNormalForce(parseFloat(val))} 
                         readOnly={mode !== 'force'}
                       />
                    </InputGroup>
                 </div>
              </div>

              {/* Result / Manual Override */}
              <div className="mt-auto bg-gray-100 p-3 border-t border-gray-300">
                 <InputGroup label="Result (µ)">
                    <UnitInput 
                      type="factor" 
                      value={customCoeff} 
                      onChange={handleManualChange} 
                    />
                 </InputGroup>
                 <div className="text-[10px] text-gray-500 italic text-right mt-1">
                    {mode === 'database' && "Value from Material Database"}
                    {mode === 'force' && "Value calculated from Forces"}
                    {mode === 'manual' && "User Manual Input"}
                 </div>
              </div>

           </div>

           {/* Right: Visualization */}
           <div className="flex-1 p-4 bg-white flex flex-col items-center justify-center relative select-none">
              
              {/* Formula */}
              <div className="absolute top-4 right-4 bg-white/90 p-2 border border-gray-200 shadow-sm rounded text-lg font-serif">
                 <span>µ = <div className="inline-block text-center align-middle"><div className="border-b border-black">F<sub>f</sub></div><div>N</div></div></span>
              </div>

              {/* Diagram */}
              <svg width="250" height="200" viewBox="0 0 250 200" className="mt-8">
                  {/* Ground */}
                  <line x1="20" y1="150" x2="230" y2="150" stroke="black" strokeWidth="2" />
                  <path d="M20,150 L230,150" stroke="black" strokeWidth="1" />
                  {/* Hatching */}
                  {Array.from({length: 20}).map((_, i) => (
                    <line key={i} x1={30 + i*10} y1={150} x2={20 + i*10} y2={160} stroke="gray" />
                  ))}

                  {/* Block */}
                  <rect x="80" y="70" width="90" height="80" fill="#e5f3ff" stroke="black" strokeWidth="2" />
                  <text x="125" y="115" textAnchor="middle" fontSize="14" fill="gray">Mass</text>

                  {/* Normal Force N */}
                  <line x1="125" y1="70" x2="125" y2="20" stroke="red" strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x="130" y="35" fill="red" fontWeight="bold">N</text>

                  {/* Gravity mg (dashed) */}
                  <line x1="125" y1="110" x2="125" y2="150" stroke="gray" strokeWidth="1" strokeDasharray="4,2" />

                  {/* Pull Force (Motion) */}
                  <line x1="170" y1="110" x2="220" y2="110" stroke="black" strokeWidth="2" markerEnd="url(#arrow-black)" />
                  <text x="180" y="100" fontSize="10">Motion</text>

                  {/* Friction Force Ff */}
                  <line x1="80" y1="150" x2="30" y2="150" stroke="blue" strokeWidth="2" markerEnd="url(#arrow-blue)" />
                  <text x="40" y="140" fill="blue" fontWeight="bold">F<sub>f</sub></text>

                  {/* Definitions */}
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L9,3 z" fill="red" />
                    </marker>
                    <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L9,3 z" fill="blue" />
                    </marker>
                    <marker id="arrow-black" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L9,3 z" fill="black" />
                    </marker>
                  </defs>
              </svg>
           </div>
        </div>

        {/* Footer */}
        <div className="h-10 bg-gray-100 border-t border-gray-300 flex items-center justify-end px-4 space-x-2">
           <button onClick={() => onAccept(customCoeff.toString())} className="px-6 py-1 bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded shadow-sm">Accept</button>
           <button onClick={onClose} className="px-6 py-1 bg-white border border-gray-300 hover:border-gray-400 rounded shadow-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};
