import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Zap, Play, Settings2, ArrowRightLeft, ChevronsUp, BarChart3, Database, Gauge, Link as LinkIcon } from 'lucide-react';
import { TreeNode, CamTable } from '../types';
import { motorCatalog, driveCatalog, gearboxCatalog } from '../catalogData';
import { InertiaCalculatorModal } from './InertiaCalculatorModal';
import { FrictionCalculatorModal } from './FrictionCalculatorModal';
import { ProfileEditor } from './ProfileEditor';
import { UnitType } from '../utils/unitConversion';
import { UnitInput, InputGroup, Select } from './Common';

/* --- Visualization Components --- */

const EfficiencyBar = React.memo(({ value }: { value: number }) => (
  <div className="flex flex-col items-center">
    <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 rounded-sm mb-1 border border-green-600 shadow-sm">
      {value}%
    </div>
    <div className="h-4 w-px bg-gray-400"></div>
  </div>
));

const DriveUnit = React.memo(({ label }: { label: string }) => (
  <div className="flex flex-col items-center mx-2 relative group w-16 shrink-0">
    {/* Connection line top */}
    <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-400"></div>
    
    {/* Inverter Box */}
    <div className="w-16 h-24 bg-gray-50 border border-gray-400 shadow-sm relative flex flex-col items-center justify-between p-1">
      <div className="w-full h-4 bg-gray-800 text-red-500 font-mono text-[8px] flex items-center justify-center">88</div>
      <div className="flex-1 flex items-center justify-center">
        <Zap size={16} className="text-gray-400" />
      </div>
      <div className="w-full flex justify-around">
         <div className="w-1.5 h-1.5 bg-green-700 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
    </div>

    {/* Cable */}
    <div className="h-6 w-1 bg-green-700 my-0.5"></div>

    {/* Motor */}
    <div className="w-16 h-10 bg-gray-700 rounded-sm border border-black relative flex items-center justify-center shadow-md">
       <div className="absolute -left-2 w-4 h-6 bg-gray-600 rounded-l-sm border-l border-t border-b border-black"></div>
       <div className="w-10 h-0.5 bg-gray-500 opacity-30"></div>
       <div className="w-10 h-0.5 bg-gray-500 opacity-30 mt-1"></div>
    </div>
    
    <div className="mt-1 text-xs font-bold text-gray-600 truncate w-full text-center">{label}</div>
  </div>
));

const Visualizer = ({ axes }: { axes: TreeNode[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerWidth, setContainerWidth] = useState(0);

  // Constants for Virtualization
  // Width = 64px (w-16) + 16px (mx-2 = 8px * 2) = 80px
  const ITEM_WIDTH = 80; 
  const BUFFER = 5; // Number of extra items to render outside viewport

  // 1. Observe Container Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. Handle Scroll to update visible range
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollLeft = containerRef.current.scrollLeft;
      
      const startIndex = Math.max(0, Math.floor(scrollLeft / ITEM_WIDTH) - BUFFER);
      const visibleItemsCount = Math.ceil(containerWidth / ITEM_WIDTH);
      const endIndex = Math.min(axes.length, startIndex + visibleItemsCount + (2 * BUFFER));
      
      setVisibleRange(prev => {
        if (prev.start === startIndex && prev.end === endIndex) return prev;
        return { start: startIndex, end: endIndex };
      });
    };

    const element = containerRef.current;
    if (element) {
      // Initial calculation
      handleScroll();
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [axes.length, containerWidth]);

  // 3. Render Helper
  const { totalWidth, offsetLeft, visibleAxes } = useMemo(() => {
    const totalWidth = axes.length * ITEM_WIDTH;
    const offsetLeft = visibleRange.start * ITEM_WIDTH;
    const visibleAxes = axes.slice(visibleRange.start, visibleRange.end);
    return { totalWidth, offsetLeft, visibleAxes };
  }, [axes, visibleRange]);

  return (
    <div className="h-1/3 bg-white border-b border-gray-300 p-4 relative overflow-hidden flex flex-col shrink-0">
       {/* Title Overlay */}
       <div className="absolute top-0 left-0 bg-win-blue/10 text-win-blue font-bold px-2 py-0.5 text-xs border-r border-b border-win-blue/20 z-10">
         Power Group
       </div>

       {/* System Diagram */}
       <div className="flex-1 flex items-center overflow-hidden">
         {/* Supply Unit (Static) */}
         <div className="mr-8 flex flex-col items-center justify-end h-full pb-10 shrink-0 z-10 bg-white pl-4">
            <div className="w-12 h-32 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-400 shadow-md flex items-center justify-center">
               <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center">
                 <div className="w-0.5 h-3 bg-black transform rotate-45"></div>
               </div>
            </div>
         </div>

         {/* Virtualized Scroll Area */}
         <div 
            ref={containerRef}
            className="flex-1 h-full overflow-x-auto overflow-y-hidden relative scrollbar-thin"
         >
            {/* Connection Bus Background */}
            <div className="absolute top-[35%] left-0 h-1 bg-gray-800 -z-10" style={{ width: Math.max(containerWidth, totalWidth + 40) }}></div>

            {/* Scroll Content Container */}
            <div className="h-full flex items-end pb-2" style={{ width: totalWidth, position: 'relative' }}>
              {/* Virtualization Spacer */}
              <div style={{ width: offsetLeft, flexShrink: 0 }}></div>
              
              {/* Rendered Items */}
              {visibleAxes.map((axis, index) => {
                 // The index passed here is local to the slice, so we calculate global index for efficiency seed
                 const globalIndex = visibleRange.start + index;
                 const efficiency = 85 + (globalIndex * 2) % 10;
                 return (
                  <div key={axis.id} className="flex flex-col items-center -mt-16 shrink-0">
                    <EfficiencyBar value={efficiency} />
                    <DriveUnit label={axis.label.split(' ')[0]} />
                  </div>
                 );
              })}
            </div>
         </div>
       </div>
    </div>
  );
};

const SectionHeader = ({ title, rightContent }: { title: string, rightContent?: React.ReactNode }) => (
  <div className="flex justify-between items-end border-b border-gray-300 mb-2 pb-0.5 mt-3">
    <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">
      {title}
    </div>
    {rightContent}
  </div>
);

const FormTabs = ({ tabs, activeTab, onTabClick }: { tabs: string[], activeTab: string, onTabClick: (t: string) => void }) => (
  <div className="flex border-b border-gray-300 mb-3 bg-gray-100">
    {tabs.map(tab => (
      <div 
        key={tab}
        onClick={() => onTabClick(tab)}
        className={`px-3 py-1.5 text-xs cursor-pointer border-r border-gray-300 hover:bg-gray-50
          ${activeTab === tab ? 'bg-white font-bold border-t-2 border-t-blue-500 border-b-white translate-y-[1px]' : 'text-gray-600'}
        `}
      >
        {tab}
      </div>
    ))}
  </div>
);

/* --- Specific Node Forms --- */

const PowerGroupForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
      <div>
        <InputGroup label="Cycle time">
          <UnitInput value={params.cycleTime} onChange={(v) => handleChange('cycleTime', v)} type="time" />
        </InputGroup>
        <InputGroup label="Configuration">
           <Select value={params.configuration} options={['Multi-Axis', 'Independent', 'Robotic']} onChange={(e) => handleChange('configuration', e.target.value)} />
        </InputGroup>
        
        <div className="h-4 border-b border-gray-300 mb-2 mt-1"></div>

        <InputGroup label="Supply">
           <div className="flex w-full space-x-1 items-center">
             <Select value={params.supplyVoltage} options={['230', '400', '480']} onChange={(e) => handleChange('supplyVoltage', e.target.value)} />
             <span className="text-xs text-red-700 mx-1">Vac</span>
             <Select value={params.supplyPhase} options={['1', '3']} onChange={(e) => handleChange('supplyPhase', e.target.value)} />
           </div>
        </InputGroup>
        <InputGroup label="Nominal bus voltage">
          <div className="flex w-full items-center">
               <div className="flex-1">
                <UnitInput value={params.nominalBusVoltage} onChange={(v) => handleChange('nominalBusVoltage', v)} type="voltage" />
               </div>
               <div className="ml-2 flex items-center shrink-0">
                  <input type="checkbox" checked className="mr-1" readOnly />
                  <span className="text-xs">Auto</span>
               </div>
          </div>
        </InputGroup>
      </div>
      <div>
        <InputGroup label="Infeed Peak Power">
           <UnitInput value={params.infeedPeakPower} onChange={(v) => handleChange('infeedPeakPower', v)} type="efficiency" />
        </InputGroup>
        <InputGroup label="Target Bus Voltage">
           <UnitInput value={params.targetBusVoltage} onChange={(v) => handleChange('targetBusVoltage', v)} type="voltage" />
        </InputGroup>
      </div>
    </div>
  );
};

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

const MechanismForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
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

const GearboxForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const uniqueVendors = Array.from(new Set(gearboxCatalog.map(g => g.vendor)));
  const availableModels = gearboxCatalog.filter(g => g.vendor === params.vendor);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVendor = e.target.value;
    const firstModel = gearboxCatalog.find(g => g.vendor === newVendor);
    if (firstModel) {
      onUpdate({
        vendor: newVendor,
        model: firstModel.model,
        ratio: firstModel.ratio,
        efficiency: firstModel.efficiency,
        inertia: firstModel.inertia,
        backlash: firstModel.backlash,
        maxInputSpeed: firstModel.maxInputSpeed
      });
    } else {
      onUpdate({ vendor: newVendor, model: '' });
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    const specs = gearboxCatalog.find(g => g.model === newModel);
    if (specs) {
      onUpdate({
        model: newModel,
        ratio: specs.ratio,
        efficiency: specs.efficiency,
        inertia: specs.inertia,
        backlash: specs.backlash,
        maxInputSpeed: specs.maxInputSpeed
      });
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <InputGroup label="Vendor">
            <Select value={params.vendor} options={uniqueVendors} onChange={handleVendorChange} />
          </InputGroup>
          <InputGroup label="Model">
             <Select value={params.model} options={availableModels.map(m => m.model)} onChange={handleModelChange} />
          </InputGroup>
          <InputGroup label="Ratio (i)">
            <UnitInput value={params.ratio} onChange={()=>{}} type="ratio" readOnly />
          </InputGroup>
          <InputGroup label="Efficiency">
            <UnitInput value={params.efficiency} onChange={()=>{}} type="efficiency" readOnly />
          </InputGroup>
        </div>
        <div>
          <InputGroup label="Inertia">
            <UnitInput value={params.inertia} onChange={()=>{}} type="inertia" readOnly />
          </InputGroup>
          <InputGroup label="Backlash">
            <UnitInput value={params.backlash} onChange={()=>{}} type="angle" readOnly />
          </InputGroup>
          <InputGroup label="Max Input Speed">
            <UnitInput value={params.maxInputSpeed} onChange={()=>{}} type="speed" readOnly />
          </InputGroup>
        </div>
      </div>
    </div>
  );
};

const MotorDriveForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const uniqueMotorVendors = Array.from(new Set(motorCatalog.map(m => m.vendor)));
  const uniqueDriveVendors = Array.from(new Set(driveCatalog.map(d => d.vendor)));
  
  const availableMotors = motorCatalog.filter(m => m.vendor === params.motorVendor);
  const availableDrives = driveCatalog.filter(d => d.vendor === (params.driveVendor || params.motorVendor)); // Default to motor vendor if drive vendor not set

  const handleMotorVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVendor = e.target.value;
    const firstModel = motorCatalog.find(m => m.vendor === newVendor);
    const updates: any = { motorVendor: newVendor };
    
    // Auto-select first model
    if (firstModel) {
      updates.motorModel = firstModel.model;
      updates.ratedSpeed = firstModel.ratedSpeed;
      updates.ratedTorque = firstModel.ratedTorque;
      updates.ratedPower = firstModel.ratedPower;
      updates.ratedCurrent = firstModel.ratedCurrent;
      updates.motorEfficiency = firstModel.efficiency;
      updates.powerFactor = firstModel.powerFactor;
      updates.motorInertia = firstModel.inertia;
    }
    
    onUpdate(updates);
  };

  const handleMotorModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelName = e.target.value;
    const specs = motorCatalog.find(m => m.model === modelName);
    if (specs) {
      onUpdate({
        motorModel: modelName,
        ratedSpeed: specs.ratedSpeed,
        ratedTorque: specs.ratedTorque,
        ratedPower: specs.ratedPower,
        ratedCurrent: specs.ratedCurrent,
        motorEfficiency: specs.efficiency,
        powerFactor: specs.powerFactor,
        motorInertia: specs.inertia
      });
    }
  };

  const handleDriveVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newVendor = e.target.value;
      const firstModel = driveCatalog.find(d => d.vendor === newVendor);
      const updates: any = { driveVendor: newVendor };
      if (firstModel) {
          updates.driveModel = firstModel.model;
          updates.driveSupplyVoltage = firstModel.supplyVoltage;
          updates.driveMaxCurrent = firstModel.maxCurrent;
          updates.pwmFrequency = firstModel.pwmFrequency;
      }
      onUpdate(updates);
  }

  const handleDriveModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const modelName = e.target.value;
      const specs = driveCatalog.find(d => d.model === modelName);
      if (specs) {
          onUpdate({
              driveModel: modelName,
              driveSupplyVoltage: specs.supplyVoltage,
              driveMaxCurrent: specs.maxCurrent,
              pwmFrequency: specs.pwmFrequency
          });
      }
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-8 mb-4">
        <div>
          <SectionHeader 
            title="Motor Selection" 
          />
          <InputGroup label="Vendor">
            <Select value={params.motorVendor} options={uniqueMotorVendors} onChange={handleMotorVendorChange} />
          </InputGroup>
          <InputGroup label="Model">
             <Select value={params.motorModel} options={availableMotors.map(m => m.model)} onChange={handleMotorModelChange} />
          </InputGroup>
          <InputGroup label="Rated Speed">
            <UnitInput value={params.ratedSpeed} onChange={()=>{}} type="speed" readOnly />
          </InputGroup>
          <InputGroup label="Rated Torque">
            <UnitInput value={params.ratedTorque} onChange={()=>{}} type="torque" readOnly />
          </InputGroup>
          <InputGroup label="Rated Power">
            <UnitInput value={params.ratedPower} onChange={()=>{}} type="power" readOnly />
          </InputGroup>
          <InputGroup label="Rated Current">
            <UnitInput value={params.ratedCurrent} onChange={()=>{}} type="current" readOnly />
          </InputGroup>
          <InputGroup label="Efficiency">
            <UnitInput value={params.motorEfficiency} onChange={()=>{}} type="efficiency" readOnly />
          </InputGroup>
          <InputGroup label="Power Factor">
            <UnitInput value={params.powerFactor} onChange={()=>{}} type="factor" readOnly />
          </InputGroup>
          <InputGroup label="Inertia">
            <UnitInput value={params.motorInertia} onChange={()=>{}} type="inertia" readOnly />
          </InputGroup>
        </div>
        <div>
          <SectionHeader title="Drive / Inverter" />
          <InputGroup label="Vendor">
            <Select value={params.driveVendor || params.motorVendor} options={uniqueDriveVendors} onChange={handleDriveVendorChange} />
          </InputGroup>
          <InputGroup label="Model">
             <Select value={params.driveModel} options={availableDrives.map(d => d.model)} onChange={handleDriveModelChange} />
          </InputGroup>
          <InputGroup label="Supply Voltage">
            <UnitInput value={params.driveSupplyVoltage} onChange={()=>{}} type="voltage" readOnly />
          </InputGroup>
          <InputGroup label="PWM Frequency">
             <UnitInput value={params.pwmFrequency} onChange={()=>{}} type="frequency" readOnly />
          </InputGroup>
          <InputGroup label="Max Current">
            <UnitInput value={params.driveMaxCurrent} onChange={()=>{}} type="current" readOnly />
          </InputGroup>
        </div>
      </div>
      
      <SectionHeader title="Performance Curves" />
      <div className="grid grid-cols-2 gap-4">
         <div className="border border-gray-300 bg-white h-48 relative p-2">
            <div className="text-[10px] text-gray-500 absolute top-1 left-1">Torque vs Speed</div>
            <div className="w-full h-full flex items-end">
               {/* Fake Curve */}
               <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0,10 L40,10 L80,50 L100,90" fill="none" stroke="red" strokeWidth="2" />
                 <path d="M0,90 L100,90" stroke="black" strokeWidth="1" />
                 <path d="M0,0 L0,100" stroke="black" strokeWidth="1" />
               </svg>
            </div>
         </div>
         <div className="border border-gray-300 bg-white h-48 relative p-2">
            <div className="text-[10px] text-gray-500 absolute top-1 left-1">Current vs Speed</div>
            <div className="w-full h-full flex items-end">
               <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,90 L60,80 L100,20" fill="none" stroke="blue" strokeWidth="2" />
                  <path d="M0,90 L100,90" stroke="black" strokeWidth="1" />
                  <path d="M0,0 L0,100" stroke="black" strokeWidth="1" />
               </svg>
            </div>
         </div>
      </div>
    </div>
  );
};

const AxisForm = ({ params, onUpdate, availableMasters, camTables }: { params: any, onUpdate: (p: any) => void, availableMasters: string[], camTables: CamTable[] }) => {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const isMasterFollower = params.profileType === 'Master/Follower' || params.profileType === 'Camming';

  // Fallback if no masters
  const masterOptions = ['Virtual Master', ...availableMasters];
  const camOptions = camTables.map(c => c.name);

  return (
    <div>
      <div className="p-4 bg-yellow-50 border border-yellow-200 mb-4 rounded-sm text-xs text-yellow-800">
        Select a specific component (Mechanism, Gearbox, Motor) from the tree to edit its parameters.
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <SectionHeader title="Axis Definition" />
          <InputGroup label="Axis Name">
            <input 
              type="text" 
              className="w-full text-xs border border-gray-300 px-1 h-6 bg-white text-gray-900" 
              style={{ backgroundColor: '#ffffff', color: '#111827' }}
              value={params.axisName} 
              onChange={(e) => handleChange('axisName', e.target.value)} 
            />
          </InputGroup>
          <InputGroup label="Profile Type">
             <Select value={params.profileType} options={['Time Based', 'Master/Follower', 'Camming']} onChange={(e) => handleChange('profileType', e.target.value)} />
          </InputGroup>
        </div>
        
        {isMasterFollower && (
          <div>
             <SectionHeader title="Master Configuration" rightContent={<LinkIcon size={12} className="text-blue-600"/>} />
             <InputGroup label="Master Axis">
                <Select value={params.masterAxis || 'Virtual Master'} options={masterOptions} onChange={(e) => handleChange('masterAxis', e.target.value)} />
             </InputGroup>
             
             {params.profileType === 'Master/Follower' && (
               <InputGroup label="Gear Ratio">
                 <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      className="w-12 h-6 border border-gray-300 px-1 text-right text-xs bg-white text-gray-900"
                      style={{ backgroundColor: '#ffffff', color: '#111827' }} 
                      value={params.gearRatioNum || 1} 
                      onChange={(e) => handleChange('gearRatioNum', e.target.value)}
                    />
                    <span>:</span>
                    <input 
                      type="number" 
                      className="w-12 h-6 border border-gray-300 px-1 text-right text-xs bg-white text-gray-900" 
                      style={{ backgroundColor: '#ffffff', color: '#111827' }}
                      value={params.gearRatioDen || 1} 
                      onChange={(e) => handleChange('gearRatioDen', e.target.value)}
                    />
                 </div>
               </InputGroup>
             )}

             {params.profileType === 'Camming' && (
                <InputGroup label="Cam Table ID">
                   <Select 
                      value={params.camTableId || (camOptions[0] ?? '')} 
                      options={camOptions} 
                      onChange={(e) => handleChange('camTableId', e.target.value)} 
                   />
                </InputGroup>
             )}
          </div>
        )}
      </div>
      
      {/* Informational Panel about the Profile */}
      <div className="mt-8 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <div className="flex items-start">
             <div className="mr-2 mt-0.5 text-blue-500"><Gauge size={16} /></div>
             <div>
                <span className="font-bold text-gray-800">Control Mode Description:</span>
                <p className="mt-1">
                   {params.profileType === 'Time Based' && "The axis operates autonomously using an internal trajectory generator. The Motion Profile tab defines the target position/velocity over time directly."}
                   {params.profileType === 'Master/Follower' && "The axis position is electronically geared to a Master Axis. The Motion Profile tab represents the REQUIRED output motion, which is achieved by scaling the Master's motion."}
                   {params.profileType === 'Camming' && "The axis follows a non-linear Cam Table synchronized to a Master Axis. The Motion Profile tab shows the resulting cycle based on the Master's speed."}
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};

/* --- Main Form Container --- */

export const WorkArea = ({ 
  data, 
  selectedNode, 
  onUpdateNode,
  camTables
}: { 
  data: TreeNode[], 
  selectedNode: TreeNode | undefined, 
  onUpdateNode: (id: string, params: any) => void,
  camTables: CamTable[]
}) => {
  // Safe check
  if (!selectedNode) {
      return (
        <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden items-center justify-center text-gray-400 text-sm select-none">
           Select an item from the project tree to configure.
        </div>
      );
  }

  // Extract axes from the tree structure for visualizer
  const rootNode = data.find(n => n.id === 'root');
  
  // Find the active group based on selection
  let activeGroup = rootNode;
  if (selectedNode) {
     const findGroup = (nodes: TreeNode[]): TreeNode | null => {
        for(const node of nodes) {
           if (node.type === 'group') {
              if (node.id === selectedNode.id) return node;
              // check descendants
              const hasNode = (p: TreeNode, target: string): boolean => {
                 if (p.id === target) return true;
                 if (p.children) return p.children.some(c => hasNode(c, target));
                 return false;
              }
              if (node.children && node.children.some(c => hasNode(c, selectedNode.id))) return node;
           }
        }
        return null;
     }
     const found = findGroup(data);
     if (found) activeGroup = found;
  }

  const axes = activeGroup?.children?.filter(n => n.icon === 'axis') || [];
  
  // -- Calculate Available Masters --
  // Traverse entire tree to find all axes.
  // Format: "GroupName > AxisName"
  const availableMasters = useMemo(() => {
     const masters: string[] = [];
     
     const traverse = (nodes: TreeNode[], groupName: string) => {
        nodes.forEach(node => {
            if (node.type === 'group') {
               traverse(node.children || [], node.label);
            } else if (node.type === 'axis') {
               // Exclude self if selected
               if (node.id !== selectedNode.id) {
                   masters.push(`${groupName} > ${node.label}`);
               }
            }
        });
     };

     traverse(data, "");
     return masters;
  }, [data, selectedNode.id]);

  
  const [activeTab, setActiveTab] = useState('Data');

  const params = selectedNode.parameters || {};

  // Wrapper for child components to update the specific node
  const handleNodeUpdate = (newParams: any) => {
    onUpdateNode(selectedNode.id, newParams);
  };

  const renderFormContent = () => {
    // We add a key to the component to force re-render when selectedNode changes, 
    // ensuring defaultValues are updated from the new params.
    switch (selectedNode.type) {
      case 'group': return <React.Fragment key={selectedNode.id}><PowerGroupForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'mechanism': return <React.Fragment key={selectedNode.id}><MechanismForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'gearbox': return <React.Fragment key={selectedNode.id}><GearboxForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'motor_drive': return <React.Fragment key={selectedNode.id}><MotorDriveForm params={params} onUpdate={handleNodeUpdate} /></React.Fragment>;
      case 'axis': return <React.Fragment key={selectedNode.id}><AxisForm params={params} onUpdate={handleNodeUpdate} availableMasters={availableMasters} camTables={camTables} /></React.Fragment>;
      default: return <div className="text-gray-400 italic p-4">Select an item to configure</div>;
    }
  };

  const getTitle = () => {
    if (!selectedNode) return 'Configuration';
    if (selectedNode.type === 'mechanism') return `Mechanism: ${selectedNode.label}`;
    if (selectedNode.type === 'gearbox') return `Gearbox: ${selectedNode.label}`;
    if (selectedNode.type === 'motor_drive') return `Drive & Motor: ${selectedNode.label}`;
    return selectedNode.label;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 overflow-hidden">
      {selectedNode.type === 'group' && <Visualizer axes={axes} />}
      
      <div className="flex-1 bg-win-bg p-2 overflow-y-auto flex flex-col min-h-0">
        {/* Toolbar for the form */}
        <div className="flex space-x-1 mb-3 shrink-0">
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Settings2 size={16} className="text-orange-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Play size={16} className="text-blue-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><ArrowRightLeft size={16} className="text-green-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><ChevronsUp size={16} /></button>
           <div className="w-px h-6 bg-gray-300 mx-1"></div>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><Database size={16} className="text-purple-600" /></button>
           <button className="p-1 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm rounded-sm"><BarChart3 size={16} className="text-blue-500" /></button>
        </div>

        <div className="text-xs font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1 shrink-0 flex justify-between items-center">
          <span>{getTitle()}</span>
          <div className="flex space-x-2 text-[10px] font-normal text-gray-500">
             <span className="flex items-center"><Gauge size={10} className="mr-1"/> Status: OK</span>
          </div>
        </div>

        <FormTabs 
          tabs={['Data', 'Motion Profile', 'Environment', 'Notes']} 
          activeTab={activeTab} 
          onTabClick={setActiveTab} 
        />

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'Data' ? (
            renderFormContent()
          ) : activeTab === 'Motion Profile' ? (
            <div className="h-full flex flex-col">
              <ProfileEditor />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs italic border border-gray-200 border-dashed rounded bg-gray-50">
              {activeTab} view not implemented in this demo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};