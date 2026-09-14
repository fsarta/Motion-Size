import React, { useState, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export const IsometricTrajectory = ({ 
  pathData, 
  showVelocityHeatmap = false,
  scrubTime = 0,
  envelope = { x: 500, y: 500, z: 500 },
  tcpOffset = { x: 0, y: 0, z: 0 }
}: { 
  pathData: any[], 
  showVelocityHeatmap?: boolean,
  scrubTime?: number,
  envelope?: { x: number, y: number, z: number },
  tcpOffset?: { x: number, y: number, z: number }
}) => {
  const [azimuth, setAzimuth] = useState(Math.PI / 4); // 45 deg
  const [elevation, setElevation] = useState(Math.PI / 6); // 30 deg
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'rotate' | 'pan'>('rotate');
  
  const svgRef = useRef<SVGSVGElement>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragMode(e.button === 2 || e.shiftKey ? 'pan' : 'rotate');
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    
    if (dragMode === 'rotate') {
      setAzimuth(prev => prev - dx * 0.01);
      setElevation(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev - dy * 0.01)));
    } else {
      // Pan: scale movement by zoom so it feels 1:1 with the mouse
      const panFactor = 1 / zoom;
      setPan(prev => ({ x: prev.x + dx * panFactor, y: prev.y + dy * panFactor }));
    }
    
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if they are hovering the SVG
    setZoom(prev => Math.max(0.1, Math.min(10, prev - e.deltaY * 0.002)));
  };

  const resetView = () => {
    setAzimuth(Math.PI / 4);
    setElevation(Math.PI / 6);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const { points, standardPathString, heatmapPaths, viewBox, grid, axes, envBox, scrubTriad } = useMemo(() => {
    if (!pathData || pathData.length === 0) return { points: [], standardPathString: '', heatmapPaths: [], viewBox: '0 0 100 100', grid: [], axes: null, envBox: [], scrubTriad: null };

    const cosA = Math.cos(azimuth);
    const sinA = Math.sin(azimuth);
    const cosE = Math.cos(elevation);
    const sinE = Math.sin(elevation);
    
    // Project 3D to 2D (without zoom here)
    const project = (x: number, y: number, z: number) => {
      const x1 = x * cosA - y * sinA;
      const y1 = x * sinA + y * cosA;
      const u = x1;
      const v = y1 * sinE - z * cosE;
      return { u, v: -v }; 
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

    const envX = envelope.x * scale;
    const envY = envelope.y * scale;
    const envZ = envelope.z * scale;

    const maxX = Math.max(10, ...scaledData.map(p => p.x), envX) + 10;
    const maxY = Math.max(10, ...scaledData.map(p => p.y), envY) + 10;
    const maxZ = Math.max(10, ...scaledData.map(p => p.z), envZ) + 10;
    
    const boundsCoords = [
      ...scaledData,
      { x: 0, y: 0, z: 0 },
      { x: maxX, y: 0, z: 0 },
      { x: 0, y: maxY, z: 0 },
      { x: maxX, y: maxY, z: 0 },
      { x: 0, y: 0, z: maxZ },
      { x: envX, y: envY, z: envZ }
    ];

    boundsCoords.forEach(p => {
      const { u, v } = project(p.x, p.y, p.z);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });

    const padding = 20;
    const baseWidth = maxU - minU + padding * 2;
    const baseHeight = maxV - minV + padding * 2;

    const mapToSvg = (u: number, v: number) => ({
      cx: u - minU + padding,
      cy: v - minV + padding
    });

    // Zoom centers on the middle of the bounding box, pan shifts it
    const viewWidth = baseWidth / zoom;
    const viewHeight = baseHeight / zoom;
    const vbX = (baseWidth / 2) - (viewWidth / 2) - pan.x;
    const vbY = (baseHeight / 2) - (viewHeight / 2) - pan.y;
    const viewBoxStr = `${vbX} ${vbY} ${viewWidth} ${viewHeight}`;

    const envBox = [
      // Bottom face
      { p1: {x:0, y:0, z:0}, p2: {x:envX, y:0, z:0} },
      { p1: {x:envX, y:0, z:0}, p2: {x:envX, y:envY, z:0} },
      { p1: {x:envX, y:envY, z:0}, p2: {x:0, y:envY, z:0} },
      { p1: {x:0, y:envY, z:0}, p2: {x:0, y:0, z:0} },
      // Top face
      { p1: {x:0, y:0, z:envZ}, p2: {x:envX, y:0, z:envZ} },
      { p1: {x:envX, y:0, z:envZ}, p2: {x:envX, y:envY, z:envZ} },
      { p1: {x:envX, y:envY, z:envZ}, p2: {x:0, y:envY, z:envZ} },
      { p1: {x:0, y:envY, z:envZ}, p2: {x:0, y:0, z:envZ} },
      // Vertical edges
      { p1: {x:0, y:0, z:0}, p2: {x:0, y:0, z:envZ} },
      { p1: {x:envX, y:0, z:0}, p2: {x:envX, y:0, z:envZ} },
      { p1: {x:envX, y:envY, z:0}, p2: {x:envX, y:envY, z:envZ} },
      { p1: {x:0, y:envY, z:0}, p2: {x:0, y:envY, z:envZ} },
    ].map((edge, i) => {
       const u1 = project(edge.p1.x, edge.p1.y, edge.p1.z).u;
       const v1 = project(edge.p1.x, edge.p1.y, edge.p1.z).v;
       const u2 = project(edge.p2.x, edge.p2.y, edge.p2.z).u;
       const v2 = project(edge.p2.x, edge.p2.y, edge.p2.z).v;
       return { id: `env-${i}`, p1: mapToSvg(u1, v1), p2: mapToSvg(u2, v2) };
    });

    // Grid on Z=0
    const gridLines = [];
    const step = 50 * scale;
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
    for(let i = -100; i <= 300; i+=100) {
       for(let j = -100; j <= 300; j+=100) {
           const p1 = mapToSvg(project(i*scale, j*scale, 0).u, project(i*scale, j*scale, 0).v);
           const p2 = mapToSvg(project(i*scale, (j+100)*scale, 0).u, project(i*scale, (j+100)*scale, 0).v);
           const p3 = mapToSvg(project((i+100)*scale, j*scale, 0).u, project((i+100)*scale, j*scale, 0).v);
           gridLines.push({ x1: p1.cx, y1: p1.cy, x2: p2.cx, y2: p2.cy });
           gridLines.push({ x1: p1.cx, y1: p1.cy, x2: p3.cx, y2: p3.cy });
       }
    }

    // Axes lines
    const axisLen = 50 * scale * zoom;
    const orig = mapToSvg(project(0,0,0).u, project(0,0,0).v);
    const axX = mapToSvg(project(axisLen,0,0).u, project(axisLen,0,0).v);
    const axY = mapToSvg(project(0,axisLen,0).u, project(0,axisLen,0).v);
    const axZ = mapToSvg(project(0,0,axisLen).u, project(0,0,axisLen).v);
    const ax = { orig, axX, axY, axZ };

    // Waypoints and Shadows
    const svgPoints = scaledData.map(p => {
      const proj = project(p.x, p.y, p.z);
      const mapped = mapToSvg(proj.u, proj.v);
      const shadowProj = project(p.x, p.y, 0);
      const shadowMapped = mapToSvg(shadowProj.u, shadowProj.v);
      return { ...p, ...mapped, sx: shadowMapped.cx, sy: shadowMapped.cy };
    });

    const dist3D = (p1: any, p2: any) => Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2 + (p1.z-p2.z)**2);

    let standardPathString = '';
    const heatmapPaths: { d: string, id: string, x1: number, y1: number, x2: number, y2: number, stops: {offset:string, color:string}[] }[] = [];
    
    const gradPrefix = Math.random().toString(36).substr(2, 6);
    const maxVel = Math.max(0.001, ...scaledData.map((p: any) => parseFloat(p.vel) || 0));
    
    // HSL: 120 (Green) -> 0 (Red)
    const getHeatColor = (v: number) => {
       const ratio = Math.min(1, Math.max(0, v / maxVel));
       const hue = (1 - ratio) * 120; 
       return `hsl(${hue}, 100%, 45%)`;
    };

    let cursor = { cx: 0, cy: 0 };
    
    if (scaledData.length > 0) {
        const p0 = scaledData[0];
        cursor = mapToSvg(project(p0.x, p0.y, p0.z).u, project(p0.x, p0.y, p0.z).v);
        standardPathString += `M ${cursor.cx} ${cursor.cy} `;
    }
    
    for (let i = 1; i < scaledData.length; i++) {
       const p = scaledData[i];
       const pPrevRaw = scaledData[i-1];
       
       const projP = mapToSvg(project(p.x, p.y, p.z).u, project(p.x, p.y, p.z).v);
       const projPrev = mapToSvg(project(pPrevRaw.x, pPrevRaw.y, pPrevRaw.z).u, project(pPrevRaw.x, pPrevRaw.y, pPrevRaw.z).v);
       
       const velP = parseFloat(p.vel) || 0;
       const velPrev = parseFloat(pPrevRaw.vel) || 0;

       // Generate 5 stops to force SVG to interpolate through the HSL spectrum instead of muddy RGB
       const stops = [];
       for (let step = 0; step <= 4; step++) {
           const t = step / 4;
           const velT = velPrev + (velP - velPrev) * t;
           stops.push({ offset: `${t * 100}%`, color: getHeatColor(velT) });
       }

       // We define a gradient that spans the geometric segment from pPrev to p
       const segGradient = {
           id: `grad-${gradPrefix}-seg-${i}`,
           x1: projPrev.cx, y1: projPrev.cy,
           x2: projP.cx, y2: projP.cy,
           stops
       };
       
       if (i === scaledData.length - 1) {
           standardPathString += `L ${projP.cx} ${projP.cy} `;
           heatmapPaths.push({ ...segGradient, d: `M ${cursor.cx} ${cursor.cy} L ${projP.cx} ${projP.cy}` });
           cursor = projP;
       } else {
           const r = parseFloat(p.blend) || 0;
           if (r <= 0) {
               standardPathString += `L ${projP.cx} ${projP.cy} `;
               heatmapPaths.push({ ...segGradient, d: `M ${cursor.cx} ${cursor.cy} L ${projP.cx} ${projP.cy}` });
               cursor = projP;
           } else {
               const pNext = scaledData[i+1];
               
               const dPrev = dist3D(p, pPrevRaw);
               const dNext = dist3D(p, pNext);
               
               const actualR = Math.min(r * scale, dPrev / 2, dNext / 2);
               
               if (actualR <= 0.001 || dPrev === 0 || dNext === 0) {
                  standardPathString += `L ${projP.cx} ${projP.cy} `;
                  heatmapPaths.push({ ...segGradient, d: `M ${cursor.cx} ${cursor.cy} L ${projP.cx} ${projP.cy}` });
                  cursor = projP;
                  continue;
               }

               const startX = p.x + (pPrevRaw.x - p.x) * (actualR / dPrev);
               const startY = p.y + (pPrevRaw.y - p.y) * (actualR / dPrev);
               const startZ = p.z + (pPrevRaw.z - p.z) * (actualR / dPrev);
               
               const endX = p.x + (pNext.x - p.x) * (actualR / dNext);
               const endY = p.y + (pNext.y - p.y) * (actualR / dNext);
               const endZ = p.z + (pNext.z - p.z) * (actualR / dNext);
               
               const projStart = mapToSvg(project(startX, startY, startZ).u, project(startX, startY, startZ).v);
               const projEnd = mapToSvg(project(endX, endY, endZ).u, project(endX, endY, endZ).v);
               
               // Line to blend start (uses this segment's gradient)
               standardPathString += `L ${projStart.cx} ${projStart.cy} `;
               heatmapPaths.push({ ...segGradient, d: `M ${cursor.cx} ${cursor.cy} L ${projStart.cx} ${projStart.cy}` });

               // Blend curve (also uses this segment's gradient, clamping naturally at P)
               standardPathString += `Q ${projP.cx} ${projP.cy} ${projEnd.cx} ${projEnd.cy} `;
               heatmapPaths.push({ ...segGradient, id: `grad-${gradPrefix}-curve-${i}`, d: `M ${projStart.cx} ${projStart.cy} Q ${projP.cx} ${projP.cy} ${projEnd.cx} ${projEnd.cy}` });

               cursor = projEnd;
           }
       }
    }

    // --- Scrubbing TCP Interpolation ---
    let scrubPoint = null;
    let scrubTriad = null;
    
    if (scaledData.length >= 2) {
        const segmentsInfo = [];
        let totalLen = 0;
        
        for (let i = 1; i < scaledData.length; i++) {
           const p0 = scaledData[i-1];
           const p1 = scaledData[i];
           const d = dist3D(p0, p1);
           segmentsInfo.push({ p0, p1, d, totalBefore: totalLen });
           totalLen += d;
        }

        const targetD = totalLen * (scrubTime / 100);
        let currentSeg = segmentsInfo[segmentsInfo.length - 1];
        for (let i = 0; i < segmentsInfo.length; i++) {
           if (targetD <= segmentsInfo[i].totalBefore + segmentsInfo[i].d) {
               currentSeg = segmentsInfo[i];
               break;
           }
        }

        const segT = currentSeg.d > 0 ? (targetD - currentSeg.totalBefore) / currentSeg.d : 1;
        
        const px = currentSeg.p0.x + (currentSeg.p1.x - currentSeg.p0.x) * segT;
        const py = currentSeg.p0.y + (currentSeg.p1.y - currentSeg.p0.y) * segT;
        const pz = currentSeg.p0.z + (currentSeg.p1.z - currentSeg.p0.z) * segT;
        
        const rx = (parseFloat(currentSeg.p0.rx) || 0) + ((parseFloat(currentSeg.p1.rx) || 0) - (parseFloat(currentSeg.p0.rx) || 0)) * segT;
        const ry = (parseFloat(currentSeg.p0.ry) || 0) + ((parseFloat(currentSeg.p1.ry) || 0) - (parseFloat(currentSeg.p0.ry) || 0)) * segT;
        const rz = (parseFloat(currentSeg.p0.rz) || 0) + ((parseFloat(currentSeg.p1.rz) || 0) - (parseFloat(currentSeg.p0.rz) || 0)) * segT;

        // Apply TCP Offset
        // Convert rx, ry, rz to radians
        const radX = rx * Math.PI / 180;
        const radY = ry * Math.PI / 180;
        const radZ = rz * Math.PI / 180;
        
        // Simplified rotation matrix applied to TCP vector (tcpOffset)
        // Z-Y-X Euler order
        const cx = Math.cos(radX), sx = Math.sin(radX);
        const cy = Math.cos(radY), sy = Math.sin(radY);
        const cz = Math.cos(radZ), sz = Math.sin(radZ);

        // Column vectors of the rotation matrix
        const vx_x = cz * cy;
        const vx_y = sz * cy;
        const vx_z = -sy;

        const vy_x = cz * sy * sx - sz * cx;
        const vy_y = sz * sy * sx + cz * cx;
        const vy_z = cy * sx;

        const vz_x = cz * sy * cx + sz * sx;
        const vz_y = sz * sy * cx - cz * sx;
        const vz_z = cy * cx;

        const tx = tcpOffset.x * scale;
        const ty = tcpOffset.y * scale;
        const tz = tcpOffset.z * scale;

        // Rotate TCP Offset
        const tcpRotX = tx * vx_x + ty * vy_x + tz * vz_x;
        const tcpRotY = tx * vx_y + ty * vy_y + tz * vz_y;
        const tcpRotZ = tx * vx_z + ty * vy_z + tz * vz_z;

        const finalX = px + tcpRotX;
        const finalY = py + tcpRotY;
        const finalZ = pz + tcpRotZ;

        scrubPoint = mapToSvg(project(finalX, finalY, finalZ).u, project(finalX, finalY, finalZ).v);

        // Calculate Triad axes (constant screen length)
        const triadLen = 20 / zoom;
        const xVecX = finalX + triadLen * vx_x;
        const xVecY = finalY + triadLen * vx_y;
        const xVecZ = finalZ + triadLen * vx_z;

        const yVecX = finalX + triadLen * vy_x;
        const yVecY = finalY + triadLen * vy_y;
        const yVecZ = finalZ + triadLen * vy_z;

        const zVecX = finalX + triadLen * vz_x;
        const zVecY = finalY + triadLen * vz_y;
        const zVecZ = finalZ + triadLen * vz_z;

        scrubTriad = {
           orig: scrubPoint,
           x: mapToSvg(project(xVecX, xVecY, xVecZ).u, project(xVecX, xVecY, xVecZ).v),
           y: mapToSvg(project(yVecX, yVecY, yVecZ).u, project(yVecX, yVecY, yVecZ).v),
           z: mapToSvg(project(zVecX, zVecY, zVecZ).u, project(zVecX, zVecY, zVecZ).v),
        };
    }

    return { points: svgPoints, standardPathString, heatmapPaths, viewBox: viewBoxStr, grid: gridLines, axes: ax, envBox, scrubPoint, scrubTriad };
  }, [pathData, azimuth, elevation, zoom, pan, envelope, scrubTime, tcpOffset]);

  if (!axes) return null;

  return (
    <div 
      className="w-full h-full relative group select-none cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      <svg ref={svgRef} viewBox={viewBox} className="w-full h-full max-h-64 drop-shadow-sm">
        {/* Grid */}
        <g stroke="#e5e7eb" strokeWidth={0.5 / zoom}>
          {grid.map(line => (
            <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </g>
        
        {/* Work Envelope */}
        <g stroke="#d8b4fe" strokeWidth={0.5 / zoom} strokeDasharray={`${4 / zoom} ${4 / zoom}`} fill="none">
          {envBox.map(edge => (
            <line key={edge.id} x1={edge.p1.cx} y1={edge.p1.cy} x2={edge.p2.cx} y2={edge.p2.cy} />
          ))}
        </g>
        
        {/* Origin Axes */}
        <g strokeWidth={1 / zoom}>
          <line x1={axes.orig.cx} y1={axes.orig.cy} x2={axes.axX.cx} y2={axes.axX.cy} stroke="#fca5a5" />
          <line x1={axes.orig.cx} y1={axes.orig.cy} x2={axes.axY.cx} y2={axes.axY.cy} stroke="#bbf7d0" />
          <line x1={axes.orig.cx} y1={axes.orig.cy} x2={axes.axZ.cx} y2={axes.axZ.cy} stroke="#bfdbfe" />
          <text x={axes.axX.cx} y={axes.axX.cy} fontSize={4 / zoom} fill="#ef4444">X</text>
          <text x={axes.axY.cx} y={axes.axY.cy} fontSize={4 / zoom} fill="#22c55e">Y</text>
          <text x={axes.axZ.cx} y={axes.axZ.cy} fontSize={4 / zoom} fill="#3b82f6">Z</text>
        </g>

        {/* Drop Shadows */}
        <g stroke="#cbd5e1" strokeWidth={0.5 / zoom} strokeDasharray={`${2 / zoom} ${2 / zoom}`}>
          {points.map((p, i) => (
             <line key={`drop-${i}`} x1={p.cx} y1={p.cy} x2={p.sx} y2={p.sy} />
          ))}
        </g>

        {/* 3D Trajectory Path */}
        {showVelocityHeatmap ? (
          <g strokeWidth={2 / zoom} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <defs>
              {heatmapPaths.map(hp => (
                <linearGradient key={hp.id} id={hp.id} x1={hp.x1} y1={hp.y1} x2={hp.x2} y2={hp.y2} gradientUnits="userSpaceOnUse">
                  {hp.stops.map((s, idx) => (
                      <stop key={idx} offset={s.offset} stopColor={s.color} />
                  ))}
                </linearGradient>
              ))}
            </defs>
            {heatmapPaths.map(hp => (
              <path key={`path-${hp.id}`} d={hp.d} stroke={`url(#${hp.id})`} />
            ))}
          </g>
        ) : (
          <path d={standardPathString} fill="none" stroke="#2563eb" strokeWidth={1.5 / zoom} strokeLinejoin="round" />
        )}

        {/* Waypoints */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r={2.5 / zoom} fill="#1e40af" stroke="#ffffff" strokeWidth={1 / zoom} />
            <text x={p.cx + 4 / zoom} y={p.cy - 4 / zoom} fontSize={6 / zoom} fill="#1e293b" className="font-bold font-sans">
              {p.name}
            </text>
          </g>
        ))}

        {/* TCP Triad Scrubbing Visualization */}
        {scrubTriad && (
          <g strokeWidth={2 / zoom}>
            {/* TCP Position Dot */}
            <circle cx={scrubTriad.orig.cx} cy={scrubTriad.orig.cy} r={3 / zoom} fill="#f59e0b" stroke="#ffffff" strokeWidth={1 / zoom} />
            
            {/* TCP Orientation Triad */}
            <line x1={scrubTriad.orig.cx} y1={scrubTriad.orig.cy} x2={scrubTriad.x.cx} y2={scrubTriad.x.cy} stroke="#ef4444" />
            <line x1={scrubTriad.orig.cx} y1={scrubTriad.orig.cy} x2={scrubTriad.y.cx} y2={scrubTriad.y.cy} stroke="#22c55e" />
            <line x1={scrubTriad.orig.cx} y1={scrubTriad.orig.cy} x2={scrubTriad.z.cx} y2={scrubTriad.z.cy} stroke="#3b82f6" />
          </g>
        )}
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
