import React, { useState, useEffect, useRef } from 'react';
import { User, Users, Briefcase, GraduationCap, FileText, ChevronLeft, Check, ChevronDown } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AddMemberFormProps {
    onCancel: () => void;
    onSubmit: () => void;
}

const SUFFIX_OPTIONS = [
    { value: 'Jr.', label: 'Jr.' },
    { value: 'Sr.', label: 'Sr.' },
    { value: 'III', label: 'III' },
];

const CIVIL_STATUS_OPTIONS = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
];

const OCCUPATION_OPTIONS = [
    { value: 'Employed', label: 'Employed' },
    { value: 'Self-Employed', label: 'Self-Employed' },
    { value: 'Unemployed', label: 'Unemployed' },
    { value: 'Student', label: 'Student' },
];

const EDUCATION_LEVEL_OPTIONS = [
    { value: 'Elementary', label: 'Elementary' },
    { value: 'High School', label: 'High School' },
    { value: 'College', label: 'College' },
    { value: 'Vocational', label: 'Vocational' },
];

const RELATIONSHIP_OPTIONS = [
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Child', label: 'Child' },
    { value: 'Parent', label: 'Parent' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Grandparent', label: 'Grandparent' },
    { value: 'Grandchild', label: 'Grandchild' },
    { value: 'Other', label: 'Other' },
];

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    error?: string;
    className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Select", error, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${value ? 'text-gray-700' : 'text-gray-400'}`}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg transition-colors flex items-center justify-between ${
                                    value === option.value 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                            >
                                {option.label}
                                {value === option.value && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onCancel, onSubmit }) => {
    const initialFormData = {
        relationship: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        birthDate: '',
        birthPlace: '',
        civilStatus: '',
        sex: '',
        occupation: '',
        contactNumber: '',
        isStudent: 'No',
        educationLevel: '',
        isVoter: false,
        isPwd: false,
        isSoloParent: false
    };

    const [formData, setFormData] = useState(initialFormData);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleBack = () => {
        const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        if (isDirty) {
            setShowConfirmation(true);
        } else {
            onCancel();
        }
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.relationship) newErrors.relationship = 'Relationship is required';
        if (!formData.firstName) newErrors.firstName = 'First Name is required';
        if (!formData.lastName) newErrors.lastName = 'Last Name is required';
        if (!formData.birthDate) newErrors.birthDate = 'Date of Birth is required';
        if (!formData.civilStatus) newErrors.civilStatus = 'Civil Status is required';
        if (!formData.sex) newErrors.sex = 'Sex is required';
        if (!formData.occupation) newErrors.occupation = 'Occupation is required';
        if (!formData.contactNumber) newErrors.contactNumber = 'Contact Number is required';

        if (formData.isStudent === 'Yes') {
            if (!formData.educationLevel) newErrors.educationLevel = 'Education Level is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-gray-900">Add New Member</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
                <div className="w-full space-y-6">
                    
                    {/* Relationship */}
                    <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="text-purple-600" size={18} />
                            <h3 className="text-[14px] font-bold text-purple-900">Relationship</h3>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Relationship to Family Head <span className="text-red-500">*</span></label>
                            <CustomSelect
                                value={formData.relationship}
                                onChange={(value) => setFormData({...formData, relationship: value})}
                                options={RELATIONSHIP_OPTIONS}
                                placeholder="Select Relationship"
                                error={errors.relationship}
                            />
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="text-blue-600" size={18} />
                            <h3 className="text-[14px] font-bold text-blue-900">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">First Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-2.5 bg-white border ${errors.firstName ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    placeholder="Juan"
                                />
                                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Middle Name</label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.middleName}
                                    onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                                    placeholder="Santos"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-2.5 bg-white border ${errors.lastName ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    placeholder="Dela Cruz"
                                />
                                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Suffix</label>
                                <CustomSelect
                                    value={formData.suffix}
                                    onChange={(value) => setFormData({...formData, suffix: value})}
                                    options={SUFFIX_OPTIONS}
                                    placeholder="None"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                                <input 
                                    type="date"
                                    className={`w-full px-4 py-2.5 bg-white border ${errors.birthDate ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                                />
                                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Place of Birth</label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.birthPlace}
                                    onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                                    placeholder="City, Province"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Civil Status <span className="text-red-500">*</span></label>
                                <CustomSelect
                                    value={formData.civilStatus}
                                    onChange={(value) => setFormData({...formData, civilStatus: value})}
                                    options={CIVIL_STATUS_OPTIONS}
                                    placeholder="Select Status"
                                    error={errors.civilStatus}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Sex <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-4 mt-2">
                                    {['Male', 'Female'].map((sex) => (
                                        <label key={sex} className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="sex"
                                                value={sex}
                                                checked={formData.sex === sex}
                                                onChange={(e) => setFormData({...formData, sex: e.target.value})}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-[14px] text-gray-700">{sex}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Occupation & Contact */}
                    <div className="bg-green-50/30 border border-green-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="text-green-600" size={18} />
                            <h3 className="text-[14px] font-bold text-green-900">Occupation & Contact</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Occupation <span className="text-red-500">*</span></label>
                                <CustomSelect
                                    value={formData.occupation}
                                    onChange={(value) => setFormData({...formData, occupation: value})}
                                    options={OCCUPATION_OPTIONS}
                                    placeholder="Select Occupation"
                                    error={errors.occupation}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Contact Number <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    className={`w-full px-4 py-2.5 bg-white border ${errors.contactNumber ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all`}
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                    placeholder="09XX-XXX-XXXX"
                                />
                                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="text-purple-600" size={18} />
                                    <span className="text-[14px] font-bold text-gray-700">Is this person a student?</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {['Yes', 'No'].map((option) => (
                                        <label key={option} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                                            formData.isStudent === option 
                                                ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-200' 
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                formData.isStudent === option ? 'border-blue-500' : 'border-gray-300'
                                            }`}>
                                                {formData.isStudent === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <input 
                                                type="radio" 
                                                name="isStudent"
                                                value={option}
                                                checked={formData.isStudent === option}
                                                onChange={(e) => setFormData({...formData, isStudent: e.target.value})}
                                                className="hidden"
                                            />
                                            <span className={`text-[13px] font-medium ${
                                                formData.isStudent === option ? 'text-blue-700' : 'text-gray-600'
                                            }`}>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formData.isStudent === 'Yes' && (
                                <div className="space-y-2 pt-4 border-t border-green-100/50">
                                    <label className="text-[13px] font-bold text-gray-700">Education Level <span className="text-red-500">*</span></label>
                                    <CustomSelect
                                        value={formData.educationLevel}
                                        onChange={(value) => setFormData({...formData, educationLevel: value})}
                                        options={EDUCATION_LEVEL_OPTIONS}
                                        placeholder="Select Education Level"
                                        error={errors.educationLevel}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="text-orange-600" size={18} />
                            <h3 className="text-[14px] font-bold text-orange-900">Additional Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Registered Voter', key: 'isVoter' },
                                { label: 'PWD', key: 'isPwd' },
                                { label: 'Solo Parent', key: 'isSoloParent' }
                            ].map((item) => (
                                <label key={item.key} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                        // @ts-ignore
                                        formData[item.key] ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                                    }`}>
                                        {/* @ts-ignore */}
                                        {formData[item.key] && <Check size={14} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox"
                                        // @ts-ignore
                                        checked={formData[item.key]}
                                        // @ts-ignore
                                        onChange={(e) => setFormData({...formData, [item.key]: e.target.checked})}
                                        className="hidden"
                                    />
                                    <span className="text-[14px] font-medium text-gray-700 group-hover:text-orange-700 transition-colors">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
                <button 
                    onClick={handleBack}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-[13px] transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    Submit
                </button>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={onCancel}
                title="Discard Changes?"
                message="You have unsaved changes. Are you sure you want to discard them?"
            />
        </div>
    );
};

export default AddMemberForm;
