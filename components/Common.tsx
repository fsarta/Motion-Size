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

export const Select = ({ value, options, onChange, className }: { value?: string | number, options: string[], onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void, className?: string }) => (
  <select 
    value={value} 
    onChange={onChange}
    className={`w-full text-xs border border-gray-300 bg-white px-1 py-0.5 focus:outline-none focus:border-blue-500 h-6 ${className || ''}`}
  >
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// Advanced Input that handles Unit Selection and Auto-Conversion
export const UnitInput = ({ 
  value, 
  onChange, 
  type, 
  readOnly,
  hasCalculator,
  onCalculatorClick
}: { 
  value: string | number | undefined, 
  onChange: (val: string) => void, 
  type: UnitType, 
  readOnly?: boolean,
  hasCalculator?: boolean,
  onCalculatorClick?: () => void
}) => {
  const [currentUnit, setCurrentUnit] = useState<string>(() => getDefaultUnit(type));
  const [isEditing, setIsEditing] = useState(false);
  
  const computedDisplay = useMemo(() => toDisplay(value, type, currentUnit), [value, type, currentUnit]);
  const [localValue, setLocalValue] = useState(computedDisplay);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(computedDisplay);
    }
  }, [computedDisplay, isEditing]);

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

  const availableUnits = getUnitsForType(type);

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
          className={`w-full min-w-0 text-right text-xs border border-gray-300 px-1 py-0.5 focus:outline-none focus:border-blue-500 h-6 ${readOnly ? 'bg-gray-100 text-gray-600' : 'bg-white'}`} 
        />
        {hasCalculator && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1 pointer-events-none">
             {/* Visual indicator placeholder if needed */}
          </div>
        )}
      </div>
      {hasCalculator && (
        <button 
          onClick={onCalculatorClick}
          className="ml-0.5 p-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-sm" 
          title="Open Calculator"
        >
           <Calculator size={12} className="text-gray-600"/>
        </button>
      )}
      {availableUnits.length > 0 && (
        <select 
          value={currentUnit} 
          onChange={handleUnitChange}
          disabled={availableUnits.length < 2}
          className="ml-1 w-20 text-[10px] border border-gray-300 bg-gray-50 py-0.5 h-6 focus:outline-none text-gray-700 shrink-0"
        >
          {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      )}
    </div>
  );
};
