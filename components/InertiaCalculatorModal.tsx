import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { UnitInput, InputGroup, Select } from './Common';

interface InertiaComponent {
  id: string;
  name: string;
  type: 'Solid Cylinder' | 'Hollow Cylinder' | 'Cuboid' | 'User Spec.';
  quantity: number;
  ratio: number;
  mass: number; // kg
  material: string;
  density: number; // kg/m3
  // Dimensions (stored in meters for calculation, displayed via UnitInput)
  d1: number; // Outer Diameter
  d2: number; // Inner Diameter
  h: number; // Height
  w: number; // Width
  l: number; // Length (Depth)
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
  material: 'User Spec.',
  density: 7850, // Steel approx
  d1: 0.1, // 100mm
  d2: 0,
  h: 0.1, // 100mm
  w: 0.1,
  l: 0.1,
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
      
      // Basic Inertia formulas (around center of mass). Dims are in Base Units (meters)
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
           // I = m * (L^2 + W^2) / 12. Rotating around axis parallel to H.
           // Inputs: L (Length), W (Width).
           i_local = (m * (Math.pow(comp.l, 2) + Math.pow(comp.w, 2))) / 12;
           break;
        case 'User Spec.':
          i_local = comp.inertia; 
          break;
      }

      if (comp.type !== 'User Spec.') {
        const parallelAxisTerm = m * Math.pow(comp.r_offset, 2);
        const total = (i_local + parallelAxisTerm) * comp.quantity * Math.pow(comp.ratio, 2);
        return { ...comp, inertia: total };
      }
      return comp;
    }));
  }, [
    // Recalc relies on values being updated by the UnitInput calls which update state
  ]);

  const updateComponent = (id: string, field: keyof InertiaComponent, value: any) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      
      let val = value;
      // Only parse float if the field is supposed to be numeric
      const numericFields = ['quantity', 'ratio', 'mass', 'density', 'd1', 'd2', 'h', 'w', 'l', 'r_offset', 'inertia'];
      if (numericFields.includes(field)) {
          val = typeof value === 'string' ? parseFloat(value) : value;
          val = isNaN(val) ? 0 : val;
      }
      
      const updated = { ...c, [field]: val };
      
      // Handle Material change
      if (field === 'material') {
          if (val === 'Steel') updated.density = 7850;
          else if (val === 'Aluminum') updated.density = 2700;
          // If User Spec, leave density as is or allow edit
      }

      // If needed, we could auto-calculate mass here: Mass = Volume * Density
      // But typically user might want to override mass, so we leave it decoupled for now unless requested.

      // Recalc inertia logic is duplicated here to ensure immediate UI update before effect runs? 
      // Actually the useEffect handles the recalc, but React batching means we might see a frame of old data.
      // For this simple app, we can duplicate the math or just rely on the effect. 
      // The effect above depends on the state change, so it will run on next render.
      // However, to ensure the 'inertia' field in the grid updates instantly, we should calculate it here too.
      
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
              i_local = (m * (Math.pow(updated.l, 2) + Math.pow(updated.w, 2))) / 12;
              break;
          }
          const parallelAxisTerm = m * Math.pow(updated.r_offset, 2);
          updated.inertia = (i_local + parallelAxisTerm) * updated.quantity * Math.pow(updated.ratio, 2);
      }
      
      return updated;
    }));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // If it's the last row, reset it instead of removing
    if (components.length <= 1) {
        setComponents([{ ...DEFAULT_ROW, id: Date.now().toString() }]);
        return;
    }

    const newComps = components.filter(c => c.id !== id);
    setComponents(newComps);
    
    // If we deleted the selected one, select the first available
    if (selectedId === id) {
        setSelectedId(newComps[0].id);
    }
  };

  const selectedComp = components.find(c => c.id === selectedId) || components[0];
  const totalInertia = components.reduce((acc, curr) => acc + curr.inertia, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <div className="bg-win-bg w-[900px] h-[600px] shadow-2xl border border-gray-400 flex flex-col text-xs font-sans">
        {/* Window Header */}
        <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300 flex items-center justify-between px-2 select-none">
          <div className="font-bold text-gray-700 flex items-center space-x-2">
            <span>Total Inertia:</span>
            <div className="w-32">
                <UnitInput 
                    value={totalInertia} 
                    onChange={()=>{}} 
                    type="inertia" 
                    readOnly 
                />
            </div>
          </div>
          <div className="flex items-center space-x-1">
             <HelpCircle size={16} className="text-blue-600 cursor-pointer" />
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white p-1 rounded-sm"><X size={16} /></button>
          </div>
        </div>

        {/* Top: Data Grid */}
        <div className="flex-1 bg-gray-100 border-b border-gray-300 overflow-hidden flex flex-col">
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
           {/* Left: Inputs - Using UnitInput for conversion */}
           <div className="w-[350px] p-4 border-r border-gray-300 flex flex-col space-y-2">
              
              <InputGroup label="Height [H]">
                 <UnitInput 
                    type="length" 
                    value={selectedComp.h} 
                    onChange={(val) => updateComponent(selectedComp.id, 'h', val)} 
                 />
              </InputGroup>
              
              {(selectedComp.type === 'Hollow Cylinder' || selectedComp.type === 'Solid Cylinder') && (
                <InputGroup label="Outer Diameter [D1]">
                    <UnitInput 
                        type="length" 
                        value={selectedComp.d1} 
                        onChange={(val) => updateComponent(selectedComp.id, 'd1', val)} 
                    />
                </InputGroup>
              )}

              {selectedComp.type === 'Hollow Cylinder' && (
                <InputGroup label="Inner Diameter [D2]">
                    <UnitInput 
                        type="length" 
                        value={selectedComp.d2} 
                        onChange={(val) => updateComponent(selectedComp.id, 'd2', val)} 
                    />
                </InputGroup>
              )}

              {selectedComp.type === 'Cuboid' && (
                <>
                  <InputGroup label="Width [W]">
                      <UnitInput 
                          type="length" 
                          value={selectedComp.w} 
                          onChange={(val) => updateComponent(selectedComp.id, 'w', val)} 
                      />
                  </InputGroup>
                  <InputGroup label="Length [L]">
                      <UnitInput 
                          type="length" 
                          value={selectedComp.l} 
                          onChange={(val) => updateComponent(selectedComp.id, 'l', val)} 
                      />
                  </InputGroup>
                </>
              )}

              <InputGroup label="Offset [r]">
                    <UnitInput 
                        type="length" 
                        value={selectedComp.r_offset} 
                        onChange={(val) => updateComponent(selectedComp.id, 'r_offset', val)} 
                    />
              </InputGroup>

              <div className="h-px bg-gray-300 my-2"></div>

              <InputGroup label="Material">
                 <Select 
                    value={selectedComp.material} 
                    options={['Steel', 'Aluminum', 'User Spec.']} 
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
              
              <InputGroup label="Mass">
                 <UnitInput 
                    type="mass" 
                    value={selectedComp.mass} 
                    onChange={(val) => updateComponent(selectedComp.id, 'mass', val)} 
                 />
              </InputGroup>

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
                        {/* 3D Cube: Center roughly at 50,75 relative to group */}
                        
                        {/* Back Face (Hidden lines dashed?) usually simplified. Let's draw wireframe */}
                        
                        {/* Dimensions logic for drawing scaling (fake) */}
                        
                        {/* Front Face */}
                        <rect x="20" y="40" width="80" height="80" fill="none" stroke="black" strokeWidth="1.5" />
                        
                        {/* Back Face */}
                        <polyline points="20,40 50,10 130,10 130,90 100,120" fill="none" stroke="black" strokeWidth="1.5" />
                        <line x1="100" y1="40" x2="130" y2="10" stroke="black" strokeWidth="1.5" />
                        
                        {/* Center of Mass Indicator */}
                        <circle cx="60" cy="80" r="10" fill="yellow" stroke="black" />
                        <path d="M60,80 L60,90 L70,80 A10,10 0 0 0 60,70 Z" fill="black" />
                        <path d="M60,80 L50,80 A10,10 0 0 0 60,70 Z" fill="white" /> {/* Quarter fill hack */}
                        <line x1="60" y1="70" x2="60" y2="90" stroke="black" />
                        <line x1="50" y1="80" x2="70" y2="80" stroke="black" />

                        {/* Dimensions */}
                        {/* H */}
                        <line x1="140" y1="10" x2="140" y2="90" stroke="black" />
                        <path d="M140,10 L137,15 M140,10 L143,15 M140,90 L137,85 M140,90 L143,85" stroke="black" />
                        <text x="145" y="55" fontSize="12">H</text>

                        {/* W (Width - Front face width) */}
                        <line x1="20" y1="130" x2="100" y2="130" stroke="black" />
                        <path d="M20,130 L25,127 M20,130 L25,133 M100,130 L95,127 M100,130 L95,133" stroke="black" />
                        <text x="55" y="145" fontSize="12">W</text>

                        {/* L (Length - Depth side) */}
                        <line x1="105" y1="125" x2="135" y2="95" stroke="black" />
                        <path d="M105,125 L110,120 M135,95 L130,100" stroke="black" /> {/* Arrows approx */}
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

                        {/* h */}
                        <line x1="100" y1="50" x2="100" y2="120" stroke="black" />
                        <path d="M100,50 L97,55 M100,50 L103,55 M100,120 L97,115 M100,120 L103,115" stroke="black" />
                        <text x="105" y="90" fontSize="14" fontStyle="italic">h</text>
                        
                        {/* D1 */}
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
