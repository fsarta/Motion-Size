
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize, Activity, Save, RefreshCw, Layers, Layout } from 'lucide-react';
import { CamTable, CamSector, CamMotionLaw } from '../types';
import { ConfirmationModal } from './modals/ConfirmationModal';

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

type GraphType = 'pos' | 'vel' | 'acc' | 'jerk';

// Helper for engineering notation
const formatEng = (val: number) => {
    if (val === 0) return "0.0000";
    const abs = Math.abs(val);
    // Use scientific notation for very small (< 0.001) or very large (> 10000) numbers
    if (abs < 0.001 || abs >= 10000) {
        return val.toExponential(4); // e.g. 1.2345e-5
    }
    return val.toFixed(4); // e.g. 123.4567
};

export const CamEditor = ({ 
    camTable, 
    onChange 
}: { 
    camTable: CamTable, 
    onChange: (updated: CamTable) => void 
}) => {
    
    // --- State & Helpers ---
    const [viewMode, setViewMode] = useState<GraphType>('pos');
    const [isStacked, setIsStacked] = useState(false);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

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
                    j: (rangeY / Math.pow(rangeX, 3)) * j_norm // Qualitative Jerk
                });
            }
        });
        return points;
    }, [sortedSectors]);

    // Find cursor values
    const hoverPoint = useMemo(() => {
        if (hoverX === null || plotData.length === 0) return null;
        // Find closest point
        return plotData.reduce((prev, curr) => 
            Math.abs(curr.x - hoverX) < Math.abs(prev.x - hoverX) ? curr : prev
        );
    }, [hoverX, plotData]);

    // --- Interaction Handlers ---

    const updateSector = (id: string, field: keyof CamSector, value: any) => {
        const newSectors = camTable.sectors.map(s => {
            if (s.id === id) return { ...s, [field]: value };
            return s;
        });

        // Auto-stitch logic
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

    const handleMasterRangeChange = (val: string) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            onChange({ ...camTable, masterRange: num });
        }
    };

    const addSector = () => {
        const last = sortedSectors[sortedSectors.length - 1];
        const newStartM = last ? last.masterEnd : 0;
        const newStartS = last ? last.slaveEnd : 0;
        
        const newSector: CamSector = {
            id: Date.now().toString(),
            masterStart: newStartM,
            masterEnd: Math.min(camTable.masterRange, newStartM + 90),
            slaveStart: newStartS,
            slaveEnd: newStartS, 
            law: 'Poly5'
        };
        onChange({ ...camTable, sectors: [...camTable.sectors, newSector] });
    };

    const removeSector = (id: string) => {
        if (camTable.sectors.length <= 1) return;
        onChange({ ...camTable, sectors: camTable.sectors.filter(s => s.id !== id) });
    };

    const handleSaveConfirm = () => {
        // Logic to finalize save would go here (e.g. API call)
        // Since state is updated via onChange in real-time, this is symbolic or "commit"
        setIsSaveConfirmOpen(false);
    };

    // --- Graph Rendering Helpers ---
    const width = 600; // Internal SVG coord width
    // Height will vary based on stacked vs single
    const padding = 20;

    const xMax = camTable.masterRange;
    
    // Calculate global Min/Max for scaling
    const limits = useMemo(() => {
        if (plotData.length === 0) return { pos:[0,10], vel:[0,1], acc:[0,1], jerk:[0,1] };
        
        const getLimits = (arr: number[]) => {
            let min = Math.min(...arr);
            let max = Math.max(...arr);
            if (max === min) { max+=1; min-=1; }
            return [min, max];
        };

        return {
            pos: getLimits(plotData.map(p => p.y)),
            vel: getLimits(plotData.map(p => p.v)),
            acc: getLimits(plotData.map(p => p.a)),
            jerk: getLimits(plotData.map(p => p.j))
        };
    }, [plotData]);

    const scaleX = (val: number) => padding + (val / xMax) * (width - 2*padding);
    
    // Reusable Graph Render Function
    const renderGraph = (type: GraphType, height: number, color: string, showXAxis: boolean) => {
        const [min, max] = limits[type] as [number, number];
        const range = max - min;
        
        // Scale Y to fit height with padding
        const scaleY = (val: number) => {
            const norm = (val - min) / range;
            return (height - padding) - (norm * (height - 2*padding));
        };

        const pathD = plotData.length > 0 ? plotData.map((p, i) => {
            const x = scaleX(p.x);
            // Map type to property
            const val = type === 'pos' ? p.y : type === 'vel' ? p.v : type === 'acc' ? p.a : p.j;
            const y = scaleY(val);
            return `${i===0?'M':'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ") : "";

        // Zero Line Y
        const zeroY = scaleY(0);

        return (
            <svg 
                width="100%" height="100%" 
                viewBox={`0 0 ${width} ${height}`} 
                preserveAspectRatio="none"
                className="bg-white border-b border-gray-200 block"
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left - 10) / (rect.width - 20); // Approx correction for padding
                    // Better: reverse map ratio
                    // Since viewBox is set, and preservedAspectRatio=none, exact mapping depends on container.
                    // Simplified:
                    const localX = e.clientX - rect.left;
                    const r = localX / rect.width;
                    setHoverX(Math.max(0, Math.min(xMax, r * xMax)));
                }}
                onMouseLeave={() => setHoverX(null)}
            >
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#eee" />
                <line x1={width-padding} y1={padding} x2={width-padding} y2={height-padding} stroke="#eee" />
                
                {/* Zero Line (only if 0 is within range, and mostly for derivatives) */}
                {min < 0 && max > 0 && (
                    <line x1={padding} y1={zeroY} x2={width-padding} y2={zeroY} stroke="#ddd" strokeDasharray="4,2"/>
                )}

                {/* Path */}
                <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>

                {/* Sector Lines */}
                {sortedSectors.map(s => {
                    const x = scaleX(s.masterEnd);
                    return <line key={s.id} x1={x} y1={padding} x2={x} y2={height-padding} stroke="#f3f4f6" />;
                })}

                {/* Cursor */}
                {hoverX !== null && (
                    <line 
                        x1={scaleX(hoverX)} y1={padding} 
                        x2={scaleX(hoverX)} y2={height-padding} 
                        stroke="black" strokeDasharray="3,3" strokeWidth="1"
                    />
                )}

                {/* Labels */}
                <text x={padding} y={padding - 5} fontSize="10" fill={color} fontWeight="bold" className="uppercase">{type}</text>
                
                {showXAxis && (
                   <text x={width/2} y={height-5} textAnchor="middle" fontSize="10" fill="#999">Master Position (deg)</text>
                )}
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <ConfirmationModal 
                isOpen={isSaveConfirmOpen}
                title="Confirm Save"
                message={<p>Do you want to save changes to cam table <br/><span className="font-bold">"{camTable.name}"</span>?</p>}
                variant="info"
                confirmLabel="Save"
                onConfirm={handleSaveConfirm}
                onCancel={() => setIsSaveConfirmOpen(false)}
            />

            {/* Toolbar */}
            <div className="h-10 bg-white border-b border-gray-300 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center space-x-4">
                     <span className="font-bold text-gray-700">{camTable.name}</span>
                     <div className="h-4 w-px bg-gray-300"></div>
                     <div className="flex space-x-1 text-xs">
                         <span className="text-gray-500">Master Cycle:</span>
                         <input 
                            className="w-16 border border-gray-300 text-center focus:border-blue-500 focus:outline-none" 
                            type="number"
                            value={camTable.masterRange} 
                            onChange={(e) => handleMasterRangeChange(e.target.value)} 
                         />
                         <span className="text-gray-500">deg</span>
                     </div>
                </div>
                <div className="flex space-x-2 items-center">
                     <div className="flex bg-gray-100 rounded p-0.5 border border-gray-300 mr-2">
                         <button 
                            onClick={() => setIsStacked(false)}
                            title="Single Graph View"
                            className={`p-1 rounded ${!isStacked ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                             <Maximize size={14}/>
                         </button>
                         <button 
                            onClick={() => setIsStacked(true)}
                            title="Stacked Graph View"
                            className={`p-1 rounded ${isStacked ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                             <Layers size={14}/>
                         </button>
                     </div>

                     <button 
                        onClick={() => setIsSaveConfirmOpen(true)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded shadow hover:bg-blue-700"
                     >
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
                <div className="flex-1 bg-gray-50 flex flex-col relative" ref={containerRef}>
                    {!isStacked && (
                        <div className="absolute top-2 right-2 flex space-x-1 z-10">
                            <button onClick={() => setViewMode('pos')} className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='pos'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-600 border-gray-300'}`}>Pos</button>
                            <button onClick={() => setViewMode('vel')} className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='vel'?'bg-green-600 text-white border-green-600':'bg-white text-gray-600 border-gray-300'}`}>Vel</button>
                            <button onClick={() => setViewMode('acc')} className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='acc'?'bg-red-600 text-white border-red-600':'bg-white text-gray-600 border-gray-300'}`}>Acc</button>
                            <button onClick={() => setViewMode('jerk')} className={`px-2 py-1 text-[10px] font-bold border rounded ${viewMode==='jerk'?'bg-orange-500 text-white border-orange-500':'bg-white text-gray-600 border-gray-300'}`}>Jerk</button>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col p-2 h-full overflow-hidden">
                        {isStacked ? (
                            <>
                                <div className="flex-1 border border-b-0 border-gray-200">{renderGraph('pos', 150, '#2563eb', false)}</div>
                                <div className="flex-1 border border-b-0 border-gray-200">{renderGraph('vel', 150, '#16a34a', false)}</div>
                                <div className="flex-1 border border-b-0 border-gray-200">{renderGraph('acc', 150, '#dc2626', false)}</div>
                                <div className="flex-1 border border-gray-200">{renderGraph('jerk', 150, '#f97316', true)}</div>
                            </>
                        ) : (
                            <div className="flex-1 border border-gray-300 shadow-sm bg-white">
                                {renderGraph(
                                    viewMode, 
                                    400, 
                                    viewMode==='pos'?'#2563eb':viewMode==='vel'?'#16a34a':viewMode==='acc'?'#dc2626':'#f97316',
                                    true
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Status Footer */}
                    <div className="h-7 bg-white border-t border-gray-200 px-2 flex items-center justify-between text-[10px] text-gray-600 shrink-0">
                         <div className="font-mono font-medium">
                             {hoverX !== null ? `Master: ${hoverX.toFixed(1)}°` : 'Ready'}
                         </div>
                         <div className="flex space-x-3">
                             <div className="flex items-center">
                                 <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div> 
                                 <span>P:</span>
                                 <span className={`ml-1 font-mono font-bold ${hoverPoint ? 'text-blue-700' : 'text-gray-300'}`}>
                                     {hoverPoint ? formatEng(hoverPoint.y) : '---'}
                                 </span>
                             </div>
                             <div className="flex items-center">
                                 <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div> 
                                 <span>V:</span>
                                 <span className={`ml-1 font-mono font-bold ${hoverPoint ? 'text-green-700' : 'text-gray-300'}`}>
                                     {hoverPoint ? formatEng(hoverPoint.v) : '---'}
                                 </span>
                             </div>
                             <div className="flex items-center">
                                 <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div> 
                                 <span>A:</span>
                                 <span className={`ml-1 font-mono font-bold ${hoverPoint ? 'text-red-700' : 'text-gray-300'}`}>
                                     {hoverPoint ? formatEng(hoverPoint.a) : '---'}
                                 </span>
                             </div>
                             <div className="flex items-center">
                                 <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div> 
                                 <span>J:</span>
                                 <span className={`ml-1 font-mono font-bold ${hoverPoint ? 'text-orange-600' : 'text-gray-300'}`}>
                                     {hoverPoint ? formatEng(hoverPoint.j) : '---'}
                                 </span>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
