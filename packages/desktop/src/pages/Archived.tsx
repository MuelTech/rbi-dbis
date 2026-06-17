import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContentCard from '@/components/ui/ContentCard';
import FamilyViewModal from '@/components/ui/FamilyViewModal';
import { archivedService, ArchivedFamily } from '@/services/archived';
import SuccessToast from '@/components/ui/SuccessToast';

const Archived: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [rowHeight, setRowHeight] = useState(60);

    const [selectedFamily, setSelectedFamily] = useState<ArchivedFamily | null>(null);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);

    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

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

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(calculateLayout);
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    const { data, isLoading } = useQuery({
        queryKey: ['archived-families', { page: currentPage, pageSize: itemsPerPage, search: debouncedSearch }],
        queryFn: () => archivedService.list({
            page: currentPage,
            pageSize: itemsPerPage,
            search: debouncedSearch || undefined,
        }),
    });

    const families = data?.data ?? [];
    const totalFamilies = data?.meta.total ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;

    const restoreMutation = useMutation({
        mutationFn: (familyId: string) => archivedService.restore(familyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['archived-families'] });
            queryClient.invalidateQueries({ queryKey: ['demographics'] });
            setToastMessage('Family restored successfully');
            setShowToast(true);
        },
        onError: () => {
            setToastMessage('Failed to restore family');
            setShowToast(true);
        },
    });

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleRestore = (family: ArchivedFamily) => {
        restoreMutation.mutate(family.id);
    };

    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + families.length;
    const emptyRows = Math.max(0, itemsPerPage - families.length);

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
                                    <th className="w-[15%] text-left py-4 pl-8 pr-4 text-[14px] font-bold text-blue-500">Family ID</th>
                                    <th className="w-[25%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Family Name</th>
                                    <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Residents</th>
                                    <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Voters</th>
                                    <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500">Status</th>
                                    <th className="w-[15%] text-center py-4 px-4 text-[14px] font-bold text-blue-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading && families.length === 0 ? (
                                    Array.from({ length: itemsPerPage }).map((_, idx) => (
                                        <tr key={`skeleton-${idx}`} style={{ height: `${rowHeight}px` }}>
                                            <td colSpan={6} className="px-8">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                            </td>
                                        </tr>
                                    ))
                                ) : families.length === 0 ? (
                                    Array.from({ length: itemsPerPage }).map((_, idx) => (
                                        <tr key={`empty-${idx}`} style={{ height: `${rowHeight}px` }}>
                                            <td colSpan={6}></td>
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        {families.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors" style={{ height: `${rowHeight}px` }}>
                                                <td className="pl-8 pr-4 text-[14px] font-bold text-gray-900 truncate">{String(item.displayId ?? 0).padStart(4, '0')}</td>
                                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{item.familyName}</td>
                                                <td className="px-4 text-[14px] text-gray-600 truncate">{item.residentCount}</td>
                                                <td className="px-4 text-[14px] text-gray-600 truncate">{item.voterCount}</td>
                                                <td className="px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold ${
                                                        item.status === 'Moveout'
                                                            ? 'text-[#9A3412] bg-[#FFFBEB]'
                                                            : 'text-[#991B1B] bg-[#FEF2F2]'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedFamily(item);
                                                                setIsFamilyModalOpen(true);
                                                            }}
                                                            className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95"
                                                        >
                                                            <Search size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestore(item)}
                                                            disabled={restoreMutation.isPending}
                                                            className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all active:scale-95 disabled:opacity-50"
                                                            title="Restore family"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {Array.from({ length: emptyRows }).map((_, idx) => (
                                            <tr key={`empty-${idx}`} style={{ height: `${rowHeight}px` }}>
                                                <td colSpan={6}></td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-50 shrink-0 bg-white">
                        <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">
                            Showing {totalFamilies > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, totalFamilies)} of {totalFamilies}
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
                                disabled={currentPage === totalPages || totalPages === 0}
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
                    onClose={() => {
                        setIsFamilyModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['archived-families'] });
                    }}
                    familyId={selectedFamily.id}
                    familyName={selectedFamily.familyName}
                    familyStatus={selectedFamily.status}
                />
            )}

            <SuccessToast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
};

export default Archived;
