import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { UnitType, toDisplay, toBase } from '../utils/unitConversion';

interface InertiaComponent {
  id: string;
  name: string;
  type: 'Solid Cylinder' | 'Hollow Cylinder' | 'Cuboid' | 'User Spec.';
  quantity: number;
  ratio: number;
  mass: number; // kg
  density: number; // kg/m3
  // Dimensions (stored in meters for calculation, displayed in mm)
  d1: number; // Outer Diameter
  d2: number; // Inner Diameter
  h: number; // Height/Length
  w: number; // Width
  r_offset: number; // Distance from axis
  inertia: number; // kg m^2
}

interface InertiaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (value: string) => void;
  initialValue?: string;
  title: string;
}

const DEFAULT_ROW: InertiaComponent = {
  id: '1',
  name: 'NewComponent',
  type: 'Solid Cylinder',
  quantity: 1,
  ratio: 1,
  mass: 1,
  density: 7850, // Steel approx
  d1: 0.1, // 100mm
  d2: 0,
  h: 0.1, // 100mm
  w: 0.1,
  r_offset: 0,
  inertia: 0
};

export const InertiaCalculatorModal: React.FC<InertiaCalculatorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  title
}) => {
  const [components, setComponents] = useState<InertiaComponent[]>([{ ...DEFAULT_ROW, id: Date.now().toString() }]);
  const [selectedId, setSelectedId] = useState<string>(components[0].id);

  // Recalculate inertia whenever params change
  useEffect(() => {
    setComponents(prev => prev.map(comp => {
      let i_local = 0;
      const m = comp.mass;
      
      // Basic Inertia formulas (around center of mass)
      switch (comp.type) {
        case 'Solid Cylinder':
          // I = 0.5 * m * r^2  => r = d1/2
          i_local = 0.5 * m * Math.pow(comp.d1 / 2, 2);
          break;
        case 'Hollow Cylinder':
          // I = 0.5 * m * (r_out^2 + r_in^2)
          i_local = 0.5 * m * (Math.pow(comp.d1 / 2, 2) + Math.pow(comp.d2 / 2, 2));
          break;
        case 'Cuboid':
           // I = 1/12 * m * (w^2 + h^2) - assuming rotating around depth axis
           i_local = (1/12) * m * (Math.pow(comp.w, 2) + Math.pow(comp.h, 2));
           break;
        case 'User Spec.':
          i_local = comp.inertia; // User types it manually, we trust it (or handle differently)
          break;
      }

      // Parallel Axis Theorem: I_total = I_cm + m * d^2
      // And apply Quantity and Gear Ratio (Reflected Inertia = I / Ratio^2, typically. 
      // BUT the screenshot formula says * Ratio^2. Let's assume Ratio is N_load / N_motor, so if it spins faster, inertia is higher? 
      // Standard reflected inertia to motor is I_load / Ratio^2. 
      // However, usually Ratio input here implies transmission ratio. Let's stick to standard I * Qty for now, 
      // ignoring complex ratio logic to keep it simple or follow screenshot formula blindly:
      // Screenshot: (... + mr^2) * Qty * Ratio^2.
      
      if (comp.type !== 'User Spec.') {
        const parallelAxisTerm = m * Math.pow(comp.r_offset, 2);
        const total = (i_local + parallelAxisTerm) * comp.quantity * Math.pow(comp.ratio, 2);
        return { ...comp, inertia: total };
      }
      return comp;
    }));
  }, [
    // Dependency array is tricky with array of objects. 
    // In a real app, we'd fire recalculations on specific field edits.
    // For this mock, we rely on the edit handlers to trigger state updates which include the recalc.
  ]);

  const updateComponent = (id: string, field: keyof InertiaComponent, value: any) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      
      // Auto-calc mass if density/dims change (Optional, keeping simple for now by just updating)
      // Recalc inertia
      let i_local = 0;
      const m = updated.mass;
      
      if (updated.type !== 'User Spec.') {
          switch (updated.type) {
            case 'Solid Cylinder':
              i_local = 0.5 * m * Math.pow(updated.d1 / 2, 2);
              break;
            case 'Hollow Cylinder':
              i_local = 0.5 * m * (Math.pow(updated.d1 / 2, 2) + Math.pow(updated.d2 / 2, 2));
              break;
            case 'Cuboid':
              i_local = (1/12) * m * (Math.pow(updated.w, 2) + Math.pow(updated.h, 2));
              break;
          }
          const parallelAxisTerm = m * Math.pow(updated.r_offset, 2);
          updated.inertia = (i_local + parallelAxisTerm) * updated.quantity * Math.pow(updated.ratio, 2);
      }
      
      return updated;
    }));
  };

  const selectedComp = components.find(c => c.id === selectedId) || components[0];
  const totalInertia = components.reduce((acc, curr) => acc + curr.inertia, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <div className="bg-win-bg w-[800px] h-[600px] shadow-2xl border border-gray-400 flex flex-col text-xs font-sans">
        {/* Window Header */}
        <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 flex items-center justify-between px-2 select-none">
          <div className="font-bold text-gray-700 flex items-center space-x-2">
            <span>Total Inertia:</span>
            <span className="bg-white border border-gray-300 px-2 py-0.5 rounded-sm min-w-[80px] text-right">
              {totalInertia.toExponential(4)}
            </span>
            <span>kg·m²</span>
          </div>
          <div className="flex items-center space-x-1">
             <HelpCircle size={16} className="text-blue-600 cursor-pointer" />
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white p-1 rounded-sm"><X size={16} /></button>
          </div>
        </div>

        {/* Top: Data Grid */}
        <div className="flex-1 bg-gray-100 border-b border-gray-300 overflow-hidden flex flex-col">
          <div className="bg-white border-b border-gray-300 grid grid-cols-[20px_1fr_100px_60px_60px_80px_100px_30px] font-semibold text-gray-700">
             <div className="p-1 bg-gray-100 border-r border-gray-300"></div>
             <div className="p-1 border-r border-gray-300">Component Name</div>
             <div className="p-1 border-r border-gray-300">Type</div>
             <div className="p-1 border-r border-gray-300">Quantity</div>
             <div className="p-1 border-r border-gray-300">Ratio</div>
             <div className="p-1 border-r border-gray-300">Mass (kg)</div>
             <div className="p-1 border-r border-gray-300">Inertia (kg·m²)</div>
             <div className="p-1"></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {components.map((comp) => (
              <div 
                key={comp.id}
                onClick={() => setSelectedId(comp.id)}
                className={`grid grid-cols-[20px_1fr_100px_60px_60px_80px_100px_30px] border-b border-gray-100 cursor-pointer hover:bg-win-hover
                  ${selectedId === comp.id ? 'bg-win-select text-black' : 'text-gray-800'}
                `}
              >
                 <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-gray-500">
                   {selectedId === comp.id && <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-black border-b-[4px] border-b-transparent"></div>}
                 </div>
                 <div className="p-1 border-r border-gray-200">
                   <input 
                      className="w-full bg-transparent outline-none" 
                      value={comp.name} 
                      onChange={(e) => updateComponent(comp.id, 'name', e.target.value)}
                   />
                 </div>
                 <div className="p-1 border-r border-gray-200">
                   <select 
                      className="w-full bg-transparent outline-none"
                      value={comp.type}
                      onChange={(e) => updateComponent(comp.id, 'type', e.target.value)}
                   >
                     <option>Solid Cylinder</option>
                     <option>Hollow Cylinder</option>
                     <option>Cuboid</option>
                     <option>User Spec.</option>
                   </select>
                 </div>
                 <div className="p-1 border-r border-gray-200">
                    <input className="w-full bg-transparent outline-none text-right" type="number" value={comp.quantity} onChange={e => updateComponent(comp.id, 'quantity', parseFloat(e.target.value))} />
                 </div>
                 <div className="p-1 border-r border-gray-200">
                    <input className="w-full bg-transparent outline-none text-right" type="number" value={comp.ratio} onChange={e => updateComponent(comp.id, 'ratio', parseFloat(e.target.value))} />
                 </div>
                 <div className="p-1 border-r border-gray-200">
                    <input className="w-full bg-transparent outline-none text-right" type="number" value={comp.mass} onChange={e => updateComponent(comp.id, 'mass', parseFloat(e.target.value))} />
                 </div>
                 <div className="p-1 border-r border-gray-200 bg-blue-50 text-right pr-2 font-mono text-blue-800">
                    {comp.inertia.toExponential(3)}
                 </div>
                 <div className="flex items-center justify-center">
                    <button onClick={(e) => { e.stopPropagation(); /* Remove logic */ }} className="text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                 </div>
              </div>
            ))}
            <div 
              className="p-1 pl-6 text-gray-400 italic cursor-pointer hover:bg-gray-50 border-b border-gray-100 flex items-center"
              onClick={() => {
                const newId = Date.now().toString();
                setComponents([...components, { ...DEFAULT_ROW, id: newId }]);
                setSelectedId(newId);
              }}
            >
              <Plus size={12} className="mr-1" /> Click to add component...
            </div>
          </div>
        </div>

        {/* Bottom: Detail Panel */}
        <div className="h-[280px] bg-win-bg flex">
           {/* Left: Inputs */}
           <div className="w-[350px] p-4 border-r border-gray-300 flex flex-col space-y-2">
              
              <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center mb-2">
                 <label className="text-right text-gray-600">Height [h]</label>
                 <input type="number" className="border border-gray-300 px-1 py-0.5" value={(selectedComp.h * 1000).toFixed(1)} onChange={e => updateComponent(selectedComp.id, 'h', parseFloat(e.target.value)/1000)} />
                 <span className="text-gray-500">mm</span>
              </div>
              
              {(selectedComp.type === 'Hollow Cylinder' || selectedComp.type === 'Solid Cylinder') && (
                <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                   <label className="text-right text-gray-600">Outer Diameter [D1]</label>
                   <input type="number" className="border border-gray-300 px-1 py-0.5 bg-blue-50 border-blue-300" value={(selectedComp.d1 * 1000).toFixed(1)} onChange={e => updateComponent(selectedComp.id, 'd1', parseFloat(e.target.value)/1000)} />
                   <span className="text-gray-500">mm</span>
                </div>
              )}

              {selectedComp.type === 'Hollow Cylinder' && (
                <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                   <label className="text-right text-gray-600">Inner Diameter [D2]</label>
                   <input type="number" className="border border-gray-300 px-1 py-0.5" value={(selectedComp.d2 * 1000).toFixed(1)} onChange={e => updateComponent(selectedComp.id, 'd2', parseFloat(e.target.value)/1000)} />
                   <span className="text-gray-500">mm</span>
                </div>
              )}

              {selectedComp.type === 'Cuboid' && (
                <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                   <label className="text-right text-gray-600">Width [w]</label>
                   <input type="number" className="border border-gray-300 px-1 py-0.5" value={(selectedComp.w * 1000).toFixed(1)} onChange={e => updateComponent(selectedComp.id, 'w', parseFloat(e.target.value)/1000)} />
                   <span className="text-gray-500">mm</span>
                </div>
              )}

              <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                 <label className="text-right text-gray-600">Offset [r]</label>
                 <input type="number" className="border border-gray-300 px-1 py-0.5" value={(selectedComp.r_offset * 1000).toFixed(1)} onChange={e => updateComponent(selectedComp.id, 'r_offset', parseFloat(e.target.value)/1000)} />
                 <span className="text-gray-500">mm</span>
              </div>

              <div className="h-px bg-gray-300 my-2"></div>

              <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                 <label className="text-right text-gray-600">Material</label>
                 <select className="border border-gray-300 px-1 py-0.5 bg-white">
                    <option>Steel</option>
                    <option>Aluminum</option>
                    <option>User Spec.</option>
                 </select>
                 <span></span>
              </div>
               <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                 <label className="text-right text-gray-600">Density</label>
                 <input type="number" className="border border-gray-300 px-1 py-0.5" value={selectedComp.density} onChange={e => updateComponent(selectedComp.id, 'density', parseFloat(e.target.value))} />
                 <span className="text-gray-500">kg/m³</span>
              </div>
              <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                 <label className="text-right text-gray-600">Mass</label>
                 <input type="number" className="border border-gray-300 px-1 py-0.5" value={selectedComp.mass} onChange={e => updateComponent(selectedComp.id, 'mass', parseFloat(e.target.value))} />
                 <span className="text-gray-500">kg</span>
              </div>

           </div>

           {/* Right: Visualization & Formula */}
           <div className="flex-1 p-4 bg-white flex flex-col items-center justify-center relative">
              
              {/* Formula Overlay */}
              <div className="absolute top-4 right-4 bg-white/90 p-2 border border-gray-200 shadow-sm rounded text-lg font-serif">
                 {selectedComp.type === 'Hollow Cylinder' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">m(D<sub>1</sub><sup>2</sup> + D<sub>2</sub><sup>2</sup>)</div><div>8</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : selectedComp.type === 'Solid Cylinder' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">m D<sub>1</sub><sup>2</sup></div><div>8</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : (
                   <span className="text-gray-400 text-sm">Formula unavailable for this shape</span>
                 )}
              </div>

              {/* Diagram */}
              <svg width="200" height="200" viewBox="0 0 200 200" className="mt-8">
                  {/* Axis Z */}
                  <line x1="100" y1="20" x2="100" y2="180" stroke="black" strokeDasharray="4,2" />
                  <path d="M100,20 L95,28 M100,20 L105,28" stroke="black" fill="none" />
                  <text x="110" y="30" fontSize="12" fontStyle="italic">Z</text>

                  {/* Offset axis */}
                  {selectedComp.r_offset > 0 && (
                    <>
                     <line x1="40" y1="50" x2="40" y2="150" stroke="black" strokeDasharray="4,2" />
                     {/* Rotation arrow */}
                     <path d="M30,55 A 10 5 0 1 1 50,55" fill="none" stroke="red" />
                     <path d="M50,55 L45,52 M50,55 L48,58" fill="none" stroke="red" />
                     {/* r dimension */}
                     <line x1="40" y1="100" x2="100" y2="100" stroke="black" />
                     <path d="M40,100 L45,98 M40,100 L45,102 M100,100 L95,98 M100,100 L95,102" stroke="black" />
                     <text x="65" y="95" fontSize="14">r</text>
                    </>
                  )}

                  {/* Cylinder Body */}
                  <ellipse cx="100" cy="150" rx="40" ry="10" fill="none" stroke="black" />
                  <line x1="60" y1="150" x2="60" y2="80" stroke="black" />
                  <line x1="140" y1="150" x2="140" y2="80" stroke="black" />
                  <ellipse cx="100" cy="80" rx="40" ry="10" fill="white" stroke="black" />
                  
                  {selectedComp.type === 'Hollow Cylinder' && (
                     <ellipse cx="100" cy="80" rx="20" ry="5" fill="none" stroke="black" strokeDasharray="2,2" />
                  )}

                  {/* Dimensions on Diagram */}
                  {/* h */}
                  <line x1="150" y1="80" x2="150" y2="150" stroke="black" />
                  <path d="M150,80 L148,85 M150,80 L152,85 M150,150 L148,145 M150,150 L152,145" stroke="black" />
                  <text x="155" y="120" fontSize="14" fontStyle="italic">h</text>
                  
                  {/* D1 */}
                  <line x1="60" y1="165" x2="140" y2="165" stroke="black" />
                  <path d="M60,165 L65,163 M60,165 L65,167 M140,165 L135,163 M140,165 L135,167" stroke="black" />
                  <text x="95" y="175" fontSize="12">D<tspan dy="2" fontSize="10">1</tspan></text>
              </svg>

           </div>
        </div>

        {/* Footer */}
        <div className="h-10 bg-gray-100 border-t border-gray-300 flex items-center justify-end px-4 space-x-2">
           <button onClick={() => onAccept(totalInertia.toString())} className="px-6 py-1 bg-white border border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded shadow-sm">Accept</button>
           <button onClick={onClose} className="px-6 py-1 bg-white border border-gray-300 hover:border-gray-400 rounded shadow-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};
