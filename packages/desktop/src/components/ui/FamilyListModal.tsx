import React, { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Trash2, Bike, Car, Cat, Dog, Users, Archive } from 'lucide-react';
import FamilyViewModal from '@/components/ui/FamilyViewModal';

interface FamilyListModalProps {
    isOpen: boolean;
    onClose: () => void;
    householdId: string;
    onShowSuccess?: (message: string) => void;
}

interface FamilyData {
    id: string;
    displayId: number;
    familyName: string;
    residentCount: number;
    voterCount: number;
}

const MOCK_FAMILIES: FamilyData[] = Array.from({ length: 15 }, (_, i) => ({
    id: `fam-mock-${i + 1}`,
    displayId: i + 1,
    familyName: ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Bautista', 'Ocampo', 'Gonzales', 'Lopez', 'Sy'][i % 10],
    residentCount: Math.floor(Math.random() * 6) + 2,
    voterCount: Math.floor(Math.random() * 4),
}));

const FamilyListModal: React.FC<FamilyListModalProps> = ({ isOpen, onClose, householdId, onShowSuccess }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFamily, setSelectedFamily] = useState<{id: string, name: string} | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredFamilies = MOCK_FAMILIES.filter(family => 
        family.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        family.id.includes(searchQuery)
    );

    const totalPages = Math.ceil(filteredFamilies.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredFamilies.slice(indexOfFirstItem, indexOfLastItem);
    const emptyRows = Math.max(0, itemsPerPage - currentItems.length);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Family List</h2>
                            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                <span className="text-gray-400"><HomeIcon size={12} /></span>
                                Household No. #{householdId.replace('HH-', '')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <StatCard icon={Bike} label="Motorcycles" value="42" color="text-blue-600" bgColor="bg-blue-50" />
                        <StatCard icon={Car} label="Vehicles" value="18" color="text-green-600" bgColor="bg-green-50" />
                        <StatCard icon={Cat} label="Cats" value="34" color="text-orange-500" bgColor="bg-orange-50" />
                        <StatCard icon={Dog} label="Dogs" value="27" color="text-red-500" bgColor="bg-red-50" />
                    </div>

                    {/* Search and Title */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Families</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search family..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 w-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-4 pl-8 pr-4 text-[13px] font-bold text-blue-500">Family ID</th>
                                    <th className="text-left py-4 px-4 text-[13px] font-bold text-blue-500">Family Name</th>
                                    <th className="text-left py-4 px-4 text-[13px] font-bold text-blue-500">Residents</th>
                                    <th className="text-left py-4 px-4 text-[13px] font-bold text-blue-500">Voters</th>
                                    <th className="text-center py-4 px-8 text-[13px] font-bold text-blue-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentItems.map((family) => (
                                    <tr key={family.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 pl-8 pr-4 text-[14px] font-bold text-gray-900">{String(family.displayId ?? 0).padStart(4, '0')}</td>
                                        <td className="py-4 px-4 text-[14px] font-medium text-gray-700">{family.familyName}</td>
                                        <td className="py-4 px-4 text-[14px] text-gray-600">{family.residentCount}</td>
                                        <td className="py-4 px-4 text-[14px] text-gray-600">{family.voterCount}</td>
                                        <td className="py-4 px-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedFamily({ id: family.id, name: family.familyName })}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Search size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                                    <Archive size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {Array.from({ length: emptyRows }).map((_, idx) => (
                                    <tr key={`empty-${idx}`}>
                                        <td colSpan={5} className="py-4">&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <span className="text-[12px] text-gray-500 font-medium">
                            Showing {filteredFamilies.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredFamilies.length)} of {filteredFamilies.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-bold transition-colors ${
                                            currentPage === page 
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' 
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <FamilyViewModal 
                isOpen={!!selectedFamily}
                onClose={() => setSelectedFamily(null)}
                familyId={selectedFamily?.id || ''}
                familyName={selectedFamily?.name || ''}
                onShowSuccess={onShowSuccess}
            />
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
            <Icon size={20} />
        </div>
        <div className="text-right">
            <p className="text-[13px] font-medium text-gray-500 mb-0.5">{label}</p>
            <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        </div>
    </div>
);

const HomeIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);

export default FamilyListModal;
