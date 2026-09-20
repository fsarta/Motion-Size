import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TreeNode } from '../types';

const EfficiencyBar = React.memo(({ value }: { value: number }) => (
  <div className="flex flex-col items-center">
    <div className="bg-green-600 text-white text-[9px] font-bold px-1.5 rounded-sm mb-1 border border-green-700 shadow-sm">
      {value}%
    </div>
    <div className="h-4 w-px bg-gray-400"></div>
  </div>
));

const DriveUnit = React.memo(({ 
  axis, 
  isSelected, 
  onClick 
}: { 
  axis: TreeNode; 
  isSelected: boolean; 
  onClick?: () => void;
}) => {
  const p = axis.parameters || {};
  const isConfigured = !!p.motorModel && !!p.driveModel;
  const label = axis.label || 'Axis';
  const motorModel = p.motorModel || 'Pending Motor';
  const driveModel = p.driveModel || 'Pending Drive';

  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center mx-2 relative group w-20 shrink-0 cursor-pointer transition-all ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
      title={`${label} - ${isConfigured ? 'Fully Configured' : 'Needs Selection'}\nMotor: ${motorModel}\nDrive: ${driveModel}`}
    >
      {/* Connection line top */}
      <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-400"></div>
      
      {/* Inverter Box */}
      <div className={`w-20 h-24 bg-gradient-to-b from-gray-50 to-gray-200 border rounded-sm shadow relative flex flex-col items-center justify-between p-1 transition-colors ${
        isSelected ? 'border-blue-600 ring-2 ring-blue-400 bg-blue-50/40' : 'border-gray-400 hover:border-blue-400'
      }`}>
        <div className="w-full h-4 bg-gray-800 text-red-500 font-mono text-[8px] flex items-center justify-between px-1">
          <span>{isConfigured ? 'RDY' : 'CFG'}</span>
          <span className="text-gray-400 text-[7px]">{p.driveMaxCurrent ? `${p.driveMaxCurrent}A` : ''}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Zap size={16} className={isConfigured ? "text-amber-500" : "text-gray-400"} />
          <span className="text-[7px] font-mono text-gray-500 text-center truncate w-full px-0.5">
            {p.driveModel ? p.driveModel.split('-')[0] : 'Inverter'}
          </span>
        </div>
        <div className="w-full flex justify-around items-center pt-0.5 border-t border-gray-300">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-amber-400'}`}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Cable */}
      <div className="h-5 w-1 bg-emerald-700 my-0.5"></div>

      {/* Motor */}
      <div className={`w-18 h-10 bg-slate-800 rounded-sm border relative flex items-center justify-center shadow-md transition-colors ${
        isSelected ? 'border-blue-600 ring-2 ring-blue-400' : 'border-black'
      }`}>
        <div className="absolute -left-2 w-4 h-6 bg-slate-700 rounded-l-sm border-l border-t border-b border-black"></div>
        <div className="w-10 h-0.5 bg-slate-600 opacity-40"></div>
        <div className="w-10 h-0.5 bg-slate-600 opacity-40 mt-1"></div>
        <span className="absolute text-[7px] font-bold text-slate-300 tracking-tighter truncate max-w-[50px]">
          {p.ratedTorque ? `${p.ratedTorque}Nm` : ''}
        </span>
      </div>
      
      <div className="mt-1 text-[11px] font-bold text-gray-700 truncate w-full text-center group-hover:text-blue-700">
        {label}
      </div>
    </div>
  );
});

export const Visualizer = ({ 
  axes, 
  selectedAxisId, 
  onSelectAxis 
}: { 
  axes: TreeNode[]; 
  selectedAxisId?: string; 
  onSelectAxis?: (id: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerWidth, setContainerWidth] = useState(0);

  const ITEM_WIDTH = 96; 
  const BUFFER = 4;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollLeft = containerRef.current.scrollLeft;
      
      const startIndex = Math.max(0, Math.floor(scrollLeft / ITEM_WIDTH) - BUFFER);
      const visibleItemsCount = Math.ceil(containerWidth / ITEM_WIDTH);
      const endIndex = Math.min(axes.length, startIndex + visibleItemsCount + (2 * BUFFER));
      
      setVisibleRange(prev => {
        if (prev.start === startIndex && prev.end === endIndex) return prev;
        return { start: startIndex, end: endIndex };
      });
    };

    const element = containerRef.current;
    if (element) {
      handleScroll();
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [axes.length, containerWidth]);

  const { totalWidth, offsetLeft, visibleAxes } = useMemo(() => {
    const totalWidth = axes.length * ITEM_WIDTH;
    const offsetLeft = visibleRange.start * ITEM_WIDTH;
    const visibleAxes = axes.slice(visibleRange.start, visibleRange.end);
    return { totalWidth, offsetLeft, visibleAxes };
  }, [axes, visibleRange]);

  return (
    <div className="h-1/3 bg-white border-b border-gray-300 p-4 relative overflow-hidden flex flex-col shrink-0">
      {/* Title Overlay */}
      <div className="absolute top-0 left-0 bg-blue-50 text-blue-900 font-bold px-3 py-1 text-xs border-r border-b border-blue-200 z-10 flex items-center space-x-2">
        <span>DC Shared Bus System Topology</span>
        <span className="text-[10px] text-gray-500 font-normal">({axes.length} Multi-Axis Drives)</span>
      </div>

      {/* System Diagram */}
      <div className="flex-1 flex items-center overflow-hidden">
        {/* Infeed Supply Unit (Static) */}
        <div className="mr-8 flex flex-col items-center justify-end h-full pb-8 shrink-0 z-10 bg-white pl-2">
          <div className="text-[9px] font-bold text-gray-500 mb-1">Mains Infeed</div>
          <div className="w-14 h-32 bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-400 shadow-md flex flex-col items-center justify-between p-1.5 rounded-sm">
            <div className="w-full h-3 bg-slate-800 text-green-400 font-mono text-[7px] flex items-center justify-center">
              400V
            </div>
            <div className="w-9 h-9 rounded-full border-2 border-slate-500 flex items-center justify-center bg-white shadow-inner">
              <Zap size={16} className="text-amber-500" />
            </div>
            <div className="text-[8px] font-mono text-slate-600 font-bold">ALM 16kW</div>
          </div>
        </div>

        {/* Virtualized Scroll Area */}
        <div 
          ref={containerRef}
          className="flex-1 h-full overflow-x-auto overflow-y-hidden relative scrollbar-thin"
        >
          {/* DC Bus Bar */}
          <div 
            className="absolute top-[38%] left-0 h-1.5 bg-slate-800 -z-10 rounded-full" 
            style={{ width: Math.max(containerWidth, totalWidth + 60) }}
          ></div>

          {/* Scroll Content Container */}
          <div className="h-full flex items-end pb-2" style={{ width: totalWidth, position: 'relative' }}>
            <div style={{ width: offsetLeft, flexShrink: 0 }}></div>
            
            {visibleAxes.map((axis) => {
              const efficiency = parseFloat(String(axis.parameters?.motorEfficiency || 92));
              return (
                <div key={axis.id} className="flex flex-col items-center -mt-16 shrink-0">
                  <EfficiencyBar value={efficiency} />
                  <DriveUnit 
                    axis={axis} 
                    isSelected={axis.id === selectedAxisId}
                    onClick={() => onSelectAxis?.(axis.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
