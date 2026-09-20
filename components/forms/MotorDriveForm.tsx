import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, ExternalLink, Activity, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { getMotorCatalog, getDriveCatalog, addCustomMotor, addCustomDrive } from '../../catalogData';
import { MotorSpec, DriveSpec, SizingMetrics } from '../../types';
import { calculateAxisDynamics, calculateThermalDerating } from '../../utils/physics';

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
  const isOver = type === 'usage' ? percent > 100 : percent < 100;
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

/* --- Torque-Speed (T-n) Curve Component --- */
const TorqueSpeedCurve = ({ 
  motor, 
  req, 
  derating = 1.0 
}: { 
  motor?: MotorSpec, 
  req: { ratedTorque: number; peakTorque: number; ratedSpeed: number; peakSpeed: number },
  derating?: number
}) => {
  if (!motor) return null;

  const effectiveRatedTorque = motor.ratedTorque * derating;
  const maxPlotSpeed = Math.max(motor.peakSpeed * 1.1, req.peakSpeed * 1.1, 4000);
  const maxPlotTorque = Math.max(motor.peakTorque * 1.15, req.peakTorque * 1.15, 10);

  const w = 460;
  const h = 200;
  const padL = 45;
  const padB = 30;
  const padT = 20;
  const padR = 25;

  const scaleX = (spd: number) => padL + (spd / maxPlotSpeed) * (w - padL - padR);
  const scaleY = (trq: number) => (h - padB) - (trq / maxPlotTorque) * (h - padT - padB);

  // S1 continuous profile points
  const pS1_0 = [scaleX(0), scaleY(effectiveRatedTorque)];
  const pS1_rated = [scaleX(motor.ratedSpeed), scaleY(effectiveRatedTorque)];
  // Field weakening slope to peak speed: torque decreases proportionally
  const s1EndTorque = effectiveRatedTorque * (motor.ratedSpeed / motor.peakSpeed);
  const pS1_peak = [scaleX(motor.peakSpeed), scaleY(s1EndTorque)];
  const pS1_base = [scaleX(motor.peakSpeed), scaleY(0)];
  const pS1_origin = [scaleX(0), scaleY(0)];

  const pathS1 = `M ${pS1_0[0]} ${pS1_0[1]} L ${pS1_rated[0]} ${pS1_rated[1]} L ${pS1_peak[0]} ${pS1_peak[1]} L ${pS1_base[0]} ${pS1_base[1]} L ${pS1_origin[0]} ${pS1_origin[1]} Z`;

  // S3 peak profile points
  const pS3_0 = [scaleX(0), scaleY(motor.peakTorque)];
  const pS3_rated = [scaleX(motor.ratedSpeed * 0.9), scaleY(motor.peakTorque)];
  const s3EndTorque = motor.peakTorque * (motor.ratedSpeed / motor.peakSpeed);
  const pS3_peak = [scaleX(motor.peakSpeed), scaleY(s3EndTorque)];

  const pathS3 = `M ${pS3_0[0]} ${pS3_0[1]} L ${pS3_rated[0]} ${pS3_rated[1]} L ${pS3_peak[0]} ${pS3_peak[1]} L ${pS1_peak[0]} ${pS1_peak[1]} L ${pS1_rated[0]} ${pS1_rated[1]} L ${pS1_0[0]} ${pS1_0[1]} Z`;

  // Operating points
  const rmsX = scaleX(req.ratedSpeed);
  const rmsY = scaleY(req.ratedTorque);
  const peakX = scaleX(req.peakSpeed);
  const peakY = scaleY(req.peakTorque);

  const isRmsPass = req.ratedTorque <= effectiveRatedTorque && req.ratedSpeed <= motor.ratedSpeed;
  const isPeakPass = req.peakTorque <= motor.peakTorque && req.peakSpeed <= motor.peakSpeed;

  return (
    <div className="bg-white border border-gray-300 rounded p-2 mb-2 flex items-center space-x-4 shadow-sm shrink-0">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-gray-700">
          <span className="flex items-center">
            <Activity size={14} className="mr-1 text-blue-600"/>
            Torque-Speed Characteristic Curve (T-n Curve) - {motor.model}
          </span>
          <div className="flex space-x-3 text-[10px]">
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-green-200 border border-green-600 rounded-sm mr-1"></span> S1 Continuous</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 bg-yellow-200 border border-yellow-500 rounded-sm mr-1"></span> S3 Intermittent</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span> RMS Point</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-600 mr-1"></span> Peak Point</span>
          </div>
        </div>

        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="bg-gray-50 border border-gray-200 rounded">
          {/* S3 Peak Area */}
          <path d={pathS3} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8" />
          {/* S1 Continuous Area */}
          <path d={pathS1} fill="#dcfce7" stroke="#16a34a" strokeWidth="2" opacity="0.8" />

          {/* Axes */}
          <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#64748b" strokeWidth="1.5" />
          <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#64748b" strokeWidth="1.5" />

          {/* Grid ticks */}
          <text x={padL - 6} y={scaleY(effectiveRatedTorque) + 3} textAnchor="end" fontSize="9" fill="#16a34a" fontWeight="bold">{effectiveRatedTorque.toFixed(1)}</text>
          <text x={padL - 6} y={scaleY(motor.peakTorque) + 3} textAnchor="end" fontSize="9" fill="#d97706" fontWeight="bold">{motor.peakTorque.toFixed(1)}</text>
          <text x={padL - 6} y={h - padB} textAnchor="end" fontSize="9" fill="#64748b">0</text>

          <text x={scaleX(motor.ratedSpeed)} y={h - padB + 14} textAnchor="middle" fontSize="9" fill="#16a34a" fontWeight="bold">{motor.ratedSpeed}</text>
          <text x={scaleX(motor.peakSpeed)} y={h - padB + 14} textAnchor="middle" fontSize="9" fill="#d97706" fontWeight="bold">{motor.peakSpeed}</text>

          <text x={padL} y={padT - 6} fontSize="9" fill="#475569" fontWeight="bold">Torque (Nm)</text>
          <text x={w - padR} y={h - 6} textAnchor="end" fontSize="9" fill="#475569" fontWeight="bold">Speed (RPM)</text>

          {/* RMS Operating Point */}
          <circle cx={rmsX} cy={rmsY} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
          <text x={rmsX + 6} y={rmsY - 4} fontSize="9" fill="#1d4ed8" fontWeight="bold">RMS ({req.ratedSpeed.toFixed(0)} rpm, {req.ratedTorque.toFixed(1)} Nm)</text>

          {/* Peak Operating Point */}
          <circle cx={peakX} cy={peakY} r="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
          <text x={peakX + 6} y={peakY - 4} fontSize="9" fill="#b91c1c" fontWeight="bold">Peak ({req.peakSpeed.toFixed(0)} rpm, {req.peakTorque.toFixed(1)} Nm)</text>
        </svg>
      </div>

      <div className="w-48 bg-slate-50 border border-gray-200 rounded p-2.5 flex flex-col justify-between h-[200px] text-xs">
        <div>
          <div className="font-bold text-gray-700 uppercase text-[10px] mb-2 border-b pb-1">Validation Summary</div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Continuous S1:</span>
              <span className={`font-bold flex items-center ${isRmsPass ? 'text-green-600' : 'text-red-600'}`}>
                {isRmsPass ? <CheckCircle2 size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>}
                {isRmsPass ? 'OK' : 'OVERLOAD'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Peak Torque S3:</span>
              <span className={`font-bold flex items-center ${isPeakPass ? 'text-green-600' : 'text-red-600'}`}>
                {isPeakPass ? <CheckCircle2 size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>}
                {isPeakPass ? 'OK' : 'OVERLOAD'}
              </span>
            </div>

            {derating < 1.0 && (
              <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                Thermal derating: <strong>{(derating * 100).toFixed(0)}%</strong> of catalog rating due to ambient temperature.
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-gray-400 italic">
          Points within the green zone guarantee unlimited continuous thermal operation.
        </div>
      </div>
    </div>
  );
};

const MotorSelectionTable = ({ 
  motors, 
  selectedModel, 
  onSelect,
  appInertia,
  req,
  derating = 1.0
}: { 
  motors: MotorSpec[], 
  selectedModel: string, 
  onSelect: (m: MotorSpec) => void,
  appInertia: number,
  req: {
    ratedTorque: number,
    peakTorque: number,
    ratedSpeed: number,
    peakSpeed: number
  },
  derating?: number
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
            {motors.map((motor) => {
              const isSelected = motor.model === selectedModel;
              const effectiveRatedTorque = motor.ratedTorque * derating;
              
              const ratedSafety = req.ratedTorque > 0 ? effectiveRatedTorque / req.ratedTorque : 99;
              const peakSafety = req.peakTorque > 0 ? motor.peakTorque / req.peakTorque : 99;
              const ratedSpeedUsage = motor.ratedSpeed > 0 ? (req.ratedSpeed / motor.ratedSpeed) * 100 : 0;
              const peakSpeedUsage = motor.peakSpeed > 0 ? (req.peakSpeed / motor.peakSpeed) * 100 : 0;
              const inertiaRatio = motor.inertia > 0 ? appInertia / motor.inertia : 0;
              const inertiaUsage = motor.allowableInertiaRatio > 0 ? (inertiaRatio / motor.allowableInertiaRatio) * 100 : 0;

              return (
                <tr 
                  key={motor.model} 
                  onClick={() => onSelect(motor)}
                  className={`cursor-pointer border-b border-gray-200 hover:bg-[#e5f3ff] ${isSelected ? 'bg-[#cce8ff]' : ''}`}
                >
                  <td className="p-1 border-r border-gray-300 font-bold text-[#003366] whitespace-nowrap">{motor.model}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{effectiveRatedTorque.toFixed(2)}</td>
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
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{req.ratedSpeed.toFixed(0)}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.peakSpeed}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="usage" percent={peakSpeedUsage} value={`${peakSpeedUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{req.peakSpeed.toFixed(0)}</td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono">{motor.allowableInertiaRatio}</td>
                  <td className="p-1 border-r border-gray-300 px-1">
                    <PerformanceBar type="usage" percent={inertiaUsage} value={`${inertiaUsage.toFixed(0)}%`} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center font-mono text-gray-500">{inertiaRatio.toFixed(2)}</td>
                  <td className="p-1 px-1">
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
  onlyDrive,
  sizingMetrics
}: { 
  params: any, 
  onUpdate: (p: any) => void, 
  onlyMotor?: boolean, 
  onlyDrive?: boolean,
  sizingMetrics?: SizingMetrics
}) => {
  const [vendorFilter, setVendorFilter] = useState<string>('All Vendors');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTnCurve, setShowTnCurve] = useState(true);
  const [isAddMotorOpen, setIsAddMotorOpen] = useState(false);
  const [isAddDriveOpen, setIsAddDriveOpen] = useState(false);

  // New Custom Motor state
  const [newMotor, setNewMotor] = useState<MotorSpec>({
    vendor: 'Custom',
    model: 'MTR-Custom-1',
    ratedSpeed: 3000,
    peakSpeed: 6000,
    ratedTorque: 5.0,
    peakTorque: 15.0,
    ratedPower: 1.5,
    ratedCurrent: 3.5,
    efficiency: 92.0,
    powerFactor: 0.93,
    inertia: 2.5,
    allowableInertiaRatio: 10,
    costIndex: 1.0
  });

  const [newDrive, setNewDrive] = useState<DriveSpec>({
    vendor: 'Custom',
    model: 'DRV-Custom-1',
    supplyVoltage: 400,
    maxCurrent: 10.0,
    pwmFrequency: 8
  });

  const motorCatalog = useMemo(() => getMotorCatalog(), [isAddMotorOpen]);
  const driveCatalog = useMemo(() => getDriveCatalog(), [isAddDriveOpen]);

  const motorVendors = ['All Vendors', ...Array.from(new Set(motorCatalog.map(m => m.vendor)))];
  const driveVendors = Array.from(new Set(driveCatalog.map(d => d.vendor)));
  
  // Accurate dynamics computation including translating load mass reflection
  const dynamics = useMemo(() => calculateAxisDynamics(params), [params]);
  const appInertia = dynamics.reflectedLoadInertiaKgCm2;
  const thermalDerating = calculateThermalDerating(parseFloat(String(params.ambientTemp || 40)));

  const req = useMemo(() => ({
    ratedTorque: sizingMetrics?.rmsTorque ?? 7.42,
    peakTorque: sizingMetrics?.peakTorque ?? 9.7,
    ratedSpeed: sizingMetrics?.rmsSpeed ?? 2159,
    peakSpeed: sizingMetrics?.peakSpeed ?? 2865
  }), [sizingMetrics]);

  const filteredMotors = useMemo(() => {
    return motorCatalog.filter(m => {
      const matchVendor = vendorFilter === 'All Vendors' || m.vendor === vendorFilter;
      const matchSearch = m.model.toLowerCase().includes(searchTerm.toLowerCase());
      return matchVendor && matchSearch;
    });
  }, [vendorFilter, searchTerm, motorCatalog]);

  const selectedMotor = useMemo(() => {
    return motorCatalog.find(m => m.model === params.motorModel);
  }, [motorCatalog, params.motorModel]);

  const availableDrives = useMemo(() => {
    let drives = driveCatalog.filter(d => d.vendor === (params.driveVendor || params.motorVendor));
    if (selectedMotor) {
      drives = drives.filter(d => d.maxCurrent >= selectedMotor.ratedCurrent);
    }
    return drives.length > 0 ? drives : driveCatalog;
  }, [driveCatalog, params.driveVendor, params.motorVendor, selectedMotor]);

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
  };

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
  };

  const handleSaveCustomMotor = () => {
    addCustomMotor(newMotor);
    handleSelectMotor(newMotor);
    setIsAddMotorOpen(false);
  };

  const handleSaveCustomDrive = () => {
    addCustomDrive(newDrive);
    onUpdate({
      driveVendor: newDrive.vendor,
      driveModel: newDrive.model,
      driveSupplyVoltage: newDrive.supplyVoltage,
      driveMaxCurrent: newDrive.maxCurrent,
      pwmFrequency: newDrive.pwmFrequency
    });
    setIsAddDriveOpen(false);
  };

  if (onlyDrive) {
    const isDriveCompatible = selectedMotor && params.driveModel && driveCatalog.find(d => d.model === params.driveModel)?.maxCurrent >= selectedMotor.ratedCurrent;
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SectionHeader title="Drive Specifications & Inverter Sizing" />
          <button 
            onClick={() => setIsAddDriveOpen(true)}
            className="flex items-center px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded shadow-sm"
          >
            <Plus size={12} className="mr-1 text-green-600"/> Add Custom Drive
          </button>
        </div>

        {selectedMotor && availableDrives.length === 0 && (
          <div className="text-red-500 text-sm flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            No compatible drives found for the selected motor current ({selectedMotor.ratedCurrent} Arms).
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-12">
            <div className="space-y-2">
                <InputGroup label="Vendor"><Select value={params.driveVendor || params.motorVendor} options={driveVendors} onChange={handleDriveVendorChange} /></InputGroup>
                <InputGroup label="Model">
                    <div className="flex items-center space-x-2 w-full">
                        <Select value={params.driveModel} options={availableDrives.map(d => d.model)} onChange={handleDriveModelChange} className="flex-1" />
                        {isDriveCompatible && <span className="text-green-600 text-xs font-semibold shrink-0">✓ Compatible</span>}
                    </div>
                </InputGroup>
            </div>
            <div className="space-y-2">
                <InputGroup label="Supply Voltage"><UnitInput value={params.driveSupplyVoltage} onChange={()=>{}} type="voltage" readOnly /></InputGroup>
                <InputGroup label="Max Current"><UnitInput value={params.driveMaxCurrent} onChange={()=>{}} type="current" readOnly /></InputGroup>
                <InputGroup label="PWM Freq."><UnitInput value={params.pwmFrequency} onChange={()=>{}} type="frequency" readOnly /></InputGroup>
            </div>
        </div>

        {/* Modal: Add Custom Drive */}
        {isAddDriveOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded p-4 w-96 shadow-2xl border border-gray-300 text-xs space-y-3">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-1">Add Custom Drive</h3>
              <div><label className="text-[10px] font-bold text-gray-500">Model Name</label><input type="text" className="w-full border p-1 rounded" value={newDrive.model} onChange={e => setNewDrive({...newDrive, model: e.target.value})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Supply Voltage (V)</label><input type="number" className="w-full border p-1 rounded" value={newDrive.supplyVoltage} onChange={e => setNewDrive({...newDrive, supplyVoltage: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Max Current (A)</label><input type="number" className="w-full border p-1 rounded" value={newDrive.maxCurrent} onChange={e => setNewDrive({...newDrive, maxCurrent: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">PWM Frequency (kHz)</label><input type="number" className="w-full border p-1 rounded" value={newDrive.pwmFrequency} onChange={e => setNewDrive({...newDrive, pwmFrequency: Number(e.target.value)})}/></div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button onClick={() => setIsAddDriveOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
                <button onClick={handleSaveCustomDrive} className="px-3 py-1 bg-blue-600 text-white rounded font-bold">Add to Catalog</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden p-1">
      {/* Filtering Toolbar */}
      <div className="flex items-center justify-between mb-2 bg-[#f0f0f0] p-1 border border-gray-400 rounded-sm shrink-0">
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
          <button 
            onClick={() => setShowTnCurve(!showTnCurve)} 
            className={`flex items-center space-x-1 px-2 py-1 border text-[10px] font-bold rounded-sm shadow-sm ${showTnCurve ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Activity size={12}/> <span>{showTnCurve ? 'Hide T-n Curve' : 'Show T-n Curve'}</span>
          </button>
          <button 
            onClick={() => setIsAddMotorOpen(true)}
            className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-[10px] font-bold text-green-700 rounded-sm shadow-sm"
          >
            <Plus size={12}/> <span>Add Motor</span>
          </button>
        </div>
      </div>

      {/* Interactive T-n Characteristic Curve */}
      {showTnCurve && selectedMotor && (
        <TorqueSpeedCurve motor={selectedMotor} req={req} derating={thermalDerating} />
      )}

      {/* Motor Selection Table */}
      <MotorSelectionTable 
        motors={filteredMotors} 
        selectedModel={params.motorModel} 
        onSelect={handleSelectMotor}
        appInertia={appInertia}
        req={req}
        derating={thermalDerating}
      />

      {/* Selected Component Status Bar */}
      <div className="mt-2 p-2 bg-[#f8fafc] border border-gray-300 grid grid-cols-6 gap-3 rounded-sm shrink-0">
          <div className="flex flex-col">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Selection</span>
             <span className="text-[11px] font-bold text-[#003366] truncate">{params.motorModel || 'None'}</span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Rated Torque (Derated)</span>
             <span className={`text-[11px] font-mono font-bold ${params.motorModel ? ((params.ratedTorque * thermalDerating) >= req.ratedTorque ? 'text-green-600' : 'text-red-600') : ''}`}>
               {((params.ratedTorque || 0) * thermalDerating).toFixed(2)} Nm
             </span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Peak Torque</span>
             <span className={`text-[11px] font-mono font-bold ${params.motorModel ? (params.peakTorque >= req.peakTorque ? 'text-green-600' : 'text-red-600') : ''}`}>
               {(params.peakTorque || 0).toFixed(1)} Nm
             </span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Rated Speed</span>
             <span className={`text-[11px] font-mono font-bold ${params.motorModel ? (params.ratedSpeed >= req.ratedSpeed ? 'text-green-600' : 'text-red-600') : ''}`}>
               {(params.ratedSpeed || 0)} RPM
             </span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Inertia Ratio</span>
             <span className={`text-[11px] font-mono font-bold ${params.motorModel ? (appInertia / (params.motorInertia || 1) <= (params.allowableInertiaRatio || 10) ? 'text-green-600' : 'text-amber-600') : ''}`}>
               {(appInertia / (params.motorInertia || 1)).toFixed(1)} : 1
             </span>
          </div>
          <div className="flex flex-col border-l border-gray-300 pl-3">
             <span className="text-[9px] text-gray-500 font-bold uppercase">Reflected Load J_L</span>
             <span className="text-[11px] font-mono font-bold text-gray-700">
               {appInertia.toFixed(2)} kg·cm²
             </span>
          </div>
      </div>

      {/* Modal: Add Custom Motor */}
      {isAddMotorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded p-5 w-[420px] shadow-2xl border border-gray-300 text-xs space-y-3">
            <h3 className="font-bold text-sm text-gray-800 border-b pb-1 flex items-center">
              <Plus size={14} className="mr-1 text-green-600"/> Add Custom Motor to Catalog
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold text-gray-500">Vendor</label><input type="text" className="w-full border p-1 rounded" value={newMotor.vendor} onChange={e => setNewMotor({...newMotor, vendor: e.target.value})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Model Name</label><input type="text" className="w-full border p-1 rounded" value={newMotor.model} onChange={e => setNewMotor({...newMotor, model: e.target.value})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Rated Torque (Nm)</label><input type="number" step="0.1" className="w-full border p-1 rounded" value={newMotor.ratedTorque} onChange={e => setNewMotor({...newMotor, ratedTorque: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Peak Torque (Nm)</label><input type="number" step="0.1" className="w-full border p-1 rounded" value={newMotor.peakTorque} onChange={e => setNewMotor({...newMotor, peakTorque: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Rated Speed (RPM)</label><input type="number" className="w-full border p-1 rounded" value={newMotor.ratedSpeed} onChange={e => setNewMotor({...newMotor, ratedSpeed: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Peak Speed (RPM)</label><input type="number" className="w-full border p-1 rounded" value={newMotor.peakSpeed} onChange={e => setNewMotor({...newMotor, peakSpeed: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Rotor Inertia (kg·cm²)</label><input type="number" step="0.01" className="w-full border p-1 rounded" value={newMotor.inertia} onChange={e => setNewMotor({...newMotor, inertia: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Allowable Ratio</label><input type="number" className="w-full border p-1 rounded" value={newMotor.allowableInertiaRatio} onChange={e => setNewMotor({...newMotor, allowableInertiaRatio: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Rated Current (A)</label><input type="number" step="0.1" className="w-full border p-1 rounded" value={newMotor.ratedCurrent} onChange={e => setNewMotor({...newMotor, ratedCurrent: Number(e.target.value)})}/></div>
              <div><label className="text-[10px] font-bold text-gray-500">Efficiency (%)</label><input type="number" className="w-full border p-1 rounded" value={newMotor.efficiency} onChange={e => setNewMotor({...newMotor, efficiency: Number(e.target.value)})}/></div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setIsAddMotorOpen(false)} className="px-3 py-1 bg-gray-100 rounded text-gray-700">Cancel</button>
              <button onClick={handleSaveCustomMotor} className="px-4 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save & Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
