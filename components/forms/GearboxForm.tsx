import React from 'react';
import { UnitInput, InputGroup, Select } from '../Common';
import { gearboxCatalog } from '../../catalogData';

export const GearboxForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
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