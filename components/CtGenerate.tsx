import React, { useState } from 'react';
import VideoGenerator from './VideoGenerator';
import BatchVideoGenerator from './BatchVideoGenerator';
import BatchKuGenerator from './BatchKuGenerator';
import BatchTxtGenerator from './BatchTxtGenerator';
import BatchJsonGenerator from './BatchJsonGenerator';

type SubTab = 'manual' | 'batch' | 'batchKu' | 'batchTxt' | 'batchJson';

const SubTabButton: React.FC<{
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ label, isActive, onClick, disabled }) => {
  const baseClasses = "px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200";
  const activeClasses = "bg-slate-700 text-white";
  const inactiveClasses = "text-gray-400 hover:bg-slate-800/60";
  const disabledClasses = "text-gray-600 cursor-not-allowed";

  const getClasses = () => {
    if (disabled) return `${baseClasses} ${disabledClasses}`;
    if (isActive) return `${baseClasses} ${activeClasses}`;
    return `${baseClasses} ${inactiveClasses}`;
  };

  return (
    <button onClick={onClick} className={getClasses()} disabled={disabled}>
      {label}
    </button>
  );
};

const EaGenerate: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('batch');

  const renderContent = () => {
    switch (activeSubTab) {
      case 'manual':
        // The original component is scene-based, which serves as a good manual generator.
        return <VideoGenerator />; 
      case 'batch':
        return <BatchVideoGenerator />;
      case 'batchKu':
        return <BatchKuGenerator />;
      case 'batchTxt':
        return <BatchTxtGenerator />;
      case 'batchJson':
        return <BatchJsonGenerator />;
      default:
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 bg-slate-800/50 rounded-lg">
                <h3 className="text-lg font-semibold">Segera Hadir</h3>
                <p>Fitur ini sedang dalam pengembangan.</p>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white">Generator Controls</h2>
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg self-start">
            <SubTabButton label="Manual" isActive={activeSubTab === 'manual'} onClick={() => setActiveSubTab('manual')} />
            <SubTabButton label="Batch" isActive={activeSubTab === 'batch'} onClick={() => setActiveSubTab('batch')} />
            <SubTabButton label="BatchKu" isActive={activeSubTab === 'batchKu'} onClick={() => setActiveSubTab('batchKu')} />
            <SubTabButton label="Batch (.txt)" isActive={activeSubTab === 'batchTxt'} onClick={() => setActiveSubTab('batchTxt')} />
            <SubTabButton label="Batch (JSON)" isActive={activeSubTab === 'batchJson'} onClick={() => setActiveSubTab('batchJson')} />
        </div>
        <div>
            {renderContent()}
        </div>
    </div>
  );
}

export default EaGenerate;