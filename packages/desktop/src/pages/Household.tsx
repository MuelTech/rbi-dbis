import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, PawPrint } from 'lucide-react';
import ContentCard from '@/components/ui/ContentCard';
import FamilyListModal from '@/components/ui/FamilyListModal';
import { householdsService } from '@/services/households';
import type { HouseholdRow } from '@/services/households';

const BLOCKS = ['1', '2', '3'];

interface HouseholdProps {
    onShowSuccess?: (message: string) => void;
}

const Household: React.FC<HouseholdProps> = ({ onShowSuccess }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('1');
    const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
    const blockMenuTimer = useRef<NodeJS.Timeout | null>(null);

    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState('');

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [rowHeight, setRowHeight] = useState(72);

    const [households, setHouseholds] = useState<HouseholdRow[]>([]);
    const [totalHouseholds, setTotalHouseholds] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLTableSectionElement>(null);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const calculateLayout = () => {
            const containerH = containerRef.current?.clientHeight || 0;
            const headerH = headerRef.current?.clientHeight || 57;
            const availableSpace = containerH - headerH;
            const MIN_ROW_HEIGHT = 60;

            let possibleRows = Math.floor(availableSpace / MIN_ROW_HEIGHT);
            if (possibleRows < 1) possibleRows = 1;

            const exactRowHeight = availableSpace / possibleRows;

            setItemsPerPage(possibleRows);
            setRowHeight(exactRowHeight);
        };

        calculateLayout();
        const observer = new ResizeObserver(() => requestAnimationFrame(calculateLayout));
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBlock, debouncedSearch]);

    const fetchHouseholds = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await householdsService.list({
                page: currentPage,
                pageSize: itemsPerPage,
                block: selectedBlock || undefined,
                search: debouncedSearch || undefined,
            });
            setHouseholds(result.data);
            setTotalHouseholds(result.meta.total);
            setTotalPages(result.meta.totalPages);
        } catch {
            setHouseholds([]);
            setTotalHouseholds(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, selectedBlock, debouncedSearch]);

    useEffect(() => {
        fetchHouseholds();
    }, [fetchHouseholds]);

    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + households.length;
    const emptyRows = Math.max(0, itemsPerPage - households.length);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleBlockMouseEnter = () => {
        if (blockMenuTimer.current) {
            clearTimeout(blockMenuTimer.current);
            blockMenuTimer.current = null;
        }
        setIsBlockMenuOpen(true);
    };

    const handleBlockMouseLeave = () => {
        blockMenuTimer.current = setTimeout(() => {
            setIsBlockMenuOpen(false);
        }, 300);
    };

    const totalCats = households.reduce((sum, item) => sum + item.catCount, 0);
    const totalDogs = households.reduce((sum, item) => sum + item.dogCount, 0);

    return (
        <ContentCard>
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 gap-4 border-b border-gray-50 shrink-0 z-20 relative">
                <div className="flex flex-wrap items-center gap-6">
                    {/* Block Dropdown */}
                    <div 
                        className="relative group"
                        onMouseEnter={handleBlockMouseEnter}
                        onMouseLeave={handleBlockMouseLeave}
                    >
                        <button className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 min-w-[140px] hover:bg-gray-50 transition-colors">
                            Block {selectedBlock}
                            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isBlockMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`absolute top-full left-0 pt-2 w-full z-30 transition-all duration-200 ${isBlockMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'}`}>
                            <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                                {BLOCKS.map((block) => (
                                    <button 
                                        key={block}
                                        onClick={() => {
                                            setSelectedBlock(block);
                                            setIsBlockMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg transition-colors ${selectedBlock === block ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        Block {block}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                            <PawPrint size={14} className="text-orange-500" />
                            <span className="text-[13px] font-medium text-gray-600">Cats: <span className="text-gray-900 font-bold">{totalCats}</span></span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                            <PawPrint size={14} className="text-blue-500" />
                            <span className="text-[13px] font-medium text-gray-600">Dogs: <span className="text-gray-900 font-bold">{totalDogs}</span></span>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-auto">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search households..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-4 py-2 bg-[#F9FAFB] rounded-xl text-[14px] text-gray-700 w-full lg:w-64 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder-blue-300"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                <table className="w-full border-separate border-spacing-0 table-fixed">
                    <thead ref={headerRef} className="bg-white z-10 sticky top-0">
                        <tr className="border-b border-gray-50">
                            <th className="w-[15%] text-left py-4 pl-8 pr-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Household No.</th>
                            <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Family</th>
                            <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Voters</th>
                            <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Cats</th>
                            <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Dogs</th>
                            <th className="w-[10%] text-center py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {households.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors" style={{ height: `${rowHeight}px` }}>
                                <td className="pl-8 pr-4 text-[14px] text-gray-900 font-bold truncate">{item.brgyHouseholdNo.padStart(3, '0')}</td>
                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{item.familyCount}</td>
                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{item.voterCount}</td>
                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{item.catCount}</td>
                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{item.dogCount}</td>
                                <td className="px-4 text-center">
                                    <button 
                                        onClick={() => {
                                            setSelectedHouseholdId(item.id);
                                            setIsFamilyModalOpen(true);
                                        }}
                                        className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all mx-auto active:scale-95"
                                    >
                                        <Search size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {Array.from({ length: emptyRows }).map((_, idx) => (
                            <tr key={`empty-${idx}`} style={{ height: `${rowHeight}px` }}>
                                <td colSpan={6}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-6 border-t border-gray-50 shrink-0 bg-white">
                <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">
                    Showing {totalHouseholds > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, totalHouseholds)} of {totalHouseholds}
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-gray-400 hover:text-gray-900 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => Math.abs(currentPage - page) < 3 || page === 1 || page === totalPages)
                            .map((number, index, array) => {
                                const isGap = index > 0 && number - array[index - 1] > 1;
                                return (
                                    <React.Fragment key={number}>
                                        {isGap && <span className="text-gray-300 text-xs self-end pb-1">...</span>}
                                        <button
                                            onClick={() => handlePageChange(number)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${currentPage === number
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                                : 'hover:bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {number}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <FamilyListModal 
                isOpen={isFamilyModalOpen}
                onClose={() => setIsFamilyModalOpen(false)}
                householdId={selectedHouseholdId}
                onShowSuccess={onShowSuccess}
            />
        </ContentCard>
    );
};

export default Household;
