
import React from 'react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { motorCatalog, driveCatalog } from '../../catalogData';

export const MotorDriveForm = ({ params, onUpdate, onlyMotor, onlyDrive }: { params: any, onUpdate: (p: any) => void, onlyMotor?: boolean, onlyDrive?: boolean }) => {
  const uniqueMotorVendors = Array.from(new Set(motorCatalog.map(m => m.vendor)));
  const uniqueDriveVendors = Array.from(new Set(driveCatalog.map(d => d.vendor)));
  
  const availableMotors = motorCatalog.filter(m => m.vendor === params.motorVendor);
  const availableDrives = driveCatalog.filter(d => d.vendor === (params.driveVendor || params.motorVendor));

  const handleMotorVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVendor = e.target.value;
    const firstModel = motorCatalog.find(m => m.vendor === newVendor);
    if (firstModel) {
      onUpdate({
        motorVendor: newVendor,
        motorModel: firstModel.model,
        ratedSpeed: firstModel.ratedSpeed,
        ratedTorque: firstModel.ratedTorque,
        ratedPower: firstModel.ratedPower,
        ratedCurrent: firstModel.ratedCurrent,
        motorEfficiency: firstModel.efficiency,
        powerFactor: firstModel.powerFactor,
        motorInertia: firstModel.inertia
      });
    }
  };

  const handleMotorModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const specs = motorCatalog.find(m => m.model === e.target.value);
    if (specs) {
      onUpdate({
        motorModel: e.target.value,
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
      const firstModel = driveCatalog.find(d => d.vendor === e.target.value);
      if (firstModel) {
          onUpdate({
              driveVendor: e.target.value,
              driveModel: firstModel.model,
              driveSupplyVoltage: firstModel.supplyVoltage,
              driveMaxCurrent: firstModel.maxCurrent,
              pwmFrequency: firstModel.pwmFrequency
          });
      }
  }

  const handleDriveModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const specs = driveCatalog.find(d => d.model === e.target.value);
      if (specs) {
          onUpdate({
              driveModel: e.target.value,
              driveSupplyVoltage: specs.supplyVoltage,
              driveMaxCurrent: specs.maxCurrent,
              pwmFrequency: specs.pwmFrequency
          });
      }
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-8">
        {(onlyMotor || (!onlyMotor && !onlyDrive)) && (
          <div>
            <SectionHeader title="Motor Specifications" />
            <InputGroup label="Vendor"><Select value={params.motorVendor} options={uniqueMotorVendors} onChange={handleMotorVendorChange} /></InputGroup>
            <InputGroup label="Model"><Select value={params.motorModel} options={availableMotors.map(m => m.model)} onChange={handleMotorModelChange} /></InputGroup>
            <InputGroup label="Rated Speed"><UnitInput value={params.ratedSpeed} onChange={()=>{}} type="speed" readOnly /></InputGroup>
            <InputGroup label="Rated Torque"><UnitInput value={params.ratedTorque} onChange={()=>{}} type="torque" readOnly /></InputGroup>
            <InputGroup label="Inertia"><UnitInput value={params.motorInertia} onChange={()=>{}} type="inertia" readOnly /></InputGroup>
            <InputGroup label="Efficiency"><UnitInput value={params.motorEfficiency} onChange={()=>{}} type="efficiency" readOnly /></InputGroup>
          </div>
        )}
        {(onlyDrive || (!onlyMotor && !onlyDrive)) && (
          <div>
            <SectionHeader title="Drive Specifications" />
            <InputGroup label="Vendor"><Select value={params.driveVendor || params.motorVendor} options={uniqueDriveVendors} onChange={handleDriveVendorChange} /></InputGroup>
            <InputGroup label="Model"><Select value={params.driveModel} options={availableDrives.map(d => d.model)} onChange={handleDriveModelChange} /></InputGroup>
            <InputGroup label="Supply Voltage"><UnitInput value={params.driveSupplyVoltage} onChange={()=>{}} type="voltage" readOnly /></InputGroup>
            <InputGroup label="Max Current"><UnitInput value={params.driveMaxCurrent} onChange={()=>{}} type="current" readOnly /></InputGroup>
            <InputGroup label="PWM Freq."><UnitInput value={params.pwmFrequency} onChange={()=>{}} type="frequency" readOnly /></InputGroup>
          </div>
        )}
      </div>
    </div>
  );
};
