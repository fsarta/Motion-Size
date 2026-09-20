import React, { useMemo } from 'react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { TreeNode } from '../../types';
import { Zap, BatteryCharging, Gauge, ShieldCheck, Flame } from 'lucide-react';
import { calculateAxisDynamics } from '../../utils/physics';

export const PowerGroupForm = ({ 
  params, 
  onUpdate, 
  groupNode 
}: { 
  params: any, 
  onUpdate: (p: any) => void, 
  groupNode?: TreeNode 
}) => {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const axes = groupNode?.children?.filter(c => c.type === 'axis') || [];
  const cycleTimeSec = Math.max(0.1, parseFloat(String(params.cycleTime || 10)));
  const supplyVoltage = parseFloat(String(params.supplyVoltage || 400));
  const nominalBusVoltage = parseFloat(String(params.nominalBusVoltage || Math.round(supplyVoltage * 1.35)));

  // Calculate aggregated electrical & mechanical power across all group axes
  const powerMetrics = useMemo(() => {
    let totalRatedPowerKw = 0;
    let totalPeakPowerKw = 0;
    let totalKineticEnergyJ = 0;
    let totalRegenPowerKw = 0;

    axes.forEach(axis => {
      const p = axis.parameters || {};
      const ratedP = parseFloat(String(p.ratedPower || 0));
      const ratedT = parseFloat(String(p.ratedTorque || 0));
      const peakT = parseFloat(String(p.peakTorque || (ratedT * 3)));
      const ratedN = parseFloat(String(p.ratedSpeed || 3000));
      const peakN = parseFloat(String(p.peakSpeed || 6000));

      totalRatedPowerKw += ratedP;
      // Peak mechanical power: P_peak = T_peak * omega_peak
      const omegaPeak = (peakN * 2 * Math.PI) / 60;
      const peakP = (peakT * omegaPeak) / 1000;
      totalPeakPowerKw += (peakP > 0 ? peakP : ratedP * 2.5);

      // Kinetic energy E_k = 0.5 * J_tot * omega^2
      const dyn = calculateAxisDynamics(p);
      const omegaMax = (Math.min(ratedN, 3000) * 2 * Math.PI) / 60;
      const kineticJ = 0.5 * dyn.totalInertiaKgM2 * Math.pow(omegaMax, 2);
      totalKineticEnergyJ += kineticJ;

      // Estimated regen power during emergency / fast stop
      const decelTimeSec = 0.2; // typical servo rapid decel
      totalRegenPowerKw += (kineticJ / decelTimeSec) / 1000;
    });

    // DC bus capacitor bank capacity (typical ~1100 uF per drive)
    const totalCapacitanceUf = Math.max(1000, axes.length * 1100);
    const maxBusVoltage = Math.round(nominalBusVoltage * 1.35); // Chopper turn-on threshold
    // Storable energy without chopper: 0.5 * C * (V_max^2 - V_nom^2)
    const capStorageJoules = 0.5 * (totalCapacitanceUf * 1e-6) * (Math.pow(maxBusVoltage, 2) - Math.pow(nominalBusVoltage, 2));

    // Net energy needing resistor dissipation per cycle
    const excessEnergyJ = Math.max(0, totalKineticEnergyJ - capStorageJoules);
    const continuousResistorWatts = Math.round(excessEnergyJ / cycleTimeSec);
    const peakResistorWatts = Math.round(totalRegenPowerKw * 1000);

    // Recommended braking resistance
    const chopperVoltage = Math.round(nominalBusVoltage * 1.25);
    const minResistanceOhm = peakResistorWatts > 500 ? Math.max(10, Math.round((chopperVoltage * chopperVoltage) / peakResistorWatts)) : 50;

    return {
      totalRatedPowerKw: parseFloat(totalRatedPowerKw.toFixed(2)),
      totalPeakPowerKw: parseFloat(totalPeakPowerKw.toFixed(2)),
      totalKineticEnergyJ: Math.round(totalKineticEnergyJ),
      capStorageJoules: Math.round(capStorageJoules),
      excessEnergyJ: Math.round(excessEnergyJ),
      continuousResistorWatts,
      peakResistorWatts,
      chopperVoltage,
      minResistanceOhm
    };
  }, [axes, cycleTimeSec, nominalBusVoltage]);

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded p-3 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Continuous Power</div>
            <div className="text-base font-bold text-gray-800">{powerMetrics.totalRatedPowerKw} kW</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Peak Infeed Power</div>
            <div className="text-base font-bold text-amber-600">{powerMetrics.totalPeakPowerKw} kW</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-green-50 text-green-600 rounded">
            <BatteryCharging size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Kinetic Energy</div>
            <div className="text-base font-bold text-green-700">{powerMetrics.totalKineticEnergyJ} J</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Capacitor Buffer</div>
            <div className="text-base font-bold text-purple-700">{powerMetrics.capStorageJoules} J</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Left Column: Grid Supply & DC Bus */}
        <div className="space-y-3">
          <SectionHeader title="Mains Supply & DC Bus System" />
          
          <InputGroup label="Supply Voltage">
            <div className="flex w-full space-x-1 items-center">
              <Select 
                value={String(params.supplyVoltage || 400)} 
                options={['230', '400', '480']} 
                onChange={(e) => {
                  const v = Number(e.target.value);
                  handleChange('supplyVoltage', v);
                  handleChange('nominalBusVoltage', Math.round(v * 1.35));
                }} 
              />
              <span className="text-xs text-gray-500 mx-1">Vac</span>
              <Select value={String(params.supplyPhase || 3)} options={['1', '3']} onChange={(e) => handleChange('supplyPhase', Number(e.target.value))} />
              <span className="text-xs text-gray-500">Phase</span>
            </div>
          </InputGroup>

          <InputGroup label="Nominal Bus Voltage">
            <div className="flex w-full items-center">
              <div className="flex-1">
                <UnitInput 
                  value={params.nominalBusVoltage || Math.round(supplyVoltage * 1.35)} 
                  onChange={(v) => handleChange('nominalBusVoltage', v)} 
                  type="voltage" 
                />
              </div>
              <div className="ml-2 flex items-center shrink-0 text-xs text-gray-500">
                <span>(Vdc)</span>
              </div>
            </div>
          </InputGroup>

          <InputGroup label="Cycle Time">
            <UnitInput value={params.cycleTime || 10} onChange={(v) => handleChange('cycleTime', v)} type="time" />
          </InputGroup>

          <InputGroup label="Bus Configuration">
            <Select 
              value={params.configuration || 'Multi-Axis'} 
              options={['Multi-Axis', 'Independent', 'Robotic']} 
              onChange={(e) => handleChange('configuration', e.target.value)} 
            />
          </InputGroup>
        </div>

        {/* Right Column: Braking Resistor & Energy Sharing */}
        <div className="space-y-3">
          <SectionHeader title="Regenerative Energy & Braking Resistor Sizing" />

          <div className="bg-slate-50 border border-gray-200 rounded p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chopper Trigger Threshold:</span>
              <span className="font-mono font-bold text-gray-800">{powerMetrics.chopperVoltage} Vdc</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Peak Braking Power:</span>
              <span className="font-mono font-bold text-amber-600">{(powerMetrics.peakResistorWatts / 1000).toFixed(1)} kW</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Continuous Resistor Wattage:</span>
              <span className="font-mono font-bold text-blue-700">{powerMetrics.continuousResistorWatts} W</span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-gray-800 font-bold">Recommended Minimum Resistor:</span>
              <span className="font-mono font-black text-purple-700 text-sm">{powerMetrics.minResistanceOhm} Ω</span>
            </div>
          </div>

          <div className="p-2.5 bg-green-50 border border-green-200 rounded text-[11px] text-green-800">
            <strong>DC Bus Sharing Status:</strong> {params.configuration === 'Independent' ? 'Disabled (Individual Axis Inverters)' : 'Active (Decelerating axes feed accelerating axes directly via shared DC bus, reducing energy waste).' }
          </div>
        </div>
      </div>
    </div>
  );
};
