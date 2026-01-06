import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import ContentCard from '@/components/ui/ContentCard';
import FamilyViewModal from '@/components/ui/FamilyViewModal';

interface ArchivedFamily {
    id: string;
    residents: number;
    voters: number;
    status: 'Moveout' | 'Deceased';
}

const MOCK_ARCHIVED: ArchivedFamily[] = [
    { id: '011', residents: 7, voters: 4, status: 'Moveout' },
    { id: '012', residents: 2, voters: 1, status: 'Moveout' },
    { id: '013', residents: 4, voters: 3, status: 'Deceased' },
    { id: '014', residents: 3, voters: 2, status: 'Moveout' },
    { id: '015', residents: 1, voters: 0, status: 'Deceased' },
    // Add more mock data to test pagination if needed
    { id: '016', residents: 5, voters: 2, status: 'Moveout' },
    { id: '017', residents: 2, voters: 2, status: 'Deceased' },
    { id: '018', residents: 6, voters: 4, status: 'Moveout' },
    { id: '019', residents: 3, voters: 1, status: 'Deceased' },
    { id: '020', residents: 4, voters: 2, status: 'Moveout' },
];

const Archived: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [rowHeight, setRowHeight] = useState(60);
    
    // Add Family View Modal state
    const [selectedFamily, setSelectedFamily] = useState<ArchivedFamily | null>(null);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLTableSectionElement>(null);

    // Dynamic Layout Calculation
    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const calculateLayout = () => {
            // Measure available space
            const containerH = containerRef.current?.clientHeight || 0;
            const headerH = headerRef.current?.clientHeight || 57;

            const availableSpace = containerH - headerH;

            // Desired minimum row height for readability
            const MIN_ROW_HEIGHT = 60;

            // How many rows can we fit?
            let possibleRows = Math.floor(availableSpace / MIN_ROW_HEIGHT);
            if (possibleRows < 1) possibleRows = 1;

            // Calculate exact height per row to fill the container perfectly
            const exactRowHeight = availableSpace / possibleRows;

            setItemsPerPage(possibleRows);
            setRowHeight(exactRowHeight);
        };

        calculateLayout();

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(calculateLayout);
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const filteredData = MOCK_ARCHIVED.filter(item => 
        item.id.includes(searchQuery) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="h-full">
            <ContentCard className="flex-1">
                <div className="flex flex-col h-full">
                    {/* Search Bar */}
                    <div className="flex justify-end p-6 border-b border-gray-50">
                        <div className="relative w-full lg:w-64">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search archived family..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-4 py-2 bg-[#F9FAFB] rounded-xl text-[14px] text-gray-700 w-full border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder-blue-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                        <table className="w-full border-separate border-spacing-0 table-fixed">
                            <thead ref={headerRef} className="bg-white sticky top-0 z-10">
                                <tr className="border-b border-gray-50">
                                    <th className="w-[20%] text-left py-4 pl-8 pr-4 text-[14px] font-bold text-blue-500">Family ID</th>
                                    <th className="w-[20%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Residents</th>
                                    <th className="w-[20%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Voters</th>
                                    <th className="w-[20%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Status</th>
                                    <th className="w-[20%] text-center py-4 px-4 text-[14px] font-bold text-blue-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors" style={{ height: `${rowHeight}px` }}>
                                        <td className="pl-8 pr-4 text-[14px] font-bold text-gray-900 truncate">{item.id}</td>
                                        <td className="px-4 text-[14px] text-gray-600 truncate">{item.residents}</td>
                                        <td className="px-4 text-[14px] text-gray-600 truncate">{item.voters}</td>
                                        <td className="px-4 text-[14px] text-gray-600 truncate">{item.status}</td>
                                        <td className="px-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedFamily(item);
                                                        setIsFamilyModalOpen(true);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Search size={18} />
                                                </button>
                                                <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <RotateCcw size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-50 shrink-0 bg-white">
                        <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">
                            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-gray-400 hover:text-gray-900 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                                Prev
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                                : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-gray-400 hover:text-gray-900 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </ContentCard>

            {/* Family View Modal */}
            {selectedFamily && (
                <FamilyViewModal 
                    isOpen={isFamilyModalOpen}
                    onClose={() => setIsFamilyModalOpen(false)}
                    familyId={selectedFamily.id}
                    familyName="Dela Cruz"
                    familyStatus={selectedFamily.status}
                />
            )}
        </div>
    );
};

export default Archived;
