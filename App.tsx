import React from 'react';
import { Ribbon } from './components/Ribbon';
import { TreeView } from './components/TreeView';
import { WorkArea } from './components/MainView';
import { WizardPanel } from './components/WizardPanel';
import { HelpCircle } from 'lucide-react';

const Footer = () => (
  <div className="h-6 bg-win-blue/10 border-t border-gray-300 flex items-center px-2 text-xs text-gray-600 justify-between shrink-0">
    <div className="flex items-center space-x-4">
      <div className="flex items-center cursor-pointer hover:text-black">
        <HelpCircle size={12} className="mr-1 text-blue-600" />
        <span>Press F1 for Help</span>
      </div>
      <div className="border-l border-gray-300 pl-4 h-3 flex items-center">
         Country: all
      </div>
    </div>
    <div>
      {/* Right side status items could go here */}
    </div>
  </div>
);

const App = () => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden select-none">
      <Ribbon />
      
      <div className="flex-1 flex flex-row overflow-hidden relative">
        <TreeView />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <WorkArea />
        </div>

        <WizardPanel />
      </div>

      <Footer />
    </div>
  );
};

export default App;