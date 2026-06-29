import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, Trash2, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContentCard from '@/components/ui/ContentCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import SuccessToast from '@/components/ui/SuccessToast';
import { activityLogsService, AuditLog } from '@/services/activityLogs';

const ACTION_TYPES = ['CREATE', 'UPDATE', 'ARCHIVE'];
const TABLE_NAMES = ['residents', 'families', 'users'];

const ActivityLogs: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [rowHeight, setRowHeight] = useState(60);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Filter states
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const filterMenuTimer = useRef<NodeJS.Timeout | null>(null);
    const [tempFilters, setTempFilters] = useState({
        actionType: [] as string[],
        tableName: [] as string[],
    });
    const [activeFilters, setActiveFilters] = useState({
        actionType: [] as string[],
        tableName: [] as string[],
    });

    // Date range states
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Selection states for bulk delete
    const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);

    // Delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk' | 'olderThan'; id?: string } | null>(null);

    // Toast
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
        setSelectedLogs(new Set());
        setIsAllSelected(false);
    }, [debouncedSearch, activeFilters, dateFrom, dateTo]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ['activity-logs', {
            page: currentPage,
            pageSize: itemsPerPage,
            search: debouncedSearch,
            actionType: activeFilters.actionType.join(','),
            tableName: activeFilters.tableName.join(','),
            dateFrom,
            dateTo,
        }],
        queryFn: () => activityLogsService.getAll({
            page: currentPage,
            pageSize: itemsPerPage,
            search: debouncedSearch || undefined,
            actionType: activeFilters.actionType.length > 0 ? activeFilters.actionType.join(',') : undefined,
            tableName: activeFilters.tableName.length > 0 ? activeFilters.tableName.join(',') : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
        }),
    });

    const logs = data?.data ?? [];
    const totalLogs = data?.meta.total ?? 0;
    const totalPages = data?.meta.totalPages ?? 0;

    // Delete mutations
    const deleteMutation = useMutation({
        mutationFn: (id: string) => activityLogsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            setToastMessage('Log deleted successfully');
            setShowToast(true);
        },
        onError: () => {
            setToastMessage('Failed to delete log');
            setShowToast(true);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => activityLogsService.bulkDelete(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
            setSelectedLogs(new Set());
            setIsAllSelected(false);
            setToastMessage('Logs deleted successfully');
            setShowToast(true);
        },
        onError: () => {
            setToastMessage('Failed to delete logs');
            setShowToast(true);
        },
    });

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const toggleRowExpand = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectLog = (id: string) => {
        setSelectedLogs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedLogs(new Set());
            setIsAllSelected(false);
        } else {
            setSelectedLogs(new Set(logs.map(l => l.id)));
            setIsAllSelected(true);
        }
    };

    const handleDelete = (log: AuditLog) => {
        setDeleteTarget({ type: 'single', id: log.id });
        setShowDeleteModal(true);
    };

    const handleBulkDelete = () => {
        if (selectedLogs.size === 0) return;
        setDeleteTarget({ type: 'bulk' });
        setShowDeleteModal(true);
    };

    const handleDeleteOlderThan = (days: number) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        setDeleteTarget({ type: 'olderThan' });
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'single' && deleteTarget.id) {
            deleteMutation.mutate(deleteTarget.id);
        } else if (deleteTarget.type === 'bulk') {
            bulkDeleteMutation.mutate(Array.from(selectedLogs));
        } else if (deleteTarget.type === 'olderThan') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            activityLogsService.bulkDeleteOlderThan(cutoff.toISOString()).then(() => {
                queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
                setToastMessage('Old logs deleted successfully');
                setShowToast(true);
            });
        }

        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    // Filter menu handlers
    const handleFilterMouseEnter = () => {
        if (filterMenuTimer.current) {
            clearTimeout(filterMenuTimer.current);
            filterMenuTimer.current = null;
        }
        setIsFilterMenuOpen(true);
    };

    const handleFilterMouseLeave = () => {
        filterMenuTimer.current = setTimeout(() => {
            setIsFilterMenuOpen(false);
        }, 300);
    };

    const handleApplyFilters = () => {
        setActiveFilters({ ...tempFilters });
        setIsFilterMenuOpen(false);
    };

    const handleClearFilters = () => {
        setTempFilters({ actionType: [], tableName: [] });
        setActiveFilters({ actionType: [], tableName: [] });
        setDateFrom('');
        setDateTo('');
        setIsFilterMenuOpen(false);
    };

    const toggleFilterItem = (category: 'actionType' | 'tableName', item: string) => {
        setTempFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(item)
                ? prev[category].filter(i => i !== item)
                : [...prev[category], item],
        }));
    };

    const formatDate = (timestamp: string) => {
        const d = new Date(timestamp);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ARCHIVE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatChanges = (changes: Record<string, [any, any]> | null) => {
        if (!changes) return null;
        return Object.entries(changes).map(([field, [oldVal, newVal]]) => ({
            field,
            old: oldVal ?? '(empty)',
            new: newVal ?? '(empty)',
        }));
    };

    const activeFilterCount = activeFilters.actionType.length + activeFilters.tableName.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + logs.length;
    const emptyRows = Math.max(0, itemsPerPage - logs.length);

    return (
        <div className="h-full">
            <ContentCard className="flex-1">
                <div className="flex flex-col h-full">
                    {/* Toolbar */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 gap-4 border-b border-gray-50 shrink-0 z-20 relative">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Filter By Dropdown */}
                            <div
                                className="relative group"
                                onMouseEnter={handleFilterMouseEnter}
                                onMouseLeave={handleFilterMouseLeave}
                            >
                                <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Filter size={16} className="text-gray-400" />
                                        <span className="text-[14px] font-medium text-gray-600">Filter By</span>
                                        {activeFilterCount > 0 && (
                                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Filter Menu */}
                                    <div className={`absolute top-full left-0 pt-2 w-[320px] transition-all duration-200 z-50 ${isFilterMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'}`}>
                                        <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                                            <div className="p-4 grid grid-cols-2 gap-4">
                                                {/* Action Type */}
                                                <div className="space-y-2">
                                                    <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Action Type</h3>
                                                    <div className="space-y-1">
                                                        {ACTION_TYPES.map((item) => (
                                                            <label key={item} className="flex items-center gap-2 cursor-pointer group/item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tempFilters.actionType.includes(item)}
                                                                    onChange={() => toggleFilterItem('actionType', item)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-[13px] text-gray-600 group-hover/item:text-gray-900">{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Table Name */}
                                                <div className="space-y-2">
                                                    <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Table</h3>
                                                    <div className="space-y-1">
                                                        {TABLE_NAMES.map((item) => (
                                                            <label key={item} className="flex items-center gap-2 cursor-pointer group/item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tempFilters.tableName.includes(item)}
                                                                    onChange={() => toggleFilterItem('tableName', item)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-[13px] text-gray-600 group-hover/item:text-gray-900 capitalize">{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date Range */}
                                            <div className="px-4 pb-4 space-y-2">
                                                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Date Range</h3>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="date"
                                                        value={dateFrom}
                                                        onChange={(e) => setDateFrom(e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={dateTo}
                                                        onChange={(e) => setDateTo(e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                                >
                                                    Clear all
                                                </button>
                                                <button
                                                    onClick={handleApplyFilters}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-lg transition-colors"
                                                >
                                                    Apply Filters
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bulk Delete Button */}
                            {selectedLogs.size > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[13px] font-semibold transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Delete ({selectedLogs.size})
                                </button>
                            )}

                            {/* Delete Old Logs Dropdown */}
                            <div className="relative group" ref={datePickerRef}>
                                <button
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    <Calendar size={16} className="text-gray-400" />
                                    Clear Old Logs
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDatePickerOpen && (
                                    <div className="absolute top-full left-0 pt-2 w-48 z-50">
                                        <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-1.5">
                                            <button
                                                onClick={() => { handleDeleteOlderThan(7); setIsDatePickerOpen(false); }}
                                                className="w-full text-left px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                Older than 7 days
                                            </button>
                                            <button
                                                onClick={() => { handleDeleteOlderThan(30); setIsDatePickerOpen(false); }}
                                                className="w-full text-left px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                Older than 30 days
                                            </button>
                                            <button
                                                onClick={() => { handleDeleteOlderThan(90); setIsDatePickerOpen(false); }}
                                                className="w-full text-left px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                Older than 90 days
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search */}
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

                    {/* Table */}
                    <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                        <table className="w-full border-separate border-spacing-0 table-fixed">
                            <thead ref={headerRef} className="bg-white z-10 sticky top-0">
                                <tr className="border-b border-gray-50">
                                    <th className="w-[5%] text-center py-4 px-2">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="w-[8%] text-left py-4 pl-2 pr-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">ID</th>
                                    <th className="w-[14%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Timestamp</th>
                                    <th className="w-[12%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Personnel</th>
                                    <th className="w-[30%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Description</th>
                                    <th className="w-[10%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Table</th>
                                    <th className="w-[10%] text-center py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Action</th>
                                    <th className="w-[6%] text-center py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap"></th>
                                    <th className="w-[5%] text-center py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {isLoading && logs.length === 0 ? (
                                    Array.from({ length: itemsPerPage }).map((_, idx) => (
                                        <tr key={`skeleton-${idx}`} style={{ height: `${rowHeight}px` }}>
                                            <td colSpan={9} className="px-8">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                            </td>
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    Array.from({ length: itemsPerPage }).map((_, idx) => (
                                        <tr key={`empty-${idx}`} style={{ height: `${rowHeight}px` }}>
                                            <td colSpan={9}></td>
                                        </tr>
                                    ))
                                ) : (
                                    logs.map((log) => (
                                        <React.Fragment key={log.id}>
                                            <tr className="hover:bg-gray-50/50 transition-colors" style={{ height: `${rowHeight}px` }}>
                                                <td className="text-center px-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLogs.has(log.id)}
                                                        onChange={() => handleSelectLog(log.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="pl-2 pr-4 text-[14px] font-bold text-gray-900 truncate">
                                                    {String(log.id).slice(0, 8)}
                                                </td>
                                                <td className="px-4 text-[14px] text-gray-600 truncate">{formatDate(log.timestamp)}</td>
                                                <td className="px-4 text-[14px] font-bold text-gray-900 truncate">{log.personnel}</td>
                                                <td className="px-4 text-[14px] text-gray-600 truncate">{log.summary || '-'}</td>
                                                <td className="px-4 text-[14px] text-gray-500 truncate capitalize">{log.tableName}</td>
                                                <td className="px-4 text-center">
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wide min-w-[80px] ${getActionColor(log.actionType)}`}>
                                                        {log.actionType}
                                                    </span>
                                                </td>
                                                <td className="px-4 text-center">
                                                    {log.changes && (
                                                        <button
                                                            onClick={() => toggleRowExpand(log.id)}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            {expandedRows.has(log.id) ? (
                                                                <ChevronUp size={16} className="text-gray-400" />
                                                            ) : (
                                                                <ChevronDown size={16} className="text-gray-400" />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 text-center">
                                                    <button
                                                        onClick={() => handleDelete(log)}
                                                        className="p-1 hover:bg-red-50 rounded transition-colors text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRows.has(log.id) && log.changes && (
                                                <tr>
                                                    <td colSpan={9} className="px-8 py-3 bg-gray-50 border-b border-gray-100">
                                                        <div className="text-[12px] space-y-1">
                                                            {formatChanges(log.changes)?.map((change, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-700 min-w-[120px]">{change.field}:</span>
                                                                    <span className="text-red-500 line-through">{String(change.old)}</span>
                                                                    <span className="text-gray-400">&rarr;</span>
                                                                    <span className="text-green-600">{String(change.new)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-50 shrink-0 bg-white">
                        <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">
                            Showing {totalLogs > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, totalLogs)} of {totalLogs}
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

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                onConfirm={confirmDelete}
            />

            {/* Success Toast */}
            <SuccessToast
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
};

export default ActivityLogs;
