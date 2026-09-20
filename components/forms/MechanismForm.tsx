import React, { useState } from 'react';
import { UnitType } from '../../utils/unitConversion';
import { UnitInput, InputGroup, Select } from '../Common';
import { InertiaCalculatorModal } from '../InertiaCalculatorModal';
import { TransmissionCalculatorModal } from '../TransmissionCalculatorModal';
import { FrictionCalculatorModal } from '../FrictionCalculatorModal';
import { Calculator, Info } from 'lucide-react';

type FieldConfig = {
  key: string;
  label: string;
  unitType: UnitType;
  hasCalculator?: boolean;
};

type MechanismSection = {
  section: string;
  fields: FieldConfig[];
};

// Common Groups
const LOAD_FIELDS: FieldConfig[] = [
  { key: 'massLoad', label: 'Load Mass', unitType: 'mass' },
  { key: 'externalForce', label: 'External Force', unitType: 'force' },
  { key: 'frictionCoeff', label: 'Friction Coefficient', unitType: 'factor', hasCalculator: true },
  { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
  { key: 'inclineAngle', label: 'Inclination Angle', unitType: 'angle' },
];

const COUNTER_WEIGHT_FIELDS: FieldConfig[] = [
  { key: 'cwMass', label: 'Counter Weight Mass', unitType: 'mass' },
  { key: 'thrustAsc', label: 'Thrust in Ascending', unitType: 'force' },
  { key: 'thrustDesc', label: 'Thrust in Descending', unitType: 'force' },
];

const TRANSMISSION_FIELDS: FieldConfig[] = [
  { key: 'ratio', label: 'Gear Ratio', unitType: 'ratio', hasCalculator: true },
  { key: 'transInertia', label: 'Reflected Inertia of Transmission', unitType: 'inertia', hasCalculator: true },
  { key: 'transAddTorque', label: 'Additional Torque', unitType: 'torque' },
  { key: 'transEfficiency', label: 'Efficiency', unitType: 'efficiency' },
];

// Configuration per Mechanism
const MECHANISM_STRUCTURES: Record<string, MechanismSection[]> = {
  'Ball Screw': [
    { section: 'Load', fields: LOAD_FIELDS },
    { section: 'Counter Weight', fields: COUNTER_WEIGHT_FIELDS },
    { section: 'Mechanism', fields: [
      { key: 'screwLead', label: 'Lead (unit/rev)', unitType: 'length' },
      { key: 'slideMass', label: 'Slide Mass', unitType: 'mass' },
      { key: 'screwInertia', label: 'Ball Screw Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
  'Belt': [
    { section: 'Load', fields: LOAD_FIELDS },
    { section: 'Counter Weight', fields: COUNTER_WEIGHT_FIELDS },
    { section: 'Mechanism', fields: [
      { key: 'driverDiameter', label: 'Driver Pitch Diameter', unitType: 'length' },
      { key: 'beltMass', label: 'Belt Mass', unitType: 'mass' },
      { key: 'driverInertia', label: 'Driver/Idler Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
  'Chain and Sprocket': [
    { section: 'Load', fields: LOAD_FIELDS },
    { section: 'Counter Weight', fields: COUNTER_WEIGHT_FIELDS },
    { section: 'Mechanism', fields: [
      { key: 'sprocketPCD', label: 'Sprocket PCD', unitType: 'length' },
      { key: 'chainMass', label: 'Chain Mass', unitType: 'mass' },
      { key: 'sprocketInertia', label: 'Sprocket/Idler Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
  'Rack and Pinion': [
    { section: 'Load', fields: LOAD_FIELDS },
    { section: 'Counter Weight', fields: COUNTER_WEIGHT_FIELDS },
    { section: 'Mechanism', fields: [
      { key: 'pinionPCD', label: 'Pinion PCD', unitType: 'length' },
      { key: 'rackMass', label: 'Rack Mass', unitType: 'mass' },
      { key: 'pinionInertia', label: 'Pinion Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
  'Roll Feeder': [
    { section: 'Load', fields: [
      { key: 'pressForce', label: 'Press Force', unitType: 'force' },
      { key: 'tensionForce', label: 'Tension Force', unitType: 'force' },
      { key: 'frictionCoeff', label: 'Friction Coefficient', unitType: 'factor', hasCalculator: true },
      { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
      { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
    ]},
    { section: 'Mechanism', fields: [
      { key: 'drivingRollerDia', label: 'Driving Roller Diameter', unitType: 'length' },
      { key: 'drivingInertia', label: 'Driving Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'drivenInertia', label: 'Driven Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
  'Linear Motor': [
    { section: 'Load', fields: LOAD_FIELDS },
    { section: 'Counter Weight', fields: COUNTER_WEIGHT_FIELDS },
    { section: 'Mechanism', fields: [
      { key: 'forceMargin', label: 'Force Margin', unitType: 'efficiency' },
      { key: 'slideMass', label: 'Slide Mass', unitType: 'mass' },
    ]},
  ],
  'Rotation Table': [
    { section: 'Load', fields: [
      { key: 'rotatingInertia', label: 'Rotating Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'externalTorque', label: 'External Torque', unitType: 'torque' },
      { key: 'frictionCoeff', label: 'Friction Coefficient', unitType: 'factor', hasCalculator: true },
      { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
  'Crank': [
    { section: 'Load', fields: LOAD_FIELDS },
    { section: 'Counter Weight', fields: COUNTER_WEIGHT_FIELDS },
    { section: 'Mechanism', fields: [
      { key: 'crankRadius', label: 'Crank Radius', unitType: 'length' },
      { key: 'rodLength', label: 'Connecting Rod Length', unitType: 'length' },
      { key: 'crankInertia', label: 'Crank Inertia', unitType: 'inertia', hasCalculator: true },
      { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
    ]},
    { section: 'Transmission', fields: TRANSMISSION_FIELDS },
  ],
};

const MechanismVisualizer = ({ type, angle }: { type: string, angle: number }) => {
  const getSvgContent = () => {
    switch (type) {
      case 'Belt':
      case 'Belt & Pulley':
        return (
          <>
            <circle cx="150" cy="150" r="40" fill="#999" stroke="#333" strokeWidth="2" />
            <circle cx="450" cy="150" r="40" fill="#999" stroke="#333" strokeWidth="2" />
            <path d="M150,110 L450,110" stroke="#333" strokeWidth="4" />
            <path d="M150,190 L450,190" stroke="#333" strokeWidth="4" />
            <rect x="250" y="80" width="100" height="30" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" rx="4" />
            <text x="300" y="100" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0369a1">Load Car</text>
          </>
        );
      case 'Ball Screw':
        return (
          <>
            <rect x="100" y="140" width="400" height="20" fill="#ccc" stroke="#333" />
            <path d="M100,140 L500,160 M100,145 L500,165 M100,150 L500,170 M100,155 L500,175" stroke="#999" strokeWidth="1" />
            <rect x="250" y="120" width="100" height="60" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" rx="4" />
            <text x="300" y="155" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0369a1">Ball Nut & Slide</text>
          </>
        );
      case 'Rack and Pinion':
      case 'Rack & Pinion':
        return (
          <>
            <rect x="100" y="180" width="400" height="20" fill="#999" stroke="#333" />
            {Array.from({length: 20}).map((_, i) => (
               <line key={i} x1={110 + i * 20} y1={180} x2={110 + i * 20} y2={175} stroke="#333" strokeWidth="2" />
            ))}
            <circle cx="300" cy="135" r="40" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
            <circle cx="300" cy="135" r="8" fill="#333" />
            <text x="300" y="139" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">Pinion</text>
          </>
        );
      case 'Chain and Sprocket':
        return (
          <>
            <circle cx="160" cy="150" r="35" fill="#bbb" stroke="#222" strokeWidth="2" strokeDasharray="6,3" />
            <circle cx="440" cy="150" r="35" fill="#bbb" stroke="#222" strokeWidth="2" strokeDasharray="6,3" />
            <path d="M160,115 L440,115 M160,185 L440,185" stroke="#444" strokeWidth="3" strokeDasharray="8,4" />
            <rect x="260" y="90" width="80" height="25" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" rx="3" />
            <text x="300" y="107" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">Carrier</text>
          </>
        );
      case 'Rotation Table':
      case 'Rotary Table':
        return (
          <>
            <ellipse cx="300" cy="150" rx="140" ry="40" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
            <rect x="280" y="150" width="40" height="80" fill="#999" stroke="#333" strokeWidth="2" />
            <circle cx="300" cy="150" r="10" fill="#333" />
            <text x="300" y="145" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0369a1">Rotating Plate</text>
          </>
        );
      case 'Roll Feeder':
      case 'Roll Feed':
        return (
          <>
            <circle cx="300" cy="100" r="35" fill="#999" stroke="#333" strokeWidth="2" />
            <circle cx="300" cy="180" r="35" fill="#999" stroke="#333" strokeWidth="2" />
            <rect x="150" y="138" width="300" height="4" fill="#3b82f6" />
            <text x="300" y="95" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">Driver</text>
            <text x="300" y="185" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">Driven</text>
          </>
        );
      case 'Crank':
        return (
          <>
            <circle cx="200" cy="150" r="45" fill="#ccc" stroke="#333" strokeWidth="2" />
            <line x1="200" y1="150" x2="230" y2="120" stroke="#0284c7" strokeWidth="4" />
            <line x1="230" y1="120" x2="400" y2="150" stroke="#333" strokeWidth="3" />
            <rect x="380" y="135" width="60" height="30" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" rx="3" />
            <text x="410" y="154" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">Piston</text>
          </>
        );
      case 'Linear Motor':
        return (
          <>
            <rect x="100" y="170" width="400" height="20" fill="#475569" stroke="#1e293b" rx="2" />
            <rect x="250" y="125" width="100" height="40" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" rx="4" />
            <text x="300" y="150" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">Forcer</text>
          </>
        );
      default:
        return (
          <>
            <rect x="100" y="140" width="400" height="20" fill="#ccc" stroke="#333" rx="10" />
            <circle cx="120" cy="150" r="10" fill="#666" />
            <circle cx="480" cy="150" r="10" fill="#666" />
            <rect x="250" y="100" width="100" height="40" fill="#f0f0f0" stroke="#333" strokeWidth="2" />
          </>
        );
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-700 to-slate-900 rounded-sm relative overflow-hidden flex items-center justify-center p-4 shadow-inner">
      <div className="relative w-full max-w-[500px] h-[180px]">
        <svg viewBox="0 0 600 300" className="w-full h-full">
           <defs>
             <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:1}} />
               <stop offset="100%" style={{stopColor:'#e2e8f0', stopOpacity:1}} />
             </linearGradient>
           </defs>
           <rect width="600" height="300" fill="url(#grad)" rx="8" />
           {getSvgContent()}
        </svg>
      </div>
      {angle !== 0 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-mono">
          Inclination: {angle}°
        </div>
      )}
    </div>
  );
};

export const MechanismForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const mechType = params.mechanismType || 'Ball Screw';
  const sections = MECHANISM_STRUCTURES[mechType] || MECHANISM_STRUCTURES['Ball Screw'];
  const [calculatorField, setCalculatorField] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => onUpdate({ [key]: value });
  const handleOpenCalculator = (key: string) => setCalculatorField(key);

  const handleCalculatorAccept = (value: string) => {
    if (calculatorField) {
      handleChange(calculatorField, value);
      setCalculatorField(null);
    }
  };

  const isFriction = calculatorField === 'frictionCoeff';
  const isTrans = calculatorField === 'ratio';
  const isInertia = calculatorField && (calculatorField.toLowerCase().includes('inertia'));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-win-panel">
      <InertiaCalculatorModal 
        isOpen={!!calculatorField && !!isInertia} 
        onClose={() => setCalculatorField(null)} 
        onAccept={handleCalculatorAccept}
        title={`Inertia for ${calculatorField}`}
        initialValue={calculatorField ? params[calculatorField] : '0'}
      />

      <TransmissionCalculatorModal
        isOpen={!!calculatorField && !!isTrans}
        onClose={() => setCalculatorField(null)}
        onAccept={(inertia, ratio, efficiency, torque) => {
           onUpdate({ 
             transInertia: inertia,
             ratio: ratio,
             transEfficiency: (parseFloat(efficiency) * 100).toString(),
             transAddTorque: torque
           });
           setCalculatorField(null);
        }}
        title="Transmission Calculator"
      />

      <FrictionCalculatorModal
        isOpen={!!calculatorField && !!isFriction}
        onClose={() => setCalculatorField(null)}
        onAccept={handleCalculatorAccept}
        title="Friction Coefficient Calculator"
        initialValue={calculatorField ? params[calculatorField] : '0'}
      />

      {/* Top Visualizer Area */}
      <div className="flex space-x-4 mb-4 shrink-0 h-[220px]">
        <MechanismVisualizer type={mechType} angle={parseFloat(params.inclineAngle || 0)} />
        <div className="w-[420px] bg-gray-50 border border-gray-300 p-3 rounded-sm shadow-sm shrink-0 flex flex-col justify-between">
           <div>
             <h4 className="text-[11px] font-bold text-gray-700 uppercase mb-2 border-b border-gray-200 pb-1">Mechanism Selector</h4>
             <div className="space-y-3">
               <InputGroup label="Select Type">
                  <Select 
                    value={mechType} 
                    options={Object.keys(MECHANISM_STRUCTURES)} 
                    onChange={(e) => handleChange('mechanismType', e.target.value)} 
                    className="!h-7 !text-xs font-bold"
                  />
               </InputGroup>
               <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800 leading-relaxed">
                  <div className="font-bold uppercase mb-1 flex items-center"><Info size={12} className="mr-1"/> Automatic Dynamic Coupling</div>
                  Moving mass, slide mass, lead/diameter, and inclination angle are automatically converted into equivalent rotary inertia and static gravitational torques reflected to the motor shaft.
               </div>
             </div>
           </div>
           <div className="text-[10px] text-gray-500 italic">
             Use the calculator icons (<Calculator size={10} className="inline text-blue-600"/>) for geometric inertia, friction materials, and multi-stage transmission stages.
           </div>
        </div>
      </div>

      {/* Main Parameters Grid - 4 Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-4 gap-6 min-w-[1000px] p-1">
          {sections.map((section) => (
            <div key={section.section} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2 mb-2 border-b border-gray-300 pb-0.5">
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">{section.section}</h3>
              </div>
              
              <div className="space-y-2">
                {section.fields.map((field) => (
                  <div key={field.key} className="flex flex-col">
                    <span className="text-[10px] font-semibold text-win-blue mb-0.5 flex justify-between items-center h-4">
                      {field.label}
                    </span>
                    <UnitInput 
                      value={params[field.key]} 
                      onChange={(val) => handleChange(field.key, val)}
                      type={field.unitType}
                      hasCalculator={field.hasCalculator}
                      onCalculatorClick={() => handleOpenCalculator(field.key)}
                      unitAsTextbox={field.unitType === 'ratio'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
