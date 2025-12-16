import React, { useState } from 'react';
import { Table, Plus, Trash2, X } from 'lucide-react';
import { CamTable } from '../../types';

export const CamTableManagerModal = ({ isOpen, onClose, camTables, onAdd, onDelete }: { isOpen: boolean, onClose: () => void, camTables: CamTable[], onAdd: (name: string) => void, onDelete: (id: string) => void }) => {
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
       <div className="bg-win-bg border border-gray-400 shadow-xl w-96 font-sans text-xs flex flex-col h-[400px]">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-2 py-1 border-b border-gray-300 flex items-center justify-between text-gray-700 font-bold select-none">
             <div className="flex items-center"><Table size={14} className="mr-2 text-blue-600" /> Cam Table Manager</div>
             <button onClick={onClose} className="hover:bg-red-500 hover:text-white rounded-sm p-0.5"><X size={14}/></button>
          </div>
          
          <div className="p-2 border-b border-gray-300 bg-gray-50 flex space-x-2">
             <input 
               type="text" 
               className="flex-1 border border-gray-300 px-2 py-1 outline-none focus:border-blue-500 bg-white text-gray-900"
               style={{ backgroundColor: '#ffffff', color: '#111827' }}
               placeholder="New Table Name..."
               value={newName}
               onChange={(e) => setNewName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
             />
             <button onClick={handleAdd} className="flex items-center px-3 py-1 bg-white border border-gray-300 hover:bg-blue-50 rounded-sm shadow-sm text-gray-700">
               <Plus size={12} className="mr-1"/> Add
             </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-2">
             {camTables.length === 0 ? (
               <div className="text-gray-400 italic text-center mt-10">No Cam Tables defined.</div>
             ) : (
               <div className="border border-gray-200">
                  <div className="grid grid-cols-[1fr_40px] bg-gray-100 border-b border-gray-200 font-semibold p-1">
                     <div>Name</div>
                     <div className="text-center">Action</div>
                  </div>
                  {camTables.map(cam => (
                    <div key={cam.id} className="grid grid-cols-[1fr_40px] border-b border-gray-100 p-1 hover:bg-gray-50 items-center">
                       <div className="px-2">{cam.name}</div>
                       <div className="flex justify-center">
                          <button onClick={() => onDelete(cam.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12}/></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
          
          <div className="p-2 bg-gray-100 border-t border-gray-300 flex justify-end">
             <button onClick={onClose} className="px-4 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm shadow-sm">Close</button>
          </div>
       </div>
    </div>
  );
}