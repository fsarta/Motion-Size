import React from 'react';
import { UnitInput, InputGroup, Select } from '../Common';
import { gearboxCatalog } from '../../catalogData';

export const GearboxForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const uniqueVendors = Array.from(new Set(gearboxCatalog.map(g => g.vendor)));
  const availableModels = gearboxCatalog.filter(g => g.vendor === params.gearboxVendor);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVendor = e.target.value;
    const firstModel = gearboxCatalog.find(g => g.vendor === newVendor);
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
    const specs = gearboxCatalog.find(g => g.model === newModel);
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

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <InputGroup label="Vendor">
            <Select value={params.gearboxVendor} options={uniqueVendors} onChange={handleVendorChange} />
          </InputGroup>
          <InputGroup label="Model">
             <Select value={params.gearboxModel} options={availableModels.map(m => m.model)} onChange={handleModelChange} />
          </InputGroup>
          <InputGroup label="Ratio (i)">
            <UnitInput value={params.gearboxRatio} onChange={()=>{}} type="ratio" readOnly />
          </InputGroup>
          <InputGroup label="Efficiency">
            <UnitInput value={params.gearboxEfficiency} onChange={()=>{}} type="efficiency" readOnly />
          </InputGroup>
        </div>
        <div>
          <InputGroup label="Inertia">
            <UnitInput value={params.gearboxInertia} onChange={()=>{}} type="inertia" readOnly />
          </InputGroup>
          <InputGroup label="Backlash">
            <UnitInput value={params.gearboxBacklash} onChange={()=>{}} type="angle" readOnly />
          </InputGroup>
          <InputGroup label="Max Input Speed">
            <UnitInput value={params.gearboxMaxInputSpeed} onChange={()=>{}} type="speed" readOnly />
          </InputGroup>
        </div>
      </div>
    </div>
  );
};