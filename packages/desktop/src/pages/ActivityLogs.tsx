import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from '@/components/ui/ContentCard';

interface ActivityLog {
    id: string;
    timestamp: string;
    page: string;
    personnel: string;
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    action: 'CREATE' | 'UPDATE' | 'ARCHIVE';
}

const MOCK_LOGS: ActivityLog[] = [
    { id: '001', timestamp: '25/10/2023 14:30', page: 'Add Resident Page', personnel: 'Nayeon', fieldChanged: 'N/A', oldValue: 'N/A', newValue: 'N/A', action: 'CREATE' },
    { id: '002', timestamp: '25/10/2023 13:45', page: 'Update Profile Page', personnel: 'Jihyo', fieldChanged: 'Status', oldValue: 'Active', newValue: 'Inactive', action: 'UPDATE' },
    { id: '003', timestamp: '25/10/2023 11:20', page: 'Family List', personnel: 'Momo', fieldChanged: 'N/A', oldValue: 'Family #035', newValue: 'N/A', action: 'ARCHIVE' },
    { id: '004', timestamp: '24/10/2023 16:10', page: 'Document Issuance', personnel: 'Sana', fieldChanged: 'Amount', oldValue: '200', newValue: '500', action: 'UPDATE' },
    { id: '005', timestamp: '24/10/2023 09:15', page: 'Manage Account', personnel: 'Admin', fieldChanged: 'Role', oldValue: 'User', newValue: 'Admin', action: 'UPDATE' },
    { id: '006', timestamp: '23/10/2023 15:00', page: 'Add Resident Page', personnel: 'Mina', fieldChanged: 'N/A', oldValue: 'N/A', newValue: 'N/A', action: 'CREATE' },
    { id: '007', timestamp: '23/10/2023 10:30', page: 'Update Profile Page', personnel: 'Dahyun', fieldChanged: 'Address', oldValue: '123 Old St.', newValue: '456 New Ave.', action: 'UPDATE' },
    { id: '008', timestamp: '22/10/2023 14:20', page: 'Family View', personnel: 'Chaeyoung', fieldChanged: 'Member', oldValue: 'N/A', newValue: 'N/A', action: 'CREATE' },
    { id: '009', timestamp: '22/10/2023 11:45', page: 'Manage Account', personnel: 'Tzuyu', fieldChanged: 'Status', oldValue: 'Active', newValue: 'N/A', action: 'ARCHIVE' },
    { id: '010', timestamp: '21/10/2023 09:00', page: 'Document Issuance', personnel: 'Nayeon', fieldChanged: 'N/A', oldValue: 'N/A', newValue: 'N/A', action: 'CREATE' },
    { id: '011', timestamp: '20/10/2023 14:30', page: 'Add Resident Page', personnel: 'Jeongyeon', fieldChanged: 'N/A', oldValue: 'N/A', newValue: 'N/A', action: 'CREATE' },
    { id: '012', timestamp: '20/10/2023 13:45', page: 'Update Profile Page', personnel: 'Jihyo', fieldChanged: 'Status', oldValue: 'Inactive', newValue: 'Active', action: 'UPDATE' },
];

const ActivityLogs: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [rowHeight, setRowHeight] = useState(60);

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

    const filteredLogs = MOCK_LOGS.filter(log => 
        log.page.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.personnel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ARCHIVE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-4 py-2 bg-[#F9FAFB] rounded-xl text-[14px] text-gray-700 w-full border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder-blue-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                        <table className="w-full border-separate border-spacing-0 table-fixed">
                            <thead ref={headerRef} className="bg-white z-10 sticky top-0">
                                <tr className="border-b border-gray-50">
                                    <th className="w-[8%] text-left py-4 pl-8 pr-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Audit ID</th>
                                    <th className="w-[12%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Timestamp</th>
                                    <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Page</th>
                                    <th className="w-[10%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Personnel</th>
                                    <th className="w-[10%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Field Changed</th>
                                    <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Old Value</th>
                                    <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">New Value</th>
                                    <th className="w-[15%] text-center py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {currentItems.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors" style={{ height: `${rowHeight}px` }}>
                                        <td className="pl-8 pr-4 text-[14px] font-bold text-gray-900 truncate">{log.id}</td>
                                        <td className="px-4 text-[14px] text-gray-600 truncate">{log.timestamp}</td>
                                        <td className="px-4 text-[14px] text-gray-600 truncate">{log.page}</td>
                                        <td className="px-4 text-[14px] font-bold text-gray-900 truncate">{log.personnel}</td>
                                        <td className="px-4 text-[14px] text-gray-500 truncate">{log.fieldChanged}</td>
                                        <td className="px-4 text-[14px] text-gray-500 truncate">{log.oldValue}</td>
                                        <td className="px-4 text-[14px] text-gray-500 truncate">{log.newValue}</td>
                                        <td className="px-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wide min-w-[80px] ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-50 shrink-0 bg-white">
                        <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">
                            Showing {filteredLogs.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length}
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
        </div>
    );
};

export default ActivityLogs;
