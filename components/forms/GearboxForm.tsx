import React, { useMemo, useState } from 'react';
import { UnitInput, InputGroup, Select, SectionHeader } from '../Common';
import { getFullGearboxCatalog } from '../../catalogData';
import { GearboxSpec } from '../../types';
import { Sparkles, Edit3, Settings, FileText, SlidersHorizontal, CheckCircle2, AlertTriangle, Cog, ShieldCheck, Ruler } from 'lucide-react';
import { ComponentDatasheetModal } from '../modals/ComponentDatasheetModal';
import { CatalogExplorerModal } from '../modals/CatalogExplorerModal';

export const GearboxForm = ({ params, onUpdate }: { params: any, onUpdate: (p: any) => void }) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(params.gearboxVendor === 'Custom');
  const [datasheetOpen, setDatasheetOpen] = useState(false);
  const [explorerOpen, setIsExplorerOpen] = useState(false);

  const catalog = useMemo(() => getFullGearboxCatalog(), []);
  const uniqueVendors = useMemo(() => ['Custom', ...Array.from(new Set(catalog.map(g => g.vendor)))], [catalog]);
  const availableModels = useMemo(() => catalog.filter(g => g.vendor === params.gearboxVendor), [catalog, params.gearboxVendor]);

  const selectedGearbox = useMemo(() => {
    return catalog.find(g => g.model === params.gearboxModel && g.vendor === params.gearboxVendor);
  }, [catalog, params.gearboxModel, params.gearboxVendor]);

  const handleApplyGearbox = (specs: GearboxSpec) => {
    setIsCustomMode(false);
    onUpdate({
      gearboxVendor: specs.vendor,
      gearboxModel: specs.model,
      gearboxRatio: specs.ratio,
      gearboxEfficiency: specs.efficiency,
      gearboxInertia: specs.inertia,
      gearboxBacklash: specs.backlash,
      gearboxMaxInputSpeed: specs.maxInputSpeed,
      gearboxMass: specs.mass,
      gearboxNominalTorque: specs.nominalTorque,
      gearboxMaxTorque: specs.maxAccelerationTorque,
      gearboxMaxRadialForce: specs.maxRadialForce,
      gearboxMaxAxialForce: specs.maxAxialForce,
      gearboxTorsionalRigidity: specs.torsionalRigidity,
      gearboxOutputShaftDiameter: specs.outputShaftDiameter
    });
  };

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVendor = e.target.value;
    if (newVendor === 'Custom') {
      setIsCustomMode(true);
      onUpdate({
        gearboxVendor: 'Custom',
        gearboxModel: 'Custom Gearbox',
        gearboxRatio: params.gearboxRatio || 5,
        gearboxEfficiency: params.gearboxEfficiency || 95,
        gearboxInertia: params.gearboxInertia || 0.2,
        gearboxBacklash: params.gearboxBacklash || 5,
        gearboxMaxInputSpeed: params.gearboxMaxInputSpeed || 5000
      });
      return;
    }

    setIsCustomMode(false);
    const models = catalog.filter(g => g.vendor === newVendor);
    const firstModel = models[0];
    if (firstModel) {
      handleApplyGearbox(firstModel);
    } else {
      onUpdate({ gearboxVendor: newVendor, gearboxModel: '' });
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    const specs = catalog.find(g => g.model === newModel && g.vendor === params.gearboxVendor);
    if (specs) {
      handleApplyGearbox(specs);
    }
  };

  const ratioVal = parseFloat(String(params.gearboxRatio || 1));
  const inertiaDivisor = (ratioVal * ratioVal).toFixed(1);

  // Output Shaft Radial Force Estimation (from driver pulley or pinion)
  const driverDiaM = (parseFloat(String(params.driverDiameter || params.pinionDiameter || 50))) / 1000;
  const loadTorqueNm = parseFloat(String(params.peakTorque || 10)) * ratioVal;
  const estimatedRadialForceN = driverDiaM > 0 ? (2 * loadTorqueNm) / driverDiaM : 0;
  const permissibleRadialForceN = selectedGearbox?.maxRadialForce || params.gearboxMaxRadialForce || 1650;
  const isRadialSafe = estimatedRadialForceN <= permissibleRadialForceN;

  return (
    <div className="space-y-4">
      <SectionHeader 
        title="Gearbox & Speed Reducer" 
        rightContent={
          <div className="flex items-center space-x-2">
            {selectedGearbox && (
              <button
                onClick={() => setDatasheetOpen(true)}
                className="flex items-center px-2.5 py-1 rounded text-xs font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                title="View Certified Gearbox Technical Datasheet"
              >
                <FileText size={13} className="mr-1.5 text-blue-600" />
                Datasheet
              </button>
            )}

            <button
              onClick={() => setIsExplorerOpen(true)}
              className="flex items-center px-2.5 py-1 rounded text-xs font-bold bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100 shadow-sm"
              title="Explore all precision gearboxes with filters"
            >
              <SlidersHorizontal size={13} className="mr-1.5 text-blue-600" />
              Gearbox Catalog
            </button>

            <button
              onClick={() => {
                const newMode = !isCustomMode;
                setIsCustomMode(newMode);
                if (newMode) onUpdate({ gearboxVendor: 'Custom', gearboxModel: 'Custom Gearbox' });
              }}
              className={`flex items-center px-2 py-1 rounded text-xs font-bold border ${isCustomMode ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
            >
              <Edit3 size={12} className="mr-1" />
              {isCustomMode ? 'Custom Mode' : 'Custom'}
            </button>
          </div>
        }
      />

      {/* Inertia Reflection Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
        <div>
          <strong>Inertia Reflection Principle:</strong> Load inertia reflected to the motor is reduced by the square of the ratio: <strong>J_L,motor = J_load / i² = J_load / {inertiaDivisor}</strong>.
        </div>
        <div className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-blue-200 font-bold">
          Ratio: {ratioVal}:1
        </div>
      </div>

      {/* Selection Grid */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <InputGroup label="Vendor">
            <Select value={params.gearboxVendor || uniqueVendors[0]} options={uniqueVendors} onChange={handleVendorChange} />
          </InputGroup>

          {!isCustomMode ? (
            <InputGroup label="Model">
              <Select value={params.gearboxModel} options={availableModels.map(m => m.model)} onChange={handleModelChange} />
            </InputGroup>
          ) : (
            <InputGroup label="Model Name">
              <input
                type="text"
                className="w-full text-xs border border-gray-300 px-2 h-6 bg-white text-gray-900 focus:border-blue-500 outline-none"
                value={params.gearboxModel || 'Custom Gearbox'}
                onChange={(e) => onUpdate({ gearboxModel: e.target.value })}
              />
            </InputGroup>
          )}

          <InputGroup label="Gear Ratio (i)">
            <UnitInput 
              value={params.gearboxRatio || 1} 
              onChange={(val) => onUpdate({ gearboxRatio: parseFloat(val) || 1 })} 
              type="ratio" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>

          <InputGroup label="Efficiency (%)">
            <UnitInput 
              value={params.gearboxEfficiency || 95} 
              onChange={(val) => onUpdate({ gearboxEfficiency: parseFloat(val) || 95 })} 
              type="efficiency" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>
        </div>

        <div className="space-y-2">
          <InputGroup label="Gearbox Inertia">
            <UnitInput 
              value={params.gearboxInertia || 0} 
              onChange={(val) => onUpdate({ gearboxInertia: parseFloat(val) || 0 })} 
              type="inertia" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>

          <InputGroup label="Backlash">
            <UnitInput 
              value={params.gearboxBacklash || 0} 
              onChange={(val) => onUpdate({ gearboxBacklash: parseFloat(val) || 0 })} 
              type="angle" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>

          <InputGroup label="Max Input Speed">
            <UnitInput 
              value={params.gearboxMaxInputSpeed || 5000} 
              onChange={(val) => onUpdate({ gearboxMaxInputSpeed: parseFloat(val) || 5000 })} 
              type="speed" 
              readOnly={!isCustomMode} 
            />
          </InputGroup>
        </div>
      </div>

      {/* Complete Mechanical & Durability Specifications Card */}
      {selectedGearbox && (
        <div className="border border-gray-300 rounded overflow-hidden mt-2">
          <div className="bg-slate-100 px-3 py-2 border-b border-gray-300 font-bold text-slate-800 flex items-center justify-between text-xs">
            <span className="flex items-center">
              <Cog size={14} className="mr-1.5 text-blue-600" /> Certified Mechanical & Output Loading Ratings
            </span>
            <span className="text-[10px] text-gray-500 font-normal">DIN 3990 / ISO 9409-1</span>
          </div>

          <div className="p-3 bg-white grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500 text-[10px] font-bold block">Nominal Torque (T2N)</span>
              <span className="font-mono font-bold text-emerald-700">{selectedGearbox.nominalTorque || 45} Nm</span>
              <span className="text-[9px] text-gray-400 block">Accel T2B: {selectedGearbox.maxAccelerationTorque || 72} Nm</span>
            </div>

            <div>
              <span className="text-gray-500 text-[10px] font-bold block">Output Shaft Dimensions</span>
              <span className="font-mono font-bold text-slate-800">
                Dia {selectedGearbox.outputShaftDiameter || 16} × {selectedGearbox.outputShaftLength || 28} mm
              </span>
              <span className="text-[9px] text-gray-400 block">{selectedGearbox.outputShaftType || 'DIN 6885-1 Key'}</span>
            </div>

            <div>
              <span className="text-gray-500 text-[10px] font-bold block">Torsional Rigidity (Ct)</span>
              <span className="font-mono font-bold text-slate-800">{selectedGearbox.torsionalRigidity || 6.5} Nm / arcmin</span>
              <span className="text-[9px] text-gray-400 block">Weight: {selectedGearbox.mass || 1.8} kg</span>
            </div>

            <div>
              <span className="text-gray-500 text-[10px] font-bold block">Permissible Output Radial Force</span>
              <span className="font-mono font-bold text-blue-900">{selectedGearbox.maxRadialForce || 1650} N</span>
              <span className="text-[9px] text-gray-400 block">Axial Fa2: {selectedGearbox.maxAxialForce || 2100} N</span>
            </div>
          </div>

          {/* Radial Loading Verification */}
          {estimatedRadialForceN > 0 && (
            <div className="bg-slate-50 border-t border-gray-200 px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {isRadialSafe ? <CheckCircle2 size={15} className="text-green-600"/> : <AlertTriangle size={15} className="text-amber-600"/>}
                <span className="text-slate-700">
                  Estimated Output Shaft Radial Force: <strong>{estimatedRadialForceN.toFixed(0)} N</strong> (Limit: {permissibleRadialForceN} N)
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isRadialSafe ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {((estimatedRadialForceN / permissibleRadialForceN) * 100).toFixed(0)}% Radial Capacity
              </span>
            </div>
          )}
        </div>
      )}

      {/* Datasheet Modal */}
      <ComponentDatasheetModal
        isOpen={datasheetOpen}
        onClose={() => setDatasheetOpen(false)}
        type="gearbox"
        gearbox={selectedGearbox}
        appliedRadialForce={estimatedRadialForceN}
      />

      {/* Catalog Explorer Modal */}
      <CatalogExplorerModal
        isOpen={explorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        initialTab="gearboxes"
        activeAxisName={params.axisName}
        onSelectGearbox={handleApplyGearbox}
      />
    </div>
  );
};
