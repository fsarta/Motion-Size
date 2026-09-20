import { CamMotionLaw } from '../types';

export const MotionLaws: Record<CamMotionLaw, (u: number) => [number, number, number, number]> = {
    'Straight Line': (u) => {
        const uClamped = Math.min(1, Math.max(0, u));
        return [uClamped, 1, 0, 0];
    },
    'Poly5': (u) => {
        const uClamped = Math.min(1, Math.max(0, u));
        const u2 = uClamped * uClamped;
        const u3 = u2 * uClamped;
        const u4 = u3 * uClamped;
        const u5 = u4 * uClamped;
        return [
            10 * u3 - 15 * u4 + 6 * u5,
            30 * u2 - 60 * u3 + 30 * u4,
            60 * uClamped - 180 * u2 + 120 * u3,
            60 - 360 * uClamped + 360 * u2
        ];
    },
    'Sine': (u) => {
        const uClamped = Math.min(1, Math.max(0, u));
        const pi2 = Math.PI * 2;
        return [
            uClamped - Math.sin(pi2 * uClamped) / pi2,
            1 - Math.cos(pi2 * uClamped),
            pi2 * Math.sin(pi2 * uClamped),
            pi2 * pi2 * Math.cos(pi2 * uClamped)
        ];
    },
    'Modified Sine': (u) => {
        // Standard VDI 2143 Modified Sine Motion Law
        const uC = Math.min(1, Math.max(0, u));
        const pi = Math.PI;
        const A = (pi * pi) / (4 + pi); // ~5.5280
        const v1_8 = A / (4 * pi);
        const s1_8 = (A / (4 * pi)) * (1 / 8) - A / (16 * pi * pi);

        if (uC <= 1 / 8) {
            const angle = 4 * pi * uC;
            const a = A * Math.sin(angle);
            const v = (A / (4 * pi)) * (1 - Math.cos(angle));
            const s = (A / (4 * pi)) * uC - (A / (16 * pi * pi)) * Math.sin(angle);
            const j = A * 4 * pi * Math.cos(angle);
            return [s, v, a, j];
        } else if (uC <= 7 / 8) {
            const du = uC - 1 / 8;
            const w = (4 * pi) / 3;
            const a = A * Math.cos(w * du);
            const v = v1_8 + (A / w) * Math.sin(w * du);
            const s = s1_8 + v1_8 * du + (A / (w * w)) * (1 - Math.cos(w * du));
            const j = -A * w * Math.sin(w * du);
            return [s, v, a, j];
        } else {
            const du = uC - 7 / 8;
            const angle = 4 * pi * du;
            const a = -A * Math.sin(angle);
            const v = (A / (4 * pi)) * (1 + Math.cos(angle));
            const s = 1 - (A / (4 * pi)) * (1 - uC) + (A / (16 * pi * pi)) * Math.sin(4 * pi * (1 - uC));
            const j = -A * 4 * pi * Math.cos(angle);
            return [Math.min(1, Math.max(0, s)), Math.max(0, v), a, j];
        }
    },
    'Modified Trapezoid': (u) => {
        // Standard VDI 2143 Modified Trapezoidal Motion Law
        const uC = Math.min(1, Math.max(0, u));
        const pi = Math.PI;
        // Normalized constant for Modified Trapezoid
        const C = 4 / (pi + 2); // ~0.7779
        const A = C * pi;       // Peak acceleration ~4.888
        
        if (uC <= 1 / 8) {
            const a = A * Math.sin(4 * pi * uC);
            const v = (A / (4 * pi)) * (1 - Math.cos(4 * pi * uC));
            const s = (A / (4 * pi)) * uC - (A / (16 * pi * pi)) * Math.sin(4 * pi * uC);
            const j = A * 4 * pi * Math.cos(4 * pi * uC);
            return [s, v, a, j];
        } else if (uC <= 3 / 8) {
            const du = uC - 1 / 8;
            const v0 = A / (4 * pi);
            const s0 = (A / (4 * pi)) * (1 / 8) - A / (16 * pi * pi);
            const a = A;
            const v = v0 + A * du;
            const s = s0 + v0 * du + 0.5 * A * du * du;
            return [s, v, a, 0];
        } else if (uC <= 5 / 8) {
            const du = uC - 3 / 8;
            const v0 = A / (4 * pi) + A * 0.25;
            const s0 = (A / (4 * pi)) * (1 / 8) - A / (16 * pi * pi) + (A / (4 * pi)) * 0.25 + 0.5 * A * 0.25 * 0.25;
            const a = A * Math.cos(4 * pi * du);
            const v = v0 + (A / (4 * pi)) * Math.sin(4 * pi * du);
            const s = s0 + v0 * du + (A / (16 * pi * pi)) * (1 - Math.cos(4 * pi * du));
            const j = -A * 4 * pi * Math.sin(4 * pi * du);
            return [s, v, a, j];
        } else if (uC <= 7 / 8) {
            const du = uC - 5 / 8;
            const v0 = A / (4 * pi) + A * 0.25;
            const s0 = 0.5;
            const a = -A;
            const v = v0 - A * du;
            const s = s0 + v0 * du - 0.5 * A * du * du;
            return [s, v, a, 0];
        } else {
            const du = uC - 7 / 8;
            const a = -A * Math.sin(4 * pi * (1 - uC));
            const v = (A / (4 * pi)) * (1 - Math.cos(4 * pi * (1 - uC)));
            const s = 1 - ((A / (4 * pi)) * (1 - uC) - (A / (16 * pi * pi)) * Math.sin(4 * pi * (1 - uC)));
            const j = A * 4 * pi * Math.cos(4 * pi * (1 - uC));
            return [Math.min(1, Math.max(0, s)), Math.max(0, v), a, j];
        }
    }
};
