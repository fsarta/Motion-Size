
import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { motorCatalog, driveCatalog } from '../../catalogData';
import { MotorSpec } from '../../types';

const PerformanceBar = ({ percent, label }: { percent: number, label: string | number }) => {
  const isOver = percent > 100;
  const colorClass = isOver ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-green-500';
  
  return (
    <div className="flex items-center space-x-2 w-full min-w-[120px]">
      <div className="flex-1 h-4 bg-gray-200 rounded-sm overflow-hidden relative border border-gray-300">
        <div 
          className={`h-full transition-all duration-500 ${colorClass}`} 
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-800 mix-blend-difference">
          {label}
        </div>
      </div>
      <span className={`text-[10px] font-bold w-8 text-right ${isOver ? 'text-red-600' : 'text-gray-600'}`}>
        {percent.toFixed(0)}%
      </span>
    </div>
  );
};

const MotorSelectionTable = ({ 
  motors, 
  selectedModel, 
  onSelect, 
  requiredTorque = 7.5, // Mock value, in real app this comes from calculations
  requiredPeakTorque = 10.5,
  requiredSpeed = 2200,
  requiredInertia = 5.0
}: { 
  motors: MotorSpec[], 
  selectedModel: string, 
  onSelect: (m: MotorSpec) => void,
  requiredTorque?: number,
  requiredPeakTorque?: number,
  requiredSpeed?: number,
  requiredInertia?: number
}) => {
  return (
    <div className="flex-1 border border-gray-300 rounded-sm bg-white overflow-hidden flex flex-col shadow-inner">
      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
            <tr className="text-[10px] text-gray-500 uppercase font-bold border-b border-gray-300">
              <th className="p-2 border-r border-gray-200">Part No.</th>
              <th className="p-2 border-r border-gray-200 text-center">Rated Torque (Nm)</th>
              <th className="p-2 border-r border-gray-200">Factor of Safety (R)</th>
              <th className="p-2 border-r border-gray-200 text-center">Peak Torque (Nm)</th>
              <th className="p-2 border-r border-gray-200">Factor of Safety (P)</th>
              <th className="p-2 border-r border-gray-200 text-center">Rated Speed (RPM)</th>
              <th className="p-2 border-r border-gray-200">% Rated Speed</th>
              <th className="p-2 border-r border-gray-200">Inertia Ratio</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody className="text-[11px] divide-y divide-gray-100">
            {motors.map((motor) => {
              const isSelected = motor.model === selectedModel;
              const torqueSafety = motor.ratedTorque / requiredTorque;
              const peakTorqueSafety = (motor.ratedTorque * 3) / requiredPeakTorque; // Assumed 3x peak
              const speedUsage = (requiredSpeed / motor.ratedSpeed) * 100;
              const inertiaRatio = requiredInertia / motor.inertia;
              const inertiaUsage = (inertiaRatio / 10) * 100; // Assuming 10 is max allowable

              const isViable = torqueSafety >= 1 && speedUsage <= 100;

              return (
                <tr 
                  key={motor.model} 
                  onClick={() => onSelect(motor)}
                  className={`cursor-pointer transition-colors group ${isSelected ? 'bg-win-select' : 'hover:bg-win-hover'}`}
                >
                  <td className="p-2 border-r border-gray-100 font-bold text-win-blue">{motor.model}</td>
                  <td className="p-2 border-r border-gray-100 text-center font-mono">{motor.ratedTorque.toFixed(2)}</td>
                  <td className="p-2 border-r border-gray-100">
                    <PerformanceBar percent={(1/torqueSafety)*100} label={torqueSafety.toFixed(2)} />
                  </td>
                  <td className="p-2 border-r border-gray-100 text-center font-mono">{(motor.ratedTorque * 3).toFixed(2)}</td>
                  <td className="p-2 border-r border-gray-100">
                    <PerformanceBar percent={(1/peakTorqueSafety)*100} label={peakTorqueSafety.toFixed(2)} />
                  </td>
                  <td className="p-2 border-r border-gray-100 text-center font-mono">{motor.ratedSpeed}</td>
                  <td className="p-2 border-r border-gray-100">
                    <PerformanceBar percent={speedUsage} label={`${requiredSpeed} RPM`} />
                  </td>
                  <td className="p-2 border-r border-gray-100 text-center font-mono">{inertiaRatio.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    {isViable ? 
                      <CheckCircle2 size={16} className="text-green-600 mx-auto" /> : 
                      // Wrap the icon in a span to use the native title attribute correctly for tooltips
                      <span title="Motor parameters outside requirements">
                        <AlertTriangle size={16} className="text-red-500 mx-auto" />
                      </span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const MotorDriveForm = ({ 
  params, 
  onUpdate, 
  onlyMotor, 
  onlyDrive 
}: { 
  params: any, 
  onUpdate: (p: any) => void, 
  onlyMotor?: boolean, 
  onlyDrive?: boolean 
}) => {
  const [vendorFilter, setVendorFilter] = useState<string>('All Vendors');
  const [searchTerm, setSearchTerm] = useState('');
  
  const motorVendors = ['All Vendors', ...Array.from(new Set(motorCatalog.map(m => m.vendor)))];
  const driveVendors = Array.from(new Set(driveCatalog.map(d => d.vendor)));
  
  const filteredMotors = useMemo(() => {
    return motorCatalog.filter(m => {
      const matchVendor = vendorFilter === 'All Vendors' || m.vendor === vendorFilter;
      const matchSearch = m.model.toLowerCase().includes(searchTerm.toLowerCase());
      return matchVendor && matchSearch;
    });
  }, [vendorFilter, searchTerm]);

  const availableDrives = driveCatalog.filter(d => d.vendor === (params.driveVendor || params.motorVendor));

  const handleSelectMotor = (motor: MotorSpec) => {
    onUpdate({
      motorVendor: motor.vendor,
      motorModel: motor.model,
      ratedSpeed: motor.ratedSpeed,
      ratedTorque: motor.ratedTorque,
      ratedPower: motor.ratedPower,
      ratedCurrent: motor.ratedCurrent,
      motorEfficiency: motor.efficiency,
      powerFactor: motor.powerFactor,
      motorInertia: motor.inertia
    });
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

  // View for only Drive
  if (onlyDrive) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Drive Specifications" />
        <div className="grid grid-cols-2 gap-x-12">
            <div className="space-y-1">
                <InputGroup label="Vendor"><Select value={params.driveVendor || params.motorVendor} options={driveVendors} onChange={handleDriveVendorChange} /></InputGroup>
                <InputGroup label="Model"><Select value={params.driveModel} options={availableDrives.map(d => d.model)} onChange={handleDriveModelChange} /></InputGroup>
            </div>
            <div className="space-y-1">
                <InputGroup label="Supply Voltage"><UnitInput value={params.driveSupplyVoltage} onChange={()=>{}} type="voltage" readOnly /></InputGroup>
                <InputGroup label="Max Current"><UnitInput value={params.driveMaxCurrent} onChange={()=>{}} type="current" readOnly /></InputGroup>
                <InputGroup label="PWM Freq."><UnitInput value={params.pwmFrequency} onChange={()=>{}} type="frequency" readOnly /></InputGroup>
            </div>
        </div>
      </div>
    );
  }

  // View for Motor (Grid Selection)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 border border-gray-300 rounded-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={14} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-600">Filter By:</span>
            <Select 
              value={vendorFilter} 
              options={motorVendors} 
              onChange={(e) => setVendorFilter(e.target.value)} 
              className="w-40"
            />
          </div>
          <div className="relative">
             <Search size={14} className="absolute left-2 top-1.5 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search model..."
               className="pl-8 pr-2 py-1 text-xs border border-gray-300 rounded-sm focus:border-blue-500 outline-none w-64"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase">
           <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-sm mr-1"></div> Safe</div>
           <div className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-sm mr-1"></div> Warning</div>
           <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div> Danger</div>
        </div>
      </div>

      <MotorSelectionTable 
        motors={filteredMotors} 
        selectedModel={params.motorModel} 
        onSelect={handleSelectMotor}
      />

      <div className="mt-4 p-3 bg-win-bg border border-win-border grid grid-cols-4 gap-4 rounded-sm shadow-sm shrink-0">
          <div className="flex flex-col">
             <span className="text-[10px] text-gray-500 font-bold uppercase">Current Selection</span>
             <span className="text-sm font-bold text-win-blue">{params.motorModel || 'None'}</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-4">
             <span className="text-[10px] text-gray-500 font-bold uppercase">Rated Torque</span>
             <span className="text-xs font-mono font-bold">{(params.ratedTorque || 0).toFixed(2)} Nm</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-4">
             <span className="text-[10px] text-gray-500 font-bold uppercase">Rated Speed</span>
             <span className="text-xs font-mono font-bold">{(params.ratedSpeed || 0)} RPM</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-4">
             <span className="text-[10px] text-gray-500 font-bold uppercase">Motor Inertia</span>
             <span className="text-xs font-mono font-bold">{(params.motorInertia || 0).toFixed(2)} kg·cm²</span>
          </div>
      </div>
    </div>
  );
};
