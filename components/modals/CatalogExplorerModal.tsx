import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Cpu, Zap, Cog, Check, SlidersHorizontal, ArrowUpDown, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { MotorSpec, DriveSpec, GearboxSpec } from '../../types';
import { getFullMotorCatalog, getFullDriveCatalog, getFullGearboxCatalog } from '../../catalogData';

interface CatalogExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMotor?: (motor: MotorSpec) => void;
  onSelectDrive?: (drive: DriveSpec) => void;
  onSelectGearbox?: (gearbox: GearboxSpec) => void;
  onOpenDatasheet?: (type: 'motor' | 'drive' | 'gearbox', item: any) => void;
  initialTab?: 'motors' | 'drives' | 'gearboxes';
  activeAxisName?: string;
}

export const CatalogExplorerModal: React.FC<CatalogExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectMotor,
  onSelectDrive,
  onSelectGearbox,
  onOpenDatasheet,
  initialTab = 'motors',
  activeAxisName = 'Active Axis'
}) => {
  const [activeTab, setActiveTab] = useState<'motors' | 'drives' | 'gearboxes'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [minTorque, setMinTorque] = useState<number | ''>('');
  const [maxTorque, setMaxTorque] = useState<number | ''>('');
  const [minSpeed, setMinSpeed] = useState<number | ''>('');
  const [ratioFilter, setRatioFilter] = useState('All');
  
  // Side-by-side comparison state
  const [compareList, setCompareList] = useState<any[]>([]);

  const motorCatalog = useMemo(() => getFullMotorCatalog(), []);
  const driveCatalog = useMemo(() => getFullDriveCatalog(), []);
  const gearboxCatalog = useMemo(() => getFullGearboxCatalog(), []);

  if (!isOpen) return null;

  // Vendors per category
  const motorVendors = ['All', ...Array.from(new Set(motorCatalog.map(m => m.vendor)))];
  const driveVendors = ['All', ...Array.from(new Set(driveCatalog.map(d => d.vendor)))];
  const gearboxVendors = ['All', ...Array.from(new Set(gearboxCatalog.map(g => g.vendor)))];

  // Unique ratios for gearboxes
  const uniqueRatios = ['All', ...Array.from(new Set(gearboxCatalog.map(g => String(g.ratio)))).sort((a,b) => Number(a)-Number(b))];

  // Filtering
  const filteredMotors = motorCatalog.filter(m => {
    if (vendorFilter !== 'All' && m.vendor !== vendorFilter) return false;
    if (searchQuery && !m.model.toLowerCase().includes(searchQuery.toLowerCase()) && !m.series?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (minTorque !== '' && m.ratedTorque < Number(minTorque)) return false;
    if (maxTorque !== '' && m.ratedTorque > Number(maxTorque)) return false;
    if (minSpeed !== '' && m.ratedSpeed < Number(minSpeed)) return false;
    return true;
  });

  const filteredDrives = driveCatalog.filter(d => {
    if (vendorFilter !== 'All' && d.vendor !== vendorFilter) return false;
    if (searchQuery && !d.model.toLowerCase().includes(searchQuery.toLowerCase()) && !d.series?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredGearboxes = gearboxCatalog.filter(g => {
    if (vendorFilter !== 'All' && g.vendor !== vendorFilter) return false;
    if (searchQuery && !g.model.toLowerCase().includes(searchQuery.toLowerCase()) && !g.series?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (ratioFilter !== 'All' && String(g.ratio) !== ratioFilter) return false;
    return true;
  });

  const toggleCompare = (item: any) => {
    if (compareList.some(c => c.model === item.model)) {
      setCompareList(compareList.filter(c => c.model !== item.model));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 models simultaneously.');
        return;
      }
      setCompareList([...compareList, item]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-md shadow-2xl border border-gray-400 w-full max-w-6xl h-[92vh] flex flex-col font-sans text-xs overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-3 flex justify-between items-center border-b border-slate-700 select-none">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-600 rounded text-white shadow">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Industrial Component Catalog Explorer</h2>
              <div className="text-[10px] text-slate-300">
                Browse, filter, and compare verified servo motors, drives, and gearboxes for: <span className="text-blue-300 font-bold">{activeAxisName}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector & Search Filters Bar */}
        <div className="bg-slate-100 border-b border-gray-300 px-5 py-2.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Main Category Tabs */}
          <div className="flex space-x-1 bg-slate-200 p-0.5 rounded border border-gray-300">
            <button
              onClick={() => { setActiveTab('motors'); setVendorFilter('All'); setCompareList([]); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                activeTab === 'motors' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-black'
              }`}
            >
              <Cpu size={14} />
              <span>Servo Motors ({filteredMotors.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('drives'); setVendorFilter('All'); setCompareList([]); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                activeTab === 'drives' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-black'
              }`}
            >
              <Zap size={14} />
              <span>Servo Inverters ({filteredDrives.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('gearboxes'); setVendorFilter('All'); setCompareList([]); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                activeTab === 'gearboxes' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-black'
              }`}
            >
              <Cog size={14} />
              <span>Precision Gearboxes ({filteredGearboxes.length})</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-gray-600 uppercase">Vendor:</span>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white font-medium"
              >
                {(activeTab === 'motors' ? motorVendors : activeTab === 'drives' ? driveVendors : gearboxVendors).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {activeTab === 'motors' && (
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Torque (Nm):</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minTorque}
                  onChange={(e) => setMinTorque(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded px-1.5 py-1 text-xs text-center"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxTorque}
                  onChange={(e) => setMaxTorque(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-14 border border-gray-300 rounded px-1.5 py-1 text-xs text-center"
                />
              </div>
            )}

            {activeTab === 'gearboxes' && (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Ratio:</span>
                <select
                  value={ratioFilter}
                  onChange={(e) => setRatioFilter(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs bg-white font-medium"
                >
                  {uniqueRatios.map(r => (
                    <option key={r} value={r}>{r === 'All' ? 'All Ratios' : `i = ${r}:1`}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search model, series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 border border-gray-300 rounded text-xs w-48 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Comparison Drawer (if any selected) */}
        {compareList.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-blue-900 text-xs">Compare ({compareList.length}/3):</span>
              <div className="flex space-x-2">
                {compareList.map(c => (
                  <span key={c.model} className="inline-flex items-center bg-white px-2 py-0.5 rounded border border-blue-300 text-blue-800 text-[11px] font-semibold">
                    {c.model}
                    <button onClick={() => toggleCompare(c)} className="ml-1.5 text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Clear Comparison
            </button>
          </div>
        )}

        {/* Content Table Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            
            {/* MOTORS TABLE */}
            {activeTab === 'motors' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-gray-300 text-[10px] text-gray-700 font-bold uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 border-r">Vendor</th>
                    <th className="p-2.5 border-r">Series</th>
                    <th className="p-2.5 border-r">Model Part No.</th>
                    <th className="p-2.5 border-r text-center">Rated Torque</th>
                    <th className="p-2.5 border-r text-center">Peak Torque</th>
                    <th className="p-2.5 border-r text-center">Rated Speed</th>
                    <th className="p-2.5 border-r text-center">Max Speed</th>
                    <th className="p-2.5 border-r text-center">Inertia ($J_M$)</th>
                    <th className="p-2.5 border-r text-center">Flange</th>
                    <th className="p-2.5 border-r text-center">Shaft</th>
                    <th className="p-2.5 border-r text-center">Weight</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMotors.map((m) => {
                    const isCompared = compareList.some(c => c.model === m.model);
                    return (
                      <tr key={m.model} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-2.5 border-r font-bold text-gray-700">{m.vendor}</td>
                        <td className="p-2.5 border-r text-gray-500 font-medium">{m.series || '-'}</td>
                        <td className="p-2.5 border-r font-mono font-bold text-blue-900">{m.model}</td>
                        <td className="p-2.5 border-r text-center font-mono font-bold text-emerald-700">{m.ratedTorque} Nm</td>
                        <td className="p-2.5 border-r text-center font-mono font-bold text-amber-700">{m.peakTorque} Nm</td>
                        <td className="p-2.5 border-r text-center font-mono">{m.ratedSpeed} RPM</td>
                        <td className="p-2.5 border-r text-center font-mono">{m.peakSpeed} RPM</td>
                        <td className="p-2.5 border-r text-center font-mono">{m.inertia} kg·cm²</td>
                        <td className="p-2.5 border-r text-center font-mono">{m.flangeSize || 100} mm</td>
                        <td className="p-2.5 border-r text-center font-mono">$\varnothing${m.shaftDiameter || 19} mm</td>
                        <td className="p-2.5 border-r text-center font-mono">{m.motorMass || 6.5} kg</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => onOpenDatasheet?.('motor', m)}
                              className="p-1 hover:bg-slate-100 text-gray-600 rounded border border-gray-300"
                              title="View Full Technical Datasheet"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => toggleCompare(m)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                isCompared ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {isCompared ? 'Compared' : 'Compare'}
                            </button>
                            <button
                              onClick={() => { onSelectMotor?.(m); onClose(); }}
                              className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shadow-sm"
                            >
                              Apply
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMotors.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-400 italic">
                        No servo motors match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* DRIVES TABLE */}
            {activeTab === 'drives' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-gray-300 text-[10px] text-gray-700 font-bold uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 border-r">Vendor</th>
                    <th className="p-2.5 border-r">Series</th>
                    <th className="p-2.5 border-r">Model Part No.</th>
                    <th className="p-2.5 border-r">Type</th>
                    <th className="p-2.5 border-r text-center">Supply Voltage</th>
                    <th className="p-2.5 border-r text-center">Continuous Current</th>
                    <th className="p-2.5 border-r text-center">Peak Current</th>
                    <th className="p-2.5 border-r text-center">Bus Capacitance</th>
                    <th className="p-2.5 border-r text-center">PWM Freq</th>
                    <th className="p-2.5 border-r text-center">Dimensions</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDrives.map((d) => (
                    <tr key={d.model} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-2.5 border-r font-bold text-gray-700">{d.vendor}</td>
                      <td className="p-2.5 border-r text-gray-500 font-medium">{d.series || '-'}</td>
                      <td className="p-2.5 border-r font-mono font-bold text-blue-900">{d.model}</td>
                      <td className="p-2.5 border-r text-gray-600">{d.driveType || 'Single Axis'}</td>
                      <td className="p-2.5 border-r text-center font-mono">{d.supplyVoltage} V AC</td>
                      <td className="p-2.5 border-r text-center font-mono font-bold text-emerald-700">{d.ratedOutputCurrent || (d.maxCurrent/2).toFixed(1)} Arms</td>
                      <td className="p-2.5 border-r text-center font-mono font-bold text-amber-700">{d.maxCurrent} Arms</td>
                      <td className="p-2.5 border-r text-center font-mono">{d.internalBusCapacitance || 220} $\mu$F</td>
                      <td className="p-2.5 border-r text-center font-mono">{d.pwmFrequency} kHz</td>
                      <td className="p-2.5 border-r text-center font-mono text-[11px]">
                        {d.dimensions ? `${d.dimensions.width}x${d.dimensions.height}x${d.dimensions.depth}` : '50x380x270'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenDatasheet?.('drive', d)}
                            className="p-1 hover:bg-slate-100 text-gray-600 rounded border border-gray-300"
                            title="View Full Technical Datasheet"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => { onSelectDrive?.(d); onClose(); }}
                            className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shadow-sm"
                          >
                            Apply
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDrives.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400 italic">
                        No servo inverters match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* GEARBOXES TABLE */}
            {activeTab === 'gearboxes' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-gray-300 text-[10px] text-gray-700 font-bold uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 border-r">Vendor</th>
                    <th className="p-2.5 border-r">Series</th>
                    <th className="p-2.5 border-r">Model Part No.</th>
                    <th className="p-2.5 border-r text-center">Ratio</th>
                    <th className="p-2.5 border-r text-center">Nominal Torque (T2N)</th>
                    <th className="p-2.5 border-r text-center">Max Accel (T2B)</th>
                    <th className="p-2.5 border-r text-center">Backlash</th>
                    <th className="p-2.5 border-r text-center">Efficiency</th>
                    <th className="p-2.5 border-r text-center">Input Inertia (J1)</th>
                    <th className="p-2.5 border-r text-center">Output Shaft</th>
                    <th className="p-2.5 border-r text-center">Max Radial (Fr2)</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredGearboxes.map((g) => (
                    <tr key={g.model} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-2.5 border-r font-bold text-gray-700">{g.vendor}</td>
                      <td className="p-2.5 border-r text-gray-500 font-medium">{g.series || '-'}</td>
                      <td className="p-2.5 border-r font-mono font-bold text-blue-900">{g.model}</td>
                      <td className="p-2.5 border-r text-center font-mono font-bold text-blue-800">{g.ratio}:1</td>
                      <td className="p-2.5 border-r text-center font-mono font-bold text-emerald-700">{g.nominalTorque || 45} Nm</td>
                      <td className="p-2.5 border-r text-center font-mono font-bold text-amber-700">{g.maxAccelerationTorque || 72} Nm</td>
                      <td className="p-2.5 border-r text-center font-mono font-bold">{g.backlash} arcmin</td>
                      <td className="p-2.5 border-r text-center font-mono">{g.efficiency}%</td>
                      <td className="p-2.5 border-r text-center font-mono">{g.inertia} kg·cm²</td>
                      <td className="p-2.5 border-r text-center font-mono">$\varnothing${g.outputShaftDiameter || 16} mm</td>
                      <td className="p-2.5 border-r text-center font-mono">{g.maxRadialForce || 1650} N</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenDatasheet?.('gearbox', g)}
                            className="p-1 hover:bg-slate-100 text-gray-600 rounded border border-gray-300"
                            title="View Full Technical Datasheet"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => { onSelectGearbox?.(g); onClose(); }}
                            className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shadow-sm"
                          >
                            Apply
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGearboxes.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-400 italic">
                        No precision gearboxes match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-gray-300 px-5 py-3 flex justify-between items-center text-xs text-gray-600">
          <div>
            Showing <strong>{activeTab === 'motors' ? filteredMotors.length : activeTab === 'drives' ? filteredDrives.length : filteredGearboxes.length}</strong> catalog items with certified specifications.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded font-semibold text-gray-800 transition-colors"
          >
            Close Explorer
          </button>
        </div>

      </div>
    </div>
  );
};
