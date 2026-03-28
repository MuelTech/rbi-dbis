import React, { useState, useEffect } from 'react';
import { Camera, Lock, Save, ChevronDown, Edit, X, Search, FileText, Activity, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Resident } from '@/types';
import { useAuth } from '@/context/AuthContext';

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

interface ResidentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    resident: Resident | null;
    onShowSuccess?: (message: string) => void;
}

const ResidentProfileModal: React.FC<ResidentProfileModalProps> = ({ isOpen, onClose, resident, onShowSuccess }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    useEffect(() => {
        if (resident) {
            setFormData({
                firstName: resident.firstName,
                middleName: 'Santos',
                lastName: resident.lastName,
                suffix: 'Select Suffix',
                relationshipToHead: 'Head',
                dateOfBirth: '1990-05-15',
                placeOfBirth: 'Quezon City',
                civilStatus: 'Married',
                sex: resident.sex,
                contactNumber: '0917-123-4567',
                occupation: 'Teacher',
                studentStatus: 'Not Student',
                householdNo: '123-B',
                streetName: 'Maharlika Street',
                alley: 'Rosal Alley',
                voter: resident.voter === 'Yes',
                pwd: false,
                homeowner: true,
                soloParent: false,
                status: resident.status,
                id: resident.id,
                age: resident.age
            });
        }
        setIsEditing(false);
    }, [resident, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSave = () => {
        // Here you would typically save the data to the backend
        setIsEditing(false);
        if (onShowSuccess) {
            onShowSuccess("Update profile success.");
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form data to original resident data
        if (resident) {
             setFormData({
                firstName: resident.firstName,
                middleName: 'Santos',
                lastName: resident.lastName,
                suffix: 'Select Suffix',
                relationshipToHead: 'Head',
                dateOfBirth: '1990-05-15',
                placeOfBirth: 'Quezon City',
                civilStatus: 'Married',
                sex: resident.sex,
                contactNumber: '0917-123-4567',
                occupation: 'Teacher',
                studentStatus: 'Not Student',
                householdNo: '123-B',
                streetName: 'Maharlika Street',
                alley: 'Rosal Alley',
                voter: resident.voter === 'Yes',
                pwd: false,
                homeowner: true,
                soloParent: false,
                status: resident.status,
                id: resident.id,
                age: resident.age
            });
        }
    };

    if (!resident || !formData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resident Profile" maxWidth="max-w-5xl" disableScroll={true}>
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
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white shadow-sm hover:bg-blue-700 transition-colors">
                                    <Camera size={14} />
                                </button>
                            </div>
                            
                            <div className="flex-1 w-full">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h3>
                                        <div className="flex items-center gap-3 mt-2 text-[13px]">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 font-medium">ID: RES-{formData.id}</span>
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <span className="text-blue-500 font-medium">FAMILY HEAD:</span> Dela Cruz, Juan Sr.
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
                                                                setFormData((prev: any) => ({ ...prev, status }));
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
                                        onChange={(value) => setFormData((prev: any) => ({ ...prev, suffix: value }))}
                                        options={['Jr.', 'Sr.', 'II', 'III', 'IV']}
                                        disabled={!isEditing}
                                        placeholder="Select Suffix"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-500">Relationship to Family Head</label>
                                    <CustomDropdown
                                        value={formData.relationshipToHead}
                                        onChange={(value) => setFormData((prev: any) => ({ ...prev, relationshipToHead: value }))}
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
                                        onChange={(value) => setFormData((prev: any) => ({ ...prev, civilStatus: value }))}
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
                                        onChange={(value) => setFormData((prev: any) => ({ ...prev, occupation: value }))}
                                        options={['Teacher', 'Engineer', 'Nurse', 'Doctor', 'Driver', 'Vendor', 'Unemployed', 'Others']}
                                        disabled={!isEditing}
                                        placeholder="Select Occupation"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-500">Student Status</label>
                                    <CustomDropdown
                                        value={formData.studentStatus}
                                        onChange={(value) => setFormData((prev: any) => ({ ...prev, studentStatus: value }))}
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
                                <div className="relative w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search transactions..." 
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
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
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { id: '001', date: '16/06/2025', personnel: 'Nayeon', type: 'Barangay Clearance', fee: '₱200' },
                                                { id: '002', date: '16/06/2025', personnel: 'Nayeon', type: 'Certificate of Indigency', fee: '₱200' },
                                                { id: '003', date: '16/06/2025', personnel: 'Nayeon', type: 'Certificate of Residency', fee: '₱200' },
                                                { id: '004', date: '16/06/2025', personnel: 'Nayeon', type: 'Certificate of First Time Job Seeker', fee: '₱200' },
                                                { id: '005', date: '16/06/2025', personnel: 'Nayeon', type: 'Business Permit', fee: '₱200' },
                                                { id: '006', date: '16/06/2025', personnel: 'Nayeon', type: 'Certificate of No Property', fee: '₱200' },
                                                { id: '007', date: '16/06/2025', personnel: 'Nayeon', type: 'Certificate of Live Birth', fee: '₱200' },
                                            ].map((item, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4 text-[13px] text-gray-900 font-bold">{item.id}</td>
                                                    <td className="px-6 py-4 text-[13px] text-gray-600">{item.date}</td>
                                                    <td className="px-6 py-4 text-[13px] text-gray-600">{item.personnel}</td>
                                                    <td className="px-6 py-4 text-[13px] text-gray-600">{item.type}</td>
                                                    <td className="px-6 py-4 text-[13px] text-gray-900 font-bold text-right">{item.fee}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button className="px-3 py-1 rounded-full border border-blue-200 text-blue-600 text-[11px] font-bold hover:bg-blue-50 transition-colors">
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                                    <span className="text-[12px] text-gray-500">Showing 1-7 of 15</span>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-[12px] font-medium flex items-center gap-1 pr-2">
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <button className="w-7 h-7 rounded-lg bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shadow-sm shadow-blue-200">1</button>
                                        <button className="w-7 h-7 rounded-lg text-gray-600 hover:bg-gray-50 text-[12px] font-medium flex items-center justify-center">2</button>
                                        <button className="w-7 h-7 rounded-lg text-gray-600 hover:bg-gray-50 text-[12px] font-medium flex items-center justify-center">3</button>
                                        <button className="p-1 text-gray-600 hover:text-gray-900 text-[12px] font-medium flex items-center gap-1 pl-2">
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Logs */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Activity className="text-blue-600" size={20} />
                                <h3 className="text-[16px] font-bold text-gray-900">Audit Logs</h3>
                            </div>
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Audit ID</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Timestamp</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Personnel</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Field Changed</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500">Old Value</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500">New Value</th>
                                                <th className="px-6 py-4 text-[12px] font-bold text-blue-500 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { id: 'AUD-101', time: '16/06/2025 09:30 AM', personnel: 'Admin User', field: 'Civil Status', old: 'Single', new: 'Married' },
                                                { id: 'AUD-102', time: '15/06/2025 02:15 PM', personnel: 'Staff 1', field: 'Address', old: '123 Old St., ...', new: '123-B Maharli...' },
                                                { id: 'AUD-103', time: '14/06/2025 11:00 AM', personnel: 'Admin User', field: 'Contact Number', old: '0912-345-6789', new: '0917-123-4567' },
                                                { id: 'AUD-104', time: '13/06/2025 10:00 AM', personnel: 'Admin User', field: 'Occupation', old: 'Unemployed', new: 'Teacher' },
                                                { id: 'AUD-105', time: '12/06/2025 09:00 AM', personnel: 'Staff 2', field: 'Voter Status', old: 'No', new: 'Yes' },
                                                { id: 'AUD-106', time: '11/06/2025 04:30 PM', personnel: 'Admin User', field: 'Last Name', old: 'Cruz', new: 'Dela Cruz' },
                                                { id: 'AUD-107', time: '10/06/2025 01:20 PM', personnel: 'Staff 1', field: 'Family Head', old: 'None', new: 'Dela Cruz, Ju...' },
                                            ].map((item, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-[13px] text-gray-900 font-bold">{item.id}</td>
                                                    <td className="px-6 py-4 text-[13px] text-gray-600">{item.time}</td>
                                                    <td className="px-6 py-4 text-[13px] text-gray-600">{item.personnel}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-[11px] font-bold border border-orange-100">
                                                            {item.field}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[13px] text-red-500 bg-red-50/50 rounded-lg px-2">{item.old}</td>
                                                    <td className="px-6 py-4 text-[13px] text-green-600 bg-green-50/50 rounded-lg px-2">{item.new}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                                                            UPDATE
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                                    <span className="text-[12px] text-gray-500">Showing 1-7 of 12</span>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-[12px] font-medium flex items-center gap-1 pr-2">
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <button className="w-7 h-7 rounded-lg bg-blue-600 text-white text-[12px] font-bold flex items-center justify-center shadow-sm shadow-blue-200">1</button>
                                        <button className="w-7 h-7 rounded-lg text-gray-600 hover:bg-gray-50 text-[12px] font-medium flex items-center justify-center">2</button>
                                        <button className="p-1 text-gray-600 hover:text-gray-900 text-[12px] font-medium flex items-center gap-1 pl-2">
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                            >
                                <Save size={16} />
                                Save Changes
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
        </Modal>
    );
};

export default ResidentProfileModal;
