import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { TreeNode } from '../types';

const EfficiencyBar = React.memo(({ value }: { value: number }) => (
  <div className="flex flex-col items-center">
    <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 rounded-sm mb-1 border border-green-600 shadow-sm">
      {value}%
    </div>
    <div className="h-4 w-px bg-gray-400"></div>
  </div>
));

const DriveUnit = React.memo(({ label }: { label: string }) => (
  <div className="flex flex-col items-center mx-2 relative group w-16 shrink-0">
    {/* Connection line top */}
    <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-400"></div>
    
    {/* Inverter Box */}
    <div className="w-16 h-24 bg-gray-50 border border-gray-400 shadow-sm relative flex flex-col items-center justify-between p-1">
      <div className="w-full h-4 bg-gray-800 text-red-500 font-mono text-[8px] flex items-center justify-center">88</div>
      <div className="flex-1 flex items-center justify-center">
        <Zap size={16} className="text-gray-400" />
      </div>
      <div className="w-full flex justify-around">
         <div className="w-1.5 h-1.5 bg-green-700 rounded-full"></div>
         <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
    </div>

    {/* Cable */}
    <div className="h-6 w-1 bg-green-700 my-0.5"></div>

    {/* Motor */}
    <div className="w-16 h-10 bg-gray-700 rounded-sm border border-black relative flex items-center justify-center shadow-md">
       <div className="absolute -left-2 w-4 h-6 bg-gray-600 rounded-l-sm border-l border-t border-b border-black"></div>
       <div className="w-10 h-0.5 bg-gray-500 opacity-30"></div>
       <div className="w-10 h-0.5 bg-gray-500 opacity-30 mt-1"></div>
    </div>
    
    <div className="mt-1 text-xs font-bold text-gray-600 truncate w-full text-center">{label}</div>
  </div>
));

export const Visualizer = ({ axes }: { axes: TreeNode[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerWidth, setContainerWidth] = useState(0);

  // Constants for Virtualization
  // Width = 64px (w-16) + 16px (mx-2 = 8px * 2) = 80px
  const ITEM_WIDTH = 80; 
  const BUFFER = 5; // Number of extra items to render outside viewport

  // 1. Observe Container Resize
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

  // 2. Handle Scroll to update visible range
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
      // Initial calculation
      handleScroll();
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [axes.length, containerWidth]);

  // 3. Render Helper
  const { totalWidth, offsetLeft, visibleAxes } = useMemo(() => {
    const totalWidth = axes.length * ITEM_WIDTH;
    const offsetLeft = visibleRange.start * ITEM_WIDTH;
    const visibleAxes = axes.slice(visibleRange.start, visibleRange.end);
    return { totalWidth, offsetLeft, visibleAxes };
  }, [axes, visibleRange]);

  return (
    <div className="h-1/3 bg-white border-b border-gray-300 p-4 relative overflow-hidden flex flex-col shrink-0">
       {/* Title Overlay */}
       <div className="absolute top-0 left-0 bg-win-blue/10 text-win-blue font-bold px-2 py-0.5 text-xs border-r border-b border-win-blue/20 z-10">
         Power Group
       </div>

       {/* System Diagram */}
       <div className="flex-1 flex items-center overflow-hidden">
         {/* Supply Unit (Static) */}
         <div className="mr-8 flex flex-col items-center justify-end h-full pb-10 shrink-0 z-10 bg-white pl-4">
            <div className="w-12 h-32 bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-400 shadow-md flex items-center justify-center">
               <div className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center">
                 <div className="w-0.5 h-3 bg-black transform rotate-45"></div>
               </div>
            </div>
         </div>

         {/* Virtualized Scroll Area */}
         <div 
            ref={containerRef}
            className="flex-1 h-full overflow-x-auto overflow-y-hidden relative scrollbar-thin"
         >
            {/* Connection Bus Background */}
            <div className="absolute top-[35%] left-0 h-1 bg-gray-800 -z-10" style={{ width: Math.max(containerWidth, totalWidth + 40) }}></div>

            {/* Scroll Content Container */}
            <div className="h-full flex items-end pb-2" style={{ width: totalWidth, position: 'relative' }}>
              {/* Virtualization Spacer */}
              <div style={{ width: offsetLeft, flexShrink: 0 }}></div>
              
              {/* Rendered Items */}
              {visibleAxes.map((axis, index) => {
                 // The index passed here is local to the slice, so we calculate global index for efficiency seed
                 const globalIndex = visibleRange.start + index;
                 const efficiency = 85 + (globalIndex * 2) % 10;
                 return (
                  <div key={axis.id} className="flex flex-col items-center -mt-16 shrink-0">
                    <EfficiencyBar value={efficiency} />
                    <DriveUnit label={axis.label.split(' ')[0]} />
                  </div>
                 );
              })}
            </div>
         </div>
       </div>
    </div>
  );
};