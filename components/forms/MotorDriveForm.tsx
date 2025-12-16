import React from 'react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { motorCatalog, driveCatalog } from '../../catalogData';

export const MotorDriveForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
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