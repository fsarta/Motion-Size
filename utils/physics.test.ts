import { describe, it, expect } from 'vitest';
import { calculateInertiaPhysics, InertiaComponent } from './physics';

describe('Physics Utilities', () => {
  it('calculates solid cylinder inertia correctly', () => {
    const comp: InertiaComponent = {
      id: '1', name: 'Cyl', type: 'Solid Cylinder', quantity: 1, ratio: 1,
      mass: 0, volume: 0, material: 'Steel', density: 7850,
      d1: 10, d2: 0, h: 100, w: 0, l: 0, r_offset: 0, inertia: 0
    };
    const result = calculateInertiaPhysics(comp);
    expect(result.mass).toBeGreaterThan(0);
    expect(result.inertia).toBeGreaterThan(0);
    
    // r = 5mm = 0.005m, h = 100mm = 0.1m
    // v = pi * (0.005)^2 * 0.1 = 0.00000785398 m^3
    // mass = v * 7850 = 0.06165 kg
    // I = 0.5 * 0.06165 * 0.005^2 = 0.0000007706 kg*m^2
    // I in kg*cm^2 = I * 10000 = 0.007706 kg*cm^2
    expect(result.inertia).toBeCloseTo(0.007706, 3);
  });

  it('calculates hollow cylinder inertia correctly', () => {
    const comp: InertiaComponent = {
      id: '2', name: 'HCyl', type: 'Hollow Cylinder', quantity: 1, ratio: 1,
      mass: 0, volume: 0, material: 'Steel', density: 7850,
      d1: 20, d2: 10, h: 100, w: 0, l: 0, r_offset: 0, inertia: 0
    };
    const result = calculateInertiaPhysics(comp);
    expect(result.inertia).toBeGreaterThan(0);
  });

  it('calculates block inertia correctly', () => {
    const comp: InertiaComponent = {
      id: '3', name: 'Block', type: 'Cuboid', quantity: 1, ratio: 1,
      mass: 0, volume: 0, material: 'Steel', density: 7850,
      d1: 0, d2: 0, h: 50, w: 50, l: 100, r_offset: 0, inertia: 0
    };
    const result = calculateInertiaPhysics(comp);
    expect(result.inertia).toBeGreaterThan(0);
  });
});
