import React, { useState, useEffect, useRef } from 'react';
import { Home, User, Users, Hash, MapPin, PawPrint, Car, ChevronLeft, ChevronRight, Check, Briefcase, GraduationCap, FileText, UserPlus, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AddResidentFormProps {
    onCancel: () => void;
    setIsNavigationBlocked?: (blocked: boolean) => void;
    onShowSuccess?: (message: string) => void;
}

interface FamilyMember {
    id: number;
    isExpanded: boolean;
    relationship: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    birthDate: string;
    birthPlace: string;
    civilStatus: string;
    sex: string;
    occupation: string;
    contactNumber: string;
    isStudent: string;
    educationLevel: string;
    isVoter: boolean;
    isPwd: boolean;
    isSoloParent: boolean;
}

const BLOCK_OPTIONS = [
    { value: '1', label: 'Block 1' },
    { value: '2', label: 'Block 2' },
];

const HOUSEHOLD_OPTIONS = [
    { value: '1', label: '101' },
    { value: '2', label: '102' },
];

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


const AddResidentForm: React.FC<AddResidentFormProps> = ({ onCancel, setIsNavigationBlocked, onShowSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Family Details
        block: '',
        householdNumber: '',
        houseNumber: '',
        streetName: '',
        alley: '',
        hasPets: 'No',
        numberOfDogs: '',
        numberOfCats: '',
        otherAnimals: '',
        hasVehicles: 'No',
        numberOfMotorcycles: '',
        motorcyclePlateNumbers: '',
        numberOfOtherVehicles: '',
        otherVehiclePlateNumbers: '',

        // Step 2: Family Head
        headFirstName: '',
        headMiddleName: '',
        headLastName: '',
        headSuffix: '',
        headBirthDate: '',
        headBirthPlace: '',
        headCivilStatus: '',
        headSex: '',
        headOccupation: '',
        headContactNumber: '',
        headIsStudent: 'No',
        headEducationLevel: '',
        headIsVoter: false,
        headIsPwd: false,
        headIsSoloParent: false,
    });

    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showBackConfirmation, setShowBackConfirmation] = useState(false);

    // Track form dirty state
    useEffect(() => {
        if (setIsNavigationBlocked) {
            // Check if any field has a value (simple dirty check)
            const isFormDataDirty = Object.values(formData).some(value => {
                if (typeof value === 'string') return value !== '' && value !== 'No';
                if (typeof value === 'boolean') return value === true;
                return false;
            });
            
            const isFamilyMembersDirty = familyMembers.length > 0;

            setIsNavigationBlocked(isFormDataDirty || isFamilyMembersDirty);
        }
    }, [formData, familyMembers, setIsNavigationBlocked]);

    const isFormDirty = () => {
        const isFormDataDirty = Object.values(formData).some(value => {
            if (typeof value === 'string') return value !== '' && value !== 'No';
            if (typeof value === 'boolean') return value === true;
            return false;
        });
        
        const isFamilyMembersDirty = familyMembers.length > 0;
        return isFormDataDirty || isFamilyMembersDirty;
    };

    const handleBack = () => {
        if (currentStep === 1) {
            if (isFormDirty()) {
                setShowBackConfirmation(true);
            } else {
                onCancel();
            }
        } else {
            setCurrentStep(prev => prev - 1);
        }
    };

    const addFamilyMember = () => {
        const newMember: FamilyMember = {
            id: Date.now(),
            isExpanded: true,
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

        // Collapse existing members
        const updatedMembers = familyMembers.map(member => ({ ...member, isExpanded: false }));
        setFamilyMembers([...updatedMembers, newMember]);
    };

    const removeFamilyMember = (id: number) => {
        setFamilyMembers(familyMembers.filter(m => m.id !== id));
    };

    const updateFamilyMember = (id: number, field: keyof FamilyMember, value: any) => {
        setFamilyMembers(familyMembers.map(member => 
            member.id === id ? { ...member, [field]: value } : member
        ));
    };

    const toggleFamilyMember = (id: number) => {
        setFamilyMembers(familyMembers.map(member => 
            member.id === id ? { ...member, isExpanded: !member.isExpanded } : member
        ));
    };

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};
        
        if (step === 1) {
            if (!formData.block) newErrors.block = 'Block is required';
            if (!formData.householdNumber) newErrors.householdNumber = 'Household Number is required';
            if (!formData.houseNumber) newErrors.houseNumber = 'House Number is required';
            if (!formData.streetName) newErrors.streetName = 'Street Name is required';
            if (!formData.alley) newErrors.alley = 'Alley is required';

            if (formData.hasPets === 'Yes') {
                if (!formData.numberOfDogs) newErrors.numberOfDogs = 'Number of Dogs is required';
                if (!formData.numberOfCats) newErrors.numberOfCats = 'Number of Cats is required';
                if (!formData.otherAnimals) newErrors.otherAnimals = 'Other Animals is required';
            }

            if (formData.hasVehicles === 'Yes') {
                if (!formData.numberOfMotorcycles) newErrors.numberOfMotorcycles = 'Number of Motorcycles is required';
                if (!formData.motorcyclePlateNumbers) newErrors.motorcyclePlateNumbers = 'Motorcycle Plate Numbers is required';
                if (!formData.numberOfOtherVehicles) newErrors.numberOfOtherVehicles = 'Number of Other Vehicles is required';
                if (!formData.otherVehiclePlateNumbers) newErrors.otherVehiclePlateNumbers = 'Vehicle Plate Numbers is required';
            }
        } else if (step === 2) {
            if (!formData.headFirstName) newErrors.headFirstName = 'First Name is required';
            if (!formData.headLastName) newErrors.headLastName = 'Last Name is required';
            if (!formData.headBirthDate) newErrors.headBirthDate = 'Date of Birth is required';
            if (!formData.headCivilStatus) newErrors.headCivilStatus = 'Civil Status is required';
            if (!formData.headSex) newErrors.headSex = 'Sex is required';
            if (!formData.headOccupation) newErrors.headOccupation = 'Occupation is required';
            if (!formData.headContactNumber) newErrors.headContactNumber = 'Contact Number is required';
            
            if (formData.headIsStudent === 'Yes') {
                if (!formData.headEducationLevel) newErrors.headEducationLevel = 'Education Level is required';
            }
        } else if (step === 3) {
            familyMembers.forEach((member) => {
                if (!member.relationship) newErrors[`member_${member.id}_relationship`] = 'Relationship is required';
                if (!member.firstName) newErrors[`member_${member.id}_firstName`] = 'First Name is required';
                if (!member.lastName) newErrors[`member_${member.id}_lastName`] = 'Last Name is required';
                if (!member.birthDate) newErrors[`member_${member.id}_birthDate`] = 'Date of Birth is required';
                if (!member.civilStatus) newErrors[`member_${member.id}_civilStatus`] = 'Civil Status is required';
                if (!member.sex) newErrors[`member_${member.id}_sex`] = 'Sex is required';
                if (!member.occupation) newErrors[`member_${member.id}_occupation`] = 'Occupation is required';
                if (!member.contactNumber) newErrors[`member_${member.id}_contactNumber`] = 'Contact Number is required';

                if (member.isStudent === 'Yes') {
                    if (!member.educationLevel) newErrors[`member_${member.id}_educationLevel`] = 'Education Level is required';
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const steps = [
        { number: 1, title: 'Family Details', icon: Home },
        { number: 2, title: 'Family Head', icon: User },
        { number: 3, title: 'Family Members', icon: Users },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Stepper */}
            <div className="py-8 px-6 border-b border-gray-50 bg-white">
                <div className="flex items-center justify-center w-full max-w-3xl mx-auto">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                    currentStep === step.number 
                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                        : currentStep > step.number
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-white border-gray-200 text-gray-400'
                                }`}>
                                    {currentStep > step.number ? <Check size={18} /> : <step.icon size={18} />}
                                </div>
                                <span className={`mt-2 text-[12px] font-bold ${
                                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                    {step.title}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-[2px] bg-gray-100 mx-4 -mt-6 relative -z-0" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Step 1: Family Details */}
                    {currentStep === 1 && (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Family Details</h2>
                                <p className="text-gray-500 text-[14px] mt-1">Enter household address and asset information.</p>
                            </div>

                            {/* Barangay Household Identifier */}
                            <div className="bg-purple-50/30 border border-purple-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Hash className="text-purple-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-purple-900">Barangay Household Identifier</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Block <span className="text-red-500">*</span></label>
                                        <CustomSelect
                                            value={formData.block}
                                            onChange={(value) => setFormData({...formData, block: value})}
                                            options={BLOCK_OPTIONS}
                                            placeholder="Select Block"
                                            error={errors.block}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Household Number <span className="text-red-500">*</span></label>
                                        <CustomSelect
                                            value={formData.householdNumber}
                                            onChange={(value) => setFormData({...formData, householdNumber: value})}
                                            options={HOUSEHOLD_OPTIONS}
                                            placeholder="Select Household Number"
                                            error={errors.householdNumber}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Residential Address */}
                            <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <MapPin className="text-blue-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-blue-900">Residential Address</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">House Number <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.houseNumber ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                            value={formData.houseNumber}
                                            onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
                                            placeholder="#123"
                                        />
                                        {errors.houseNumber && <p className="text-red-500 text-xs mt-1">{errors.houseNumber}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Street Name <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.streetName ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                            value={formData.streetName}
                                            onChange={(e) => setFormData({...formData, streetName: e.target.value})}
                                            placeholder="Rizal St."
                                        />
                                        {errors.streetName && <p className="text-red-500 text-xs mt-1">{errors.streetName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Alley <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.alley ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                            value={formData.alley}
                                            onChange={(e) => setFormData({...formData, alley: e.target.value})}
                                            placeholder="Sampaguita"
                                        />
                                        {errors.alley && <p className="text-red-500 text-xs mt-1">{errors.alley}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Pets & Animals */}
                            <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <PawPrint className="text-orange-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-orange-900">Pets & Animals</h3>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <p className="text-[14px] text-gray-600">Do you have any pets or animals?</p>
                                    <div className="flex items-center gap-3">
                                        {['Yes', 'No'].map((option) => (
                                            <label key={option} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                                                formData.hasPets === option 
                                                    ? 'bg-white border-orange-200 shadow-sm ring-1 ring-orange-200' 
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                    formData.hasPets === option ? 'border-orange-500' : 'border-gray-300'
                                                }`}>
                                                    {formData.hasPets === option && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                                </div>
                                                <input 
                                                    type="radio" 
                                                    name="hasPets"
                                                    value={option}
                                                    checked={formData.hasPets === option}
                                                    onChange={(e) => setFormData({...formData, hasPets: e.target.value})}
                                                    className="hidden"
                                                />
                                                <span className={`text-[13px] font-medium ${
                                                    formData.hasPets === option ? 'text-orange-700' : 'text-gray-600'
                                                }`}>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.hasPets === 'Yes' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-orange-100/50">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Number of Dogs <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.numberOfDogs ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
                                                value={formData.numberOfDogs}
                                                onChange={(e) => setFormData({...formData, numberOfDogs: e.target.value})}
                                                placeholder="0"
                                            />
                                            {errors.numberOfDogs && <p className="text-red-500 text-xs mt-1">{errors.numberOfDogs}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Number of Cats <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.numberOfCats ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
                                                value={formData.numberOfCats}
                                                onChange={(e) => setFormData({...formData, numberOfCats: e.target.value})}
                                                placeholder="0"
                                            />
                                            {errors.numberOfCats && <p className="text-red-500 text-xs mt-1">{errors.numberOfCats}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Other Animals <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.otherAnimals ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
                                                value={formData.otherAnimals}
                                                onChange={(e) => setFormData({...formData, otherAnimals: e.target.value})}
                                                placeholder="e.g., 2 chickens, 1 goat"
                                            />
                                            {errors.otherAnimals && <p className="text-red-500 text-xs mt-1">{errors.otherAnimals}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Motorized Vehicles */}
                            <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Car className="text-blue-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-blue-900">Motorized Vehicles</h3>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <p className="text-[14px] text-gray-600">Does your family own any motorized vehicles?</p>
                                    <div className="flex items-center gap-3">
                                        {['Yes', 'No'].map((option) => (
                                            <label key={option} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                                                formData.hasVehicles === option 
                                                    ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-200' 
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                    formData.hasVehicles === option ? 'border-blue-500' : 'border-gray-300'
                                                }`}>
                                                    {formData.hasVehicles === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                </div>
                                                <input 
                                                    type="radio" 
                                                    name="hasVehicles"
                                                    value={option}
                                                    checked={formData.hasVehicles === option}
                                                    onChange={(e) => setFormData({...formData, hasVehicles: e.target.value})}
                                                    className="hidden"
                                                />
                                                <span className={`text-[13px] font-medium ${
                                                    formData.hasVehicles === option ? 'text-blue-700' : 'text-gray-600'
                                                }`}>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.hasVehicles === 'Yes' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-blue-100/50">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Number of Motorcycles <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.numberOfMotorcycles ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                value={formData.numberOfMotorcycles}
                                                onChange={(e) => setFormData({...formData, numberOfMotorcycles: e.target.value})}
                                                placeholder="0"
                                            />
                                            {errors.numberOfMotorcycles && <p className="text-red-500 text-xs mt-1">{errors.numberOfMotorcycles}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Motorcycle Plate Numbers <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.motorcyclePlateNumbers ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                value={formData.motorcyclePlateNumbers}
                                                onChange={(e) => setFormData({...formData, motorcyclePlateNumbers: e.target.value})}
                                                placeholder="e.g., ABC-1234, XYZ-5678"
                                            />
                                            {errors.motorcyclePlateNumbers && <p className="text-red-500 text-xs mt-1">{errors.motorcyclePlateNumbers}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Number of Other Vehicles <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.numberOfOtherVehicles ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                value={formData.numberOfOtherVehicles}
                                                onChange={(e) => setFormData({...formData, numberOfOtherVehicles: e.target.value})}
                                                placeholder="0"
                                            />
                                            {errors.numberOfOtherVehicles && <p className="text-red-500 text-xs mt-1">{errors.numberOfOtherVehicles}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-gray-700">Vehicle Plate Numbers <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text"
                                                className={`w-full px-4 py-2.5 bg-white border ${errors.otherVehiclePlateNumbers ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                value={formData.otherVehiclePlateNumbers}
                                                onChange={(e) => setFormData({...formData, otherVehiclePlateNumbers: e.target.value})}
                                                placeholder="e.g., DEF-9012, GHI-3456"
                                            />
                                            {errors.otherVehiclePlateNumbers && <p className="text-red-500 text-xs mt-1">{errors.otherVehiclePlateNumbers}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Step 2: Family Head */}
                    {currentStep === 2 && (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Family Head</h2>
                                <p className="text-gray-500 text-[14px] mt-1">Enter the personal information of the family head.</p>
                            </div>

                            {/* Personal Information */}
                            <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <User className="text-blue-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-blue-900">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">First Name <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.headFirstName ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                            value={formData.headFirstName}
                                            onChange={(e) => setFormData({...formData, headFirstName: e.target.value})}
                                            placeholder="Juan"
                                        />
                                        {errors.headFirstName && <p className="text-red-500 text-xs mt-1">{errors.headFirstName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Middle Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.headMiddleName}
                                            onChange={(e) => setFormData({...formData, headMiddleName: e.target.value})}
                                            placeholder="Santos"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.headLastName ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                            value={formData.headLastName}
                                            onChange={(e) => setFormData({...formData, headLastName: e.target.value})}
                                            placeholder="Dela Cruz"
                                        />
                                        {errors.headLastName && <p className="text-red-500 text-xs mt-1">{errors.headLastName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Suffix</label>
                                        <CustomSelect
                                            value={formData.headSuffix}
                                            onChange={(value) => setFormData({...formData, headSuffix: value})}
                                            options={SUFFIX_OPTIONS}
                                            placeholder="None"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                                        <input 
                                            type="date"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.headBirthDate ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                            value={formData.headBirthDate}
                                            onChange={(e) => setFormData({...formData, headBirthDate: e.target.value})}
                                        />
                                        {errors.headBirthDate && <p className="text-red-500 text-xs mt-1">{errors.headBirthDate}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Place of Birth</label>
                                        <input 
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.headBirthPlace}
                                            onChange={(e) => setFormData({...formData, headBirthPlace: e.target.value})}
                                            placeholder="City, Province"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Civil Status <span className="text-red-500">*</span></label>
                                        <CustomSelect
                                            value={formData.headCivilStatus}
                                            onChange={(value) => setFormData({...formData, headCivilStatus: value})}
                                            options={CIVIL_STATUS_OPTIONS}
                                            placeholder="Select Status"
                                            error={errors.headCivilStatus}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Sex <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-4 mt-2">
                                            {['Male', 'Female'].map((sex) => (
                                                <label key={sex} className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        name="headSex"
                                                        value={sex}
                                                        checked={formData.headSex === sex}
                                                        onChange={(e) => setFormData({...formData, headSex: e.target.value})}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-[14px] text-gray-700">{sex}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.headSex && <p className="text-red-500 text-xs mt-1">{errors.headSex}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Occupation & Contact */}
                            <div className="bg-green-50/30 border border-green-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Briefcase className="text-green-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-green-900">Occupation & Contact</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Occupation <span className="text-red-500">*</span></label>
                                        <CustomSelect
                                            value={formData.headOccupation}
                                            onChange={(value) => setFormData({...formData, headOccupation: value})}
                                            options={OCCUPATION_OPTIONS}
                                            placeholder="Select Occupation"
                                            error={errors.headOccupation}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Contact Number <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text"
                                            className={`w-full px-4 py-2.5 bg-white border ${errors.headContactNumber ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all`}
                                            value={formData.headContactNumber}
                                            onChange={(e) => setFormData({...formData, headContactNumber: e.target.value})}
                                            placeholder="09XX-XXX-XXXX"
                                        />
                                        {errors.headContactNumber && <p className="text-red-500 text-xs mt-1">{errors.headContactNumber}</p>}
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
                                                    formData.headIsStudent === option 
                                                        ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-200' 
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        formData.headIsStudent === option ? 'border-blue-500' : 'border-gray-300'
                                                    }`}>
                                                        {formData.headIsStudent === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <input 
                                                        type="radio" 
                                                        name="headIsStudent"
                                                        value={option}
                                                        checked={formData.headIsStudent === option}
                                                        onChange={(e) => setFormData({...formData, headIsStudent: e.target.value})}
                                                        className="hidden"
                                                    />
                                                    <span className={`text-[13px] font-medium ${
                                                        formData.headIsStudent === option ? 'text-blue-700' : 'text-gray-600'
                                                    }`}>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.headIsStudent === 'Yes' && (
                                        <div className="space-y-2 pt-4 border-t border-green-100/50">
                                            <label className="text-[13px] font-bold text-gray-700">Education Level <span className="text-red-500">*</span></label>
                                            <CustomSelect
                                                value={formData.headEducationLevel}
                                                onChange={(value) => setFormData({...formData, headEducationLevel: value})}
                                                options={EDUCATION_LEVEL_OPTIONS}
                                                placeholder="Select Education Level"
                                                error={errors.headEducationLevel}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="bg-orange-50/30 border border-orange-100 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <FileText className="text-orange-600" size={20} />
                                    <h3 className="text-[15px] font-bold text-orange-900">Additional Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Registered Voter', key: 'headIsVoter' },
                                        { label: 'PWD', key: 'headIsPwd' },
                                        { label: 'Homeowner', key: 'headIsHomeowner' },
                                        { label: 'Solo Parent', key: 'headIsSoloParent' }
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
                        </>
                    )}

                    {/* Step 3: Family Members */}
                    {currentStep === 3 && (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Family Members</h2>
                                <p className="text-gray-500 text-[14px] mt-1">Add other members of your household.</p>
                            </div>

                            {familyMembers.length === 0 ? (
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Users className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-[16px] font-bold text-gray-900 mb-2">No family members added yet</h3>
                                    <p className="text-[14px] text-gray-500 max-w-xs mb-6">
                                        Click the button below to add family members to your household.
                                    </p>
                                    <button 
                                        onClick={addFamilyMember}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[14px] font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                                    >
                                        <UserPlus size={18} />
                                        Add Family Member
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {familyMembers.map((member, index) => (
                                        <div key={member.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md">
                                            {/* Header */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[13px]">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[14px] font-bold text-gray-900">
                                                            {member.firstName && member.lastName 
                                                                ? `${member.firstName} ${member.lastName}`
                                                                : `Family Member ${index + 1}`
                                                            }
                                                        </h3>
                                                        <p className="text-[12px] text-gray-500">
                                                            {member.relationship || 'Relationship not specified'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => removeFamilyMember(member.id)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleFamilyMember(member.id)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        {member.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            {member.isExpanded && (
                                                <div className="p-6 space-y-6">
                                                    {/* Relationship */}
                                                    <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Users className="text-purple-600" size={18} />
                                                            <h3 className="text-[14px] font-bold text-purple-900">Relationship</h3>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[13px] font-bold text-gray-700">Relationship to Family Head <span className="text-red-500">*</span></label>
                                                            <CustomSelect
                                                                value={member.relationship}
                                                                onChange={(value) => updateFamilyMember(member.id, 'relationship', value)}
                                                                options={RELATIONSHIP_OPTIONS}
                                                                placeholder="Select Relationship"
                                                                error={errors[`member_${member.id}_relationship`]}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Personal Information */}
                                                    <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <User className="text-blue-600" size={18} />
                                                            <h3 className="text-[14px] font-bold text-blue-900">Personal Information</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">First Name <span className="text-red-500">*</span></label>
                                                                <input 
                                                                    type="text"
                                                                    className={`w-full px-4 py-2.5 bg-white border ${errors[`member_${member.id}_firstName`] ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                                    value={member.firstName}
                                                                    onChange={(e) => updateFamilyMember(member.id, 'firstName', e.target.value)}
                                                                    placeholder="Juan"
                                                                />
                                                                {errors[`member_${member.id}_firstName`] && <p className="text-red-500 text-xs mt-1">{errors[`member_${member.id}_firstName`]}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Middle Name</label>
                                                                <input 
                                                                    type="text"
                                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                    value={member.middleName}
                                                                    onChange={(e) => updateFamilyMember(member.id, 'middleName', e.target.value)}
                                                                    placeholder="Santos"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                                                                <input 
                                                                    type="text"
                                                                    className={`w-full px-4 py-2.5 bg-white border ${errors[`member_${member.id}_lastName`] ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                                    value={member.lastName}
                                                                    onChange={(e) => updateFamilyMember(member.id, 'lastName', e.target.value)}
                                                                    placeholder="Dela Cruz"
                                                                />
                                                                {errors[`member_${member.id}_lastName`] && <p className="text-red-500 text-xs mt-1">{errors[`member_${member.id}_lastName`]}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Suffix</label>
                                                                <CustomSelect
                                                                    value={member.suffix}
                                                                    onChange={(value) => updateFamilyMember(member.id, 'suffix', value)}
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
                                                                    className={`w-full px-4 py-2.5 bg-white border ${errors[`member_${member.id}_birthDate`] ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                                                                    value={member.birthDate}
                                                                    onChange={(e) => updateFamilyMember(member.id, 'birthDate', e.target.value)}
                                                                />
                                                                {errors[`member_${member.id}_birthDate`] && <p className="text-red-500 text-xs mt-1">{errors[`member_${member.id}_birthDate`]}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Place of Birth</label>
                                                                <input 
                                                                    type="text"
                                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                                    value={member.birthPlace}
                                                                    onChange={(e) => updateFamilyMember(member.id, 'birthPlace', e.target.value)}
                                                                    placeholder="City, Province"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Civil Status <span className="text-red-500">*</span></label>
                                                                <CustomSelect
                                                                    value={member.civilStatus}
                                                                    onChange={(value) => updateFamilyMember(member.id, 'civilStatus', value)}
                                                                    options={CIVIL_STATUS_OPTIONS}
                                                                    placeholder="Select Status"
                                                                    error={errors[`member_${member.id}_civilStatus`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Sex <span className="text-red-500">*</span></label>
                                                                <div className="flex items-center gap-4 mt-2">
                                                                    {['Male', 'Female'].map((sex) => (
                                                                        <label key={sex} className="flex items-center gap-2 cursor-pointer">
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`sex-${member.id}`}
                                                                                value={sex}
                                                                                checked={member.sex === sex}
                                                                                onChange={(e) => updateFamilyMember(member.id, 'sex', e.target.value)}
                                                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                                            />
                                                                            <span className="text-[14px] text-gray-700">{sex}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                {errors[`member_${member.id}_sex`] && <p className="text-red-500 text-xs mt-1">{errors[`member_${member.id}_sex`]}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Occupation & Contact */}
                                                    <div className="bg-green-50/30 border border-green-100 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Briefcase className="text-green-600" size={18} />
                                                            <h3 className="text-[14px] font-bold text-green-900">Occupation & Contact</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Occupation <span className="text-red-500">*</span></label>
                                                                <CustomSelect
                                                                    value={member.occupation}
                                                                    onChange={(value) => updateFamilyMember(member.id, 'occupation', value)}
                                                                    options={OCCUPATION_OPTIONS}
                                                                    placeholder="Select Occupation"
                                                                    error={errors[`member_${member.id}_occupation`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[13px] font-bold text-gray-700">Contact Number <span className="text-red-500">*</span></label>
                                                                <input 
                                                                    type="text"
                                                                    className={`w-full px-4 py-2.5 bg-white border ${errors[`member_${member.id}_contactNumber`] ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all`}
                                                                    value={member.contactNumber}
                                                                    onChange={(e) => updateFamilyMember(member.id, 'contactNumber', e.target.value)}
                                                                    placeholder="09XX-XXX-XXXX"
                                                                />
                                                                {errors[`member_${member.id}_contactNumber`] && <p className="text-red-500 text-xs mt-1">{errors[`member_${member.id}_contactNumber`]}</p>}
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
                                                                            member.isStudent === option 
                                                                                ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-200' 
                                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                                        }`}>
                                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                                                member.isStudent === option ? 'border-blue-500' : 'border-gray-300'
                                                                            }`}>
                                                                                {member.isStudent === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                                            </div>
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`isStudent-${member.id}`}
                                                                                value={option}
                                                                                checked={member.isStudent === option}
                                                                                onChange={(e) => updateFamilyMember(member.id, 'isStudent', e.target.value)}
                                                                                className="hidden"
                                                                            />
                                                                            <span className={`text-[13px] font-medium ${
                                                                                member.isStudent === option ? 'text-blue-700' : 'text-gray-600'
                                                                            }`}>{option}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {member.isStudent === 'Yes' && (
                                                                <div className="space-y-2 pt-4 border-t border-green-100/50">
                                                                    <label className="text-[13px] font-bold text-gray-700">Education Level <span className="text-red-500">*</span></label>
                                                                    <CustomSelect
                                                                        value={member.educationLevel}
                                                                        onChange={(value) => updateFamilyMember(member.id, 'educationLevel', value)}
                                                                        options={EDUCATION_LEVEL_OPTIONS}
                                                                        placeholder="Select Education Level"
                                                                        error={errors[`member_${member.id}_educationLevel`]}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Additional Information */}
                                                    <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4">
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
                                                                        member[item.key] ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                                                                    }`}>
                                                                        {/* @ts-ignore */}
                                                                        {member[item.key] && <Check size={14} className="text-white" />}
                                                                    </div>
                                                                    <input 
                                                                        type="checkbox"
                                                                        // @ts-ignore
                                                                        checked={member[item.key]}
                                                                        // @ts-ignore
                                                                        onChange={(e) => updateFamilyMember(member.id, item.key, e.target.checked)}
                                                                        className="hidden"
                                                                    />
                                                                    <span className="text-[14px] font-medium text-gray-700 group-hover:text-orange-700 transition-colors">{item.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button 
                                        onClick={addFamilyMember}
                                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-[14px]">Add Another Family Member</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 px-5 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-[13px] transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                
                {currentStep < 3 ? (
                    <button 
                        onClick={() => {
                            if (validateStep(currentStep)) {
                                setCurrentStep(prev => Math.min(prev + 1, 3));
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        Next Step
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            if (validateStep(currentStep)) {
                                if (setIsNavigationBlocked) setIsNavigationBlocked(false);
                                onCancel();
                                if (onShowSuccess) onShowSuccess("Create Resident Success");
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        Submit
                        <Send size={16} />
                    </button>
                )}
            </div>

            <ConfirmationModal
                isOpen={showBackConfirmation}
                onClose={() => setShowBackConfirmation(false)}
                onConfirm={() => {
                    setShowBackConfirmation(false);
                    onCancel();
                }}
                title="Unsaved Changes"
                message="You have unsaved changes. Are you sure you want to go back? Your progress will be lost."
            />
        </div>
    );
};

export default AddResidentForm;
