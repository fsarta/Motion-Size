
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
  { key: 'frictionCoeff', label: 'Friction', unitType: 'factor', hasCalculator: true },
  { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
  { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
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
  return (
    <div className="flex-1 bg-[#1a73e8] rounded-sm relative overflow-hidden flex items-center justify-center p-4">
      <div className="relative w-full max-w-[500px] h-[180px]">
        <svg viewBox="0 0 600 300" className="w-full h-full">
           <defs>
             <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:1}} />
               <stop offset="100%" style={{stopColor:'#cccccc', stopOpacity:1}} />
             </linearGradient>
           </defs>
           <path d="M50,220 L550,220 L580,260 L80,260 Z" fill="url(#grad)" stroke="#333" strokeWidth="1" />
           <rect x="100" y="200" width="400" height="10" fill="#999" stroke="#333" />
           <rect x="100" y="215" width="400" height="10" fill="#999" stroke="#333" />
           <rect x="80" y="208" width="440" height="4" fill="#666" />
           <rect x="250" y="140" width="100" height="70" fill="#f0f0f0" stroke="#333" strokeWidth="2" />
           <g stroke="red" strokeWidth="3" fill="red">
             <path d="M100,160 L200,160" markerEnd="url(#arrow-red)" />
             <path d="M200,160 L100,160" markerEnd="url(#arrow-red)" />
             <text x="120" y="150" fill="white" fontSize="12" fontWeight="bold">External Force</text>
             <path d="M300,135 L300,90" markerEnd="url(#arrow-red)" />
             <text x="270" y="85" fill="white" fontSize="12" fontWeight="bold">Load Mass</text>
             <path d="M500,280 L580,280" markerEnd="url(#arrow-red)" />
             <text x="500" y="300" fill="white" fontSize="12" fontWeight="bold">Direction of Motion</text>
           </g>
           <defs>
             <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
               <path d="M0,0 L0,6 L9,3 z" fill="red" />
             </marker>
           </defs>
        </svg>
        <div className="absolute right-0 top-0 w-32 h-32 opacity-80">
           <svg viewBox="0 0 100 100">
              <path d="M10,80 L90,80" stroke="red" strokeWidth="2" />
              <path d="M10,80 L90,40" stroke="red" strokeWidth="2" />
              <text x="30" y="70" fill="white" fontSize="8" fontWeight="bold">θ</text>
              <text x="80" y="35" fill="white" fontSize="8">Motion</text>
              <text x="80" y="95" fill="white" fontSize="8">Horizontal</text>
           </svg>
        </div>
      </div>
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
  const isTrans = calculatorField === 'transInertia' || calculatorField === 'ratio';
  const isInertia = calculatorField && (calculatorField.toLowerCase().includes('inertia') && calculatorField !== 'transInertia');

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
        onAccept={(inertia, ratio, efficiency) => {
           onUpdate({ 
             transInertia: inertia,
             ratio: ratio,
             transEfficiency: (parseFloat(efficiency) * 100).toString()
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
      <div className="flex space-x-4 mb-6 shrink-0 h-[220px]">
        <MechanismVisualizer type={mechType} angle={parseFloat(params.inclineAngle || 0)} />
        <div className="w-[520px] bg-gray-50 border border-gray-300 p-3 rounded-sm shadow-sm shrink-0">
           <h4 className="text-[11px] font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-1">Mechanism Selector</h4>
           <div className="space-y-4">
             <InputGroup label="Select Type">
                <Select 
                  value={mechType} 
                  options={Object.keys(MECHANISM_STRUCTURES)} 
                  onChange={(e) => handleChange('mechanismType', e.target.value)} 
                  className="!h-7 !text-sm font-bold"
                />
             </InputGroup>
             <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed">
                <div className="font-bold uppercase mb-1 flex items-center"><Info size={12} className="mr-1"/> Logic Info</div>
                Selecting a mechanism type updates the parameters and visualizer below to match the selected kinematics. All transmission parameters can be calculated using the dedicated Transmission Calculator.
             </div>
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
