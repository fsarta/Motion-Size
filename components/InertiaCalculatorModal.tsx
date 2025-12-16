import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { UnitInput, InputGroup, Select } from './Common';

interface InertiaComponent {
  id: string;
  name: string;
  type: 'Solid Cylinder' | 'Hollow Cylinder' | 'Cuboid' | 'User Spec.';
  quantity: number;
  ratio: number;
  mass: number; // kg (Base unit)
  volume: number; // m3 (Base unit)
  material: string;
  density: number; // kg/m3
  // Dimensions (stored in Base Unit: mm)
  d1: number; // Outer Diameter
  d2: number; // Inner Diameter
  h: number; // Height
  w: number; // Width
  l: number; // Length (Depth)
  r_offset: number; // Distance from axis
  inertia: number; // kg cm^2 (Base unit)
}

interface InertiaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (value: string) => void;
  initialValue?: string;
  title: string;
}

const MATERIALS = [
  { name: 'Aluminum', density: 2700 },
  { name: 'Brass', density: 8500 },
  { name: 'Hard Wood (Oak)', density: 750 },
  { name: 'Iron (Cast)', density: 7200 },
  { name: 'Nylon', density: 1150 },
  { name: 'POM (Delrin)', density: 1410 },
  { name: 'Steel (Carbon Tool)', density: 7850 },
  { name: 'Steel (Stainless)', density: 8000 },
  { name: 'User Spec.', density: 0 }
];

const DEFAULT_ROW: InertiaComponent = {
  id: '1',
  name: 'NewComponent',
  type: 'Solid Cylinder',
  quantity: 1,
  ratio: 1,
  mass: 0,
  volume: 0,
  material: 'Steel (Carbon Tool)',
  density: 7850,
  d1: 100, // 100mm
  d2: 0,
  h: 100, // 100mm
  w: 100,
  l: 100,
  r_offset: 0,
  inertia: 0
};

export const InertiaCalculatorModal: React.FC<InertiaCalculatorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  title
}) => {
  const [components, setComponents] = useState<InertiaComponent[]>([
     calculatePhysics({ ...DEFAULT_ROW, id: Date.now().toString() })
  ]);
  const [selectedId, setSelectedId] = useState<string>(components[0].id);

  // Helper to calculate Mass, Volume and Inertia based on geometry and density
  function calculatePhysics(comp: InertiaComponent): InertiaComponent {
    if (comp.type === 'User Spec.') {
       // For User Spec, we assume volume is not auto-calc'd unless we add fields for it.
       // Mass and Inertia are direct inputs/preserved.
       return comp; 
    }

    // 1. Dimensions to SI Units (Meters)
    const d1_m = comp.d1 / 1000;
    const d2_m = comp.d2 / 1000;
    const h_m = comp.h / 1000;
    const w_m = comp.w / 1000;
    const l_m = comp.l / 1000;
    const r_offset_m = comp.r_offset / 1000;

    // 2. Calculate Volume (m^3)
    let vol_m3 = 0;
    if (comp.type === 'Solid Cylinder') {
      const radius = d1_m / 2;
      vol_m3 = Math.PI * Math.pow(radius, 2) * h_m;
    } else if (comp.type === 'Hollow Cylinder') {
      const r_out = d1_m / 2;
      const r_in = d2_m / 2;
      vol_m3 = Math.PI * (Math.pow(r_out, 2) - Math.pow(r_in, 2)) * h_m;
    } else if (comp.type === 'Cuboid') {
      vol_m3 = w_m * l_m * h_m;
    }

    // 3. Calculate Mass (kg)
    const mass = vol_m3 * comp.density;

    // 4. Calculate Base Inertia (kg*m^2) around Center of Mass
    let I_cm_si = 0;
    if (comp.type === 'Solid Cylinder') {
      const radius = d1_m / 2;
      I_cm_si = 0.5 * mass * Math.pow(radius, 2);
    } else if (comp.type === 'Hollow Cylinder') {
      const r_out = d1_m / 2;
      const r_in = d2_m / 2;
      I_cm_si = 0.5 * mass * (Math.pow(r_out, 2) + Math.pow(r_in, 2));
    } else if (comp.type === 'Cuboid') {
       // Rotating around axis parallel to H (so using L and W)
       I_cm_si = (mass * (Math.pow(l_m, 2) + Math.pow(w_m, 2))) / 12;
    }

    // 5. Parallel Axis Theorem & Transmission (kg*m^2)
    const I_parallel_si = I_cm_si + (mass * Math.pow(r_offset_m, 2));
    const I_total_si = I_parallel_si * comp.quantity * Math.pow(comp.ratio, 2);

    // 6. Convert SI Inertia (kg*m^2) to App Base Unit (kg*cm^2)
    // 1 m^2 = 10000 cm^2
    const I_total_storage = I_total_si * 10000;

    return {
      ...comp,
      volume: vol_m3,
      mass: mass,
      inertia: I_total_storage
    };
  }

  const updateComponent = (id: string, field: keyof InertiaComponent, value: any) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      
      let val = value;
      // Numeric parsing
      const numericFields = ['quantity', 'ratio', 'mass', 'density', 'd1', 'd2', 'h', 'w', 'l', 'r_offset', 'inertia', 'volume'];
      if (numericFields.includes(field)) {
          val = typeof value === 'string' ? parseFloat(value) : value;
          val = isNaN(val) ? 0 : val;
      }
      
      let updated = { ...c, [field]: val };
      
      if (field === 'material') {
          const mat = MATERIALS.find(m => m.name === val);
          if (mat) {
             updated.density = mat.density;
          }
      }
      
      if (updated.type !== 'User Spec.') {
         if (field !== 'mass' && field !== 'inertia') {
             updated = calculatePhysics(updated);
         } else if (field === 'mass') {
             // Re-calc inertia if mass changes manually
             const m = updated.mass;
             // Assume volume matches mass/density? Or just update inertia.
             // Let's just update inertia based on new mass and geometry
             const r_offset_m = updated.r_offset / 1000;
             const d1_m = updated.d1 / 1000; 
             const d2_m = updated.d2 / 1000;
             const l_m = updated.l / 1000; 
             const w_m = updated.w / 1000;
             
             let I_cm_si = 0;
             if (updated.type === 'Solid Cylinder') {
                I_cm_si = 0.5 * m * Math.pow(d1_m/2, 2);
             } else if (updated.type === 'Hollow Cylinder') {
                I_cm_si = 0.5 * m * (Math.pow(d1_m/2, 2) + Math.pow(d2_m/2, 2));
             } else if (updated.type === 'Cuboid') {
                I_cm_si = (m * (Math.pow(l_m, 2) + Math.pow(w_m, 2))) / 12;
             }
             const I_total_si = (I_cm_si + m * Math.pow(r_offset_m, 2)) * updated.quantity * Math.pow(updated.ratio, 2);
             updated.inertia = I_total_si * 10000;
             // Also back-calculate volume if possible? 
             if(updated.density > 0) updated.volume = m / updated.density;
         }
      }
      
      return updated;
    }));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (components.length <= 1) {
        setComponents([calculatePhysics({ ...DEFAULT_ROW, id: Date.now().toString() })]);
        return;
    }
    const newComps = components.filter(c => c.id !== id);
    setComponents(newComps);
    if (selectedId === id) setSelectedId(newComps[0].id);
  };

  const selectedComp = components.find(c => c.id === selectedId) || components[0];
  const totalInertia = components.reduce((acc, curr) => acc + curr.inertia, 0);
  const totalMass = components.reduce((acc, curr) => acc + (curr.mass * curr.quantity), 0); // Total mass of system
  const totalVolume = components.reduce((acc, curr) => acc + (curr.volume * curr.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <div className="bg-win-bg w-[900px] h-[650px] shadow-2xl border border-gray-400 flex flex-col text-xs font-sans">
        {/* Window Header */}
        <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 flex items-center justify-between px-2 select-none">
          <div className="font-bold text-gray-700 pl-2">
            {title || 'Inertia Calculator'}
          </div>
          <div className="flex items-center space-x-1">
             <HelpCircle size={16} className="text-blue-600 cursor-pointer" />
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white p-1 rounded-sm"><X size={16} /></button>
          </div>
        </div>

        {/* Grid Area */}
        <div className="h-[200px] bg-gray-100 border-b border-gray-300 overflow-hidden flex flex-col">
          <div className="bg-white border-b border-gray-300 grid grid-cols-[20px_1fr_100px_60px_60px_140px_160px_30px] font-semibold text-gray-700">
             <div className="p-1 bg-gray-100 border-r border-gray-300"></div>
             <div className="p-1 border-r border-gray-300">Component Name</div>
             <div className="p-1 border-r border-gray-300">Type</div>
             <div className="p-1 border-r border-gray-300">Quantity</div>
             <div className="p-1 border-r border-gray-300">Ratio</div>
             <div className="p-1 border-r border-gray-300">Mass</div>
             <div className="p-1 border-r border-gray-300">Inertia</div>
             <div className="p-1"></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {components.map((comp) => (
              <div 
                key={comp.id}
                onClick={() => setSelectedId(comp.id)}
                className={`grid grid-cols-[20px_1fr_100px_60px_60px_140px_160px_30px] border-b border-gray-100 cursor-pointer hover:bg-win-hover
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
                    <UnitInput 
                        value={comp.mass} 
                        onChange={(val) => updateComponent(comp.id, 'mass', val)} 
                        type="mass" 
                    />
                 </div>
                 <div className="p-1 border-r border-gray-200 bg-blue-50">
                    <UnitInput 
                        value={comp.inertia} 
                        onChange={()=>{}} 
                        type="inertia" 
                        readOnly 
                    />
                 </div>
                 <div className="flex items-center justify-center">
                    <button onClick={(e) => handleDelete(e, comp.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"><Trash2 size={12}/></button>
                 </div>
              </div>
            ))}
            <div 
              className="p-1 pl-6 text-gray-400 italic cursor-pointer hover:bg-gray-50 border-b border-gray-100 flex items-center"
              onClick={() => {
                const newId = Date.now().toString();
                setComponents([...components, calculatePhysics({ ...DEFAULT_ROW, id: newId })]);
                setSelectedId(newId);
              }}
            >
              <Plus size={12} className="mr-1" /> Click to add component...
            </div>
          </div>
        </div>

        {/* Overall Summary Section (Between Grid and Details) */}
        <div className="bg-gray-200 border-b border-gray-300 py-2 px-4 flex items-center justify-between shadow-inner">
           <div className="text-gray-700 font-bold uppercase text-[10px] tracking-wide">Overall System Results</div>
           <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                 <span className="font-semibold text-gray-600">Overall Volume:</span>
                 <div className="w-24"><UnitInput value={totalVolume} onChange={()=>{}} type="volume" readOnly /></div>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="font-semibold text-gray-600">Overall Mass:</span>
                 <div className="w-24"><UnitInput value={totalMass} onChange={()=>{}} type="mass" readOnly /></div>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="font-semibold text-win-blue">Overall Inertia:</span>
                 <div className="w-28 bg-white border border-blue-300 shadow-sm"><UnitInput value={totalInertia} onChange={()=>{}} type="inertia" readOnly /></div>
              </div>
           </div>
        </div>

        {/* Bottom: Detail Panel */}
        <div className="flex-1 bg-win-bg flex overflow-hidden">
           {/* Left: Inputs Section */}
           <div className="w-[450px] p-4 border-r border-gray-300 flex flex-col overflow-y-auto">
              
              {/* Properties Section */}
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-0.5">Properties</h4>
                <div className="space-y-2 pl-2">
                   <InputGroup label="Height [H]">
                      <UnitInput type="length" value={selectedComp.h} onChange={(val) => updateComponent(selectedComp.id, 'h', val)} />
                   </InputGroup>
                   
                   {(selectedComp.type === 'Hollow Cylinder' || selectedComp.type === 'Solid Cylinder') && (
                     <InputGroup label="Outer Diameter [D1]">
                         <UnitInput type="length" value={selectedComp.d1} onChange={(val) => updateComponent(selectedComp.id, 'd1', val)} />
                     </InputGroup>
                   )}

                   {selectedComp.type === 'Hollow Cylinder' && (
                     <InputGroup label="Inner Diameter [D2]">
                         <UnitInput type="length" value={selectedComp.d2} onChange={(val) => updateComponent(selectedComp.id, 'd2', val)} />
                     </InputGroup>
                   )}

                   {selectedComp.type === 'Cuboid' && (
                     <>
                       <InputGroup label="Width [W]">
                           <UnitInput type="length" value={selectedComp.w} onChange={(val) => updateComponent(selectedComp.id, 'w', val)} />
                       </InputGroup>
                       <InputGroup label="Length [L]">
                           <UnitInput type="length" value={selectedComp.l} onChange={(val) => updateComponent(selectedComp.id, 'l', val)} />
                       </InputGroup>
                     </>
                   )}

                   <InputGroup label="Offset [r]">
                         <UnitInput type="length" value={selectedComp.r_offset} onChange={(val) => updateComponent(selectedComp.id, 'r_offset', val)} />
                   </InputGroup>
                </div>
              </div>

              {/* Density Section */}
              <div className="mb-4">
                 <h4 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-0.5">Density</h4>
                 <div className="space-y-2 pl-2">
                    <InputGroup label="Material">
                       <Select 
                          value={selectedComp.material} 
                          options={MATERIALS.map(m => m.name)} 
                          onChange={(e) => updateComponent(selectedComp.id, 'material', e.target.value)} 
                       />
                    </InputGroup>
                    <InputGroup label="Density">
                       <UnitInput 
                          type="density" 
                          value={selectedComp.density} 
                          onChange={(val) => updateComponent(selectedComp.id, 'density', val)} 
                          readOnly={selectedComp.material !== 'User Spec.'}
                       />
                    </InputGroup>
                 </div>
              </div>

              {/* Result Section */}
              <div>
                 <h4 className="font-bold text-gray-700 mb-2 border-b border-gray-300 pb-0.5">Result (Single Item)</h4>
                 <div className="space-y-2 pl-2">
                    <InputGroup label="Volume">
                       <UnitInput type="volume" value={selectedComp.volume} onChange={()=>{}} readOnly />
                    </InputGroup>
                    <InputGroup label="Mass">
                       <UnitInput type="mass" value={selectedComp.mass} onChange={(val) => updateComponent(selectedComp.id, 'mass', val)} />
                    </InputGroup>
                    <InputGroup label="Inertia">
                       <UnitInput type="inertia" value={selectedComp.inertia} onChange={()=>{}} readOnly />
                    </InputGroup>
                 </div>
              </div>

           </div>

           {/* Right: Visualization & Formula */}
           <div className="flex-1 p-4 bg-white flex flex-col items-center justify-center relative select-none">
              
              {/* Formula Overlay */}
              <div className="absolute top-4 right-4 bg-white/90 p-2 border border-gray-200 shadow-sm rounded text-lg font-serif">
                 {selectedComp.type === 'Hollow Cylinder' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">m(D<sub>1</sub><sup>2</sup> + D<sub>2</sub><sup>2</sup>)</div><div>8</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : selectedComp.type === 'Solid Cylinder' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">m D<sub>1</sub><sup>2</sup></div><div>8</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : selectedComp.type === 'Cuboid' ? (
                   <span>I<sub>H</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">m(L<sup>2</sup> + W<sup>2</sup>)</div><div>12</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : (
                   <span className="text-gray-400 text-sm">Formula unavailable for this shape</span>
                 )}
              </div>

              {/* Diagram */}
              <svg width="250" height="220" viewBox="0 0 250 220" className="mt-12">
                  
                  {/* Common Z Axis / H Axis */}
                  <line x1="50" y1="20" x2="50" y2="200" stroke="black" strokeDasharray="4,2" />
                  {/* Axis Cap */}
                  <path d="M40,25 A 10 5 0 1 1 60,25" fill="none" stroke="red" />
                  <path d="M60,25 L55,22 M60,25 L58,28" fill="none" stroke="red" />

                  {/* Offset Line */}
                  {selectedComp.r_offset > 0 && (
                     <>
                        <line x1="50" y1="120" x2={selectedComp.type === 'Cuboid' ? 120 : 100} y2="120" stroke="black" />
                        <text x="75" y="115" fontSize="14">r</text>
                     </>
                  )}

                  {selectedComp.type === 'Cuboid' ? (
                    <g transform="translate(100, 50)">
                        {/* 3D Cube */}
                        <rect x="20" y="40" width="80" height="80" fill="none" stroke="black" strokeWidth="1.5" />
                        <polyline points="20,40 50,10 130,10 130,90 100,120" fill="none" stroke="black" strokeWidth="1.5" />
                        <line x1="100" y1="40" x2="130" y2="10" stroke="black" strokeWidth="1.5" />
                        
                        {/* Center of Mass Indicator */}
                        <circle cx="60" cy="80" r="10" fill="yellow" stroke="black" />
                        <path d="M60,80 L60,90 L70,80 A10,10 0 0 0 60,70 Z" fill="black" />
                        <path d="M60,80 L50,80 A10,10 0 0 0 60,70 Z" fill="white" />
                        <line x1="60" y1="70" x2="60" y2="90" stroke="black" />
                        <line x1="50" y1="80" x2="70" y2="80" stroke="black" />

                        {/* Dimensions */}
                        <line x1="140" y1="10" x2="140" y2="90" stroke="black" />
                        <path d="M140,10 L137,15 M140,10 L143,15 M140,90 L137,85 M140,90 L143,85" stroke="black" />
                        <text x="145" y="55" fontSize="12">H</text>

                        <line x1="20" y1="130" x2="100" y2="130" stroke="black" />
                        <path d="M20,130 L25,127 M20,130 L25,133 M100,130 L95,127 M100,130 L95,133" stroke="black" />
                        <text x="55" y="145" fontSize="12">W</text>

                        <line x1="105" y1="125" x2="135" y2="95" stroke="black" />
                        <path d="M105,125 L110,120 M135,95 L130,100" stroke="black" />
                        <text x="125" y="125" fontSize="12">L</text>
                    </g>
                  ) : (
                    <g transform="translate(100, 50)">
                        {/* Cylinder */}
                        <ellipse cx="50" cy="120" rx="40" ry="10" fill="none" stroke="black" />
                        <line x1="10" y1="120" x2="10" y2="50" stroke="black" />
                        <line x1="90" y1="120" x2="90" y2="50" stroke="black" />
                        <ellipse cx="50" cy="50" rx="40" ry="10" fill="white" stroke="black" />
                        
                        {selectedComp.type === 'Hollow Cylinder' && (
                            <ellipse cx="50" cy="50" rx="20" ry="5" fill="none" stroke="black" strokeDasharray="2,2" />
                        )}

                        <line x1="100" y1="50" x2="100" y2="120" stroke="black" />
                        <path d="M100,50 L97,55 M100,50 L103,55 M100,120 L97,115 M100,120 L103,115" stroke="black" />
                        <text x="105" y="90" fontSize="14" fontStyle="italic">h</text>
                        
                        <line x1="10" y1="135" x2="90" y2="135" stroke="black" />
                        <path d="M10,135 L15,133 M10,135 L15,137 M90,135 L85,133 M90,135 L85,137" stroke="black" />
                        <text x="45" y="150" fontSize="12">D<tspan dy="2" fontSize="10">1</tspan></text>
                    </g>
                  )}
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
