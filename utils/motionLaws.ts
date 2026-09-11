import { CamMotionLaw } from '../types';

export const MotionLaws: Record<CamMotionLaw, (u: number) => [number, number, number, number]> = {
    'Straight Line': (u) => {
        return [u, 1, 0, 0];
    },
    'Poly5': (u) => {
        const u2 = u*u, u3 = u2*u, u4 = u3*u, u5 = u4*u;
        return [
            10*u3 - 15*u4 + 6*u5,
            30*u2 - 60*u3 + 30*u4,
            60*u - 180*u2 + 120*u3,
            60 - 360*u + 360*u2
        ];
    },
    'Sine': (u) => {
        const pi2 = Math.PI * 2;
        return [
            u - Math.sin(pi2 * u) / pi2,
            1 - Math.cos(pi2 * u),
            pi2 * Math.sin(pi2 * u),
            pi2 * pi2 * Math.cos(pi2 * u)
        ];
    },
    'Modified Sine': (u) => {
        const u2=u*u, u3=u2*u, u4=u3*u, u5=u4*u, u6=u5*u, u7=u6*u;
        const s = 35*u4 - 84*u5 + 70*u6 - 20*u7;
        const v = 140*u3 - 420*u4 + 420*u5 - 140*u6;
        const a = 420*u2 - 1680*u3 + 2100*u4 - 840*u5;
        const j = 840*u - 5040*u2 + 8400*u3 - 4200*u4;
        return [s, v, a, j];
    },
    'Modified Trapezoid': (u) => {
        const pi = Math.PI;
        const s = 0.5 * (1 - Math.cos(pi * u));
        const v = 0.5 * pi * Math.sin(pi * u);
        const a = 0.5 * pi * pi * Math.cos(pi * u);
        const j = -0.5 * pi * pi * pi * Math.sin(pi * u);
        return [s, v, a, j];
    }
};
