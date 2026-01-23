import React from 'react';
import { User, Briefcase, GraduationCap, FileText, Check } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { WizardStepProps, SUFFIX_OPTIONS, CIVIL_STATUS_OPTIONS, OCCUPATION_OPTIONS, EDUCATION_LEVEL_OPTIONS } from './types';

const Step2FamilyHead: React.FC<WizardStepProps> = ({ formData, setFormData, errors }) => {
    return (
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
                            onChange={(e) => setFormData(prev => ({...prev, headFirstName: e.target.value}))}
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
                            onChange={(e) => setFormData(prev => ({...prev, headMiddleName: e.target.value}))}
                            placeholder="Santos"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className={`w-full px-4 py-2.5 bg-white border ${errors.headLastName ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                            value={formData.headLastName}
                            onChange={(e) => setFormData(prev => ({...prev, headLastName: e.target.value}))}
                            placeholder="Dela Cruz"
                        />
                        {errors.headLastName && <p className="text-red-500 text-xs mt-1">{errors.headLastName}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Suffix</label>
                        <CustomSelect
                            value={formData.headSuffix}
                            onChange={(value) => setFormData(prev => ({...prev, headSuffix: value}))}
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
                            onChange={(e) => setFormData(prev => ({...prev, headBirthDate: e.target.value}))}
                        />
                        {errors.headBirthDate && <p className="text-red-500 text-xs mt-1">{errors.headBirthDate}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Place of Birth</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={formData.headBirthPlace}
                            onChange={(e) => setFormData(prev => ({...prev, headBirthPlace: e.target.value}))}
                            placeholder="City, Province"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Civil Status <span className="text-red-500">*</span></label>
                        <CustomSelect
                            value={formData.headCivilStatus}
                            onChange={(value) => setFormData(prev => ({...prev, headCivilStatus: value}))}
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
                                        onChange={(e) => setFormData(prev => ({...prev, headSex: e.target.value}))}
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
                            onChange={(value) => setFormData(prev => ({...prev, headOccupation: value}))}
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
                            onChange={(e) => setFormData(prev => ({...prev, headContactNumber: e.target.value}))}
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
                                        onChange={(e) => setFormData(prev => ({...prev, headIsStudent: e.target.value}))}
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
                                onChange={(value) => setFormData(prev => ({...prev, headEducationLevel: value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, [item.key]: e.target.checked}))}
                                className="hidden"
                            />
                            <span className="text-[14px] font-medium text-gray-700 group-hover:text-orange-700 transition-colors">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Step2FamilyHead;
