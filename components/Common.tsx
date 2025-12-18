
import React, { useState, useMemo, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { 
  toDisplay, 
  toBase, 
  getDefaultUnit, 
  getUnitsForType, 
  UnitType 
} from '../utils/unitConversion';

export const InputGroup = ({ label, children, className="" }: { label: string, children?: React.ReactNode, className?: string }) => (
  <div className={`flex items-center mb-1.5 ${className}`}>
    <div className="w-32 text-xs text-win-blue font-medium truncate pr-2 flex items-center text-right justify-end shrink-0">
        {label}
    </div>
    <div className="flex-1 flex items-center min-w-0">
      {children}
    </div>
  </div>
);

export const SectionHeader = ({ title, rightContent }: { title: string, rightContent?: React.ReactNode }) => (
  <div className="flex justify-between items-end border-b border-gray-300 mb-2 pb-0.5 mt-3">
    <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">
      {title}
    </div>
    {rightContent}
  </div>
);

export const FormTabs = ({ tabs, activeTab, onTabClick }: { tabs: string[], activeTab: string, onTabClick: (t: string) => void }) => (
  <div className="flex border-b border-gray-300 mb-3 bg-gray-100">
    {tabs.map(tab => (
      <div 
        key={tab}
        onClick={() => onTabClick(tab)}
        className={`px-3 py-1.5 text-xs cursor-pointer border-r border-gray-300 hover:bg-gray-50
          ${activeTab === tab ? 'bg-white font-bold border-t-2 border-t-blue-500 border-b-white translate-y-[1px]' : 'text-gray-600'}
        `}
      >
        {tab}
      </div>
    ))}
  </div>
);

export const Select = ({ value, options, onChange, className }: { value?: string | number, options: string[], onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void, className?: string }) => (
  <select 
    value={value} 
    onChange={onChange}
    className={`w-full text-xs border border-gray-300 bg-white text-gray-900 px-1 py-0.5 focus:outline-none focus:border-blue-500 h-6 ${className || ''}`}
    style={{ backgroundColor: '#ffffff', color: '#111827' }}
  >
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export const UnitInput = ({ 
  value, 
  onChange, 
  type, 
  readOnly,
  hasCalculator,
  onCalculatorClick,
  unitFilter,
  unitAsTextbox = false
}: { 
  value: string | number | undefined, 
  onChange: (val: string) => void, 
  type: UnitType, 
  readOnly?: boolean,
  hasCalculator?: boolean,
  onCalculatorClick?: () => void,
  unitFilter?: string[],
  unitAsTextbox?: boolean
}) => {
  const availableUnits = useMemo(() => {
    const units = getUnitsForType(type);
    if (unitFilter && unitFilter.length > 0) {
      return units.filter(u => unitFilter.includes(u));
    }
    return units;
  }, [type, unitFilter]);

  const [currentUnit, setCurrentUnit] = useState<string>(() => availableUnits[0] || getDefaultUnit(type));
  const [isEditing, setIsEditing] = useState(false);
  
  const computedDisplay = useMemo(() => toDisplay(value, type, currentUnit), [value, type, currentUnit]);
  const [localValue, setLocalValue] = useState(computedDisplay);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(computedDisplay);
    }
  }, [computedDisplay, isEditing]);

  useEffect(() => {
    if (availableUnits.length > 0 && !availableUnits.includes(currentUnit)) {
      setCurrentUnit(availableUnits[0]);
    }
  }, [availableUnits]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    const baseVal = toBase(newVal, type, currentUnit);
    onChange(baseVal);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setLocalValue(computedDisplay);
  };

  const handleFocus = () => {
    if (!readOnly) setIsEditing(true);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setCurrentUnit(newUnit);
    setIsEditing(false);
  };

  return (
    <div className="flex w-full items-center">
      <div className="relative flex-1 flex items-center">
        <input 
          type="text" 
          value={localValue} 
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          readOnly={readOnly}
          className={`w-full min-w-0 text-right text-xs border border-gray-300 px-1 py-0.5 focus:outline-none focus:border-blue-500 h-6 ${readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'}`} 
          style={{ 
             backgroundColor: readOnly ? '#f3f4f6' : '#ffffff', 
             color: readOnly ? '#6b7280' : '#111827' 
          }}
        />
      </div>
      
      {/* Unit Part */}
      {availableUnits.length > 0 && (
        unitAsTextbox || type === 'ratio' ? (
          <input
            type="text"
            readOnly
            value={currentUnit}
            className="ml-1 w-20 text-[10px] border border-gray-300 bg-gray-50 py-0.5 h-6 focus:outline-none text-gray-700 shrink-0 text-center font-bold"
          />
        ) : (
          <select 
            value={currentUnit} 
            onChange={handleUnitChange}
            disabled={availableUnits.length < 2}
            className="ml-1 w-20 text-[10px] border border-gray-300 bg-gray-50 py-0.5 h-6 focus:outline-none text-gray-700 shrink-0"
          >
            {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )
      )}

      {hasCalculator && (
        <button 
          onClick={onCalculatorClick}
          className="ml-1 p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm flex items-center justify-center w-6 h-6" 
          title="Open Calculator"
        >
           <Calculator size={14} className="text-blue-600"/>
        </button>
      )}
    </div>
  );
};
