export interface InertiaComponent {
  id: string;
  name: string;
  type: 'Solid Cylinder' | 'Hollow Cylinder' | 'Cuboid' | 'Solid Sphere' | 'Hollow Sphere' | 'Solid Cone' | 'User Spec.';
  quantity: number;
  ratio: number;
  mass: number; // kg (Base unit)
  volume: number; // m3 (Base unit)
  material: string;
  density: number; // kg/m3
  // Dimensions (stored in Base Unit: mm)
  d1: number; // Outer Diameter
  d2: number; // Inner Diameter
  h: number; // Height
  w: number; // Width
  l: number; // Length (Depth)
  r_offset: number; // Distance from axis
  inertia: number; // kg cm^2 (Base unit)
}

export const MATERIALS = [
  { name: 'Aluminum', density: 2700 },
  { name: 'Brass', density: 8500 },
  { name: 'Hard Wood (Oak)', density: 750 },
  { name: 'Iron (Cast)', density: 7200 },
  { name: 'Nylon', density: 1150 },
  { name: 'POM (Delrin)', density: 1410 },
  { name: 'Steel (Carbon Tool)', density: 7850 },
  { name: 'Steel (Stainless)', density: 8000 },
  { name: 'User Spec.', density: 0 }
];

export const DEFAULT_INERTIA_ROW: InertiaComponent = {
  id: '1',
  name: 'NewComponent',
  type: 'Solid Cylinder',
  quantity: 1,
  ratio: 1,
  mass: 0,
  volume: 0,
  material: 'Steel (Carbon Tool)',
  density: 7850,
  d1: 100, // 100mm
  d2: 0,
  h: 100, // 100mm
  w: 100,
  l: 100,
  r_offset: 0,
  inertia: 0
};

export function calculateInertiaPhysics(comp: InertiaComponent): InertiaComponent {
  if (comp.type === 'User Spec.') {
      return comp; 
  }

  // 1. Dimensions to SI Units (Meters)
  const d1_m = comp.d1 / 1000;
  const d2_m = comp.d2 / 1000;
  const h_m = comp.h / 1000;
  const w_m = comp.w / 1000;
  const l_m = comp.l / 1000;
  const r_offset_m = comp.r_offset / 1000;

  // 2. Calculate Volume (m^3)
  let vol_m3 = 0;
  if (comp.type === 'Solid Cylinder') {
    const radius = d1_m / 2;
    vol_m3 = Math.PI * Math.pow(radius, 2) * h_m;
  } else if (comp.type === 'Hollow Cylinder') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    vol_m3 = Math.PI * (Math.pow(r_out, 2) - Math.pow(r_in, 2)) * h_m;
  } else if (comp.type === 'Cuboid') {
    vol_m3 = w_m * l_m * h_m;
  } else if (comp.type === 'Solid Sphere') {
    const radius = d1_m / 2;
    vol_m3 = (4/3) * Math.PI * Math.pow(radius, 3);
  } else if (comp.type === 'Hollow Sphere') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    vol_m3 = (4/3) * Math.PI * (Math.pow(r_out, 3) - Math.pow(r_in, 3));
  } else if (comp.type === 'Solid Cone') {
    const radius = d1_m / 2;
    vol_m3 = (1/3) * Math.PI * Math.pow(radius, 2) * h_m;
  }

  // 3. Calculate Mass (kg)
  const mass = vol_m3 * comp.density;

  // 4. Calculate Base Inertia (kg*m^2) around Center of Mass
  let I_cm_si = 0;
  if (comp.type === 'Solid Cylinder') {
    const radius = d1_m / 2;
    I_cm_si = 0.5 * mass * Math.pow(radius, 2);
  } else if (comp.type === 'Hollow Cylinder') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    I_cm_si = 0.5 * mass * (Math.pow(r_out, 2) + Math.pow(r_in, 2));
  } else if (comp.type === 'Cuboid') {
      I_cm_si = (mass * (Math.pow(l_m, 2) + Math.pow(w_m, 2))) / 12;
  } else if (comp.type === 'Solid Sphere') {
    const radius = d1_m / 2;
    I_cm_si = (2/5) * mass * Math.pow(radius, 2);
  } else if (comp.type === 'Hollow Sphere') {
    const r_out = d1_m / 2;
    const r_in = d2_m / 2;
    const num = Math.pow(r_out, 5) - Math.pow(r_in, 5);
    const den = Math.pow(r_out, 3) - Math.pow(r_in, 3);
    if (den > 0) {
      I_cm_si = (2/5) * mass * (num / den);
    }
  } else if (comp.type === 'Solid Cone') {
    const radius = d1_m / 2;
    I_cm_si = (3/10) * mass * Math.pow(radius, 2);
  }

  // 5. Parallel Axis Theorem & Transmission (kg*m^2)
  const I_parallel_si = I_cm_si + (mass * Math.pow(r_offset_m, 2));
  const I_total_si = I_parallel_si * comp.quantity * Math.pow(comp.ratio, 2);

  // 6. Convert SI Inertia (kg*m^2) to App Base Unit (kg*cm^2)
  const I_total_storage = I_total_si * 10000;

  return {
    ...comp,
    volume: vol_m3,
    mass: mass,
    inertia: I_total_storage
  };
}
