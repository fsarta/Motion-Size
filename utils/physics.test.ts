import { describe, it, expect } from 'vitest';
import { 
  calculateInertiaPhysics, 
  InertiaComponent,
  calculateAxisDynamics,
  calculateThermalDerating,
  calculateMaxStop,
  calculateRegenEnergyAndResistor,
  solveScaraIK
} from './physics';
import { MotionLaws } from './motionLaws';
import { simulateMotion } from '../engines/motionWorker';

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

  it('correctly reflects translating linear mass to rotary inertia for ball screw', () => {
    // 50 kg mass on a 10 mm/rev ball screw with a 5:1 gearbox
    // r_eff = 0.010 / (2 * pi) = 0.00159155 m
    // J_mass_load_side = 50 * (0.00159155)^2 = 0.00012665 kg*m^2 = 1.2665 kg*cm^2
    // With gearbox ratio 5:1 -> J_refl = 1.2665 / 25 = 0.05066 kg*cm^2
    const dynamics = calculateAxisDynamics({
      axisUsage: 'Linear',
      mechanismType: 'Ball Screw',
      screwLead: 10,
      massLoad: 50,
      gearboxRatio: 5,
      motorInertia: 1.0,
      gearboxInertia: 0.1
    });

    expect(dynamics.massInertiaKgCm2).toBeCloseTo(1.2665, 3);
    expect(dynamics.reflectedLoadInertiaKgCm2).toBeCloseTo(1.2665 / 25, 3);
    expect(dynamics.totalInertiaKgCm2).toBeGreaterThan(1.1); // motor + gb + load
    expect(dynamics.totalInertiaKgM2).toBeCloseTo(dynamics.totalInertiaKgCm2 * 0.0001, 6);
  });

  it('calculates gravitational torque for vertical axis', () => {
    // 10 kg mass on vertical axis (inclineAngle = 90 deg)
    // Ball screw lead = 10 mm, gearbox = 1:1
    // F_gravity = 10 * 9.80665 = 98.0665 N
    // r_eff = 0.01 / (2*pi) = 0.0015915 m
    // T_gravity = 98.0665 * 0.0015915 = 0.156 Nm
    const dynamics = calculateAxisDynamics({
      axisUsage: 'Linear',
      mechanismType: 'Ball Screw',
      screwLead: 10,
      massLoad: 10,
      inclineAngle: 90,
      gearboxRatio: 1
    });

    expect(dynamics.gravityForceN).toBeCloseTo(98.07, 1);
    expect(dynamics.gravityTorqueNm).toBeCloseTo(0.156, 3);
  });

  it('evaluates thermal derating above 40 C', () => {
    expect(calculateThermalDerating(40)).toBe(1.0);
    expect(calculateThermalDerating(30)).toBe(1.0);
    expect(calculateThermalDerating(50)).toBeCloseTo(0.88, 2);
    expect(calculateThermalDerating(60)).toBeCloseTo(0.76, 2);
  });

  it('calculates max-stop stopping distance and time', () => {
    const result = calculateMaxStop(0.005, 3000, 15, 0.5, 10, 5, true);
    expect(result.stopTimeSec).toBeGreaterThan(0);
    expect(result.stopDistanceMm).toBeGreaterThan(0);
    expect(result.stopTimeSec).toBeLessThan(1.0); // stopping in fractions of a second
  });

  it('calculates SCARA inverse kinematics accurately', () => {
    const l1 = 300, l2 = 250;
    // Test point at (x=300, y=250)
    const ik = solveScaraIK(300, 250, 50, 0, l1, l2);
    expect(ik.reachable).toBe(true);
    expect(ik.zMm).toBe(50);
  });

  it('validates VDI 2143 motion laws boundary conditions', () => {
    // Poly5 at start and end
    const [s0, v0, a0] = MotionLaws['Poly5'](0);
    expect(s0).toBe(0);
    expect(v0).toBe(0);
    expect(a0).toBe(0);

    const [s1, v1, a1] = MotionLaws['Poly5'](1);
    expect(s1).toBeCloseTo(1, 4);
    expect(v1).toBeCloseTo(0, 4);
    expect(a1).toBeCloseTo(0, 4);

    // Modified Trapezoid at start and end
    const [mtS0, mtV0] = MotionLaws['Modified Trapezoid'](0);
    expect(mtS0).toBe(0);
    expect(mtV0).toBe(0);

    const [mtS1, mtV1] = MotionLaws['Modified Trapezoid'](1);
    expect(mtS1).toBeCloseTo(1, 4);
    expect(mtV1).toBeCloseTo(0, 4);
  });

  it('verifies S-Curve ends at rest when moving point to point', () => {
    const points = simulateMotion(
      [{ id: '1', type: 'S-Curve', duration: 1, distance: 100, velocity: 0, accel: 0, decel: 0, jerk: 0, payload: 0, calcTarget: 'velocity' }],
      0.005, 'Time Based', 1, null, 0.1, 0.95, 0, undefined, 'Linear', 10
    );

    expect(points.length).toBeGreaterThan(10);
    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    expect(startPoint.vel).toBeCloseTo(0, 3);
    expect(endPoint.vel).toBeCloseTo(0, 3);
    expect(endPoint.pos).toBeCloseTo(100, 1);
  });
});
