
import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { motorCatalog, driveCatalog } from '../../catalogData';
import { MotorSpec } from '../../types';

const PerformanceBar = ({ 
  percent, 
  value, 
  type = 'usage' 
}: { 
  percent: number, 
  value: string | number, 
  type?: 'usage' | 'safety' | 'cost' 
}) => {
  // Logic matching the reference image:
  // Safety factors use Green/Yellow.
  // Percentages use Green for < 100%, Yellow for > 100%.
  
  const isOver = type === 'usage' ? percent > 100 : percent < 100; // Safety < 100% is bad
  const colorClass = isOver ? 'bg-yellow-400' : 'bg-green-500';
  
  // Limit bar to 100% visually
  const visualPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="flex items-center space-x-1.5 w-full">
      <div className="flex-1 h-3.5 bg-gray-100 rounded-[1px] overflow-hidden relative border border-gray-300 shadow-inner">
        <div 
          className={`h-full transition-all duration-300 ${colorClass}`} 
          style={{ width: `${visualPercent}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center px-1 text-[8px] font-bold text-gray-800 mix-blend-multiply pointer-events-none">
          {value}
        </div>
      </div>
    </div>
  );
};

const MotorSelectionTable = ({ 
  motors, 
  selectedModel, 
  onSelect, 
  // Application requirements (Mocked but structure is ready for integration)
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
    <div className="flex-1 border border-gray-400 rounded-sm bg-white overflow-hidden flex flex-col shadow-md">
      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead className="bg-[#f3f4f6] sticky top-0 z-20 border-b border-gray-400">
            <tr className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">
              <th className="p-1.5 border-r border-gray-300">Part No.</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Rated Torque (Nm)</th>
              <th className="p-1.5 border-r border-gray-300 w-32">Factor of Safety</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Req. Rated Torque (Nm)</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Peak Torque (Nm)</th>
              <th className="p-1.5 border-r border-gray-300 w-32">Factor of Safety</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Req. Peak Torque (Nm)</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Rated Speed (RPM)</th>
              <th className="p-1.5 border-r border-gray-300 w-32">% Rated Speed</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Req. Rated Speed (RPM)</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Peak Speed (RPM)</th>
              <th className="p-1.5 border-r border-gray-300 w-32">% Peak Speed</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Req. Peak Speed (RPM)</th>
              <th className="p-1.5 border-r border-gray-300 text-center">Allowable Inertia Ratio</th>
              <th className="p-1.5 border-r border-gray-300 w-32">% of Allow. Iner. Ratio</th>
              <th className="p-1.5 border-r border-gray-300 text-center">App. Inertia Ratio</th>
              <th className="p-1.5 w-32">Cost Factor</th>
            </tr>
          </thead>
          <tbody className="text-[10px] divide-y divide-gray-200">
            {motors.map((motor) => {
              const isSelected = motor.model === selectedModel;
              
              // Calculations matching the 17 columns
              const ratedSafety = motor.ratedTorque / req.ratedTorque;
              const peakSafety = motor.peakTorque / req.peakTorque;
              const ratedSpeedUsage = (req.ratedSpeed / motor.ratedSpeed) * 100;
              const peakSpeedUsage = (req.peakSpeed / motor.peakSpeed) * 100;
              const inertiaUsage = (req.appInertiaRatio / motor.allowableInertiaRatio) * 100;

              const isViable = ratedSafety >= 1 && peakSafety >= 1 && ratedSpeedUsage <= 100 && peakSpeedUsage <= 100 && inertiaUsage <= 100;

              return (
                <tr 
                  key={motor.model} 
                  onClick={() => onSelect(motor)}
                  className={`cursor-pointer transition-colors hover:bg-win-hover ${isSelected ? 'bg-win-select' : ''}`}
                >
                  <td className="p-1.5 border-r border-gray-200 font-bold text-win-blue whitespace-nowrap">{motor.model}</td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono">{motor.ratedTorque.toFixed(2)}</td>
                  <td className="p-1.5 border-r border-gray-200">
                    <PerformanceBar type="safety" percent={ratedSafety * 50} value={ratedSafety.toFixed(2)} />
                  </td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono text-gray-500">{req.ratedTorque.toFixed(2)}</td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono">{motor.peakTorque.toFixed(1)}</td>
                  <td className="p-1.5 border-r border-gray-200">
                    <PerformanceBar type="safety" percent={peakSafety * 25} value={peakSafety.toFixed(2)} />
                  </td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono text-gray-500">{req.peakTorque.toFixed(1)}</td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono">{motor.ratedSpeed}</td>
                  <td className="p-1.5 border-r border-gray-200">
                    <PerformanceBar type="usage" percent={ratedSpeedUsage} value={`${ratedSpeedUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono text-gray-500">{req.ratedSpeed}</td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono">{motor.peakSpeed}</td>
                  <td className="p-1.5 border-r border-gray-200">
                    <PerformanceBar type="usage" percent={peakSpeedUsage} value={`${peakSpeedUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono text-gray-500">{req.peakSpeed}</td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono">{motor.allowableInertiaRatio}</td>
                  <td className="p-1.5 border-r border-gray-200">
                    <PerformanceBar type="usage" percent={inertiaUsage} value={`${inertiaUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1.5 border-r border-gray-200 text-center font-mono text-gray-500">{req.appInertiaRatio.toFixed(2)}</td>
                  <td className="p-1.5">
                    <PerformanceBar type="cost" percent={motor.costIndex * 40} value={motor.costIndex.toFixed(2)} />
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
      {/* Filtering Toolbar */}
      <div className="flex items-center justify-between mb-2 bg-[#f8f9fa] p-1.5 border border-gray-400 rounded-sm shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Filter size={13} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-700 uppercase">Vendor:</span>
            <Select 
              value={vendorFilter} 
              options={motorVendors} 
              onChange={(e) => setVendorFilter(e.target.value)} 
              className="w-44 !h-6"
            />
          </div>
          <div className="relative">
             <Search size={13} className="absolute left-2 top-1.5 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search by part number..."
               className="pl-8 pr-2 py-1 text-xs border border-gray-300 rounded-sm focus:border-blue-500 outline-none w-72 h-6"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-[10px] font-bold text-gray-600 rounded-sm shadow-sm">
                <ExternalLink size={12}/> <span>Open PDF Spec</span>
            </button>
        </div>
      </div>

      <MotorSelectionTable 
        motors={filteredMotors} 
        selectedModel={params.motorModel} 
        onSelect={handleSelectMotor}
      />

      {/* Selected Component Status Bar */}
      <div className="mt-3 p-2 bg-[#e8f0f8] border border-blue-300 grid grid-cols-5 gap-4 rounded-sm shadow-sm shrink-0">
          <div className="flex flex-col">
             <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tight">Active Component</span>
             <span className="text-xs font-bold text-gray-900 truncate">{params.motorModel || 'N/A'}</span>
          </div>
          <div className="flex flex-col border-l border-blue-200 pl-3">
             <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tight">Rated Torque</span>
             <span className="text-xs font-mono font-bold">{(params.ratedTorque || 0).toFixed(2)} Nm</span>
          </div>
          <div className="flex flex-col border-l border-blue-200 pl-3">
             <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tight">Peak Torque</span>
             <span className="text-xs font-mono font-bold">{(params.peakTorque || 0).toFixed(1)} Nm</span>
          </div>
          <div className="flex flex-col border-l border-blue-200 pl-3">
             <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tight">Rated Speed</span>
             <span className="text-xs font-mono font-bold">{(params.ratedSpeed || 0)} RPM</span>
          </div>
          <div className="flex flex-col border-l border-blue-200 pl-3">
             <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tight">Inertia Matching</span>
             <span className="text-xs font-mono font-bold">{(params.allowableInertiaRatio || 0)} : 1 (Max)</span>
          </div>
      </div>
    </div>
  );
};
