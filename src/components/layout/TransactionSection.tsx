import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Search, ChevronDown, ChevronRight, ChevronLeft, Calendar, Coins, FileText } from 'lucide-react';
import { Transaction } from '@/types';

const MOCK_DATA = {
  'Day': {
    accumulatedFee: '₱3,212',
    totalTransactions: 31,
    transactions: [
      { id: '001', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Maria Santos', type: 'Barangay Clearance', fee: 200 },
      { id: '002', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Aries Castanas', type: 'Certificate of Indigency', fee: 200 },
      { id: '003', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Arwind Jae Mendoza', type: 'Certificate of Residency', fee: 200 },
      { id: '004', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Matt Dwayne Gagarin', type: 'Certificate of First Time Job Seeker', fee: 200 },
      { id: '005', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'John Lemuel Teano', type: 'Business Permit', fee: 200 },
      { id: '006', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Minatozaki Sana', type: 'Certificate of No Income', fee: 200 },
      { id: '007', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Mitsubishi Haduken', type: 'Certificate of Live Birth', fee: 200 },
      { id: '008', dateIssued: '16/06/2025', personnel: 'Nayeon', resident: 'Jennie Kim', type: 'Barangay Indigency', fee: 200 },
    ]
  },
  'Week': {
    accumulatedFee: '₱15,450',
    totalTransactions: 142,
    transactions: [
      { id: '009', dateIssued: '15/06/2025', personnel: 'Sana', resident: 'Kim Dahyun', type: 'Barangay Clearance', fee: 200 },
      { id: '010', dateIssued: '14/06/2025', personnel: 'Sana', resident: 'Chou Tzuyu', type: 'Business Permit', fee: 500 },
      { id: '011', dateIssued: '13/06/2025', personnel: 'Nayeon', resident: 'Park Jihyo', type: 'Certificate of Residency', fee: 200 },
      { id: '012', dateIssued: '12/06/2025', personnel: 'Sana', resident: 'Hirai Momo', type: 'Barangay Indigency', fee: 0 },
      { id: '013', dateIssued: '11/06/2025', personnel: 'Nayeon', resident: 'Yoo Jeongyeon', type: 'Certificate of Live Birth', fee: 200 },
      { id: '014', dateIssued: '10/06/2025', personnel: 'Sana', resident: 'Son Chaeyoung', type: 'Certificate of No Income', fee: 200 },
    ]
  },
  'Month': {
    accumulatedFee: '₱68,900',
    totalTransactions: 523,
    transactions: [
      { id: '015', dateIssued: '01/06/2025', personnel: 'Nayeon', resident: 'Im Nayeon', type: 'Business Permit', fee: 1000 },
      { id: '016', dateIssued: '05/06/2025', personnel: 'Sana', resident: 'Myoui Mina', type: 'Barangay Clearance', fee: 200 },
      { id: '017', dateIssued: '10/06/2025', personnel: 'Nayeon', resident: 'Kim Jisoo', type: 'Certificate of Residency', fee: 200 },
      { id: '018', dateIssued: '15/06/2025', personnel: 'Sana', resident: 'Lalisa Manobal', type: 'Certificate of Indigency', fee: 0 },
      { id: '019', dateIssued: '20/06/2025', personnel: 'Nayeon', resident: 'Roseanne Park', type: 'Certificate of First Time Job Seeker', fee: 0 },
    ]
  },
  'Custom': {
    accumulatedFee: '₱5,100',
    totalTransactions: 45,
    transactions: [
       { id: '020', dateIssued: '20/06/2025', personnel: 'Nayeon', resident: 'Custom Range User 1', type: 'Barangay Clearance', fee: 200 },
       { id: '021', dateIssued: '21/06/2025', personnel: 'Sana', resident: 'Custom Range User 2', type: 'Business Permit', fee: 500 },
    ]
  }
};

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: any;
  iconBg: string;
  iconColor: string;
  className?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, iconBg, iconColor, className }) => (
  <div className={`bg-white p-[clamp(0.75rem,1vw,1.25rem)] rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center w-full flex-1 ${className}`}>
    <p className="text-gray-500 font-medium mb-[clamp(0.4rem,0.6vh,0.6rem)] text-[clamp(0.8rem,0.9vw,1rem)]">{title}</p>
    <div className="flex items-center gap-[clamp(0.5rem,1vw,1rem)]">
      <div className={`p-[clamp(0.6rem,1vw,1rem)] rounded-full ${iconBg}`}>
        <Icon className={`${iconColor} w-[clamp(1.25rem,1.75vw,1.75rem)] h-[clamp(1.25rem,1.75vw,1.75rem)]`} />
      </div>
      <span className="text-[clamp(1.25rem,2vw,1.875rem)] font-bold text-gray-900 tracking-tight">{value}</span>
    </div>
  </div>
);

const TransactionSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Day');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Personnel Dropdown State
  const [isPersonnelDropdownOpen, setIsPersonnelDropdownOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState('All');
  const personnelDropdownRef = useRef<HTMLDivElement>(null);
  
  // Dynamic Table Layout State
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [rowHeight, setRowHeight] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);

  const currentData = MOCK_DATA[activeTab as keyof typeof MOCK_DATA] || MOCK_DATA['Day'];
  
  // Dynamic Layout Calculation
  useLayoutEffect(() => {
      if (!containerRef.current) return;

      const calculateLayout = () => {
          // Measure available space
          const containerH = containerRef.current?.clientHeight || 0;
          const headerH = headerRef.current?.clientHeight || 50; // Default header height estimate

          const availableSpace = containerH - headerH;

          // Desired minimum row height for readability
          const MIN_ROW_HEIGHT = 56;

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

  const totalPages = Math.ceil(currentData.transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = currentData.transactions.slice(startIndex, startIndex + itemsPerPage);
  const emptyRows = Math.max(0, itemsPerPage - paginatedTransactions.length);

  const handleDateApply = () => {
    setActiveTab('Custom');
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const totalPages = Math.ceil(currentData.transactions.length / itemsPerPage);
    if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
    }
  }, [itemsPerPage, currentData.transactions.length, currentPage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (personnelDropdownRef.current && !personnelDropdownRef.current.contains(event.target as Node)) {
        setIsPersonnelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-[clamp(1rem,1.5vw,1.5rem)]">
      {/* Left Column - Controls & Summary Container */}
      <div className="col-span-12 lg:col-span-3 flex flex-col">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-[clamp(1rem,1.25vw,1.25rem)] h-[34rem] flex flex-col gap-[clamp(0.75rem,1.5vh,1.5rem)]">
          
          {/* Time Filters & Calendar */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-white rounded-xl p-0.5 flex border border-gray-100 items-center justify-between">
              {['Day', 'Week', 'Month'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-0.5 py-1.5 text-[clamp(9px,0.8vw,11px)] font-semibold rounded-lg transition-all text-center ${
                    activeTab === tab
                      ? 'bg-white shadow-sm text-gray-900 border border-gray-100'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Date Range Picker Button & Popover */}
            <div className="relative h-full" ref={datePickerRef}>
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`bg-gray-100 p-[clamp(0.4rem,0.6vw,0.6rem)] rounded-xl text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center h-full aspect-square flex-shrink-0 ${showDatePicker || activeTab === 'Custom' ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-600' : ''}`}
              >
                <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              </button>

              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 transform origin-top-left">
                    <div className="flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Select Date Range</h4>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Start Date</label>
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">End Date</label>
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="pt-2 flex gap-2">
                            <button 
                                onClick={() => setShowDatePicker(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDateApply}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm shadow-blue-200"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* Personnel Dropdown */}
          <div className="flex items-center gap-2 w-full z-20">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap min-w-fit">Personnel</span>
              <div className="relative w-full" ref={personnelDropdownRef}>
                  <button 
                    onClick={() => setIsPersonnelDropdownOpen(!isPersonnelDropdownOpen)}
                    className="w-full bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-xl flex items-center justify-between focus:outline-none focus:border-gray-400 font-medium text-[clamp(11px,0.8vw,12px)] transition-all hover:bg-gray-50"
                  >
                      <span className="truncate">{selectedPersonnel}</span>
                      <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${isPersonnelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Custom Dropdown Menu */}
                  <div className={`absolute top-full left-0 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl p-1 z-50 transition-all duration-200 origin-top ${isPersonnelDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                      {['All', 'Nayeon', 'Sana'].map((person) => (
                          <button
                              key={person}
                              onClick={() => {
                                  setSelectedPersonnel(person);
                                  setIsPersonnelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-[11px] font-medium rounded-lg transition-colors ${selectedPersonnel === person ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                              {person}
                          </button>
                      ))}
                  </div>
              </div>
          </div>

          {/* Summary Cards */}
          <div className="flex flex-col gap-[clamp(0.75rem,1.25vw,1.25rem)] mt-auto flex-1">
            <SummaryCard 
              title="Accumulated Fee" 
              value={currentData.accumulatedFee} 
              icon={Coins} 
              iconBg="bg-orange-100" 
              iconColor="text-orange-500"
            />
            <SummaryCard 
              title="Total Transactions" 
              value={currentData.totalTransactions} 
              icon={FileText} 
              iconBg="bg-teal-100" 
              iconColor="text-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Right Column - Table */}
      <div className="col-span-12 lg:col-span-9">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-[clamp(1rem,1.5vw,1.75rem)] h-[34rem] flex flex-col">
          
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[clamp(1rem,1.5vw,1.5rem)] gap-4">
            <h3 className="text-[clamp(0.9rem,1.25vw,1.125rem)] font-bold text-gray-900 tracking-tight">Document Transactions</h3>
            <div className="flex flex-wrap items-center gap-2 xl:gap-2.5">
              <button className="bg-green-400 hover:bg-green-500 text-white px-3 xl:px-4 py-1.5 rounded-lg text-[9px] xl:text-[10px] font-bold transition-colors tracking-wide uppercase">CSV</button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 xl:px-4 py-1.5 rounded-lg text-[9px] xl:text-[10px] font-bold transition-colors tracking-wide uppercase">PDF</button>
              <div className="relative ml-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-3.5 h-3.5" />
                <input 
                  type="text" 
                  placeholder="Search transactions.." 
                  className="pl-9 pr-3 py-1.5 xl:py-2 bg-gray-50 border-none rounded-xl text-[11px] xl:text-xs text-gray-700 placeholder-blue-300 focus:ring-1 focus:ring-blue-500 w-full sm:w-44 xl:w-56"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden relative" ref={containerRef}>
            <table className="w-full border-separate border-spacing-0 table-fixed">
              <thead ref={headerRef} className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-100">
                  <th className="w-[15%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Transaction ID</th>
                  <th className="w-[15%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Date Issued</th>
                  <th className="w-[12%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Personel</th>
                  <th className="w-[18%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Resident</th>
                  <th className="w-[20%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="w-[10%] text-left py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Fee</th>
                  <th className="w-[10%] text-center py-2 px-3 xl:px-4 text-[9px] xl:text-[11px] font-bold text-blue-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors group" style={{ height: `${rowHeight}px` }}>
                    <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 font-medium truncate">{t.id}</td>
                    <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate">{t.dateIssued}</td>
                    <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate">{t.personnel}</td>
                    <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate">{t.resident}</td>
                    <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-600 truncate" title={t.type}>{t.type}</td>
                    <td className="px-3 xl:px-4 text-[11px] xl:text-[13px] text-gray-900 font-bold truncate">₱{t.fee}</td>
                    <td className="px-3 xl:px-4 text-center">
                      <button className="text-blue-500 border-2 border-blue-500 rounded-full px-3 xl:px-4 py-1 text-[10px] xl:text-[11px] font-bold hover:bg-blue-50 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: emptyRows }).map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b border-gray-50 last:border-none" style={{ height: `${rowHeight}px` }}>
                    <td colSpan={7}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-auto pt-[clamp(0.75rem,1.5vh,1.5rem)] border-t border-gray-50">
             <span className="text-[10px] xl:text-[11px] text-gray-400 font-medium">
               Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, currentData.transactions.length)} of {currentData.transactions.length}
             </span>
             <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-1.5 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide"
                >
                    <ChevronLeft size={12} /> Prev
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-5 h-5 flex items-center justify-center rounded-md text-[10px] font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide"
                >
                    Next <ChevronRight size={12} />
                </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransactionSection;