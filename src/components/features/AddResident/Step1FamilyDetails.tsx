import React from 'react';
import { Hash, MapPin, PawPrint, Car } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { WizardStepProps, BLOCK_OPTIONS, BLOCK_LIMITS } from './types';

const Step1FamilyDetails: React.FC<WizardStepProps> = ({ formData, setFormData, errors }) => {

    const householdOptions = React.useMemo(() => {
        if (!formData.block || !BLOCK_LIMITS[formData.block]) return [];
        return Array.from({ length: BLOCK_LIMITS[formData.block] }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1)
        }));
    }, [formData.block]);

    return (
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
                            onChange={(value) => setFormData(prev => ({...prev, block: value, householdNumber: ''}))}
                            options={BLOCK_OPTIONS}
                            placeholder="Select Block"
                            error={errors.block}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Household Number <span className="text-red-500">*</span></label>
                        <CustomSelect
                            value={formData.householdNumber}
                            onChange={(value) => setFormData(prev => ({...prev, householdNumber: value}))}
                            options={householdOptions}
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
                            onChange={(e) => setFormData(prev => ({...prev, houseNumber: e.target.value}))}
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
                            onChange={(e) => setFormData(prev => ({...prev, streetName: e.target.value}))}
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
                            onChange={(e) => setFormData(prev => ({...prev, alley: e.target.value}))}
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
                                    onChange={(e) => setFormData(prev => ({...prev, hasPets: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, numberOfDogs: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, numberOfCats: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, otherAnimals: e.target.value}))}
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
                                    onChange={(e) => setFormData(prev => ({...prev, hasVehicles: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, numberOfMotorcycles: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, motorcyclePlateNumbers: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, numberOfOtherVehicles: e.target.value}))}
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
                                onChange={(e) => setFormData(prev => ({...prev, otherVehiclePlateNumbers: e.target.value}))}
                                placeholder="e.g., DEF-9012, GHI-3456"
                            />
                            {errors.otherVehiclePlateNumbers && <p className="text-red-500 text-xs mt-1">{errors.otherVehiclePlateNumbers}</p>}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Step1FamilyDetails;
