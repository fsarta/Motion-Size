
import React, { useState } from 'react';
import { Table, Plus, Trash2, X, Edit3 } from 'lucide-react';
import { CamTable } from '../../types';
import { CamEditor } from '../CamEditor';

export const CamTableManagerModal = ({ 
    isOpen, 
    onClose, 
    camTables, 
    onAdd, 
    onDelete,
    onUpdateTable
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    camTables: CamTable[], 
    onAdd: (name: string) => void, 
    onDelete: (id: string) => void,
    onUpdateTable: (table: CamTable) => void
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  // Select first table by default if none selected
  if (!selectedTableId && camTables.length > 0) {
      setSelectedTableId(camTables[0].id);
  }

  const activeTable = camTables.find(c => c.id === selectedTableId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
       <div className="bg-win-bg border border-gray-500 shadow-2xl w-[90vw] h-[90vh] font-sans text-xs flex flex-col rounded-sm overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-2 border-b border-gray-800 flex items-center justify-between text-white font-bold select-none shadow-md">
             <div className="flex items-center">
                 <Table size={16} className="mr-2 text-blue-300" /> 
                 Professional Cam Editor
             </div>
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white rounded-sm p-1 transition-colors"><X size={16}/></button>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
              
              {/* Sidebar: Table List */}
              <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col shrink-0">
                  <div className="p-2 border-b border-gray-300 bg-gray-200 font-bold text-gray-700">
                      Cam Tables
                  </div>
                  
                  {/* List */}
                  <div className="flex-1 overflow-y-auto">
                      {camTables.map(cam => (
                        <div 
                            key={cam.id} 
                            onClick={() => setSelectedTableId(cam.id)}
                            className={`flex items-center justify-between p-2 cursor-pointer border-b border-gray-200 
                                ${selectedTableId === cam.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : 'hover:bg-gray-50 text-gray-600'}
                            `}
                        >
                           <div className="font-medium">{cam.name}</div>
                           {selectedTableId === cam.id && (
                               <Trash2 
                                    size={14} 
                                    className="text-gray-400 hover:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); onDelete(cam.id); }} 
                               />
                           )}
                        </div>
                      ))}
                  </div>

                  {/* Add New */}
                  <div className="p-2 border-t border-gray-300 bg-gray-200">
                     <div className="flex space-x-1">
                        <input 
                           className="flex-1 border border-gray-300 px-2 py-1 outline-none text-xs"
                           placeholder="New Table Name..."
                           value={newName}
                           onChange={(e) => setNewName(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-2 rounded shadow hover:bg-blue-700">
                            <Plus size={14}/>
                        </button>
                     </div>
                  </div>
              </div>

              {/* Main Content: Editor */}
              <div className="flex-1 bg-white relative">
                  {activeTable ? (
                      <CamEditor 
                          camTable={activeTable} 
                          onChange={onUpdateTable}
                      />
                  ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                          <Table size={48} className="mb-4 opacity-20"/>
                          <div>Select or Create a Cam Table to edit</div>
                      </div>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
}
