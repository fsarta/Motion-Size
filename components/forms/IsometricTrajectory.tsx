import React, { useState, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export const IsometricTrajectory = ({ pathData }: { pathData: any[] }) => {
  const [azimuth, setAzimuth] = useState(Math.PI / 4); // 45 deg
  const [elevation, setElevation] = useState(Math.PI / 6); // 30 deg
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    
    setAzimuth(prev => prev - dx * 0.01);
    setElevation(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev - dy * 0.01)));
    
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if they are hovering the SVG
    setZoom(prev => Math.max(0.1, Math.min(10, prev - e.deltaY * 0.002)));
  };

  const resetView = () => {
    setAzimuth(Math.PI / 4);
    setElevation(Math.PI / 6);
    setZoom(1);
  };

  const { points, paths, viewBox, grid, axes } = useMemo(() => {
    if (!pathData || pathData.length === 0) return { points: [], paths: '', viewBox: '0 0 100 100', grid: [], axes: null };

    const cosA = Math.cos(azimuth);
    const sinA = Math.sin(azimuth);
    const cosE = Math.cos(elevation);
    const sinE = Math.sin(elevation);
    
    // Project 3D to 2D
    const project = (x: number, y: number, z: number) => {
      // 1. Rotate around Z (Azimuth)
      const x1 = x * cosA - y * sinA;
      const y1 = x * sinA + y * cosA;
      // 2. Rotate around X (Elevation)
      const u = x1;
      const v = y1 * sinE - z * cosE;
      return { u: u * zoom, v: -v * zoom }; // Invert V so positive Z goes UP
    };

    let minU = Infinity, maxU = -Infinity;
    let minV = Infinity, maxV = -Infinity;

    const scale = 0.1;
    const scaledData = pathData.map(p => ({
      ...p, 
      x: (p.x || 0) * scale, 
      y: (p.y || 0) * scale, 
      z: (p.z || 0) * scale 
    }));

    const maxX = Math.max(10, ...scaledData.map(p => p.x)) + 10;
    const maxY = Math.max(10, ...scaledData.map(p => p.y)) + 10;
    const maxZ = Math.max(10, ...scaledData.map(p => p.z)) + 10;
    
    const boundsCoords = [
      ...scaledData,
      { x: 0, y: 0, z: 0 },
      { x: maxX, y: 0, z: 0 },
      { x: 0, y: maxY, z: 0 },
      { x: maxX, y: maxY, z: 0 },
      { x: 0, y: 0, z: maxZ }
    ];

    boundsCoords.forEach(p => {
      const { u, v } = project(p.x, p.y, p.z);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });

    const padding = 20;
    const width = maxU - minU + padding * 2;
    const height = maxV - minV + padding * 2;

    const mapToSvg = (u: number, v: number) => ({
      cx: u - minU + padding,
      cy: v - minV + padding
    });

    // Grid on Z=0
    const gridLines = [];
    const step = 10;
    for (let x = 0; x <= maxX; x += step) {
      const p1 = mapToSvg(project(x, 0, 0).u, project(x, 0, 0).v);
      const p2 = mapToSvg(project(x, maxY, 0).u, project(x, maxY, 0).v);
      gridLines.push({ id: `x${x}`, x1: p1.cx, y1: p1.cy, x2: p2.cx, y2: p2.cy });
    }
    for (let y = 0; y <= maxY; y += step) {
      const p1 = mapToSvg(project(0, y, 0).u, project(0, y, 0).v);
      const p2 = mapToSvg(project(maxX, y, 0).u, project(maxX, y, 0).v);
      gridLines.push({ id: `y${y}`, x1: p1.cx, y1: p1.cy, x2: p2.cx, y2: p2.cy });
    }

    // Origin Axes
    const origin = mapToSvg(project(0, 0, 0).u, project(0, 0, 0).v);
    const axisX = mapToSvg(project(maxX, 0, 0).u, project(maxX, 0, 0).v);
    const axisY = mapToSvg(project(0, maxY, 0).u, project(0, maxY, 0).v);
    const axisZ = mapToSvg(project(0, 0, maxZ).u, project(0, 0, maxZ).v);
    const ax = { origin, axisX, axisY, axisZ };

    // Waypoints and Shadows
    const svgPoints = scaledData.map(p => {
      const proj = project(p.x, p.y, p.z);
      const mapped = mapToSvg(proj.u, proj.v);
      const shadowProj = project(p.x, p.y, 0);
      const shadowMapped = mapToSvg(shadowProj.u, shadowProj.v);
      return { ...p, ...mapped, sx: shadowMapped.cx, sy: shadowMapped.cy };
    });

    const dist3D = (p1: any, p2: any) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2 + (p1.z-p2.z)**2);

    let pathString = '';
    
    for (let i = 0; i < scaledData.length; i++) {
       const p = scaledData[i];
       const projP = mapToSvg(project(p.x, p.y, p.z).u, project(p.x, p.y, p.z).v);
       
       if (i === 0) {
           pathString += `M ${projP.cx} ${projP.cy} `;
       } else if (i === scaledData.length - 1) {
           pathString += `L ${projP.cx} ${projP.cy} `;
       } else {
           const r = parseFloat(p.blend) || 0;
           if (r <= 0) {
               pathString += `L ${projP.cx} ${projP.cy} `;
           } else {
               const pPrev = scaledData[i-1];
               const pNext = scaledData[i+1];
               
               const dPrev = dist3D(p, pPrev);
               const dNext = dist3D(p, pNext);
               
               // Cap blend radius so it doesn't overshoot the segments.
               // * scale because coordinates are scaled down by 0.1
               const actualR = Math.min(r * scale, dPrev / 2, dNext / 2);
               
               if (actualR <= 0.001 || dPrev === 0 || dNext === 0) {
                  pathString += `L ${projP.cx} ${projP.cy} `;
                  continue;
               }

               const startX = p.x + (pPrev.x - p.x) * (actualR / dPrev);
               const startY = p.y + (pPrev.y - p.y) * (actualR / dPrev);
               const startZ = p.z + (pPrev.z - p.z) * (actualR / dPrev);
               
               const endX = p.x + (pNext.x - p.x) * (actualR / dNext);
               const endY = p.y + (pNext.y - p.y) * (actualR / dNext);
               const endZ = p.z + (pNext.z - p.z) * (actualR / dNext);
               
               const projStart = mapToSvg(project(startX, startY, startZ).u, project(startX, startY, startZ).v);
               const projEnd = mapToSvg(project(endX, endY, endZ).u, project(endX, endY, endZ).v);
               
               pathString += `L ${projStart.cx} ${projStart.cy} `;
               pathString += `Q ${projP.cx} ${projP.cy} ${projEnd.cx} ${projEnd.cy} `;
           }
       }
    }

    return { points: svgPoints, paths: pathString, viewBox: `0 0 ${width} ${height}`, grid: gridLines, axes: ax };
  }, [pathData, azimuth, elevation, zoom]);

  if (!axes) return null;

  return (
    <div 
      className="w-full h-full relative group select-none cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg ref={svgRef} viewBox={viewBox} className="w-full h-full max-h-64 drop-shadow-sm">
        {/* Grid */}
        <g stroke="#e5e7eb" strokeWidth="0.5">
          {grid.map(line => (
            <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </g>
        
        {/* Origin Axes */}
        <g strokeWidth="1">
          <line x1={axes.origin.cx} y1={axes.origin.cy} x2={axes.axisX.cx} y2={axes.axisX.cy} stroke="#fca5a5" />
          <line x1={axes.origin.cx} y1={axes.origin.cy} x2={axes.axisY.cx} y2={axes.axisY.cy} stroke="#86efac" />
          <line x1={axes.origin.cx} y1={axes.origin.cy} x2={axes.axisZ.cx} y2={axes.axisZ.cy} stroke="#93c5fd" />
        </g>

        {/* Drop Shadows */}
        <g stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2">
          {points.map((p, i) => (
             <line key={`drop-${i}`} x1={p.cx} y1={p.cy} x2={p.sx} y2={p.sy} />
          ))}
        </g>

        {/* Trajectory Path */}
        <path d={paths} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Waypoints */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="2.5" fill="#1e40af" stroke="#ffffff" strokeWidth="1" />
            <text x={p.cx + 4} y={p.cy - 4} fontSize="6" fill="#1e293b" className="font-bold font-sans">
              {p.name}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="absolute top-2 right-2 flex flex-col items-end space-y-2 opacity-30 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-gray-500 font-medium bg-white/90 px-2 py-1 rounded shadow-sm border border-gray-100">
          Drag to rotate • Scroll to zoom
        </div>
        <button onClick={resetView} className="bg-white/90 p-1.5 rounded shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Reset View">
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
};
