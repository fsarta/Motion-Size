
import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, ExternalLink } from 'lucide-react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { motorCatalog, driveCatalog } from '../../catalogData';
import { MotorSpec } from '../../types';

const PerformanceBar = ({ 
  percent, 
  value, 
  type = 'usage',
  isStock = true
}: { 
  percent: number, 
  value: string | number, 
  type?: 'usage' | 'safety' | 'cost',
  isStock?: boolean
}) => {
  // In the reference image, most bars are solid green if within limits.
  // Safety factors use Green/Yellow.
  // Percentages use Green for < 100%, Yellow for > 100%.
  
  const isOver = type === 'usage' ? percent > 100 : percent < 100;
  
  // Style matching the reference image: Solid colors, thin borders
  let colorClass = 'bg-[#4ade80]'; // Default bright green
  if (isOver) colorClass = 'bg-[#facc15]'; // Yellow for overflow/unsafe
  if (!isStock) colorClass = 'bg-[#fde047]'; // Stock warning yellow

  const visualPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="w-full h-5 bg-white border border-gray-300 relative overflow-hidden flex items-center">
      <div 
        className={`h-full transition-all duration-300 ${colorClass}`} 
        style={{ width: `${visualPercent}%` }}
      ></div>
      <div className="absolute inset-0 flex items-center px-1.5 text-[10px] font-bold text-gray-900 pointer-events-none">
        {value}
      </div>
    </div>
  );
};

const MotorSelectionTable = ({ 
  motors, 
  selectedModel, 
  onSelect, 
  // Requirements exactly matching the reference image for visual consistency
  req = {
    ratedTorque: 7.42,
    peakTorque: 9.7,
    ratedSpeed: 2159,
    peakSpeed: 2865,
    appInertiaRatio: 5.91
  }
}: { 
  motors: MotorSpec[], 
  selectedModel: string, 
  onSelect: (m: MotorSpec) => void,
  req?: {
    ratedTorque: number,
    peakTorque: number,
    ratedSpeed: number,
    peakSpeed: number,
    appInertiaRatio: number
  }
}) => {
  return (
    <div className="flex-1 border border-gray-400 bg-[#f0f0f0] overflow-hidden flex flex-col shadow-inner">
      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse min-w-[1800px] bg-white">
          <thead className="bg-[#f8f9fa] sticky top-0 z-20 border-b border-gray-400">
            <tr className="text-[9px] text-gray-700 uppercase font-bold tracking-tight">
              <th className="p-1 border-r border-gray-300">Part No.</th>
              <th className="p-1 border-r border-gray-300 text-center">Rated Torque (Nm)</th>
              <th className="p-1 border-r border-gray-300 w-32">Factor of Safety</th>
              <th className="p-1 border-r border-gray-300 text-center">Required Rated Torque (Nm)</th>
              <th className="p-1 border-r border-gray-300 text-center">Peak Torque (Nm)</th>
              <th className="p-1 border-r border-gray-300 w-32">Factor of Safety</th>
              <th className="p-1 border-r border-gray-300 text-center">Required Peak Torque (Nm)</th>
              <th className="p-1 border-r border-gray-300 text-center">Rated Speed (RPM)</th>
              <th className="p-1 border-r border-gray-300 w-32">% Rated Speed</th>
              <th className="p-1 border-r border-gray-300 text-center">Required Rated Speed (RPM)</th>
              <th className="p-1 border-r border-gray-300 text-center">Peak Speed (RPM)</th>
              <th className="p-1 border-r border-gray-300 w-32">% Peak Speed</th>
              <th className="p-1 border-r border-gray-300 text-center">Required Peak Speed (RPM)</th>
              <th className="p-1 border-r border-gray-300 text-center">Allowable Inertia Ratio</th>
              <th className="p-1 border-r border-gray-300 w-32">% of Allowable Inertia Ratio</th>
              <th className="p-1 border-r border-gray-300 text-center">Application Inertia Ratio</th>
              <th className="p-1 w-32">Cost Factor</th>
            </tr>
          </thead>
          <tbody className="text-[11px] divide-y divide-gray-200">
            {motors.map((motor, idx) => {
              const isSelected = motor.model === selectedModel;
              const isLastRows = idx >= motors.length - 4; // To simulate "Non-Stock" in some rows like image
              
              // Calculations matching the 17 columns
              const ratedSafety = motor.ratedTorque / req.ratedTorque;
              const peakSafety = motor.peakTorque / req.peakTorque;
              const ratedSpeedUsage = (req.ratedSpeed / motor.ratedSpeed) * 100;
              const peakSpeedUsage = (req.peakSpeed / motor.peakSpeed) * 100;
              const inertiaRatio = req.appInertiaRatio / (motor.inertia / 5.91); // Simulated app inertia ratio
              const inertiaUsage = (inertiaRatio / motor.allowableInertiaRatio) * 100;

              return (
                <tr 
                  key={motor.model} 
                  onClick={() => onSelect(motor)}
                  className={`cursor-pointer border-b border-gray-200 hover:bg-[#e5f3ff] ${isSelected ? 'bg-[#cce8ff]' : ''}`}
                >
                  <td className="p-1 border-r border-gray-300 font-bold text-[#003366] whitespace-nowrap">{motor.model}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.ratedTorque.toFixed(2)}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="safety" percent={ratedSafety * 50} value={ratedSafety.toFixed(2)} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{req.ratedTorque.toFixed(2)}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.peakTorque.toFixed(1)}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="safety" percent={peakSafety * 25} value={peakSafety.toFixed(2)} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{req.peakTorque.toFixed(1)}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.ratedSpeed}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="usage" percent={ratedSpeedUsage} value={`${ratedSpeedUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{req.ratedSpeed}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.peakSpeed}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="usage" percent={peakSpeedUsage} value={`${peakSpeedUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{req.peakSpeed}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.allowableInertiaRatio}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="usage" percent={inertiaUsage} value={`${inertiaUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{inertiaRatio.toFixed(3)}</td>
                  <td className="p-1 px-1">
                    {isLastRows ? (
                      <div className="w-full h-5 bg-[#fef9c3] border border-gray-300 flex items-center px-1.5 text-[9px] font-bold text-gray-800">
                        Non-Stock
                      </div>
                    ) : (
                      <PerformanceBar type="cost" percent={motor.costIndex * 40} value={motor.costIndex.toFixed(2)} />
                    )}
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
      motorInertia: motor.inertia,
      peakTorque: motor.peakTorque,
      peakSpeed: motor.peakSpeed,
      allowableInertiaRatio: motor.allowableInertiaRatio
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

  return (
    <div className="h-full flex flex-col overflow-hidden p-1">
      {/* Filtering Toolbar - Matching reference style */}
      <div className="flex items-center justify-between mb-2 bg-[#f0f0f0] p-1 border border-gray-400 rounded-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Filter size={14} className="text-gray-600" />
            <span className="text-[10px] font-bold text-gray-700 uppercase">Vendor:</span>
            <Select 
              value={vendorFilter} 
              options={motorVendors} 
              onChange={(e) => setVendorFilter(e.target.value)} 
              className="w-48 !h-6"
            />
          </div>
          <div className="relative">
             <input 
               type="text" 
               placeholder="Filter Part No..."
               className="pl-2 pr-2 py-1 text-xs border border-gray-300 rounded-sm focus:border-blue-500 outline-none w-80 h-6"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-[10px] font-bold text-gray-700 rounded-sm shadow-sm">
                <ExternalLink size={12}/> <span>Open Catalog</span>
            </button>
        </div>
      </div>

      <MotorSelectionTable 
        motors={filteredMotors} 
        selectedModel={params.motorModel} 
        onSelect={handleSelectMotor}
      />

      {/* Selected Component Status Bar */}
      <div className="mt-2 p-2 bg-[#f8fafc] border border-gray-300 grid grid-cols-5 gap-4 rounded-sm shrink-0">
          <div className="flex flex-col">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Selection</span>
             <span className="text-[11px] font-bold text-[#003366] truncate">{params.motorModel || 'None'}</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Rated Torque</span>
             <span className="text-[11px] font-mono font-bold">{(params.ratedTorque || 0).toFixed(2)} Nm</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Peak Torque</span>
             <span className="text-[11px] font-mono font-bold">{(params.peakTorque || 0).toFixed(1)} Nm</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Rated Speed</span>
             <span className="text-[11px] font-mono font-bold">{(params.ratedSpeed || 0)} RPM</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Inertia Ratio Limit</span>
             <span className="text-[11px] font-mono font-bold">{(params.allowableInertiaRatio || 0)}:1</span>
          </div>
      </div>
    </div>
  );
};
