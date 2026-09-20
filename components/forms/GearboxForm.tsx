import React, { useMemo, useState } from 'react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { getGearboxCatalog } from '../../catalogData';
import { GearboxSpec } from '../../types';
import { Sparkles, Edit3, Settings } from 'lucide-react';

export const GearboxForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(params.gearboxVendor === 'Custom');
  const catalog = useMemo(() => getGearboxCatalog(), []);
  const uniqueVendors = useMemo(() => ['Custom', ...Array.from(new Set(catalog.map(g => g.vendor)))], [catalog]);
  const availableModels = useMemo(() => catalog.filter(g => g.vendor === params.gearboxVendor), [catalog, params.gearboxVendor]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVendor = e.target.value;
    if (newVendor === 'Custom') {
      setIsCustomMode(true);
      onUpdate({
        gearboxVendor: 'Custom',
        gearboxModel: 'Custom Gearbox',
        gearboxRatio: params.gearboxRatio || 5,
        gearboxEfficiency: params.gearboxEfficiency || 95,
        gearboxInertia: params.gearboxInertia || 0.2,
        gearboxBacklash: params.gearboxBacklash || 5,
        gearboxMaxInputSpeed: params.gearboxMaxInputSpeed || 5000
      });
      return;
    }

    setIsCustomMode(false);
    const models = catalog.filter(g => g.vendor === newVendor);
    const firstModel = models[0];
    if (firstModel) {
      onUpdate({
        gearboxVendor: newVendor,
        gearboxModel: firstModel.model,
        gearboxRatio: firstModel.ratio,
        gearboxEfficiency: firstModel.efficiency,
        gearboxInertia: firstModel.inertia,
        gearboxBacklash: firstModel.backlash,
        gearboxMaxInputSpeed: firstModel.maxInputSpeed
      });
    } else {
      onUpdate({ gearboxVendor: newVendor, gearboxModel: '' });
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    const specs = catalog.find(g => g.model === newModel && g.vendor === params.gearboxVendor);
    if (specs) {
      onUpdate({
        gearboxModel: newModel,
        gearboxRatio: specs.ratio,
        gearboxEfficiency: specs.efficiency,
        gearboxInertia: specs.inertia,
        gearboxBacklash: specs.backlash,
        gearboxMaxInputSpeed: specs.maxInputSpeed
      });
    }
  };

  const ratioVal = parseFloat(String(params.gearboxRatio || 1));
  const inertiaDivisor = (ratioVal * ratioVal).toFixed(1);

  return (
    <div className="space-y-4">
      <SectionHeader 
        title="Gearbox & Speed Reducer" 
        rightContent={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newMode = !isCustomMode;
                setIsCustomMode(newMode);
                if (newMode) onUpdate({ gearboxVendor: 'Custom', gearboxModel: 'Custom Gearbox' });
              }}
              className={`flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${isCustomMode ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
            >
              <Edit3 size={12} className="mr-1" />
              {isCustomMode ? 'Custom Specifications' : 'Switch to Custom Mode'}
            </button>
          </div>
        }
      />

      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
        <div>
          <strong>Inertia Reflection Effect:</strong> Load inertia reflected to the motor shaft is reduced by the square of the ratio: <strong>$J_L / i^2 = J_L / {inertiaDivisor}$</strong>.
        </div>
        <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-blue-200">
          Ratio: <strong>{ratioVal}:1</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <InputGroup label="Vendor">
            <Select value={params.gearboxVendor || uniqueVendors[0]} options={uniqueVendors} onChange={handleVendorChange} />
          </InputGroup>

          {!isCustomMode ? (
            <InputGroup label="Model">
              <Select value={params.gearboxModel} options={availableModels.map(m => m.model)} onChange={handleModelChange} />
            </InputGroup>
          ) : (
            <InputGroup label="Model Name">
              <input
                type="text"
                className="w-full text-xs border border-gray-300 px-2 h-6 bg-white text-gray-900 focus:border-blue-500 outline-none"
                value={params.gearboxModel || 'Custom Gearbox'}
                onChange={(e) => onUpdate({ gearboxModel: e.target.value })}
              />
            </InputGroup>
          )}

          <InputGroup label="Gear Ratio (i)">
            <UnitInput 
              value={params.gearboxRatio || 1} 
              onChange={(val) => onUpdate({ gearboxRatio: parseFloat(val) || 1 })} 
              type="ratio" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>

          <InputGroup label="Efficiency (%)">
            <UnitInput 
              value={params.gearboxEfficiency || 95} 
              onChange={(val) => onUpdate({ gearboxEfficiency: parseFloat(val) || 95 })} 
              type="efficiency" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>
        </div>

        <div className="space-y-2">
          <InputGroup label="Gearbox Inertia">
            <UnitInput 
              value={params.gearboxInertia || 0} 
              onChange={(val) => onUpdate({ gearboxInertia: parseFloat(val) || 0 })} 
              type="inertia" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>

          <InputGroup label="Backlash">
            <UnitInput 
              value={params.gearboxBacklash || 0} 
              onChange={(val) => onUpdate({ gearboxBacklash: parseFloat(val) || 0 })} 
              type="angle" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>

          <InputGroup label="Max Input Speed">
            <UnitInput 
              value={params.gearboxMaxInputSpeed || 5000} 
              onChange={(val) => onUpdate({ gearboxMaxInputSpeed: parseFloat(val) || 5000 })} 
              type="speed" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>
        </div>
      </div>
    </div>
  );
};
