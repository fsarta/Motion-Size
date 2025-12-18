
import React from 'react';
import { Gauge, Link as LinkIcon, Disc, Ruler } from 'lucide-react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { CamTable } from '../../types';

export const AxisForm = ({ params, onUpdate, availableMasters, camTables }: { params: any, onUpdate: (p: any) => void, availableMasters: string[], camTables: CamTable[] }) => {
  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const isMasterFollower = params.profileType === 'Master/Follower' || params.profileType === 'Camming';

  // Fallback if no masters
  const masterOptions = ['Virtual Master', ...availableMasters];
  const camOptions = camTables.map(c => c.name);

  return (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm text-xs text-blue-800 flex items-start">
        <div className="mr-2 mt-0.5"><Gauge size={14}/></div>
        <p>Configure the axis behavior and synchronization here. Physical dimensions (Mechanism, Motor) are managed in their respective tabs.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-12">
        <div className="space-y-1">
          <SectionHeader title="Basic Definition" />
          <InputGroup label="Axis Name">
            <input 
              type="text" 
              className="w-full text-xs border border-gray-300 px-2 h-6 bg-white text-gray-900 focus:border-blue-500 outline-none" 
              value={params.axisName} 
              onChange={(e) => handleChange('axisName', e.target.value)} 
            />
          </InputGroup>
          <InputGroup label="Load Type">
             <div className="flex w-full space-x-2">
                <button 
                  onClick={() => handleChange('axisUsage', 'Rotary')}
                  className={`flex-1 flex items-center justify-center space-x-1 h-6 border rounded-sm transition-colors ${params.axisUsage !== 'Linear' ? 'bg-win-select border-blue-400 text-blue-800 font-bold' : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                >
                   <Disc size={12}/> <span>Rotary (deg)</span>
                </button>
                <button 
                  onClick={() => handleChange('axisUsage', 'Linear')}
                  className={`flex-1 flex items-center justify-center space-x-1 h-6 border rounded-sm transition-colors ${params.axisUsage === 'Linear' ? 'bg-win-select border-blue-400 text-blue-800 font-bold' : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                >
                   <Ruler size={12}/> <span>Linear (mm)</span>
                </button>
             </div>
          </InputGroup>
          <InputGroup label="Control Mode">
             <Select value={params.profileType} options={['Time Based', 'Master/Follower', 'Camming']} onChange={(e) => handleChange('profileType', e.target.value)} />
          </InputGroup>
        </div>
        
        <div className="space-y-1">
           <SectionHeader title="Synchronization" rightContent={isMasterFollower && <LinkIcon size={12} className="text-blue-600"/>} />
           <div className={!isMasterFollower ? "opacity-30 pointer-events-none" : ""}>
             <InputGroup label="Master Axis">
                <Select value={params.masterAxis || 'Virtual Master'} options={masterOptions} onChange={(e) => handleChange('masterAxis', e.target.value)} />
             </InputGroup>
             
             {params.profileType === 'Master/Follower' && (
               <InputGroup label="Gear Ratio">
                 <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      className="w-full h-6 border border-gray-300 px-1 text-right text-xs bg-white text-gray-900"
                      value={params.gearRatioNum || 1} 
                      onChange={(e) => handleChange('gearRatioNum', e.target.value)}
                    />
                    <span>:</span>
                    <input 
                      type="number" 
                      className="w-full h-6 border border-gray-300 px-1 text-right text-xs bg-white text-gray-900" 
                      value={params.gearRatioDen || 1} 
                      onChange={(e) => handleChange('gearRatioDen', e.target.value)}
                    />
                 </div>
               </InputGroup>
             )}

             {params.profileType === 'Camming' && (
                <InputGroup label="Cam Table">
                   <Select 
                      value={params.camTableId || (camOptions[0] ?? '')} 
                      options={camOptions} 
                      onChange={(e) => handleChange('camTableId', e.target.value)} 
                   />
                </InputGroup>
             )}
           </div>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm text-[11px] text-gray-600 italic">
        <strong>Note:</strong> In "Master/Follower" or "Camming" modes, the motion profile is automatically calculated from the Master Axis trajectory and cannot be edited manually.
      </div>
    </div>
  );
};
