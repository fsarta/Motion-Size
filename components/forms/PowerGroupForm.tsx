import React from 'react';
import { UnitInput, InputGroup, Select } from '../Common';

export const PowerGroupForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
      <div>
        <InputGroup label="Cycle time">
          <UnitInput value={params.cycleTime} onChange={(v) => handleChange('cycleTime', v)} type="time" />
        </InputGroup>
        <InputGroup label="Configuration">
           <Select value={params.configuration} options={['Multi-Axis', 'Independent', 'Robotic']} onChange={(e) => handleChange('configuration', e.target.value)} />
        </InputGroup>
        
        <div className="h-4 border-b border-gray-300 mb-2 mt-1"></div>

        <InputGroup label="Supply">
           <div className="flex w-full space-x-1 items-center">
             <Select value={params.supplyVoltage} options={['230', '400', '480']} onChange={(e) => handleChange('supplyVoltage', e.target.value)} />
             <span className="text-xs text-red-700 mx-1">Vac</span>
             <Select value={params.supplyPhase} options={['1', '3']} onChange={(e) => handleChange('supplyPhase', e.target.value)} />
           </div>
        </InputGroup>
        <InputGroup label="Nominal bus voltage">
          <div className="flex w-full items-center">
               <div className="flex-1">
                <UnitInput value={params.nominalBusVoltage} onChange={(v) => handleChange('nominalBusVoltage', v)} type="voltage" />
               </div>
               <div className="ml-2 flex items-center shrink-0">
                  <input type="checkbox" checked className="mr-1" readOnly />
                  <span className="text-xs">Auto</span>
               </div>
          </div>
        </InputGroup>
      </div>
      <div>
        <InputGroup label="Infeed Peak Power">
           <UnitInput value={params.infeedPeakPower} onChange={(v) => handleChange('infeedPeakPower', v)} type="efficiency" />
        </InputGroup>
        <InputGroup label="Target Bus Voltage">
           <UnitInput value={params.targetBusVoltage} onChange={(v) => handleChange('targetBusVoltage', v)} type="voltage" />
        </InputGroup>
      </div>
    </div>
  );
};