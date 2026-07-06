import React, { useState } from 'react';
import { X, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { UnitInput, InputGroup, Select } from './Common';
import { InertiaComponent, MATERIALS, DEFAULT_INERTIA_ROW, calculateInertiaPhysics } from '../utils/physics';

interface InertiaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (value: string) => void;
  initialValue?: string;
  title: string;
}

export const InertiaCalculatorModal: React.FC<InertiaCalculatorModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  title
}) => {
  const [components, setComponents] = useState<InertiaComponent[]>([
     calculateInertiaPhysics({ ...DEFAULT_INERTIA_ROW, id: Date.now().toString() })
  ]);
  const [selectedId, setSelectedId] = useState<string>(components[0].id);

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
             updated = calculateInertiaPhysics(updated);
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
             const h_m = updated.h / 1000;
             
             let I_cm_si = 0;
             if (updated.type === 'Solid Cylinder') {
                I_cm_si = 0.5 * m * Math.pow(d1_m/2, 2);
             } else if (updated.type === 'Hollow Cylinder') {
                I_cm_si = 0.5 * m * (Math.pow(d1_m/2, 2) + Math.pow(d2_m/2, 2));
             } else if (updated.type === 'Cuboid') {
                I_cm_si = (m * (Math.pow(l_m, 2) + Math.pow(w_m, 2))) / 12;
             } else if (updated.type === 'Solid Sphere') {
                I_cm_si = (2/5) * m * Math.pow(d1_m/2, 2);
             } else if (updated.type === 'Hollow Sphere') {
                const r_out = d1_m/2; const r_in = d2_m/2;
                const num = Math.pow(r_out, 5) - Math.pow(r_in, 5);
                const den = Math.pow(r_out, 3) - Math.pow(r_in, 3);
                I_cm_si = (2/5) * m * (den > 0 ? num/den : 0);
             } else if (updated.type === 'Solid Cone') {
                I_cm_si = (3/10) * m * Math.pow(d1_m/2, 2);
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
        setComponents([calculateInertiaPhysics({ ...DEFAULT_INERTIA_ROW, id: Date.now().toString() })]);
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
      <div className="bg-win-bg w-[900px] h-[750px] shadow-2xl border border-gray-400 flex flex-col text-xs font-sans">
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
                     <option>Solid Sphere</option>
                     <option>Hollow Sphere</option>
                     <option>Solid Cone</option>
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
                setComponents([...components, calculateInertiaPhysics({ ...DEFAULT_INERTIA_ROW, id: newId })]);
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
                 <div className="w-40"><UnitInput value={totalVolume} onChange={()=>{}} type="volume" readOnly /></div>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="font-semibold text-gray-600">Overall Mass:</span>
                 <div className="w-40"><UnitInput value={totalMass} onChange={()=>{}} type="mass" readOnly /></div>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="font-semibold text-win-blue">Overall Inertia:</span>
                 <div className="w-48 bg-white border border-blue-300 shadow-sm"><UnitInput value={totalInertia} onChange={()=>{}} type="inertia" readOnly /></div>
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
                   
                   {/* Height - Hidden for Spheres */}
                   {selectedComp.type !== 'Solid Sphere' && selectedComp.type !== 'Hollow Sphere' && (
                     <InputGroup label="Height [H]">
                        <UnitInput type="length" value={selectedComp.h} onChange={(val) => updateComponent(selectedComp.id, 'h', val)} />
                     </InputGroup>
                   )}
                   
                   {/* D1 - Used for Cylinder, Hollow Cylinder, Spheres, Cone */}
                   {(selectedComp.type === 'Hollow Cylinder' || selectedComp.type === 'Solid Cylinder' || selectedComp.type === 'Solid Sphere' || selectedComp.type === 'Hollow Sphere' || selectedComp.type === 'Solid Cone') && (
                     <InputGroup label={selectedComp.type.includes('Cone') ? "Base Diameter [D1]" : "Outer Diameter [D1]"}>
                         <UnitInput type="length" value={selectedComp.d1} onChange={(val) => updateComponent(selectedComp.id, 'd1', val)} />
                     </InputGroup>
                   )}

                   {/* D2 - Used for Hollow types */}
                   {(selectedComp.type === 'Hollow Cylinder' || selectedComp.type === 'Hollow Sphere') && (
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
                 ) : selectedComp.type === 'Solid Sphere' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">2 m r<sup>2</sup></div><div>5</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : selectedComp.type === 'Hollow Sphere' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">2m(R<sup>5</sup>-r<sup>5</sup>)</div><div>5(R<sup>3</sup>-r<sup>3</sup>)</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
                 ) : selectedComp.type === 'Solid Cone' ? (
                   <span>I<sub>z</sub> = <span className="text-lg">(</span><div className="inline-block text-center align-middle"><div className="border-b border-black">3 m r<sup>2</sup></div><div>10</div></div> + mr<sup>2</sup><span className="text-lg">)</span> × Qty × Ratio<sup>2</sup></span>
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
                  ) : selectedComp.type === 'Solid Cone' ? (
                     <g transform="translate(100, 50)">
                         {/* Cone */}
                         <path d="M10,120 L50,10 L90,120" fill="none" stroke="black" strokeWidth="1.5" />
                         <ellipse cx="50" cy="120" rx="40" ry="10" fill="none" stroke="black" />
                         <line x1="10" y1="120" x2="90" y2="120" stroke="black" strokeDasharray="4,2" />
                         <line x1="50" y1="10" x2="50" y2="120" stroke="black" strokeDasharray="4,2" />
                         
                         {/* Dimensions */}
                         <line x1="100" y1="10" x2="100" y2="120" stroke="black" />
                         <path d="M100,10 L97,15 M100,10 L103,15 M100,120 L97,115 M100,120 L103,115" stroke="black" />
                         <text x="105" y="70" fontSize="12">H</text>

                         <line x1="10" y1="135" x2="90" y2="135" stroke="black" />
                         <path d="M10,135 L15,133 M10,135 L15,137 M90,135 L85,133 M90,135 L85,137" stroke="black" />
                         <text x="45" y="150" fontSize="12">D<tspan dy="2" fontSize="10">1</tspan></text>
                     </g>
                  ) : selectedComp.type.includes('Sphere') ? (
                     <g transform="translate(100, 50)">
                        {/* Sphere */}
                        <circle cx="50" cy="80" r="40" fill="none" stroke="black" strokeWidth="1.5" />
                        <ellipse cx="50" cy="80" rx="40" ry="10" fill="none" stroke="black" strokeDasharray="4,2" />
                        
                        {selectedComp.type === 'Hollow Sphere' && (
                           <circle cx="50" cy="80" r="25" fill="none" stroke="black" strokeDasharray="3,3" />
                        )}

                        <line x1="50" y1="40" x2="50" y2="120" stroke="black" strokeDasharray="4,2" />

                        {/* Dimensions */}
                        <line x1="10" y1="130" x2="90" y2="130" stroke="black" />
                        <path d="M10,130 L15,128 M10,130 L15,132 M90,130 L85,128 M90,130 L85,132" stroke="black" />
                        <text x="45" y="145" fontSize="12">D<tspan dy="2" fontSize="10">1</tspan></text>
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
