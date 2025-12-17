
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize, Activity, Save, RefreshCw } from 'lucide-react';
import { CamTable, CamSector, CamMotionLaw } from '../types';

// --- Math Engines for Motion Laws ---

// Standardized u = (x - x0) / (x1 - x0)
// Returns [s, v_norm, a_norm, j_norm] where derivatives are normalized to u (0..1)
// Real derivatives need scaling by (x1-x0) and system speed.
const MotionLaws: Record<CamMotionLaw, (u: number) => [number, number, number, number]> = {
    'Straight Line': (u) => {
        return [u, 1, 0, 0];
    },
    'Poly5': (u) => {
        // 10u^3 - 15u^4 + 6u^5
        // v = 30u^2 - 60u^3 + 30u^4
        // a = 60u - 180u^2 + 120u^3
        // j = 60 - 360u + 360u^2
        const u2 = u*u, u3 = u2*u, u4 = u3*u, u5 = u4*u;
        return [
            10*u3 - 15*u4 + 6*u5,
            30*u2 - 60*u3 + 30*u4,
            60*u - 180*u2 + 120*u3,
            60 - 360*u + 360*u2
        ];
    },
    'Sine': (u) => {
        // Simple Sine (Cycloidal displacement usually refers to Sine Acceleration, but here simplified)
        // y = u - sin(2pi u)/2pi
        const pi2 = Math.PI * 2;
        return [
            u - Math.sin(pi2 * u) / pi2,
            1 - Math.cos(pi2 * u),
            pi2 * Math.sin(pi2 * u),
            pi2 * pi2 * Math.cos(pi2 * u)
        ];
    },
    'Modified Sine': (u) => {
        // Industry standard approximation
        // Placeholder implementation using Poly5 for visualization stability in this demo
        const u2 = u*u, u3 = u2*u, u4 = u3*u, u5 = u4*u;
        return [10*u3 - 15*u4 + 6*u5, 30*u2 - 60*u3 + 30*u4, 60*u - 180*u2 + 120*u3, 60 - 360*u + 360*u2];
    },
    'Modified Trapezoid': (u) => {
        // Placeholder implementation using Poly5
        const u2 = u*u, u3 = u2*u, u4 = u3*u, u5 = u4*u;
        return [10*u3 - 15*u4 + 6*u5, 30*u2 - 60*u3 + 30*u4, 60*u - 180*u2 + 120*u3, 60 - 360*u + 360*u2];
    }
};

interface CamPoint {
    x: number; // Master
    y: number; // Slave
    v: number;
    a: number;
    j: number;
}

export const CamEditor = ({ 
    camTable, 
    onChange 
}: { 
    camTable: CamTable, 
    onChange: (updated: CamTable) => void 
}) => {
    
    // --- State & Helpers ---
    const [viewMode, setViewMode] = useState<'pos' | 'vel' | 'acc'>('pos');
    const [hoverX, setHoverX] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Ensure sectors are sorted
    const sortedSectors = useMemo(() => {
        return [...camTable.sectors].sort((a,b) => a.masterStart - b.masterStart);
    }, [camTable]);

    // --- Calculation Engine ---
    const plotData = useMemo(() => {
        const points: CamPoint[] = [];
        const resolution = 1.0; // 1 degree steps

        sortedSectors.forEach(sector => {
            const rangeX = sector.masterEnd - sector.masterStart;
            const rangeY = sector.slaveEnd - sector.slaveStart;
            const steps = Math.ceil(rangeX / resolution);
            
            if (rangeX <= 0) return;

            for(let i=0; i<=steps; i++) {
                const xLocal = i * resolution;
                const currentX = sector.masterStart + xLocal;
                
                // Avoid double point at boundaries
                if (points.length > 0 && Math.abs(points[points.length-1].x - currentX) < 0.01) continue;
                if (currentX > sector.masterEnd) break;

                const u = Math.min(1, Math.max(0, xLocal / rangeX));
                const lawFunc = MotionLaws[sector.law];
                const [s_norm, v_norm, a_norm, j_norm] = lawFunc(u);

                points.push({
                    x: currentX,
                    y: sector.slaveStart + (rangeY * s_norm),
                    // Derivatives scaling: dy/dx = (rangeY/rangeX) * v_norm
                    // For visualization, we keep them relative to geometric slope
                    v: (rangeY / rangeX) * v_norm, 
                    a: (rangeY / (rangeX*rangeX)) * a_norm, // Convexity
                    j: j_norm // Qualitative
                });
            }
        });
        return points;
    }, [sortedSectors]);

    // --- Interaction Handlers ---

    const updateSector = (id: string, field: keyof CamSector, value: any) => {
        const newSectors = camTable.sectors.map(s => {
            if (s.id === id) return { ...s, [field]: value };
            return s;
        });

        // Auto-stitch logic: If we move End of Sector i, Start of Sector i+1 should move?
        // For this demo, we assume contiguous editing in the Grid.
        // A smarter editor would auto-heal gaps. Let's do a simple "Heal Next Start"
        if (field === 'masterEnd' || field === 'slaveEnd') {
            const idx = newSectors.findIndex(s => s.id === id);
            if (idx >= 0 && idx < newSectors.length - 1) {
                const nextSec = newSectors[idx+1];
                if (field === 'masterEnd') nextSec.masterStart = parseFloat(value);
                if (field === 'slaveEnd') nextSec.slaveStart = parseFloat(value);
            }
        }

        onChange({ ...camTable, sectors: newSectors });
    };

    const addSector = () => {
        const last = sortedSectors[sortedSectors.length - 1];
        const newStartM = last ? last.masterEnd : 0;
        const newStartS = last ? last.slaveEnd : 0;
        
        // Default new sector: 90 deg, same slope or flat
        const newSector: CamSector = {
            id: Date.now().toString(),
            masterStart: newStartM,
            masterEnd: Math.min(camTable.masterRange, newStartM + 90),
            slaveStart: newStartS,
            slaveEnd: newStartS, // Dwell by default
            law: 'Poly5'
        };
        onChange({ ...camTable, sectors: [...camTable.sectors, newSector] });
    };

    const removeSector = (id: string) => {
        if (camTable.sectors.length <= 1) return;
        onChange({ ...camTable, sectors: camTable.sectors.filter(s => s.id !== id) });
    };

    // --- Graph Rendering Helpers ---
    const width = 600;
    const height = 300;
    const padding = 40;

    const xMax = camTable.masterRange;
    const yMax = Math.max(...plotData.map(p => p.y), 10);
    const yMin = Math.min(...plotData.map(p => p.y), 0);
    
    // Auto-scale for derivatives
    const vMax = Math.max(...plotData.map(p => Math.abs(p.v)), 0.1);
    const aMax = Math.max(...plotData.map(p => Math.abs(p.a)), 0.1);

    const scaleX = (val: number) => padding + (val / xMax) * (width - 2*padding);
    
    const scaleY = (val: number, type: 'pos'|'vel'|'acc') => {
        const graphH = height - 2*padding;
        let norm = 0;
        if (type === 'pos') {
            const range = yMax - yMin || 1;
            norm = (val - yMin) / range;
        } else if (type === 'vel') {
             norm = 0.5 + (val / (2*vMax)) * 0.8; // Centered
        } else {
             norm = 0.5 + (val / (2*aMax)) * 0.8;
        }
        return (height - padding) - (norm * graphH);
    };

    const getPath = (key: 'y'|'v'|'a') => {
        if (plotData.length === 0) return "";
        return plotData.map((p, i) => {
            const x = scaleX(p.x);
            const y = scaleY(key === 'y' ? p.y : (key === 'v' ? p.v : p.a), key === 'y' ? 'pos' : (key === 'v' ? 'vel' : 'acc'));
            return `${i===0?'M':'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if(!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const ratio = (localX - padding) / (width - 2*padding);
        const masterVal = Math.max(0, Math.min(xMax, ratio * xMax));
        setHoverX(masterVal);
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Toolbar */}
            <div className="h-10 bg-white border-b border-gray-300 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center space-x-4">
                     <span className="font-bold text-gray-700">{camTable.name}</span>
                     <div className="h-4 w-px bg-gray-300"></div>
                     <div className="flex space-x-1 text-xs">
                         <span className="text-gray-500">Master Cycle:</span>
                         <input className="w-12 border border-gray-300 text-center" value={camTable.masterRange} readOnly />
                         <span className="text-gray-500">deg</span>
                     </div>
                </div>
                <div className="flex space-x-2">
                     <button className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded shadow hover:bg-blue-700">
                         <Save size={12} className="mr-1"/> Save Table
                     </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Data Grid */}
                <div className="w-[450px] bg-white border-r border-gray-300 flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 p-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-600 uppercase">Profile Sectors</span>
                        <button onClick={addSector} className="p-1 bg-white border border-gray-300 hover:bg-green-50 text-green-600 rounded">
                            <Plus size={14}/>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-100 text-gray-500 font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 border-b">#</th>
                                    <th className="p-2 border-b w-20">M. Start</th>
                                    <th className="p-2 border-b w-20">M. End</th>
                                    <th className="p-2 border-b w-20">S. End</th>
                                    <th className="p-2 border-b">Law</th>
                                    <th className="p-2 border-b"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSectors.map((sector, idx) => (
                                    <tr key={sector.id} className="border-b border-gray-100 hover:bg-blue-50 group">
                                        <td className="p-2 text-gray-400">{idx+1}</td>
                                        <td className="p-2 font-mono">{sector.masterStart.toFixed(1)}</td>
                                        <td className="p-2">
                                            <input 
                                                className="w-16 border border-transparent hover:border-gray-300 bg-transparent px-1 focus:bg-white focus:outline-none"
                                                type="number"
                                                value={sector.masterEnd}
                                                onChange={(e) => updateSector(sector.id, 'masterEnd', parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                className="w-16 border border-transparent hover:border-gray-300 bg-transparent px-1 focus:bg-white focus:outline-none font-bold text-blue-700"
                                                type="number"
                                                value={sector.slaveEnd}
                                                onChange={(e) => updateSector(sector.id, 'slaveEnd', parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select 
                                                className="bg-transparent w-24 outline-none"
                                                value={sector.law}
                                                onChange={(e) => updateSector(sector.id, 'law', e.target.value)}
                                            >
                                                {Object.keys(MotionLaws).map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeSector(sector.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600">
                                                <Trash2 size={12}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="p-4 text-gray-400 text-[10px] italic text-center">
                           Note: "Slave Start" is automatically inferred from the previous sector's "Slave End".
                        </div>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="flex-1 bg-gray-50 flex flex-col relative">
                    <div className="absolute top-2 right-2 flex space-x-1 z-10">
                        <button 
                            onClick={() => setViewMode('pos')} 
                            className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='pos'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300'}`}
                        >Pos</button>
                        <button 
                            onClick={() => setViewMode('vel')} 
                            className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='vel'?'bg-green-600 text-white border-green-600':'bg-white text-gray-600 border-gray-300'}`}
                        >Vel</button>
                        <button 
                            onClick={() => setViewMode('acc')} 
                            className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='acc'?'bg-red-600 text-white border-red-600':'bg-white text-gray-600 border-gray-300'}`}
                        >Acc</button>
                    </div>

                    <div className="flex-1 p-4">
                        <svg 
                            ref={svgRef}
                            width="100%" height="100%" 
                            viewBox={`0 0 ${width} ${height}`} 
                            className="bg-white border border-gray-300 shadow-sm"
                            preserveAspectRatio="none"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverX(null)}
                        >
                            {/* Grid Lines */}
                            <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#ccc" />
                            <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#ccc" />
                            
                            {/* Zero Line for Vel/Acc */}
                            {viewMode !== 'pos' && (
                                <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#eee" strokeDasharray="4,2"/>
                            )}

                            {/* Curve */}
                            <path 
                                d={getPath(viewMode === 'pos' ? 'y' : (viewMode === 'vel' ? 'v' : 'a'))} 
                                fill="none" 
                                stroke={viewMode === 'pos' ? '#2563eb' : (viewMode === 'vel' ? '#16a34a' : '#dc2626')} 
                                strokeWidth="2"
                            />

                            {/* Sector Dividers */}
                            {sortedSectors.map(s => {
                                const x = scaleX(s.masterEnd);
                                return <line key={s.id} x1={x} y1={padding} x2={x} y2={height-padding} stroke="#e5e7eb" strokeDasharray="2,2" />;
                            })}

                            {/* Cursor */}
                            {hoverX !== null && (
                                <line 
                                    x1={scaleX(hoverX)} y1={padding} 
                                    x2={scaleX(hoverX)} y2={height-padding} 
                                    stroke="black" strokeDasharray="2,2" strokeWidth="1"
                                />
                            )}
                            
                            {/* Labels */}
                            <text x={width/2} y={height-10} textAnchor="middle" fontSize="10" fill="#666">Master Position (deg)</text>
                        </svg>
                    </div>
                    
                    {/* Status Footer */}
                    <div className="h-6 bg-white border-t border-gray-200 px-2 flex items-center justify-between text-[10px] text-gray-500">
                         <div>
                             {hoverX !== null ? `Cursor: ${hoverX.toFixed(1)}°` : 'Ready'}
                         </div>
                         <div className="flex space-x-4">
                             <div className="flex items-center"><div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div> Position</div>
                             <div className="flex items-center"><div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div> Velocity</div>
                             <div className="flex items-center"><div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div> Acceleration</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
