export interface FrictionPair {
  id: string;
  material1: string;
  material2: string;
  condition: 'Dry' | 'Lubricated' | 'Greased';
  staticCoeff: number;
  kineticCoeff: number;
}

export const FRICTION_DB: FrictionPair[] = [
  { id: '1', material1: 'Steel', material2: 'Steel', condition: 'Dry', staticCoeff: 0.78, kineticCoeff: 0.42 },
  { id: '2', material1: 'Steel', material2: 'Steel', condition: 'Lubricated', staticCoeff: 0.16, kineticCoeff: 0.08 },
  { id: '3', material1: 'Steel', material2: 'Aluminum', condition: 'Dry', staticCoeff: 0.61, kineticCoeff: 0.47 },
  { id: '4', material1: 'Steel', material2: 'Brass', condition: 'Dry', staticCoeff: 0.51, kineticCoeff: 0.44 },
  { id: '5', material1: 'Steel', material2: 'Cast Iron', condition: 'Dry', staticCoeff: 0.4, kineticCoeff: 0.23 },
  { id: '6', material1: 'Steel', material2: 'Bronze', condition: 'Lubricated', staticCoeff: 0.16, kineticCoeff: 0.16 },
  { id: '7', material1: 'Aluminum', material2: 'Aluminum', condition: 'Dry', staticCoeff: 1.05, kineticCoeff: 1.4 },
  { id: '8', material1: 'Rubber', material2: 'Concrete', condition: 'Dry', staticCoeff: 1.0, kineticCoeff: 0.8 },
  { id: '9', material1: 'Wood', material2: 'Wood', condition: 'Dry', staticCoeff: 0.5, kineticCoeff: 0.3 },
  { id: '10', material1: 'Plastic (Nylon)', material2: 'Steel', condition: 'Dry', staticCoeff: 0.35, kineticCoeff: 0.25 },
  { id: '11', material1: 'Teflon (PTFE)', material2: 'Steel', condition: 'Dry', staticCoeff: 0.04, kineticCoeff: 0.04 },
];
