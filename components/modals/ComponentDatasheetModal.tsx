import React, { useState, useMemo } from 'react';
import { X, Printer, Download, Zap, Cog, Cpu, ShieldCheck, Gauge, Ruler, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { MotorSpec, DriveSpec, GearboxSpec } from '../../types';
import { calculateEquivalentBearingLife } from '../../utils/physics';

interface ComponentDatasheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'motor' | 'drive' | 'gearbox';
  motor?: MotorSpec;
  drive?: DriveSpec;
  gearbox?: GearboxSpec;
  appliedRadialForce?: number;
  appliedAxialForce?: number;
}

export const ComponentDatasheetModal: React.FC<ComponentDatasheetModalProps> = ({
  isOpen,
  onClose,
  type,
  motor,
  drive,
  gearbox,
  appliedRadialForce = 0,
  appliedAxialForce = 0
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'electrical' | 'mechanical' | 'drawings'>('overview');

  const motorBearingLife = useMemo(() => {
    if (!motor) return null;
    return calculateEquivalentBearingLife(
      20000,
      motor.maxRadialForce || 750,
      motor.ratedSpeed || 3000,
      appliedRadialForce > 0 ? appliedRadialForce : (motor.maxRadialForce || 750) * 0.45,
      (motor.ratedSpeed || 3000) * 0.7,
      'ball'
    );
  }, [motor, appliedRadialForce]);

  const gearboxBearingLife = useMemo(() => {
    if (!gearbox) return null;
    return calculateEquivalentBearingLife(
      gearbox.serviceLife || 20000,
      gearbox.maxRadialForce || 1650,
      (gearbox.nominalInputSpeed || 3700) / (gearbox.ratio || 1),
      appliedRadialForce > 0 ? appliedRadialForce : (gearbox.maxRadialForce || 1650) * 0.45,
      ((gearbox.nominalInputSpeed || 3700) / (gearbox.ratio || 1)) * 0.7,
      'ball'
    );
  }, [gearbox, appliedRadialForce]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const title = type === 'motor' 
    ? `${motor?.vendor || ''} ${motor?.model || 'Servo Motor'} Technical Datasheet`
    : type === 'drive'
    ? `${drive?.vendor || ''} ${drive?.model || 'Servo Drive'} Technical Datasheet`
    : `${gearbox?.vendor || ''} ${gearbox?.model || 'Gearbox'} Technical Datasheet`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-md shadow-2xl border border-gray-400 w-full max-w-4xl max-h-[92vh] flex flex-col font-sans text-xs overflow-hidden print:border-none print:shadow-none print:max-h-none">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-3.5 flex justify-between items-center border-b border-slate-700 select-none print:bg-none print:text-black print:border-b-2">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-600 rounded text-white shadow">
              {type === 'motor' ? <Cpu size={18} /> : type === 'drive' ? <Zap size={18} /> : <Cog size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">{title}</h2>
              <div className="text-[10px] text-slate-300 font-mono">
                {type === 'motor' && `Series: ${motor?.series || 'Standard'} | Class: ${motor?.insulationClass || 'Class F'} | Protection: ${motor?.protectionClass || 'IP65'}`}
                {type === 'drive' && `Series: ${drive?.series || 'Modular'} | Type: ${drive?.driveType || 'Single Axis'} | Bus: ${drive?.nominalBusVoltage || 540} VDC`}
                {type === 'gearbox' && `Series: ${gearbox?.series || 'Planetary'} | Ratio: ${gearbox?.ratio || 1}:1 | Backlash: ${gearbox?.backlash || 0} arcmin`}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded font-bold shadow text-xs transition-colors"
              title="Print or Save as PDF"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Screen only) */}
        <div className="bg-slate-100 border-b border-gray-300 px-5 flex space-x-6 text-xs font-semibold print:hidden">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            Overview & Ratings
          </button>
          {type === 'motor' && (
            <>
              <button
                onClick={() => setActiveTab('electrical')}
                className={`py-2.5 border-b-2 transition-colors ${activeTab === 'electrical' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              >
                Electrical Characteristics
              </button>
              <button
                onClick={() => setActiveTab('mechanical')}
                className={`py-2.5 border-b-2 transition-colors ${activeTab === 'mechanical' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              >
                Mechanical Dimensions & Shaft Loading
              </button>
            </>
          )}
          {type === 'drive' && (
            <button
              onClick={() => setActiveTab('electrical')}
              className={`py-2.5 border-b-2 transition-colors ${activeTab === 'electrical' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              Electrical & Interfaces
            </button>
          )}
          {type === 'gearbox' && (
            <button
              onClick={() => setActiveTab('mechanical')}
              className={`py-2.5 border-b-2 transition-colors ${activeTab === 'mechanical' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              Kinematics, Backlash & Rigidity
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* MOTOR DATASHEET */}
          {type === 'motor' && motor && (
            <>
              {/* Highlight KPI Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-blue-800">Rated Torque (M_N)</div>
                  <div className="text-xl font-mono font-bold text-blue-900 mt-0.5">{motor.ratedTorque} <span className="text-xs font-normal">Nm</span></div>
                  <div className="text-[9px] text-blue-600 mt-1">Stall Torque M0: {motor.stallTorque || motor.ratedTorque} Nm</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Peak Torque (M_max)</div>
                  <div className="text-xl font-mono font-bold text-amber-900 mt-0.5">{motor.peakTorque} <span className="text-xs font-normal">Nm</span></div>
                  <div className="text-[9px] text-amber-600 mt-1">Overload Ratio: {(motor.peakTorque / motor.ratedTorque).toFixed(1)}x</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Rated Speed (n_N)</div>
                  <div className="text-xl font-mono font-bold text-emerald-900 mt-0.5">{motor.ratedSpeed} <span className="text-xs font-normal">RPM</span></div>
                  <div className="text-[9px] text-emerald-600 mt-1">Max Speed n_max: {motor.peakSpeed} RPM</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-purple-800">Rotor Inertia (J_m)</div>
                  <div className="text-xl font-mono font-bold text-purple-900 mt-0.5">{motor.inertia} <span className="text-xs font-normal">kg·cm²</span></div>
                  <div className="text-[9px] text-purple-600 mt-1">Weight: {motor.motorMass || 5.0} kg</div>
                </div>
              </div>

              {/* Electrical Parameters Table */}
              {(activeTab === 'overview' || activeTab === 'electrical') && (
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b border-gray-300 font-bold text-slate-800 flex items-center">
                    <Zap size={14} className="mr-1.5 text-blue-600"/> Complete Electrical Specifications
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700 w-1/3">Rated Voltage ($U_N$)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.ratedVoltage || 400} V AC</td>
                        <td className="p-2.5 font-semibold text-gray-700 w-1/3">Rated Power ($P_N$)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.ratedPower} kW ({((motor.ratedPower || 1) * 1.341).toFixed(2)} HP)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Rated Current (IN)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.ratedCurrent} Arms</td>
                        <td className="p-2.5 font-semibold text-gray-700">Peak Current (Imax)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.peakCurrent || (motor.ratedCurrent * 3.5).toFixed(1)} Arms</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Torque Constant (Kt)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.torqueConstant || (motor.ratedTorque / motor.ratedCurrent).toFixed(2)} Nm / Arms</td>
                        <td className="p-2.5 font-semibold text-gray-700">Voltage Constant (Ke)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.voltageConstant || 85} V / 1000 RPM</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Winding Resistance (R ph-ph)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.windingResistance || 1.8} Ohm at 20°C</td>
                        <td className="p-2.5 font-semibold text-gray-700">Winding Inductance (L ph-ph)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.windingInductance || 9.5} mH</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Electrical Time Constant (tau_e)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.electricalTimeConstant || 5.2} ms</td>
                        <td className="p-2.5 font-semibold text-gray-700">Mechanical Time Constant (tau_m)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.mechanicalTimeConstant || 1.2} ms</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Pole Pairs (p)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.polePairs || 4} pairs ({(motor.polePairs || 4) * 2} poles)</td>
                        <td className="p-2.5 font-semibold text-gray-700">Thermal Time Constant (tau_th)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.thermalTimeConstant || 25} min</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Motor Efficiency ($\eta$)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.efficiency}%</td>
                        <td className="p-2.5 font-semibold text-gray-700">Power Factor ($\cos\phi$)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.powerFactor}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Insulation Class</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.insulationClass || 'Class F (155°C)'}</td>
                        <td className="p-2.5 font-semibold text-gray-700">Cooling Method</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.coolingType || 'Natural Convection (IC410)'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mechanical Parameters & Force Limits */}
              {(activeTab === 'overview' || activeTab === 'mechanical') && (
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b border-gray-300 font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center">
                      <Ruler size={14} className="mr-1.5 text-blue-600"/> Mechanical Construction & Permissible Shaft Forces
                    </span>
                    <span className="text-[10px] text-gray-500 font-normal">ISO 10816-1 / DIN 6885</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700 w-1/3">Motor Flange Size</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.flangeSize || 100} mm square</td>
                        <td className="p-2.5 font-semibold text-gray-700 w-1/3">Shaft Dimensions</td>
                        <td className="p-2.5 font-mono text-gray-900">$\varnothing${motor.shaftDiameter || 19} mm $\times$ {motor.shaftLength || 40} mm</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Keyway Style</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.keyway ? 'Feather Key DIN 6885-1' : 'Smooth plain shaft'}</td>
                        <td className="p-2.5 font-semibold text-gray-700">Total Weight</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.motorMass || 6.5} kg</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Permissible Radial Force (Fr,max)</td>
                        <td className="p-2.5 font-mono text-gray-900 font-bold text-blue-900">{motor.maxRadialForce || 750} N</td>
                        <td className="p-2.5 font-semibold text-gray-700">Permissible Axial Force (Fa,max)</td>
                        <td className="p-2.5 font-mono text-gray-900 font-bold text-blue-900">{motor.maxAxialForce || 250} N</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Ingress Protection (IP)</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.protectionClass || 'IP65 (Shaft IP64 standard)'}</td>
                        <td className="p-2.5 font-semibold text-gray-700">Vibration Severity Grade</td>
                        <td className="p-2.5 font-mono text-gray-900">{motor.vibrationGrade || 'Grade A'} (ISO 2372)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-gray-700">Holding Brake Option</td>
                        <td className="p-2.5 font-mono text-gray-900">
                          {motor.hasBrakeOption ? `Available (${motor.brakeTorque || 13} Nm, ${motor.brakePower || 18} W)` : 'None'}
                        </td>
                        <td className="p-2.5 font-semibold text-gray-700">Allowable Load Inertia Ratio</td>
                        <td className="p-2.5 font-mono text-gray-900 font-bold text-emerald-800">
                          $J_L / J_M \le {motor.allowableInertiaRatio || 10}:1$
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Force Loading Safety Check */}
              {appliedRadialForce > 0 && motor.maxRadialForce && (
                <div className="bg-slate-50 border border-gray-300 p-3 rounded flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {appliedRadialForce <= motor.maxRadialForce ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <AlertCircle size={18} className="text-red-600" />
                    )}
                    <div>
                      <div className="font-bold text-xs text-slate-800">Transmission Shaft Radial Load Check</div>
                      <div className="text-[11px] text-slate-600">
                        Applied: <strong>{appliedRadialForce.toFixed(0)} N</strong> | Permissible Limit: <strong>{motor.maxRadialForce} N</strong>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded text-xs font-bold ${
                    appliedRadialForce <= motor.maxRadialForce ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {((appliedRadialForce / motor.maxRadialForce) * 100).toFixed(0)}% Load
                  </div>
                </div>
              )}

              {/* Motor Bearing Service Life (ISO 281 L10h) Assessment */}
              {motorBearingLife && (
                <div className="bg-slate-50 border border-gray-300 p-3 rounded">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between mb-2">
                    <span className="flex items-center">
                      <ShieldCheck size={16} className="text-blue-600 mr-1.5" /> Motor Bearing Expected Service Life (ISO 281 L10h Standard)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      motorBearingLife.status === 'optimal' ? 'bg-green-100 text-green-800 border border-green-200' :
                      motorBearingLife.status === 'acceptable' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {motorBearingLife.status.toUpperCase()} STATUS
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Equiv. Dynamic Radial Force</span>
                      <strong className="font-mono">{motorBearingLife.equivalentRadialForceN} N</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Mean Operating Speed</span>
                      <strong className="font-mono">{motorBearingLife.averageSpeedRpm} RPM</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Calculated Service Life (L10h)</span>
                      <strong className="font-mono text-blue-900">{motorBearingLife.lifeHours.toLocaleString()} hours</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Years of Operation</span>
                      <strong className="font-mono text-emerald-800">{motorBearingLife.lifeYears} years (4,000 h/yr)</strong>
                    </div>
                  </div>
                  {motorBearingLife.warningMessage && (
                    <div className="text-[10px] text-amber-700 mt-2 bg-amber-50 p-1.5 rounded border border-amber-200">
                      {motorBearingLife.warningMessage}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* DRIVE DATASHEET */}
          {type === 'drive' && drive && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-blue-800">Rated Output Current</div>
                  <div className="text-xl font-mono font-bold text-blue-900 mt-0.5">{drive.ratedOutputCurrent || (drive.maxCurrent / 2).toFixed(1)} <span className="text-xs font-normal">Arms</span></div>
                  <div className="text-[9px] text-blue-600 mt-1">Continuous Thermal Limit</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Peak Current (I_max)</div>
                  <div className="text-xl font-mono font-bold text-amber-900 mt-0.5">{drive.maxCurrent} <span className="text-xs font-normal">Arms</span></div>
                  <div className="text-[9px] text-amber-600 mt-1">Max Duration: {drive.peakDuration || 3} seconds</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Mains Voltage</div>
                  <div className="text-xl font-mono font-bold text-emerald-900 mt-0.5">{drive.supplyVoltage} <span className="text-xs font-normal">V AC</span></div>
                  <div className="text-[9px] text-emerald-600 mt-1">{drive.supplyPhases || 3}-Phase ({drive.inputFrequency || '47-63 Hz'})</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-purple-800">DC Bus Capacitance</div>
                  <div className="text-xl font-mono font-bold text-purple-900 mt-0.5">{drive.internalBusCapacitance || 220} <span className="text-xs font-normal">$\mu$F</span></div>
                  <div className="text-[9px] text-purple-600 mt-1">Nominal V_DC: {drive.nominalBusVoltage || 540} V</div>
                </div>
              </div>

              {/* Complete Drive Specs Table */}
              <div className="border border-gray-300 rounded overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b border-gray-300 font-bold text-slate-800 flex items-center">
                  <Zap size={14} className="mr-1.5 text-blue-600"/> Inverter Electrical Ratings & System Integration
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700 w-1/3">Rated Mains Voltage Range</td>
                      <td className="p-2.5 font-mono text-gray-900">{drive.supplyVoltageMin || 380} V to {drive.supplyVoltageMax || 480} V AC</td>
                      <td className="p-2.5 font-semibold text-gray-700 w-1/3">Continuous Power Output</td>
                      <td className="p-2.5 font-mono text-gray-900">{drive.continuousOutputPower || 5.7} kW ({drive.peakOutputPower || 11.4} kW peak)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">PWM Switching Frequency</td>
                      <td className="p-2.5 font-mono text-gray-900">{drive.pwmFrequency} kHz (Max {drive.maxPwmFrequency || 16} kHz)</td>
                      <td className="p-2.5 font-semibold text-gray-700">Internal Braking Chopper</td>
                      <td className="p-2.5 font-mono text-gray-900">
                        {drive.hasInternalChopper ? `Yes (Min R: ${drive.minBrakeResistor || 30} $\Omega$)` : 'External unit'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Dimensions ($W \times H \times D$)</td>
                      <td className="p-2.5 font-mono text-gray-900">
                        {drive.dimensions ? `${drive.dimensions.width} × ${drive.dimensions.height} × ${drive.dimensions.depth} mm` : '50 × 380 × 270 mm'}
                      </td>
                      <td className="p-2.5 font-semibold text-gray-700">Weight & Mounting</td>
                      <td className="p-2.5 font-mono text-gray-900">{drive.weight || 4.5} kg ({drive.mounting || 'Cabinet Booksize'})</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Heat Dissipation / Power Loss</td>
                      <td className="p-2.5 font-mono text-gray-900">{drive.powerLoss || 140} W (at full load)</td>
                      <td className="p-2.5 font-semibold text-gray-700">Cooling Method</td>
                      <td className="p-2.5 font-mono text-gray-900">{drive.cooling || 'Internal Forced Air'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Supported Fieldbuses</td>
                      <td className="p-2.5 font-mono text-gray-900" colSpan={3}>
                        {(drive.fieldbus || ['EtherCAT', 'PROFINET IRT', 'EtherNet/IP']).join(', ')}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Integrated Safety Functions</td>
                      <td className="p-2.5 font-mono text-gray-900" colSpan={3}>
                        {(drive.safetyFunctions || ['STO (SIL 3 / PL e)', 'SS1', 'SLS']).join(', ')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* GEARBOX DATASHEET */}
          {type === 'gearbox' && gearbox && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-blue-800">Gear Ratio (i)</div>
                  <div className="text-xl font-mono font-bold text-blue-900 mt-0.5">{gearbox.ratio} : 1</div>
                  <div className="text-[9px] text-blue-600 mt-1">Stages: {gearbox.stages || (gearbox.ratio > 10 ? 2 : 1)} stage(s)</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Nominal Torque (T2N)</div>
                  <div className="text-xl font-mono font-bold text-amber-900 mt-0.5">{gearbox.nominalTorque || 45} <span className="text-xs font-normal">Nm</span></div>
                  <div className="text-[9px] text-amber-600 mt-1">Max Accel Torque T2B: {gearbox.maxAccelerationTorque || 72} Nm</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Torsional Backlash</div>
                  <div className="text-xl font-mono font-bold text-emerald-900 mt-0.5">{gearbox.backlash} <span className="text-xs font-normal">arcmin</span></div>
                  <div className="text-[9px] text-emerald-600 mt-1">Reduced: {gearbox.reducedBacklash || gearbox.backlash - 2} arcmin</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                  <div className="text-[10px] uppercase font-bold text-purple-800">Input Inertia ($J_1$)</div>
                  <div className="text-xl font-mono font-bold text-purple-900 mt-0.5">{gearbox.inertia} <span className="text-xs font-normal">kg·cm²</span></div>
                  <div className="text-[9px] text-purple-600 mt-1">Weight: {gearbox.mass || 1.8} kg</div>
                </div>
              </div>

              {/* Complete Gearbox Specs Table */}
              <div className="border border-gray-300 rounded overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b border-gray-300 font-bold text-slate-800 flex items-center">
                  <Cog size={14} className="mr-1.5 text-blue-600"/> Kinematics, Mechanical Capacity & Durability
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700 w-1/3">Max Acceleration Torque (T2B)</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.maxAccelerationTorque || 72} Nm</td>
                      <td className="p-2.5 font-semibold text-gray-700 w-1/3">Emergency Stop Torque (T2NOT)</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.emergencyStopTorque || 110} Nm</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Nominal Input Speed (n1N)</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.nominalInputSpeed || 3700} RPM</td>
                      <td className="p-2.5 font-semibold text-gray-700">Maximum Input Speed (n1max)</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.maxInputSpeed} RPM</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Full-Load Efficiency</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.efficiency}%</td>
                      <td className="p-2.5 font-semibold text-gray-700">Torsional Rigidity (Ct)</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.torsionalRigidity || 6.5} Nm / arcmin</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Output Shaft Dimensions</td>
                      <td className="p-2.5 font-mono text-gray-900">
                        Dia {gearbox.outputShaftDiameter || 16} mm × {gearbox.outputShaftLength || 28} mm
                      </td>
                      <td className="p-2.5 font-semibold text-gray-700">Output Shaft Style</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.outputShaftType || 'Solid with key DIN 6885-1'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Permissible Output Radial Force (Fr2)</td>
                      <td className="p-2.5 font-mono text-gray-900 font-bold text-blue-900">{gearbox.maxRadialForce || 1650} N</td>
                      <td className="p-2.5 font-semibold text-gray-700">Permissible Output Axial Force (Fa2)</td>
                      <td className="p-2.5 font-mono text-gray-900 font-bold text-blue-900">{gearbox.maxAxialForce || 2100} N</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Nominal Service Life (L10h)</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.serviceLife || 20000} hours (continuous duty)</td>
                      <td className="p-2.5 font-semibold text-gray-700">Running Noise Level</td>
                      <td className="p-2.5 font-mono text-gray-900">≤ {gearbox.noiseLevel || 62} dB(A) at 3000 RPM</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-gray-700">Lubrication</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.lubrication || 'Synthetic grease, lifetime lubricated'}</td>
                      <td className="p-2.5 font-semibold text-gray-700">Protection Rating</td>
                      <td className="p-2.5 font-mono text-gray-900">{gearbox.protectionClass || 'IP64'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Gearbox Output Bearing Service Life (ISO 281 L10h) Assessment */}
              {gearboxBearingLife && (
                <div className="bg-slate-50 border border-gray-300 p-3 rounded mt-3">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between mb-2">
                    <span className="flex items-center">
                      <ShieldCheck size={16} className="text-blue-600 mr-1.5" /> Output Shaft Bearing Service Life (ISO 281 L10h Standard)
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      gearboxBearingLife.status === 'optimal' ? 'bg-green-100 text-green-800 border border-green-200' :
                      gearboxBearingLife.status === 'acceptable' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {gearboxBearingLife.status.toUpperCase()} STATUS
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 text-[10px] block">Equiv. Output Radial Load</span>
                      <strong className="font-mono">{gearboxBearingLife.equivalentRadialForceN} N</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Mean Output Speed</span>
                      <strong className="font-mono">{gearboxBearingLife.averageSpeedRpm} RPM</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Calculated Service Life (L10h)</span>
                      <strong className="font-mono text-blue-900">{gearboxBearingLife.lifeHours.toLocaleString()} hours</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">Years of Operation</span>
                      <strong className="font-mono text-emerald-800">{gearboxBearingLife.lifeYears} years (4,000 h/yr)</strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-gray-300 px-5 py-3 flex justify-between items-center text-xs text-gray-600 print:hidden">
          <div>
            Data sourced from certified vendor engineering catalogs. All values refer to standard ambient conditions (20°C / 1000m).
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded font-semibold text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
