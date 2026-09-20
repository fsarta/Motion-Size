import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Settings, Zap, List, Activity, Check, Wand2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { MechanismForm } from './forms/MechanismForm';
import { ProfileEditor } from './ProfileEditor';

const WizardButton = ({ label, icon, onClick, disabled, primary }: { label: string, icon?: React.ReactNode, onClick: () => void, disabled?: boolean, primary?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center p-2 px-4 border rounded shadow-sm text-sm font-medium ${
      disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500' :
      primary ? 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white' : 
      'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
    }`}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {label}
  </button>
);

export const WizardPanel = () => {
  const { addWizardAxis, setIsWizardOpen } = useProjectStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [data, setData] = useState<Record<string, any>>({
    axisName: 'Wizard Axis',
    axisUsage: 'Linear',
    mechanismType: 'Ball Screw',
    profileType: 'Time Based',
    motionProfileData: JSON.stringify([{
      id: crypto.randomUUID(),
      type: "Accel/Decel",
      duration: 1,
      distance: 200,
      velocity: 400,
      accel: 0, decel: 0, jerk: 0, payload: 0,
      calcTarget: "velocity"
    }])
  });

  const updateData = (updates: Record<string, any>) => setData(prev => ({ ...prev, ...updates }));
  const setSingleData = (k: string, v: string) => updateData({ [k]: v });

  const handleNext = () => { if (currentStep < 4) setCurrentStep(currentStep + 1); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const handleFinish = () => {
    addWizardAxis(data);
    setIsWizardOpen(false);
  };

  const steps = [
    { title: 'Welcome', icon: <Zap size={24} className="text-purple-600" /> },
    { title: 'Axis Definition', icon: <Settings size={24} className="text-blue-600" /> },
    { title: 'Mechanism', icon: <List size={24} className="text-orange-600" /> },
    { title: 'Motion Profile', icon: <Activity size={24} className="text-red-600" /> },
    { title: 'Finish', icon: <CheckCircle2 size={24} className="text-green-600" /> }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 text-gray-800 font-sans">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center shadow-sm shrink-0">
        <div className="bg-purple-100 p-2 rounded-full mr-4">
          <Wand2 size={28} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">EasySize Wizard</h2>
          <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block overflow-y-auto shrink-0">
          <ul className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className={`flex items-center p-3 rounded-lg border ${
                currentStep === i ? 'bg-blue-50 border-blue-200 shadow-sm' : 
                currentStep > i ? 'bg-white border-transparent text-gray-400' : 'bg-white border-transparent text-gray-400 opacity-50'
              }`}>
                <div className="mr-3">{currentStep > i ? <CheckCircle2 size={24} className="text-green-500" /> : s.icon}</div>
                <span className={`font-medium ${currentStep === i ? 'text-blue-800' : ''}`}>{s.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 overflow-y-auto bg-white flex flex-col items-center">
          <div className={`w-full p-8 ${currentStep === 2 || currentStep === 3 ? 'h-full flex flex-col' : 'max-w-4xl'}`}>
            
            {currentStep === 0 && (
              <div>
                <h3 className="text-2xl font-light text-gray-800 mb-6">Welcome to EasySize</h3>
                <p className="text-gray-600 mb-4 text-lg">
                  This wizard will guide you through the process of sizing a new axis in just a few clicks.
                </p>
                <ul className="space-y-3 text-gray-600 mb-8 list-disc pl-5">
                  <li>Define your axis name and type</li>
                  <li>Configure the full mechanical system</li>
                  <li>Build a detailed motion profile</li>
                  <li>Automatically generate the axis in your project</li>
                </ul>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-800 mb-6">Axis Definition</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Axis Name</label>
                  <input 
                    type="text" 
                    value={data.axisName} 
                    onChange={e => setSingleData('axisName', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Axis Usage (Motion Type)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setSingleData('axisUsage', 'Linear')}
                      className={`p-4 border rounded-lg cursor-pointer text-center ${data.axisUsage === 'Linear' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="font-bold mb-1">Linear</div>
                      <div className="text-xs text-gray-500">Straight line motion (mm)</div>
                    </div>
                    <div 
                      onClick={() => setSingleData('axisUsage', 'Rotary')}
                      className={`p-4 border rounded-lg cursor-pointer text-center ${data.axisUsage === 'Rotary' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="font-bold mb-1">Rotary</div>
                      <div className="text-xs text-gray-500">Rotational motion (deg)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col h-full">
                <h3 className="text-2xl font-light text-gray-800 mb-6">Mechanism</h3>
                <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg">
                  <MechanismForm params={data} onUpdate={updateData} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col h-full min-h-[400px]">
                <h3 className="text-2xl font-light text-gray-800 mb-6">Motion Profile</h3>
                <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg relative">
                  <ProfileEditor 
                    profileType={data.profileType} 
                    savedProfileData={data.motionProfileData}
                    posUnitType={data.axisUsage === 'Linear' ? 'length' : 'angle'}
                    totalInertia={0.01}
                    onProfileChange={(d) => setSingleData('motionProfileData', d)}
                    params={data}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-800 mb-6">Ready to Generate</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Axis Name:</span>
                    <span className="font-semibold text-gray-800">{data.axisName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Motion Type:</span>
                    <span className="font-semibold text-gray-800">{data.axisUsage}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Mechanism:</span>
                    <span className="font-semibold text-gray-800">{data.mechanismType}</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center">
                  <Check className="mr-2" size={20} />
                  <span>Click Finish to create the axis and perform motor sizing.</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 flex justify-between shrink-0">
        <WizardButton label="Cancel" onClick={() => setIsWizardOpen(false)} />
        <div className="flex space-x-3">
          <WizardButton label="Previous" icon={<ArrowLeft size={16} />} onClick={handlePrev} disabled={currentStep === 0} />
          {currentStep < steps.length - 1 ? (
            <WizardButton label="Next" icon={<ArrowRight size={16} />} onClick={handleNext} primary />
          ) : (
            <WizardButton label="Finish" icon={<CheckCircle2 size={16} />} onClick={handleFinish} primary />
          )}
        </div>
      </div>
    </div>
  );
};