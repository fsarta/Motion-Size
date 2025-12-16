
export type UnitType = 'torque' | 'power' | 'inertia' | 'length' | 'mass' | 'force' | 'current' | 'voltage' | 'frequency' | 'speed' | 'ratio' | 'efficiency' | 'angle' | 'factor' | 'density' | 'temperature' | 'time' | 'volume';

interface UnitDef {
  label: string;
  factor: number; // Multiplier to go from BASE to THIS UNIT. (Display = Base * Factor)
  precision: number;
}

// BASE UNITS ASSUMPTION (Internal Storage):
// Length: mm
// Mass: kg
// Force: N
// Torque: Nm
// Power: kW
// Inertia: kg·cm²
// Speed: rpm
// Angle: deg
// Temperature: C
// Time: s
// Volume: m³

export const UNIT_DEFINITIONS: Record<UnitType, Record<string, UnitDef>> = {
  length: {
    'mm': { label: 'mm', factor: 1, precision: 2 },
    'm': { label: 'm', factor: 0.001, precision: 4 },
    'in': { label: 'in', factor: 0.0393701, precision: 3 },
    'ft': { label: 'ft', factor: 0.00328084, precision: 4 },
  },
  mass: {
    'kg': { label: 'kg', factor: 1, precision: 1 },
    'g': { label: 'g', factor: 1000, precision: 0 },
    'lb': { label: 'lb', factor: 2.20462, precision: 2 },
    'oz': { label: 'oz', factor: 35.274, precision: 1 },
  },
  force: {
    'N': { label: 'N', factor: 1, precision: 1 },
    'kN': { label: 'kN', factor: 0.001, precision: 3 },
    'lbf': { label: 'lbf', factor: 0.224809, precision: 1 },
  },
  torque: {
    'Nm': { label: 'Nm', factor: 1, precision: 2 },
    'lb-in': { label: 'lb-in', factor: 8.85075, precision: 2 },
    'lb-ft': { label: 'lb-ft', factor: 0.737562, precision: 2 },
    'kg-cm': { label: 'kg-cm', factor: 10.1972, precision: 2 },
  },
  inertia: {
    'kg·cm²': { label: 'kg·cm²', factor: 1, precision: 3 },
    'kg·m²': { label: 'kg·m²', factor: 0.0001, precision: 6 },
    'lb·in²': { label: 'lb·in²', factor: 0.341717, precision: 3 },
    'lb·ft²': { label: 'lb·ft²', factor: 0.00237304, precision: 5 },
  },
  power: {
    'kW': { label: 'kW', factor: 1, precision: 2 },
    'W': { label: 'W', factor: 1000, precision: 0 },
    'HP': { label: 'HP', factor: 1.34102, precision: 2 },
  },
  speed: {
    'rpm': { label: 'rpm', factor: 1, precision: 0 },
    'rad/s': { label: 'rad/s', factor: 0.10472, precision: 2 },
    'm/s': { label: 'm/s (lin)', factor: 0, precision: 2 }, // Context dependent, usually kept separate
  },
  density: {
    'kg/m³': { label: 'kg/m³', factor: 1, precision: 0 }, 
    'g/cm³': { label: 'g/cm³', factor: 0.001, precision: 2 },
    'lb/in³': { label: 'lb/in³', factor: 0.000036127, precision: 4 }, 
  },
  volume: {
    'm³': { label: 'm³', factor: 1, precision: 6 },
    'cm³': { label: 'cm³', factor: 1000000, precision: 1 },
    'mm³': { label: 'mm³', factor: 1000000000, precision: 0 },
    'L': { label: 'L', factor: 1000, precision: 3 },
  },
  angle: {
    'deg': { label: '°', factor: 1, precision: 1 },
    'rad': { label: 'rad', factor: 0.0174533, precision: 3 },
    'arcmin': { label: 'arcmin', factor: 60, precision: 0 },
  },
  temperature: {
    'C': { label: '°C', factor: 1, precision: 1 },
    'F': { label: '°F', factor: 1, precision: 1 }, 
  },
  time: {
    's': { label: 's', factor: 1, precision: 2 },
    'ms': { label: 'ms', factor: 1000, precision: 0 },
    'min': { label: 'min', factor: 1 / 60, precision: 2 },
  },
  // Pass-throughs / Singles
  current: { 'Arms': { label: 'Arms', factor: 1, precision: 2 } },
  voltage: { 'V': { label: 'V', factor: 1, precision: 0 }, 'kV': { label: 'kV', factor: 0.001, precision: 2 } },
  frequency: { 'Hz': { label: 'Hz', factor: 1000, precision: 0 }, 'kHz': { label: 'kHz', factor: 1, precision: 1 } },
  ratio: { ':1': { label: ':1', factor: 1, precision: 2 } },
  efficiency: { '%': { label: '%', factor: 1, precision: 1 } },
  factor: { 'µ': { label: '', factor: 1, precision: 2 } },
};

/**
 * Converts a stored base value to a display value in the target unit.
 */
export const toDisplay = (baseValue: string | number | undefined, type: UnitType, unitKey: string): string => {
  if (baseValue === undefined || baseValue === '' || baseValue === null) return '';
  const numValue = typeof baseValue === 'string' ? parseFloat(baseValue) : baseValue;
  if (isNaN(numValue)) return String(baseValue);

  const defs = UNIT_DEFINITIONS[type];
  if (!defs || !defs[unitKey]) return String(numValue);

  const def = defs[unitKey];
  
  return (numValue * def.factor).toFixed(def.precision);
};

/**
 * Converts a displayed value back to the base unit for storage.
 */
export const toBase = (displayValue: string | number, type: UnitType, unitKey: string): string => {
  const numValue = typeof displayValue === 'string' ? parseFloat(displayValue) : displayValue;
  if (isNaN(numValue)) return String(displayValue);

  const defs = UNIT_DEFINITIONS[type];
  if (!defs || !defs[unitKey]) return String(numValue);

  const def = defs[unitKey];
  
  // Base = Display / Factor
  return (numValue / def.factor).toPrecision(10); 
};

/**
 * Gets the default unit key for a type (usually the first one defined or 'metric' equivalent)
 */
export const getDefaultUnit = (type: UnitType): string => {
  const defs = UNIT_DEFINITIONS[type];
  if (!defs) return '';
  return Object.keys(defs)[0];
};

/**
 * Returns list of units for a type
 */
export const getUnitsForType = (type: UnitType): string[] => {
  return UNIT_DEFINITIONS[type] ? Object.keys(UNIT_DEFINITIONS[type]) : [];
};
