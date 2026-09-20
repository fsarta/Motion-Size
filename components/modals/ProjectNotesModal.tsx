import React, { useState } from 'react';
import { X, Save, FileText, User, Calendar, Building } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface ProjectNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectNotesModal: React.FC<ProjectNotesModalProps> = ({ isOpen, onClose }) => {
  const { data, updateNode } = useProjectStore();
  const rootNode = data[0];
  const params = rootNode?.parameters || {};

  const [title, setTitle] = useState(params.projectTitle || 'Motion Sizing Project');
  const [author, setAuthor] = useState(params.projectAuthor || '');
  const [company, setCompany] = useState(params.projectCompany || '');
  const [date, setDate] = useState(params.projectDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(params.projectNotes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (rootNode) {
      updateNode(rootNode.id, {
        projectTitle: title,
        projectAuthor: author,
        projectCompany: company,
        projectDate: date,
        projectNotes: notes
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[650px] bg-white rounded shadow-2xl border border-gray-300 flex flex-col overflow-hidden font-sans text-xs">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-100 border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-800">
            <FileText size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold">Project Metadata & Engineering Notes</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-600"><X size={16} /></button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Project / Machine Title</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-1.5 focus:border-blue-500 outline-none" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. 3-Axis Cartesian Pick & Place"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Engineer / Author</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-1.5 focus:border-blue-500 outline-none" 
                value={author} 
                onChange={e => setAuthor(e.target.value)} 
                placeholder="e.g. Senior Automation Engineer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Client / Company</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-1.5 focus:border-blue-500 outline-none" 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                placeholder="e.g. Packaging Machinery SpA"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Date</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded p-1.5 focus:border-blue-500 outline-none" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Engineering Notes & Specifications</label>
            <textarea 
              rows={8}
              className="w-full border border-gray-300 rounded p-2 focus:border-blue-500 outline-none font-mono text-xs leading-relaxed"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Record design assumptions, mechanical constraints, duty cycle requirements, or safety notes here..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-300 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-1.5 bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center px-5 py-1.5 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
            <Save size={14} className="mr-1.5" /> Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};
