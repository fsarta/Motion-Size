
type UnitType = 'torque' | 'power' | 'inertia' | 'length' | 'mass' | 'force' | 'current' | 'voltage' | 'frequency' | 'speed' | 'ratio' | 'efficiency' | 'angle' | 'factor';

interface ConversionDef {
  factor: number; // Multiplier to go from Metric to Imperial
  metric: string;
  imperial: string;
  precision: number;
}

const CONVERSIONS: Record<string, ConversionDef> = {
  torque: { factor: 0.737562, metric: 'Nm', imperial: 'lb-ft', precision: 2 },
  power: { factor: 1.34102, metric: 'kW', imperial: 'HP', precision: 2 },
  inertia: { factor: 0.341717, metric: 'kg·cm²', imperial: 'lb·in²', precision: 3 },
  length: { factor: 0.0393701, metric: 'mm', imperial: 'in', precision: 2 },
  mass: { factor: 2.20462, metric: 'kg', imperial: 'lb', precision: 1 },
  force: { factor: 0.224809, metric: 'N', imperial: 'lbf', precision: 1 },
  // Pass-through units (no conversion needed usually, or standard across both)
  current: { factor: 1, metric: 'Arms', imperial: 'Arms', precision: 1 },
  voltage: { factor: 1, metric: 'V', imperial: 'V', precision: 0 },
  frequency: { factor: 1, metric: 'kHz', imperial: 'kHz', precision: 0 },
  speed: { factor: 1, metric: 'rpm', imperial: 'rpm', precision: 0 },
  ratio: { factor: 1, metric: '', imperial: '', precision: 2 },
  efficiency: { factor: 1, metric: '%', imperial: '%', precision: 1 },
  angle: { factor: 1, metric: 'arcmin', imperial: 'arcmin', precision: 1 },
  factor: { factor: 1, metric: 'cosφ', imperial: 'cosφ', precision: 2 },
};

export const System = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
} as const;

export type SystemType = typeof System[keyof typeof System];

export const convert = (
  value: string | number | undefined, 
  type: UnitType, 
  targetSystem: SystemType
): string => {
  if (value === undefined || value === '' || value === null) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return String(value);

  const def = CONVERSIONS[type];
  if (!def) return String(numValue);

  if (targetSystem === System.METRIC) {
    return String(numValue); // Assuming source data is always stored in Metric
  } else {
    return (numValue * def.factor).toFixed(def.precision);
  }
};

export const toMetric = (
  value: string | number, 
  type: UnitType, 
  sourceSystem: SystemType
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return String(value);

  const def = CONVERSIONS[type];
  if (!def) return String(numValue);

  if (sourceSystem === System.METRIC) {
    return String(numValue);
  } else {
    // Convert Imperial back to Metric
    return (numValue / def.factor).toFixed(4); // Use reasonable precision for storage
  }
};

export const getUnit = (type: UnitType, targetSystem: SystemType): string => {
  const def = CONVERSIONS[type];
  if (!def) return '';
  return targetSystem === System.METRIC ? def.metric : def.imperial;
};
