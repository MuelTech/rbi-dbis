import React from 'react';
import { Users, UserPlus, Trash2, ChevronUp, ChevronDown, User, Briefcase, GraduationCap, FileText, Check } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { WizardStepProps, FamilyMember, RELATIONSHIP_OPTIONS, SUFFIX_OPTIONS, CIVIL_STATUS_OPTIONS, OCCUPATION_OPTIONS, EDUCATION_LEVEL_OPTIONS } from './types';

const Step3FamilyMembers: React.FC<WizardStepProps> = ({ familyMembers, setFamilyMembers, errors }) => {

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

    return (
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
    );
};

export default Step3FamilyMembers;
