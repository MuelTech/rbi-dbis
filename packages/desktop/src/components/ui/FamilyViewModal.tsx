import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, User, Edit, Plus, FileText, CreditCard, Search, PawPrint, Car, Save, ChevronDown, Loader2 } from 'lucide-react';
import AddMemberForm from '@/components/forms/AddMemberForm';
import ResidentProfileModal from '@/components/ui/ResidentProfileModal';
import { Resident } from '@/types';
import { familiesService } from '@/services/families';
import type { FamilyDetail, FamilyMemberRow } from '@/services/families';

interface FamilyViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyId: string;
    familyName: string;
    onShowSuccess?: (message: string) => void;
    familyStatus?: 'Moveout' | 'Deceased';
}

interface FormState {
    // TODO: Family head reassignment deferred — relation constraints make it complex.
    // Keeping familyHead read-only for this iteration.
    familyHead: string;
    houseNo: string;
    streetName: string;
    alley: string;
    cats: string;
    dogs: string;
    others: string;
    motorcycles: string;
    motorcyclePlates: string;
    otherVehicles: string;
    otherVehiclePlates: string;
}

function formStateFromDetail(detail: FamilyDetail): FormState {
    return {
        familyHead: detail.familyHead.fullName,
        houseNo: detail.address.houseNo,
        streetName: detail.address.streetName,
        alley: detail.address.alleyName,
        cats: String(detail.pet.numberOfCats),
        dogs: String(detail.pet.numberOfDogs),
        others: detail.pet.others,
        motorcycles: String(detail.vehicle.numberOfMotorcycles),
        motorcyclePlates: detail.vehicle.motorcyclePlateNumber,
        otherVehicles: String(detail.vehicle.numberOfVehicles),
        otherVehiclePlates: detail.vehicle.vehiclePlateNumber,
    };
}

const EMPTY_FORM: FormState = {
    familyHead: '',
    houseNo: '',
    streetName: '',
    alley: '',
    cats: '0',
    dogs: '0',
    others: '',
    motorcycles: '0',
    motorcyclePlates: '',
    otherVehicles: '0',
    otherVehiclePlates: '',
};

const FamilyViewModal: React.FC<FamilyViewModalProps> = ({ isOpen, onClose, familyId, familyName, onShowSuccess, familyStatus }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<'view' | 'add'>('view');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const originalDataRef = useRef<FormState | null>(null);

    const [familyDetail, setFamilyDetail] = useState<FamilyDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

    const displayMembers: FamilyMemberRow[] = React.useMemo(() => {
        if (!familyDetail) return [];
        if (familyStatus === 'Moveout') {
            return familyDetail.members.map(member => ({ ...member, status: 'Moveout' }));
        }
        return familyDetail.members;
    }, [familyDetail, familyStatus]);

    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
    const [showResidentProfile, setShowResidentProfile] = useState(false);

    const fetchFamily = useCallback(async () => {
        if (!familyId) return;
        setIsLoading(true);
        setError(null);
        try {
            const detail = await familiesService.getById(familyId);
            setFamilyDetail(detail);
            setFormData(formStateFromDetail(detail));
        } catch (err: any) {
            setError(err.message || 'Failed to load family details');
        } finally {
            setIsLoading(false);
        }
    }, [familyId]);

    useEffect(() => {
        if (isOpen && familyId) {
            fetchFamily();
        }
    }, [isOpen, familyId, fetchFamily]);

    const handleViewResident = (member: FamilyMemberRow) => {
        const residentData: Resident = {
            id: member.id,
            lastName: member.lastName,
            firstName: member.firstName,
            sex: member.sex as 'Male' | 'Female',
            age: member.age,
            voter: member.voter as 'Yes' | 'No',
            status: member.status === 'Moveout' ? 'Move out' : member.status as 'Active' | 'Deceased' | 'Move out'
        };
        setSelectedResident(residentData);
        setShowResidentProfile(true);
    };

    const handleEditClick = () => {
        originalDataRef.current = { ...formData };
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        if (originalDataRef.current) {
            setFormData(originalDataRef.current);
        }
        setIsEditing(false);
    };

    const handleSaveClick = async () => {
        if (!familyId) return;
        setIsSaving(true);
        try {
            const updated = await familiesService.update(familyId, {
                address: {
                    houseNo: formData.houseNo,
                    streetName: formData.streetName,
                    alleyName: formData.alley,
                },
                pet: {
                    numberOfCats: parseInt(formData.cats) || 0,
                    numberOfDogs: parseInt(formData.dogs) || 0,
                    others: formData.others,
                },
                vehicle: {
                    numberOfMotorcycles: parseInt(formData.motorcycles) || 0,
                    motorcyclePlateNumber: formData.motorcyclePlates,
                    numberOfVehicles: parseInt(formData.otherVehicles) || 0,
                    vehiclePlateNumber: formData.otherVehiclePlates,
                },
            });
            setFamilyDetail(updated);
            setFormData(formStateFromDetail(updated));
            setIsEditing(false);
            if (onShowSuccess) onShowSuccess('Update family details success');
        } catch (err: any) {
            setError(err.message || 'Failed to save family details');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    useEffect(() => {
        if (!isOpen) {
            setViewMode('view');
            setIsEditing(false);
            setError(null);
            setFamilyDetail(null);
        }
    }, [isOpen]);

    const renderField = (label: string, key: keyof FormState, colSpan: string = "", readOnly = false) => (
        <div className={`space-y-1.5 ${colSpan}`}>
            <label className="text-[12px] font-bold text-gray-500">{label}</label>
            {isEditing && !readOnly ? (
                <input
                    type="text"
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            ) : (
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-700">
                    {formData[key] || '\u00A0'}
                </div>
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                {viewMode === 'add' ? (
                    <div className="flex-1 min-h-0 flex flex-col w-full">
                        <AddMemberForm 
                            onCancel={() => setViewMode('view')}
                            onSubmit={() => {
                                setViewMode('view');
                                fetchFamily();
                                if (onShowSuccess) onShowSuccess('New family member added successfully');
                            }}
                        />
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">Family View</h2>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                                    <p className="text-sm text-gray-500 font-medium">Loading family details...</p>
                                </div>
                            ) : error && !familyDetail ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <p className="text-sm text-red-500 font-medium">{error}</p>
                                    <button
                                        onClick={fetchFamily}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {error && (
                                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 font-medium">
                                            {error}
                                        </div>
                                    )}

                                    {/* Family Details Section */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                                    <User size={18} />
                                                </div>
                                                <h3 className="text-[15px] font-bold text-gray-900">Family Details</h3>
                                            </div>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={handleCancelClick}
                                                        disabled={isSaving}
                                                        className="px-4 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={handleSaveClick}
                                                        disabled={isSaving}
                                                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
                                                    >
                                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                        {isSaving ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={handleEditClick}
                                                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Edit size={14} />
                                                    Edit Info
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            {/* TODO: Family head reassignment deferred — keeping read-only */}
                                            {renderField("Family Head", "familyHead", "", true)}
                                            {renderField("House No.", "houseNo")}
                                            {renderField("Street Name", "streetName")}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderField("Alley", "alley")}
                                        </div>
                                    </div>

                                    {/* Pets Section */}
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <PawPrint size={16} className="text-gray-400" />
                                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PETS</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderField("Cats", "cats")}
                                            {renderField("Dogs", "dogs")}
                                            {renderField("Others", "others")}
                                        </div>
                                    </div>

                                    {/* Vehicle Information Section */}
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Car size={16} className="text-gray-400" />
                                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">VEHICLE INFORMATION</h3>
                                        </div>
                                        <div className="grid grid-cols-12 gap-4 mb-4">
                                            {renderField("Motorcycles", "motorcycles", "col-span-3")}
                                            {renderField("Plate Numbers", "motorcyclePlates", "col-span-9")}
                                        </div>
                                        <div className="grid grid-cols-12 gap-4">
                                            {renderField("Other Vehicles", "otherVehicles", "col-span-3")}
                                            {renderField("Plate Numbers", "otherVehiclePlates", "col-span-9")}
                                        </div>
                                    </div>

                                    {/* Family Members Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                                                    <User size={18} />
                                                </div>
                                                <h3 className="text-[15px] font-bold text-gray-900">Family Members</h3>
                                            </div>
                                            <button 
                                                onClick={() => setViewMode('add')}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981] hover:bg-green-600 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm shadow-green-200"
                                            >
                                                <Plus size={14} />
                                                Add New Member
                                            </button>
                                        </div>

                                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="text-left py-4 pl-6 pr-4 text-[12px] font-bold text-blue-500 tracking-wider">Resident ID</th>
                                                        <th className="text-left py-4 px-4 text-[12px] font-bold text-blue-500 tracking-wider">Last Name</th>
                                                        <th className="text-left py-4 px-4 text-[12px] font-bold text-blue-500 tracking-wider">First Name</th>
                                                        <th className="text-left py-4 px-4 text-[12px] font-bold text-blue-500 tracking-wider">Sex</th>
                                                        <th className="text-left py-4 px-4 text-[12px] font-bold text-blue-500 tracking-wider">Age</th>
                                                        <th className="text-left py-4 px-4 text-[12px] font-bold text-blue-500 tracking-wider">Voter</th>
                                                        <th className="text-left py-4 px-4 text-[12px] font-bold text-blue-500 tracking-wider">Status</th>
                                                        <th className="text-center py-4 px-6 text-[12px] font-bold text-blue-500 tracking-wider">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {displayMembers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={8} className="py-8 text-center text-sm text-gray-400">No members found</td>
                                                        </tr>
                                                    ) : (
                                                        displayMembers.map((member) => (
                                                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="py-3 pl-6 pr-4 text-[13px] font-bold text-gray-900">{String(member.displayId ?? 0).padStart(3, '0')}</td>
                                                                <td className="py-3 px-4 text-[13px] font-medium text-gray-700">{member.lastName}</td>
                                                                <td className="py-3 px-4 text-[13px] font-medium text-gray-700">{member.firstName}</td>
                                                                <td className="py-3 px-4 text-[13px] text-gray-600">{member.sex}</td>
                                                                <td className="py-3 px-4 text-[13px] text-gray-600">{member.age}</td>
                                                                <td className="py-3 px-4 text-[13px] text-gray-600">{member.voter}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                                                        member.status === 'Active' ? 'text-green-700 bg-green-50' :
                                                                        member.status === 'Deceased' ? 'text-red-700 bg-red-50' :
                                                                        'text-orange-700 bg-orange-50'
                                                                    }`}>
                                                                        {member.status}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-6">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button 
                                                                            onClick={() => handleViewResident(member)}
                                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Search size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-[13px] transition-colors">
                                <FileText size={16} />
                                Generate RBI
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-lg shadow-blue-200 transition-all active:scale-95">
                                <CreditCard size={16} />
                                Generate ID
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            <ResidentProfileModal
                isOpen={showResidentProfile}
                onClose={() => setShowResidentProfile(false)}
                resident={selectedResident}
                onShowSuccess={onShowSuccess}
            />
        </div>
    );
};

export default FamilyViewModal;
