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
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
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
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
  ],
  'Chain and Sprocket': [
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
        { key: 'sprocketPCD', label: 'Sprocket PCD', unitType: 'length' },
        { key: 'chainMass', label: 'Chain Mass', unitType: 'mass' },
        { key: 'sprocketInertia', label: 'Sprocket/Idler Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
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
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
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
        { key: 'drivingRollerDiameter', label: 'Driving Roller Dia.', unitType: 'length' },
        { key: 'drivingInertia', label: 'Driving Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'drivenInertia', label: 'Driven Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
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
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
  ],
  'Crank': [
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
        { key: 'crankRadius', label: 'Crank Radius', unitType: 'length' },
        { key: 'rodLength', label: 'Connecting Rod Length', unitType: 'length' },
        { key: 'crankInertia', label: 'Crank Inertia', unitType: 'inertia', hasCalculator: true },
        { key: 'mechanismEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    },
    {
      section: 'Related Transmission',
      fields: [
        { key: 'gearRatio', label: 'Gear Ratio', unitType: 'ratio' },
        { key: 'transmissionInertia', label: 'Reflected Inertia', unitType: 'inertia' },
        { key: 'additionalTorque', label: 'Additional Torque', unitType: 'torque' },
        { key: 'transmissionEfficiency', label: 'Efficiency', unitType: 'efficiency' },
      ]
    }
  ]
};

export const MechanismForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const mechType = params.mechanismType || 'Ball Screw';
  const sections = MECHANISM_CONFIG[mechType] || [];
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
    <div key={sectionData.section} className="mb-4">
      <SectionHeader title={sectionData.section} />
      {sectionData.fields.map(renderField)}
    </div>
  );

  const loadSection = sections.find(s => s.section === 'Regarding Load');
  const otherSections = sections.filter(s => s.section !== 'Regarding Load');

  // Determine which calculator to show based on the field name
  const isFriction = calculatorField === 'frictionCoeff';
  const isInertia = calculatorField && calculatorField.toLowerCase().includes('inertia');

  return (
    <div className="relative">
      {/* Inertia Calculator Modal */}
      <InertiaCalculatorModal 
        isOpen={!!calculatorField && !!isInertia} 
        onClose={() => setCalculatorField(null)} 
        onAccept={handleCalculatorAccept}
        title={calculatorField ? `Calculate ${calculatorField}` : 'Calculator'}
        initialValue={calculatorField ? params[calculatorField] : '0'}
      />

      {/* Friction Calculator Modal */}
      <FrictionCalculatorModal
        isOpen={!!calculatorField && !!isFriction}
        onClose={() => setCalculatorField(null)}
        onAccept={handleCalculatorAccept}
        title="Friction Coefficient Calculator"
        initialValue={calculatorField ? params[calculatorField] : '0'}
      />

      <div className="grid grid-cols-2 gap-8">
        <div>
          <InputGroup label="Mechanism Type">
            <Select 
              value={mechType} 
              options={Object.keys(MECHANISM_CONFIG)} 
              onChange={(e) => handleChange('mechanismType', e.target.value)} 
            />
          </InputGroup>
          {loadSection && renderSection(loadSection)}
        </div>
        <div>
          <div className="h-[26px] mb-1.5"></div> 
          {otherSections.map(renderSection)}
        </div>
      </div>
      <div className="mt-4 p-2 border border-gray-300 bg-white">
          <div className="text-xs font-bold text-gray-500 mb-2">Thrust / Velocity Profile</div>
          <div className="h-32 bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed text-gray-400 text-xs">
             Preview Available in Profile Tab
          </div>
      </div>
    </div>
  );
};