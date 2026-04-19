import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Save, ChevronDown, Edit, FileText, Activity, User as UserIcon, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Resident, ResidentDetail } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { residentsService } from '@/services/residents';

interface CustomDropdownProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, disabled, placeholder = 'Select', className }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <button 
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-[13px] font-medium text-gray-700 transition-all ${!disabled ? 'hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'opacity-60 cursor-not-allowed bg-gray-50'}`}
            >
                <span className={!value ? 'text-gray-400' : ''}>{value || placeholder}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-100 max-h-[200px] overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

function formatDateForInput(value: string | Date | null | undefined): string {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function formatDateForDisplay(value: string | Date | null | undefined): string {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTimestamp(value: string | Date | null | undefined): string {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

interface ResidentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    resident: Resident | null;
    onShowSuccess?: (message: string) => void;
}

function buildFormData(detail: ResidentDetail) {
    return {
        firstName: detail.firstName ?? '',
        middleName: detail.middleName ?? '',
        lastName: detail.lastName ?? '',
        suffix: detail.suffix ?? '',
        relationshipToHead: detail.relationshipToHead ?? '',
        dateOfBirth: formatDateForInput(detail.dateOfBirth),
        placeOfBirth: detail.placeOfBirth ?? '',
        civilStatus: detail.civilStatus ?? '',
        sex: detail.sex,
        contactNumber: detail.contactNumber ?? '',
        occupation: detail.occupation ?? '',
        studentStatus: detail.studentType ?? '',
        householdNo: detail.household?.householdNo ?? '',
        streetName: detail.household?.streetName ?? '',
        alley: detail.household?.alley ?? '',
        voter: detail.voter === 'Yes',
        pwd: detail.isPwd ?? false,
        homeowner: detail.isOwner ?? false,
        soloParent: detail.isSoloParent ?? false,
        status: detail.status,
        displayId: detail.displayId,
        id: detail.id,
        age: detail.age,
    };
}

const ResidentProfileModal: React.FC<ResidentProfileModalProps> = ({ isOpen, onClose, resident, onShowSuccess }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ReturnType<typeof buildFormData> | null>(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const [detail, setDetail] = useState<ResidentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchDetail = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await residentsService.getById(id);
            setDetail(data);
            setFormData(buildFormData(data));
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load resident details');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && resident) {
            setActiveTab('profile');
            setIsEditing(false);
            setDetail(null);
            setFormData(null);
            fetchDetail(resident.id);
        }
    }, [isOpen, resident, fetchDetail]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => prev ? ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }) : prev);
    };

    const handleSave = async () => {
        if (!formData || !detail) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName,
                suffix: formData.suffix || null,
                dateOfBirth: formData.dateOfBirth || null,
                placeOfBirth: formData.placeOfBirth || null,
                civilStatus: formData.civilStatus || null,
                sex: formData.sex,
                contactNumber: formData.contactNumber || null,
                occupation: formData.occupation || null,
                studentType: formData.studentStatus || null,
                isVoter: formData.voter,
                isPwd: formData.pwd,
                isSoloParent: formData.soloParent,
                isOwner: formData.homeowner,
                status: formData.status,
            };
            const updated = await residentsService.update(detail.id, payload);
            setDetail(updated);
            setFormData(buildFormData(updated));
            setIsEditing(false);
            onShowSuccess?.("Update profile success.");
        } catch (err: any) {
            setError(err?.message ?? 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (detail) {
            setFormData(buildFormData(detail));
        }
    };

    if (!resident) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resident Profile" maxWidth="max-w-5xl" disableScroll={true}>
            {loading && (
                <div className="flex-1 flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                </div>
            )}

            {error && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                    <div className="text-red-500 text-sm font-medium">{error}</div>
                    <button
                        onClick={() => fetchDetail(resident.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && detail && formData && (
                <>
                    {/* Tabs */}
                    <div className="px-6 pt-6 border-b border-gray-100 bg-white z-10 shrink-0">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setActiveTab('profile')}
                                className={`pb-3 text-[13px] font-bold transition-all relative ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Profile Information
                                {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                            </button>
                            {user?.role === 'SuperAdmin' && (
                                <button 
                                    onClick={() => setActiveTab('logs')}
                                    className={`pb-3 text-[13px] font-bold transition-all relative ${activeTab === 'logs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Logs & History
                                    {activeTab === 'logs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                {/* Profile Header Card */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                    <div className="relative shrink-0">
                                        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                            {detail.profileImage ? (
                                                <img src={detail.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={40} className="text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 w-full">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h3>
                                                <div className="flex items-center gap-3 mt-2 text-[13px]">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 font-medium">ID: {String(formData.displayId ?? 0).padStart(4, '0')}</span>
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <span className="text-blue-500 font-medium">FAMILY HEAD:</span> {detail.familyHead?.name ?? 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => isEditing && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                                    disabled={!isEditing}
                                                    className={`w-[130px] flex items-center justify-between px-3 py-1.5 border rounded-lg text-[13px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                        !isEditing 
                                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
                                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`block w-2 h-2 rounded-full ${
                                                            formData.status === 'Active' ? 'bg-green-500' : 
                                                            formData.status === 'Deceased' ? 'bg-gray-500' : 
                                                            'bg-orange-500'
                                                        }`}></span>
                                                        <span>{formData.status}</span>
                                                    </div>
                                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isStatusDropdownOpen && isEditing && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                                        <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                                                            {['Active', 'Move out', 'Deceased'].map((status) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => {
                                                                        setFormData((prev) => prev ? ({ ...prev, status: status as any }) : prev);
                                                                        setIsStatusDropdownOpen(false);
                                                                    }}
                                                                    className="w-full px-3 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full ${
                                                                        status === 'Active' ? 'bg-green-500' : 
                                                                        status === 'Deceased' ? 'bg-gray-500' : 
                                                                        'bg-orange-500'
                                                                    }`}></span>
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-wide rounded-md">Resident</span>
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wide rounded-md">{formData.age} Years Old</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-gray-900">Personal Information</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">First Name <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Middle Name</label>
                                            <input 
                                                type="text" 
                                                name="middleName"
                                                value={formData.middleName}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Last Name <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Suffix</label>
                                            <CustomDropdown
                                                value={formData.suffix}
                                                onChange={(value) => setFormData((prev) => prev ? ({ ...prev, suffix: value }) : prev)}
                                                options={['Jr.', 'Sr.', 'II', 'III', 'IV']}
                                                disabled={!isEditing}
                                                placeholder="Select Suffix"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Relationship to Family Head</label>
                                            <CustomDropdown
                                                value={formData.relationshipToHead}
                                                onChange={(value) => setFormData((prev) => prev ? ({ ...prev, relationshipToHead: value }) : prev)}
                                                options={['Head', 'Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'Other']}
                                                disabled={!isEditing}
                                                placeholder="Select Relationship"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Date of Birth <span className="text-red-500">*</span></label>
                                            <input 
                                                type="date" 
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Place of Birth</label>
                                            <input 
                                                type="text" 
                                                name="placeOfBirth"
                                                value={formData.placeOfBirth}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Civil Status <span className="text-red-500">*</span></label>
                                            <CustomDropdown
                                                value={formData.civilStatus}
                                                onChange={(value) => setFormData((prev) => prev ? ({ ...prev, civilStatus: value }) : prev)}
                                                options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced']}
                                                disabled={!isEditing}
                                                placeholder="Select Status"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Sex <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2">
                                                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${formData.sex === 'Male' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.sex === 'Male' ? 'border-blue-500' : 'border-gray-300'}`}>
                                                        {formData.sex === 'Male' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <input 
                                                        type="radio" 
                                                        name="sex" 
                                                        value="Male"
                                                        checked={formData.sex === 'Male'} 
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="hidden" 
                                                    />
                                                    <span className="text-[13px] font-medium">Male</span>
                                                </label>
                                                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${formData.sex === 'Female' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.sex === 'Female' ? 'border-pink-500' : 'border-gray-300'}`}>
                                                        {formData.sex === 'Female' && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                                                    </div>
                                                    <input 
                                                        type="radio" 
                                                        name="sex" 
                                                        value="Female"
                                                        checked={formData.sex === 'Female'} 
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="hidden" 
                                                    />
                                                    <span className="text-[13px] font-medium">Female</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Residence */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-50">
                                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-gray-900">Contact & Residence</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Contact Number</label>
                                            <input 
                                                type="text" 
                                                name="contactNumber"
                                                value={formData.contactNumber}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Occupation</label>
                                            <CustomDropdown
                                                value={formData.occupation}
                                                onChange={(value) => setFormData((prev) => prev ? ({ ...prev, occupation: value }) : prev)}
                                                options={['Teacher', 'Engineer', 'Nurse', 'Doctor', 'Driver', 'Vendor', 'Unemployed', 'Others']}
                                                disabled={!isEditing}
                                                placeholder="Select Occupation"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Student Status</label>
                                            <CustomDropdown
                                                value={formData.studentStatus}
                                                onChange={(value) => setFormData((prev) => prev ? ({ ...prev, studentStatus: value }) : prev)}
                                                options={['Not Student', 'Day Care', 'Kinder', 'Elementary', 'Senior High', 'College', 'ALS']}
                                                disabled={!isEditing}
                                                placeholder="Select Status"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Household No.</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    name="householdNo"
                                                    value={formData.householdNo}
                                                    readOnly
                                                    disabled
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-500 focus:outline-none cursor-not-allowed pr-8" 
                                                />
                                                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Street Name</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    name="streetName"
                                                    value={formData.streetName}
                                                    readOnly
                                                    disabled
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-500 focus:outline-none cursor-not-allowed pr-8" 
                                                />
                                                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold text-gray-500">Alley</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    name="alley"
                                                    value={formData.alley}
                                                    readOnly
                                                    disabled
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-500 focus:outline-none cursor-not-allowed pr-8" 
                                                />
                                                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Classification */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-50">
                                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-gray-900">Classification</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Voter', name: 'voter', checked: formData.voter },
                                            { label: 'PWD', name: 'pwd', checked: formData.pwd },
                                            { label: 'Homeowner', name: 'homeowner', checked: formData.homeowner },
                                            { label: 'Solo Parent', name: 'soloParent', checked: formData.soloParent }
                                        ].map((item) => (
                                            <label key={item.label} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${item.checked ? 'bg-white border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'} ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${item.checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                    {item.checked && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"/></svg>}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    name={item.name}
                                                    checked={item.checked} 
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="hidden" 
                                                />
                                                <span className={`text-[13px] font-medium ${item.checked ? 'text-gray-900' : 'text-gray-600'}`}>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="space-y-8">
                                {/* Document Transactions */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="text-blue-600" size={20} />
                                            <h3 className="text-[16px] font-bold text-gray-900">Document Transactions</h3>
                                        </div>
                                    </div>
                                    {detail.orders.length === 0 ? (
                                        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-12 text-center">
                                            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-[13px] text-gray-400 font-medium">No document transactions found</p>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-white border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Transaction ID</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Date Issued</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Personnel</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Type</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500 text-right">Fee</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {detail.orders.map((order) => (
                                                            <tr key={order.displayId} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 text-[13px] text-gray-900 font-bold">{String(order.displayId).padStart(3, '0')}</td>
                                                                <td className="px-6 py-4 text-[13px] text-gray-600">{formatDateForDisplay(order.orderDate)}</td>
                                                                <td className="px-6 py-4 text-[13px] text-gray-600">{order.personnelName}</td>
                                                                <td className="px-6 py-4 text-[13px] text-gray-600">{order.documentType}</td>
                                                                <td className="px-6 py-4 text-[13px] text-gray-900 font-bold text-right">&#8369;{order.amount.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-6 py-4 border-t border-gray-100 bg-white">
                                                <span className="text-[12px] text-gray-500">Showing {detail.orders.length} transaction{detail.orders.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Audit Logs */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="text-blue-600" size={20} />
                                        <h3 className="text-[16px] font-bold text-gray-900">Audit Logs</h3>
                                    </div>
                                    {detail.auditTrails.length === 0 ? (
                                        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-12 text-center">
                                            <Activity size={32} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-[13px] text-gray-400 font-medium">No audit logs found</p>
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-white border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Timestamp</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Personnel</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Field Changed</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Old Value</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500">New Value</th>
                                                            <th className="px-6 py-4 text-[12px] font-bold text-blue-500 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {detail.auditTrails.map((log) => (
                                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 text-[13px] text-gray-600">{formatTimestamp(log.timestamp)}</td>
                                                                <td className="px-6 py-4 text-[13px] text-gray-600">{log.personnelName}</td>
                                                                <td className="px-6 py-4">
                                                                    {log.fieldName ? (
                                                                        <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-[11px] font-bold border border-orange-100">
                                                                            {log.fieldName}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-[13px]">—</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-[13px] text-red-500">{log.oldValue ?? '—'}</td>
                                                                <td className="px-6 py-4 text-[13px] text-green-600">{log.newValue ?? '—'}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                                                                        {log.actionType}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-6 py-4 border-t border-gray-100 bg-white">
                                                <span className="text-[12px] text-gray-500">Showing {detail.auditTrails.length} log{detail.auditTrails.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {activeTab !== 'logs' && (
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-white shrink-0">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={onClose}
                                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                                    >
                                        <Edit size={16} />
                                        Edit Information
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};

export default ResidentProfileModal;
