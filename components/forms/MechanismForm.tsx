
import React, { useState } from 'react';
import { UnitType } from '../../utils/unitConversion';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { InertiaCalculatorModal } from '../InertiaCalculatorModal';
import { FrictionCalculatorModal } from '../FrictionCalculatorModal';

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

const COMMON_TRANSMISSION: MechanismSection = {
  section: 'Related Transmission',
  fields: [
    { key: 'transRatio', label: 'Gear Ratio', unitType: 'ratio' },
    { key: 'transInertia', label: 'Reflected Inertia', unitType: 'inertia', hasCalculator: true },
    { key: 'transAddTorque', label: 'Additional Torque', unitType: 'torque' },
    { key: 'transEfficiency', label: 'Efficiency', unitType: 'efficiency' },
  ]
};

const COMMON_LOAD_FIELDS: FieldConfig[] = [
  { key: 'massLoad', label: 'Load Mass', unitType: 'mass' },
  { key: 'externalForce', label: 'External Force', unitType: 'force' },
  { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
  { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
  { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
];

const MECHANISM_CONFIG: Record<string, MechanismSection[]> = {
  'Ball Screw': [
    { section: 'Regarding Load', fields: COMMON_LOAD_FIELDS },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'screwLead', label: 'Lead (unit/rev)', unitType: 'length' },
        { key: 'slideMass', label: 'Slide Mass', unitType: 'mass' },
        { key: 'screwInertia', label: 'Ball Screw Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    COMMON_TRANSMISSION
  ],
  'Belt': [
    { section: 'Regarding Load', fields: COMMON_LOAD_FIELDS },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'driverDiameter', label: 'Driver Pitch Dia.', unitType: 'length' },
        { key: 'beltMass', label: 'Belt Mass', unitType: 'mass' },
        { key: 'driverInertia', label: 'Driver/Idler Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    COMMON_TRANSMISSION
  ],
  'Chain and Sprocket': [
    { section: 'Regarding Load', fields: COMMON_LOAD_FIELDS },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'sprocketPCD', label: 'Sprocket PCD', unitType: 'length' },
        { key: 'chainMass', label: 'Chain Mass', unitType: 'mass' },
        { key: 'sprocketInertia', label: 'Sprocket/Idler Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    COMMON_TRANSMISSION
  ],
  'Rack and Pinion': [
    { section: 'Regarding Load', fields: COMMON_LOAD_FIELDS },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'pinionPCD', label: 'Pinion PCD', unitType: 'length' },
        { key: 'rackMass', label: 'Rack Mass', unitType: 'mass' },
        { key: 'pinionInertia', label: 'Pinion Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    COMMON_TRANSMISSION
  ],
  'Roll Feeder': [
    { 
        section: 'Regarding Load', 
        fields: [
            { key: 'pressForce', label: 'Press Force', unitType: 'force' },
            { key: 'tensionForce', label: 'Tension Force', unitType: 'force' },
            { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
            { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
            { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
        ] 
    },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'drivingRollerDia', label: 'Driving Roller Dia.', unitType: 'length' },
        { key: 'drivingInertia', label: 'Driving Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'drivenInertia', label: 'Driven Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    COMMON_TRANSMISSION
  ],
  'Linear Motor': [
    { section: 'Regarding Load', fields: COMMON_LOAD_FIELDS },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'forceMargin', label: 'Force Margin', unitType: 'efficiency' },
        { key: 'slideMass', label: 'Slide Mass', unitType: 'mass' },
      ]
    }
  ],
  'Rotation Table': [
    { 
      section: 'Regarding Load', 
      fields: [
        { key: 'rotatingInertia', label: 'Rotating Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'externalTorque', label: 'External Torque', unitType: 'torque' },
        { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
        { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
      ] 
    },
    COMMON_TRANSMISSION
  ],
  'Crank': [
    { section: 'Regarding Load', fields: COMMON_LOAD_FIELDS },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'crankRadius', label: 'Crank Radius', unitType: 'length' },
        { key: 'rodLength', label: 'Connecting Rod Length', unitType: 'length' },
        { key: 'crankInertia', label: 'Crank Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    COMMON_TRANSMISSION
  ]
};

export const MechanismForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const mechType = params.mechanismType || 'Ball Screw';
  const sections = MECHANISM_CONFIG[mechType] || MECHANISM_CONFIG['Ball Screw'];
  const [calculatorField, setCalculatorField] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => onUpdate({ [key]: value });
  const handleOpenCalculator = (key: string) => setCalculatorField(key);

  const handleCalculatorAccept = (value: string) => {
    if (calculatorField) {
      handleChange(calculatorField, value);
      setCalculatorField(null);
    }
  };

  const renderField = (field: FieldConfig) => {
    // If it's the gear ratio, we want it to be read-only and linked to the gearbox ratio
    const isLinkedRatio = field.key === 'transRatio';
    const displayValue = isLinkedRatio ? (params.ratio || 1) : params[field.key];

    return (
      <InputGroup key={field.key} label={field.label}>
        <UnitInput 
          value={displayValue} 
          onChange={(val) => !isLinkedRatio && handleChange(field.key, val)}
          type={field.unitType}
          readOnly={isLinkedRatio}
          hasCalculator={field.hasCalculator}
          onCalculatorClick={() => handleOpenCalculator(field.key)}
        />
        {isLinkedRatio && (
          <div className="ml-1 text-[9px] text-blue-500 font-bold" title="Linked to Gearbox tab">LINKED</div>
        )}
      </InputGroup>
    );
  };

  const renderSection = (sectionData: MechanismSection) => (
    <div key={sectionData.section} className="mb-4 last:mb-0">
      <SectionHeader title={sectionData.section} />
      <div className="grid grid-cols-2 gap-x-8">
        {sectionData.fields.map(renderField)}
      </div>
    </div>
  );

  const isFriction = calculatorField === 'frictionCoeff';
  const isInertia = calculatorField && (calculatorField.toLowerCase().includes('inertia') || calculatorField === 'transInertia');

  return (
    <div className="relative h-full overflow-y-auto pr-2 custom-scrollbar">
      <InertiaCalculatorModal 
        isOpen={!!calculatorField && !!isInertia} 
        onClose={() => setCalculatorField(null)} 
        onAccept={handleCalculatorAccept}
        title={`Calculate ${calculatorField}`}
        initialValue={calculatorField ? params[calculatorField] : '0'}
      />

      <FrictionCalculatorModal
        isOpen={!!calculatorField && !!isFriction}
        onClose={() => setCalculatorField(null)}
        onAccept={handleCalculatorAccept}
        title="Friction Coefficient Calculator"
        initialValue={calculatorField ? params[calculatorField] : '0'}
      />

      <div className="flex flex-col">
        <div className="flex items-center mb-4 border-b border-gray-100 pb-2">
            <div className="text-xs font-bold text-gray-500 mr-4 uppercase">Mechanism Type:</div>
            <div className="w-64">
                <Select 
                value={mechType} 
                options={Object.keys(MECHANISM_CONFIG)} 
                onChange={(e) => handleChange('mechanismType', e.target.value)} 
                />
            </div>
        </div>
        <div className="space-y-1">
            {sections.map(renderSection)}
        </div>
      </div>
    </div>
  );
};
