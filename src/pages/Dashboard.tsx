import React, { useState, useRef } from 'react';
import StatsGrid from '@/components/layout/StatsGrid';
import TransactionSection from '@/components/layout/TransactionSection';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState('All');
    const blockMenuTimer = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (blockMenuTimer.current) {
            clearTimeout(blockMenuTimer.current);
            blockMenuTimer.current = null;
        }
        setIsBlockMenuOpen(true);
    };

    const handleMouseLeave = () => {
        blockMenuTimer.current = setTimeout(() => {
            setIsBlockMenuOpen(false);
        }, 300);
    };

  return (
    <>
        {/* Global Filter */}
        <div className="mb-[clamp(1rem,1.5vh,1.75rem)]">
            <div 
                className="relative inline-block w-36"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex items-center justify-between w-full bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 xl:py-2.5 rounded-xl shadow-sm cursor-pointer transition-colors">
                    <span className="text-gray-700 text-xs xl:text-sm font-medium">{selectedBlock}</span>
                    <ChevronDown size={16} className={`text-gray-700 xl:w-4 xl:h-4 transition-transform duration-200 ${isBlockMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Menu */}
                <div className={`absolute top-full left-0 pt-2 w-full z-30 transition-all duration-200 ${isBlockMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'}`}>
                    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 overflow-hidden">
                        {['All', 'Block 1', 'Block 2', 'Block 3'].map((block) => (
                            <div 
                                key={block}
                                onClick={() => {
                                    setSelectedBlock(block);
                                    setIsBlockMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg cursor-pointer transition-colors ${selectedBlock === block ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                {block}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Stats */}
        <StatsGrid selectedBlock={selectedBlock} />

        {/* Lower Section */}
        {user?.role === 'SuperAdmin' && <TransactionSection />}
    </>
  );
};

export default Dashboard;