
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize, Activity, Save, RefreshCw, Layers, Layout, AlertCircle } from 'lucide-react';
import { CamTable, CamSector, CamMotionLaw } from '../types';
import { ConfirmationModal } from './modals/ConfirmationModal';

// --- Math Engines for Motion Laws ---

const MotionLaws: Record<CamMotionLaw, (u: number) => [number, number, number, number]> = {
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
        const u2 = u*u, u3 = u2*u, u4 = u3*u, u5 = u4*u;
        return [10*u3 - 15*u4 + 6*u5, 30*u2 - 60*u3 + 30*u4, 60*u - 180*u2 + 120*u3, 60 - 360*u + 360*u2];
    },
    'Modified Trapezoid': (u) => {
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

const formatEng = (val: number) => {
    if (val === 0) return "0.0000";
    const abs = Math.abs(val);
    if (abs < 0.001 || abs >= 10000) {
        return val.toExponential(4);
    }
    return val.toFixed(4);
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
    const [validationError, setValidationError] = useState<string | null>(null);

    // Ensure sectors are sorted
    const sortedSectors = useMemo(() => {
        return [...camTable.sectors].sort((a,b) => a.masterStart - b.masterStart);
    }, [camTable]);

    // --- Calculation Engine ---
    const plotData = useMemo(() => {
        const points: CamPoint[] = [];
        const resolution = 1.0;

        sortedSectors.forEach(sector => {
            const rangeX = sector.masterEnd - sector.masterStart;
            const rangeY = sector.slaveEnd - sector.slaveStart;
            const steps = Math.ceil(rangeX / resolution);
            
            if (rangeX <= 0) return;

            for(let i=0; i<=steps; i++) {
                const xLocal = i * resolution;
                const currentX = sector.masterStart + xLocal;
                
                if (points.length > 0 && Math.abs(points[points.length-1].x - currentX) < 0.01) continue;
                if (currentX > sector.masterEnd) break;

                const u = Math.min(1, Math.max(0, xLocal / rangeX));
                const lawFunc = MotionLaws[sector.law];
                const [s_norm, v_norm, a_norm, j_norm] = lawFunc(u);

                points.push({
                    x: currentX,
                    y: sector.slaveStart + (rangeY * s_norm),
                    v: (rangeY / rangeX) * v_norm, 
                    a: (rangeY / (rangeX*rangeX)) * a_norm,
                    j: (rangeY / Math.pow(rangeX, 3)) * j_norm
                });
            }
        });
        return points;
    }, [sortedSectors]);

    const hoverPoint = useMemo(() => {
        if (hoverX === null || plotData.length === 0) return null;
        return plotData.reduce((prev, curr) => 
            Math.abs(curr.x - hoverX) < Math.abs(prev.x - hoverX) ? curr : prev
        );
    }, [hoverX, plotData]);

    // --- Interaction Handlers ---

    const updateSector = (id: string, field: keyof CamSector, value: any) => {
        let finalValue = value;
        
        // Validation: masterEnd cannot exceed masterRange
        if (field === 'masterEnd') {
            const num = parseFloat(value);
            if (num > camTable.masterRange) {
                finalValue = camTable.masterRange;
            }
        }

        const newSectors = camTable.sectors.map(s => {
            if (s.id === id) return { ...s, [field]: finalValue };
            return s;
        });

        // Auto-stitch logic
        if (field === 'masterEnd' || field === 'slaveEnd') {
            const idx = newSectors.findIndex(s => s.id === id);
            if (idx >= 0 && idx < newSectors.length - 1) {
                const nextSec = newSectors[idx+1];
                if (field === 'masterEnd') nextSec.masterStart = parseFloat(finalValue);
                if (field === 'slaveEnd') nextSec.slaveStart = parseFloat(finalValue);
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
        
        if (newStartM >= camTable.masterRange) {
            setValidationError("Cannot add more sectors. The Master Cycle is already fully defined.");
            return;
        }

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

    const handleRequestSave = () => {
        const lastSector = sortedSectors[sortedSectors.length - 1];
        if (lastSector.masterEnd < camTable.masterRange) {
            setValidationError(`Validation Error: The profile must cover the entire Master Cycle. Current profile ends at ${lastSector.masterEnd} but cycle is ${camTable.masterRange}.`);
            return;
        }
        setIsSaveConfirmOpen(true);
    };

    const handleSaveConfirm = () => {
        setIsSaveConfirmOpen(false);
    };

    // --- Graph Rendering Helpers ---
    const width = 600;
    const padding = 20;
    const xMax = camTable.masterRange;
    
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
    
    const renderGraph = (type: GraphType, height: number, color: string, showXAxis: boolean) => {
        const [min, max] = limits[type] as [number, number];
        const range = max - min;
        const scaleY = (val: number) => {
            const norm = (val - min) / range;
            return (height - padding) - (norm * (height - 2*padding));
        };
        const pathD = plotData.length > 0 ? plotData.map((p, i) => {
            const x = scaleX(p.x);
            const val = type === 'pos' ? p.y : type === 'vel' ? p.v : type === 'acc' ? p.a : p.j;
            const y = scaleY(val);
            return `${i===0?'M':'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ") : "";
        const zeroY = scaleY(0);

        return (
            <svg 
                width="100%" height="100%" 
                viewBox={`0 0 ${width} ${height}`} 
                preserveAspectRatio="none"
                className="bg-white border-b border-gray-200 block"
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const localX = e.clientX - rect.left;
                    const r = localX / rect.width;
                    setHoverX(Math.max(0, Math.min(xMax, r * xMax)));
                }}
                onMouseLeave={() => setHoverX(null)}
            >
                <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#eee" />
                <line x1={width-padding} y1={padding} x2={width-padding} y2={height-padding} stroke="#eee" />
                {min < 0 && max > 0 && (
                    <line x1={padding} y1={zeroY} x2={width-padding} y2={zeroY} stroke="#ddd" strokeDasharray="4,2"/>
                )}
                <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                {sortedSectors.map(s => {
                    const x = scaleX(s.masterEnd);
                    return <line key={s.id} x1={x} y1={padding} x2={x} y2={height-padding} stroke="#f3f4f6" />;
                })}
                {hoverX !== null && (
                    <line 
                        x1={scaleX(hoverX)} y1={padding} 
                        x2={scaleX(hoverX)} y2={height-padding} 
                        stroke="black" strokeDasharray="3,3" strokeWidth="1"
                    />
                )}
                <text x={padding} y={padding - 5} fontSize="10" fill={color} fontWeight="bold" className="uppercase">{type}</text>
                {showXAxis && (
                   <text x={width/2} y={height-5} textAnchor="middle" fontSize="10" fill="#999">Master Position ({camTable.masterRange} Cycle)</text>
                )}
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Save Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isSaveConfirmOpen}
                title="Confirm Save"
                message={<p>Do you want to save changes to cam table <br/><span className="font-bold">"{camTable.name}"</span>?</p>}
                variant="info"
                confirmLabel="Save"
                onConfirm={handleSaveConfirm}
                onCancel={() => setIsSaveConfirmOpen(false)}
            />

            {/* Validation Error Modal */}
            <ConfirmationModal
                isOpen={!!validationError}
                title="Validation Error"
                message={
                    <div className="flex flex-col items-center">
                        <AlertCircle size={24} className="text-red-500 mb-2"/>
                        <p>{validationError}</p>
                    </div>
                }
                variant="danger"
                confirmLabel="OK"
                onConfirm={() => setValidationError(null)}
                onCancel={() => setValidationError(null)}
                cancelLabel="Close"
            />

            {/* Toolbar */}
            <div className="h-10 bg-white border-b border-gray-300 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center space-x-4">
                     <span className="font-bold text-gray-700">{camTable.name}</span>
                     <div className="h-4 w-px bg-gray-300"></div>
                     <div className="flex space-x-1 text-xs items-center">
                         <span className="text-gray-500">Master Cycle:</span>
                         <input 
                            className="w-16 border border-gray-300 text-center focus:border-blue-500 focus:outline-none h-6" 
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
                        onClick={handleRequestSave}
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
                                                className={`w-16 border border-transparent hover:border-gray-300 bg-transparent px-1 focus:bg-white focus:outline-none ${sector.masterEnd === camTable.masterRange ? 'font-bold' : ''}`}
                                                type="number"
                                                value={sector.masterEnd}
                                                onChange={(e) => updateSector(sector.id, 'masterEnd', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                className="w-16 border border-transparent hover:border-gray-300 bg-transparent px-1 focus:bg-white focus:outline-none font-bold text-blue-700"
                                                type="number"
                                                value={sector.slaveEnd}
                                                onChange={(e) => updateSector(sector.id, 'slaveEnd', e.target.value)}
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
                           Note: The last segment must end at <strong>{camTable.masterRange}</strong>.
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
