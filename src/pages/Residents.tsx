import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronLeft, ChevronRight, UserPlus, Upload, Filter, RotateCcw } from 'lucide-react';
import { Resident } from '@/types';
import ContentCard from '@/components/ui/ContentCard';
import ResidentProfileModal from '@/components/ui/ResidentProfileModal';
import AddResidentWizard from '@/components/features/AddResident/AddResidentWizard';

const residentsData: Resident[] = [
    { id: '001', lastName: 'Teano', firstName: 'John Lemuel', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '002', lastName: 'Castanas', firstName: 'Aries', sex: 'Male', age: 23, voter: 'No', status: 'Deceased' },
    { id: '003', lastName: 'Mendoza', firstName: 'Arwind Jae', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '004', lastName: 'Santiago', firstName: 'Jonathan', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '005', lastName: 'Nayeon', firstName: 'Mah Lab', sex: 'Male', age: 23, voter: 'Yes', status: 'Move out' },
    { id: '006', lastName: 'Rizal', firstName: 'Jose', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '007', lastName: 'Kapre', firstName: 'Johnny', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '008', lastName: 'Aswang', firstName: 'Sofia', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '009', lastName: 'Tikbalang', firstName: 'Tralelu', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '010', lastName: 'Haduken', firstName: 'Key Oh', sex: 'Male', age: 23, voter: 'Yes', status: 'Active' },
    { id: '011', lastName: 'Manalo', firstName: 'Jose', sex: 'Male', age: 45, voter: 'Yes', status: 'Active' },
    { id: '012', lastName: 'Cruz', firstName: 'Maria', sex: 'Female', age: 32, voter: 'Yes', status: 'Active' },
    { id: '013', lastName: 'Garcia', firstName: 'Julia', sex: 'Female', age: 28, voter: 'Yes', status: 'Active' },
    { id: '014', lastName: 'Reyes', firstName: 'Mark', sex: 'Male', age: 34, voter: 'Yes', status: 'Active' },
    { id: '015', lastName: 'Santos', firstName: 'Ana', sex: 'Female', age: 22, voter: 'Yes', status: 'Active' },
    { id: '016', lastName: 'Dizon', firstName: 'Paul', sex: 'Male', age: 45, voter: 'Yes', status: 'Active' },
    { id: '017', lastName: 'Ocampo', firstName: 'Sarah', sex: 'Female', age: 31, voter: 'Yes', status: 'Active' },
    { id: '018', lastName: 'Pascual', firstName: 'Ryan', sex: 'Male', age: 29, voter: 'No', status: 'Active' },
    { id: '019', lastName: 'Torres', firstName: 'Kim', sex: 'Female', age: 26, voter: 'Yes', status: 'Active' },
    { id: '020', lastName: 'Flores', firstName: 'Ian', sex: 'Male', age: 33, voter: 'Yes', status: 'Active' },
    { id: '021', lastName: 'Lim', firstName: 'Carla', sex: 'Female', age: 27, voter: 'Yes', status: 'Active' },
    { id: '022', lastName: 'Tan', firstName: 'David', sex: 'Male', age: 40, voter: 'Yes', status: 'Active' },
    { id: '023', lastName: 'Yap', firstName: 'Elena', sex: 'Female', age: 35, voter: 'Yes', status: 'Active' },
    { id: '024', lastName: 'Go', firstName: 'Kevin', sex: 'Male', age: 24, voter: 'No', status: 'Active' },
    { id: '025', lastName: 'Sy', firstName: 'Rachel', sex: 'Female', age: 29, voter: 'Yes', status: 'Active' },
    { id: '026', lastName: 'Lee', firstName: 'Michael', sex: 'Male', age: 31, voter: 'Yes', status: 'Active' },
    { id: '027', lastName: 'Chua', firstName: 'Jenny', sex: 'Female', age: 25, voter: 'Yes', status: 'Active' },
    { id: '028', lastName: 'Bautista', firstName: 'Chris', sex: 'Male', age: 38, voter: 'Yes', status: 'Active' },
    { id: '029', lastName: 'Gonzales', firstName: 'Bea', sex: 'Female', age: 21, voter: 'Yes', status: 'Move out' },
    { id: '030', lastName: 'Villanueva', firstName: 'Tom', sex: 'Male', age: 42, voter: 'Yes', status: 'Active' },
    { id: '031', lastName: 'Castro', firstName: 'Liza', sex: 'Female', age: 30, voter: 'Yes', status: 'Active' },
    { id: '032', lastName: 'Rivera', firstName: 'Dan', sex: 'Male', age: 27, voter: 'No', status: 'Active' },
];


interface ResidentsProps {
    setIsNavigationBlocked?: (blocked: boolean) => void;
    onShowSuccess?: (message: string) => void;
}

const Residents: React.FC<ResidentsProps> = ({ setIsNavigationBlocked, onShowSuccess }) => {
    const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAgeAccordionOpen, setIsAgeAccordionOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const filterMenuTimer = useRef<NodeJS.Timeout | null>(null);

    // Add Resident Menu State
    const [isAddResidentMenuOpen, setIsAddResidentMenuOpen] = useState(false);
    const addResidentMenuTimer = useRef<NodeJS.Timeout | null>(null);

    // Resident Status State
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const statusMenuTimer = useRef<NodeJS.Timeout | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Active']);

    // Filter By State
    const [tempFilters, setTempFilters] = useState({
        sex: [] as string[],
        voter: [] as string[],
        age: [] as string[]
    });
    const [activeFilters, setActiveFilters] = useState({
        sex: [] as string[],
        voter: [] as string[],
        age: [] as string[]
    });

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Reset Animation State
    const [isResetAnimating, setIsResetAnimating] = useState(false);

    // Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

    // Reset Add Resident Menu when switching views
    useEffect(() => {
        if (viewMode === 'add') {
            setIsAddResidentMenuOpen(false);
        }
    }, [viewMode]);

    // Filter Menu Handlers
    const handleMouseEnter = () => {
        if (filterMenuTimer.current) {
            clearTimeout(filterMenuTimer.current);
            filterMenuTimer.current = null;
        }
        // Sync temp filters with active filters when opening
        setTempFilters(activeFilters);
        setIsFilterMenuOpen(true);
    };

    const handleMouseLeave = () => {
        filterMenuTimer.current = setTimeout(() => {
            setIsFilterMenuOpen(false);
        }, 300);
    };

    // Add Resident Menu Handlers
    const handleAddResidentMouseEnter = () => {
        if (addResidentMenuTimer.current) {
            clearTimeout(addResidentMenuTimer.current);
            addResidentMenuTimer.current = null;
        }
        setIsAddResidentMenuOpen(true);
    };

    const handleAddResidentMouseLeave = () => {
        addResidentMenuTimer.current = setTimeout(() => {
            setIsAddResidentMenuOpen(false);
        }, 300);
    };

    // Status Menu Handlers
    const handleStatusMouseEnter = () => {
        if (statusMenuTimer.current) {
            clearTimeout(statusMenuTimer.current);
            statusMenuTimer.current = null;
        }
        setIsStatusMenuOpen(true);
    };

    const handleStatusMouseLeave = () => {
        statusMenuTimer.current = setTimeout(() => {
            setIsStatusMenuOpen(false);
        }, 300);
    };

    const handleResetFilters = () => {
        setIsResetAnimating(true);
        setSearchQuery('');
        setSelectedStatuses(['Active']);
        setActiveFilters({ sex: [], voter: [], age: [] });
        setTempFilters({ sex: [], voter: [], age: [] });
        setTimeout(() => setIsResetAnimating(false), 500);
    };

    const handleApplyFilters = () => {
        setActiveFilters(tempFilters);
        setIsFilterMenuOpen(false);
    };
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [rowHeight, setRowHeight] = useState(72);

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

            // Desired minimum row height for readability (14px font + padding)
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
    }, [viewMode]);

    useEffect(() => {
        const totalPages = Math.ceil(residentsData.length / itemsPerPage);
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [itemsPerPage, residentsData.length, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatuses, activeFilters]);

    const filteredResidents = residentsData.filter(resident => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
            const reverseName = `${resident.lastName}, ${resident.firstName}`.toLowerCase();
            
            if (!resident.id.toLowerCase().includes(query) && 
                !fullName.includes(query) && 
                !reverseName.includes(query)) {
                return false;
            }
        }

        // Status Filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(resident.status)) return false;

        // Sex Filter
        if (activeFilters.sex.length > 0 && !activeFilters.sex.includes(resident.sex)) return false;

        // Voter Filter
        if (activeFilters.voter.length > 0) {
            const isVoter = resident.voter === 'Yes';
            const showVoters = activeFilters.voter.includes('Voter');
            const showNonVoters = activeFilters.voter.includes('Non-Voter');
            
            if (showVoters && !showNonVoters && !isVoter) return false;
            if (!showVoters && showNonVoters && isVoter) return false;
        }

        // Age Filter
        if (activeFilters.age.length > 0) {
            const age = resident.age;
            const matchesAge = activeFilters.age.some(range => {
                if (range === '60+') return age >= 60;
                const [min, max] = range.split('-').map(Number);
                return age >= min && age <= max;
            });
            if (!matchesAge) return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredResidents.slice(indexOfFirstItem, indexOfLastItem);
    const emptyRows = Math.max(0, itemsPerPage - currentItems.length);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <>
            <ContentCard>
                {viewMode === 'list' ? (
                    <>
                        {/* Toolbar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 gap-4 border-b border-gray-50 shrink-0 z-20 relative">
                <div className="flex flex-wrap items-center gap-4">

                    {/* Add Residents Dropdown */}
                    <div 
                        className="relative group"
                        onMouseEnter={handleAddResidentMouseEnter}
                        onMouseLeave={handleAddResidentMouseLeave}
                    >
                        <button 
                            onClick={() => setViewMode('add')}
                            className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2.5 text-[14px] font-semibold transition-all shadow-md shadow-blue-100 active:scale-95 group-hover:scale-100"
                        >
                            <Plus size={18} />
                            Add Residents
                            <ChevronDown size={18} className={`ml-0.5 opacity-70 transition-transform duration-200 ${isAddResidentMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown with padding-top bridge */}
                        <div className={`absolute top-full left-0 pt-2 w-48 z-30 transition-all duration-200 ${isAddResidentMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'}`}>
                            <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 overflow-hidden">
                                <button 
                                    onClick={() => setViewMode('add')}
                                    className="w-full text-left px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2.5 transition-colors"
                                >
                                    <UserPlus size={16} className="text-gray-400 group-hover:text-blue-500" />
                                    Add Residents
                                </button>
                                <button className="w-full text-left px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2.5 transition-colors">
                                    <Upload size={16} className="text-gray-400 group-hover:text-blue-500" />
                                    Batch Import
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Section - Inline Design */}
                    <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm">
                        {/* Filter Icon + Label */}
                        <div 
                            className="relative border-r border-gray-200"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                <Filter size={16} className="text-gray-400" />
                                <span className="text-[14px] font-medium text-gray-600">Filter By</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Filter Menu */}
                            <div className={`absolute top-full left-0 pt-2 w-[300px] transition-all duration-200 z-50 ${isFilterMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'}`}>
                                <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {/* Left Column */}
                                        <div className="space-y-3">
                                            {/* Demographics */}
                                            <div>
                                                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Demographics</h3>
                                                <div className="space-y-1">
                                                    {['Male', 'Female'].map((item) => (
                                                        <label key={item} className="flex items-center gap-2 cursor-pointer group/item">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={tempFilters.sex.includes(item)}
                                                                onChange={() => {
                                                                    setTempFilters(prev => ({
                                                                        ...prev,
                                                                        sex: prev.sex.includes(item)
                                                                            ? prev.sex.filter(s => s !== item)
                                                                            : [...prev.sex, item]
                                                                    }));
                                                                }}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                            />
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors">{item}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Voter Status */}
                                            <div>
                                                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Voter Status</h3>
                                                <div className="space-y-1">
                                                    {['Voter', 'Non-Voter'].map((item) => (
                                                        <label key={item} className="flex items-center gap-2 cursor-pointer group/item">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={tempFilters.voter.includes(item)}
                                                                onChange={() => {
                                                                    setTempFilters(prev => ({
                                                                        ...prev,
                                                                        voter: prev.voter.includes(item)
                                                                            ? prev.voter.filter(s => s !== item)
                                                                            : [...prev.voter, item]
                                                                    }));
                                                                }}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                            />
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors">{item}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Social / Sector */}
                                            <div>
                                                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Social / Sector</h3>
                                                <div className="space-y-1">
                                                    {['Senior Citizen', 'PWD', 'Solo Parent', 'Family Head'].map((item) => (
                                                        <label key={item} className="flex items-center gap-2 cursor-pointer group/item">
                                                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors">{item}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-3">
                                            {/* Education Level */}
                                            <div>
                                                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Education Level</h3>
                                                <div className="space-y-1">
                                                    {['Day Care', 'Kinder', 'Elementary', 'High School', 'Senior High', 'College', 'ALS'].map((item) => (
                                                        <label key={item} className="flex items-center gap-2 cursor-pointer group/item">
                                                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors">{item}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Filters (Accordion) */}
                                    <div className="border-t border-gray-50">
                                        <button 
                                            onClick={() => setIsAgeAccordionOpen(!isAgeAccordionOpen)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Age Range</span>
                                            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isAgeAccordionOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isAgeAccordionOpen && (
                                            <div className="px-4 py-4 bg-gray-50/30 border-t border-gray-50">
                                                <div className="grid grid-cols-2 gap-2">
                                                     {['0-17', '18-24', '25-34', '35-44', '45-59', '60+'].map((range) => (
                                                        <label key={range} className="flex items-center gap-2 cursor-pointer group/item">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={tempFilters.age.includes(range)}
                                                                onChange={() => {
                                                                    setTempFilters(prev => ({
                                                                        ...prev,
                                                                        age: prev.age.includes(range)
                                                                            ? prev.age.filter(r => r !== range)
                                                                            : [...prev.age, range]
                                                                    }));
                                                                }}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                                            />
                                                            <span className="text-[13px] font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors">{range}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                                        <button 
                                            onClick={handleApplyFilters}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors shadow-sm shadow-blue-200"
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resident Status Dropdown */}
                        <div 
                            className="relative group"
                            onMouseEnter={handleStatusMouseEnter}
                            onMouseLeave={handleStatusMouseLeave}
                        >
                            <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="text-[14px] font-medium text-gray-700">Resident Status</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Dropdown */}
                            <div className={`absolute top-full left-0 pt-2 w-36 z-30 transition-all duration-200 ${isStatusMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'}`}>
                                <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-2 overflow-hidden">
                                    {['Active', 'Deceased', 'Move out'].map((status) => (
                                        <label key={status} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer group/item">
                                            <input
                                                type="checkbox"
                                                checked={selectedStatuses.includes(status)}
                                                onChange={() => {
                                                    setSelectedStatuses(prev =>
                                                        prev.includes(status)
                                                            ? prev.filter(s => s !== status)
                                                            : [...prev, status]
                                                    );
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-[13px] font-medium text-gray-700 group-hover/item:text-blue-600 transition-colors">
                                                {status}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reset Filter Button */}
                    <button 
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 text-[14px] font-medium transition-colors px-3 py-2 hover:bg-red-50 rounded-xl"
                    >
                        <RotateCcw size={16} className={`transition-transform duration-500 ${isResetAnimating ? '-rotate-180' : ''}`} />
                        Reset Filter
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button className="bg-[#22C55E] hover:bg-green-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all uppercase">CSV</button>
                    <button className="bg-[#EF4444] hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-widest transition-all uppercase">PDF</button>
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search residents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-2 bg-[#F9FAFB] rounded-xl text-[14px] text-gray-700 w-full lg:w-64 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder-blue-300"
                        />
                    </div>
                </div>
            </div>

            {/* Table Container - table-fixed with proportional widths */}
            <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                <table className="w-full border-separate border-spacing-0 table-fixed">
                    <thead ref={headerRef} className="bg-white z-10 sticky top-0">
                        <tr className="border-b border-gray-50">
                            <th className="w-[12%] text-left py-4 pl-8 pr-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Resident ID</th>
                            <th className="w-[15%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Last Name</th>
                            <th className="w-[20%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">First Name</th>
                            <th className="w-[10%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Sex</th>
                            <th className="w-[8%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Age</th>
                            <th className="w-[10%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Voter</th>
                            <th className="w-[12%] text-left py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Status</th>
                            <th className="w-[8%] text-center py-4 px-4 text-[14px] font-bold text-blue-500 whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {currentItems.map((resident) => (
                            <tr key={resident.id} className="hover:bg-gray-50/50 transition-colors" style={{ height: `${rowHeight}px` }}>
                                <td className="pl-8 pr-4 text-[14px] text-gray-900 font-bold truncate">{resident.id}</td>
                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{resident.lastName}</td>
                                <td className="px-4 text-[14px] text-gray-700 font-medium truncate">{resident.firstName}</td>
                                <td className="px-4 text-[14px] text-gray-600 truncate">{resident.sex}</td>
                                <td className="px-4 text-[14px] text-gray-600 truncate">{resident.age}</td>
                                <td className="px-4 text-[14px] text-gray-600 truncate">{resident.voter}</td>
                                <td className="px-4 text-left">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold ${resident.status === 'Active' ? 'text-[#166534] bg-[#F0FDF4]' :
                                        resident.status === 'Deceased' ? 'text-[#991B1B] bg-[#FEF2F2]' :
                                            'text-[#9A3412] bg-[#FFFBEB]'
                                        }`}>
                                        {resident.status}
                                    </span>
                                </td>
                                <td className="px-4 text-center">
                                    <button 
                                        onClick={() => {
                                            setSelectedResident(resident);
                                            setIsProfileModalOpen(true);
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
                                <td colSpan={8}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-6 border-t border-gray-50 shrink-0 bg-white">
                <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">
                    Showing {residentsData.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, residentsData.length)} of {residentsData.length}
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
            </div>                    </>
                ) : (
                    <AddResidentWizard
                        onCancel={() => {
                            setViewMode('list');
                            if (setIsNavigationBlocked) setIsNavigationBlocked(false);
                        }} 
                        setIsNavigationBlocked={setIsNavigationBlocked}
                        onShowSuccess={onShowSuccess}
                    />
                )}            </ContentCard>

            <ResidentProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                resident={selectedResident}
                onShowSuccess={onShowSuccess}
            />
        </>
    );
};

export default Residents;