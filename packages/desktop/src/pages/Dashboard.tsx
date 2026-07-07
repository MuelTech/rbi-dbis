import React, { useState, useRef } from 'react';
import StatsGrid from '@/components/layout/StatsGrid';
import TransactionSection from '@/components/layout/TransactionSection';
import { ChevronDown, FileDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { reportService } from '@/services/report';
import { generateResidentReport } from '@/utils/pdfGenerator';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState('All');
    const blockMenuTimer = useRef<NodeJS.Timeout | null>(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [reportFilters, setReportFilters] = useState({
        sex: '',
        isVoter: '',
        isPwd: '',
        isSoloParent: '',
        isFamilyHead: '',
        studentType: '',
        status: '',
        ageFrom: 0,
        ageTo: 150,
    });
    const [isGenerating, setIsGenerating] = useState(false);

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

    const handleGeneratePDF = async (title: string) => {
        setIsGenerating(true);
        try {
            const result = await reportService.getFilteredResidents(reportFilters);
            generateResidentReport({
                title,
                data: result.data,
                generatedBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            });
            setShowFilterModal(false);
        } catch (err) {
            alert('Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
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
        {user?.role === 'SuperAdmin' && (
            <>
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 xl:px-4 py-1.5 rounded-lg text-[9px] xl:text-[10px] font-bold transition-colors tracking-wide uppercase flex items-center gap-1"
                    >
                        <FileDown size={12} />
                        PDF Report
                    </button>
                </div>
                <TransactionSection />
            </>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Generate PDF Report</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Report Title</label>
                            <input
                                type="text"
                                id="reportTitle"
                                defaultValue="List of Residents"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sex</label>
                                <select
                                    value={reportFilters.sex}
                                    onChange={(e) => setReportFilters({ ...reportFilters, sex: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                >
                                    <option value="">All</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select
                                    value={reportFilters.status}
                                    onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                >
                                    <option value="">All</option>
                                    <option value="Alive">Active</option>
                                    <option value="Deceased">Deceased</option>
                                    <option value="MovedOut">Moved Out</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={reportFilters.isVoter === 'true'}
                                    onChange={(e) => setReportFilters({ ...reportFilters, isVoter: e.target.checked ? 'true' : '' })}
                                    className="rounded"
                                />
                                <span className="text-sm">Voter</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={reportFilters.isPwd === 'true'}
                                    onChange={(e) => setReportFilters({ ...reportFilters, isPwd: e.target.checked ? 'true' : '' })}
                                    className="rounded"
                                />
                                <span className="text-sm">PWD</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={reportFilters.isSoloParent === 'true'}
                                    onChange={(e) => setReportFilters({ ...reportFilters, isSoloParent: e.target.checked ? 'true' : '' })}
                                    className="rounded"
                                />
                                <span className="text-sm">Solo Parent</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={reportFilters.isFamilyHead === 'true'}
                                    onChange={(e) => setReportFilters({ ...reportFilters, isFamilyHead: e.target.checked ? 'true' : '' })}
                                    className="rounded"
                                />
                                <span className="text-sm">Family Head</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="From"
                                    value={reportFilters.ageFrom || ''}
                                    onChange={(e) => setReportFilters({ ...reportFilters, ageFrom: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="number"
                                    placeholder="To"
                                    value={reportFilters.ageTo === 150 ? '' : reportFilters.ageTo}
                                    onChange={(e) => setReportFilters({ ...reportFilters, ageTo: parseInt(e.target.value) || 150 })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setShowFilterModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleGeneratePDF((document.getElementById('reportTitle') as HTMLInputElement)?.value || 'Report')}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold disabled:opacity-50"
                        >
                            {isGenerating ? 'Generating...' : 'Generate PDF'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default Dashboard;