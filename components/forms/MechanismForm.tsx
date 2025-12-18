
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

const MECHANISM_CONFIG: Record<string, MechanismSection[]> = {
  'Ball Screw': [
    {
      section: 'Regarding Load',
      fields: [
        { key: 'massLoad', label: 'Load Mass', unitType: 'mass' },
        { key: 'externalForce', label: 'External Force', unitType: 'force' },
        { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
        { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
        { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
      ]
    },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'screwLead', label: 'Lead', unitType: 'length' },
        { key: 'slideMass', label: 'Slide Mass', unitType: 'mass' },
        { key: 'screwInertia', label: 'Ball Screw Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
  ],
  'Belt': [
    {
      section: 'Regarding Load',
      fields: [
        { key: 'massLoad', label: 'Load Mass', unitType: 'mass' },
        { key: 'externalForce', label: 'External Force', unitType: 'force' },
        { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
        { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
        { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
      ]
    },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'driverDiameter', label: 'Driver Pitch Dia.', unitType: 'length' },
        { key: 'beltMass', label: 'Belt Mass', unitType: 'mass' },
        { key: 'driverInertia', label: 'Driver/Idler Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
  ],
  'Rack and Pinion': [
    {
      section: 'Regarding Load',
      fields: [
        { key: 'massLoad', label: 'Load Mass', unitType: 'mass' },
        { key: 'externalForce', label: 'External Force', unitType: 'force' },
        { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
        { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
        { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
      ]
    },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'pinionPCD', label: 'Pinion PCD', unitType: 'length' },
        { key: 'rackMass', label: 'Rack Mass', unitType: 'mass' },
        { key: 'pinionInertia', label: 'Pinion Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
  ],
  'Linear Motor': [
    {
      section: 'Regarding Load',
      fields: [
        { key: 'massLoad', label: 'Load Mass', unitType: 'mass' },
        { key: 'externalForce', label: 'External Force', unitType: 'force' },
        { key: 'frictionCoeff', label: 'Friction Coeff.', unitType: 'factor', hasCalculator: true },
        { key: 'frictionForce', label: 'Friction Force', unitType: 'force' },
        { key: 'inclineAngle', label: 'Inclination', unitType: 'angle' },
      ]
    },
    {
      section: 'Regarding Mechanism',
      fields: [
        { key: 'forceMargin', label: 'Force Margin', unitType: 'force' },
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
    }
  ]
};

export const MechanismForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const mechType = params.mechanismType || 'Ball Screw';
  const sections = MECHANISM_CONFIG[mechType] || MECHANISM_CONFIG['Ball Screw'];
  const [calculatorField, setCalculatorField] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };
  
  const handleOpenCalculator = (key: string) => {
    setCalculatorField(key);
  };

  const handleCalculatorAccept = (value: string) => {
    if (calculatorField) {
      handleChange(calculatorField, value);
      setCalculatorField(null);
    }
  };

  const renderField = (field: FieldConfig) => {
    return (
      <React.Fragment key={field.key}>
      <InputGroup label={field.label}>
        <UnitInput 
          value={params[field.key]} 
          onChange={(val) => handleChange(field.key, val)}
          type={field.unitType}
          hasCalculator={field.hasCalculator}
          onCalculatorClick={() => handleOpenCalculator(field.key)}
        />
      </InputGroup>
      </React.Fragment>
    );
  };

  const renderSection = (sectionData: MechanismSection) => (
    <div key={sectionData.section} className="mb-0">
      <SectionHeader title={sectionData.section} />
      <div className="grid grid-cols-2 gap-x-8">
        {sectionData.fields.map(renderField)}
      </div>
    </div>
  );

  const isFriction = calculatorField === 'frictionCoeff';
  const isInertia = calculatorField && calculatorField.toLowerCase().includes('inertia');

  return (
    <div className="relative">
      <InertiaCalculatorModal 
        isOpen={!!calculatorField && !!isInertia} 
        onClose={() => setCalculatorField(null)} 
        onAccept={handleCalculatorAccept}
        title={calculatorField ? `Calculate ${calculatorField}` : 'Calculator'}
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
        <div className="flex items-center mb-2 border-b border-gray-100 pb-2">
            <div className="text-xs font-bold text-gray-500 mr-4">MECH. TYPE:</div>
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
