import React from 'react';
import { Gauge, Link as LinkIcon } from 'lucide-react';
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
    <div>
      <div className="p-4 bg-yellow-50 border border-yellow-200 mb-4 rounded-sm text-xs text-yellow-800">
        Select a specific component (Mechanism, Gearbox, Motor) from the tree to edit its parameters.
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <SectionHeader title="Axis Definition" />
          <InputGroup label="Axis Name">
            <input 
              type="text" 
              className="w-full text-xs border border-gray-300 px-1 h-6 bg-white text-gray-900" 
              style={{ backgroundColor: '#ffffff', color: '#111827' }}
              value={params.axisName} 
              onChange={(e) => handleChange('axisName', e.target.value)} 
            />
          </InputGroup>
          <InputGroup label="Profile Type">
             <Select value={params.profileType} options={['Time Based', 'Master/Follower', 'Camming']} onChange={(e) => handleChange('profileType', e.target.value)} />
          </InputGroup>
        </div>
        
        {isMasterFollower && (
          <div>
             <SectionHeader title="Master Configuration" rightContent={<LinkIcon size={12} className="text-blue-600"/>} />
             <InputGroup label="Master Axis">
                <Select value={params.masterAxis || 'Virtual Master'} options={masterOptions} onChange={(e) => handleChange('masterAxis', e.target.value)} />
             </InputGroup>
             
             {params.profileType === 'Master/Follower' && (
               <InputGroup label="Gear Ratio">
                 <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      className="w-12 h-6 border border-gray-300 px-1 text-right text-xs bg-white text-gray-900"
                      style={{ backgroundColor: '#ffffff', color: '#111827' }} 
                      value={params.gearRatioNum || 1} 
                      onChange={(e) => handleChange('gearRatioNum', e.target.value)}
                    />
                    <span>:</span>
                    <input 
                      type="number" 
                      className="w-12 h-6 border border-gray-300 px-1 text-right text-xs bg-white text-gray-900" 
                      style={{ backgroundColor: '#ffffff', color: '#111827' }}
                      value={params.gearRatioDen || 1} 
                      onChange={(e) => handleChange('gearRatioDen', e.target.value)}
                    />
                 </div>
               </InputGroup>
             )}

             {params.profileType === 'Camming' && (
                <InputGroup label="Cam Table ID">
                   <Select 
                      value={params.camTableId || (camOptions[0] ?? '')} 
                      options={camOptions} 
                      onChange={(e) => handleChange('camTableId', e.target.value)} 
                   />
                </InputGroup>
             )}
          </div>
        )}
      </div>
      
      {/* Informational Panel about the Profile */}
      <div className="mt-8 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <div className="flex items-start">
             <div className="mr-2 mt-0.5 text-blue-500"><Gauge size={16} /></div>
             <div>
                <span className="font-bold text-gray-800">Control Mode Description:</span>
                <p className="mt-1">
                   {params.profileType === 'Time Based' && "The axis operates autonomously using an internal trajectory generator. The Motion Profile tab defines the target position/velocity over time directly."}
                   {params.profileType === 'Master/Follower' && "The axis position is electronically geared to a Master Axis. The Motion Profile tab represents the REQUIRED output motion, which is achieved by scaling the Master's motion."}
                   {params.profileType === 'Camming' && "The axis follows a non-linear Cam Table synchronized to a Master Axis. The Motion Profile tab shows the resulting cycle based on the Master's speed."}
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};