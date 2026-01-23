import React, { useState, useEffect } from 'react';
import { Home, User, Users, Check, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { FormData, FamilyMember } from './types';
import Step1FamilyDetails from './Step1FamilyDetails';
import Step2FamilyHead from './Step2FamilyHead';
import Step3FamilyMembers from './Step3FamilyMembers';

interface AddResidentWizardProps {
    onCancel: () => void;
    setIsNavigationBlocked?: (blocked: boolean) => void;
    onShowSuccess?: (message: string) => void;
}

const AddResidentWizard: React.FC<AddResidentWizardProps> = ({ onCancel, setIsNavigationBlocked, onShowSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
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

    const renderStep = () => {
        const props = {
            formData,
            setFormData,
            familyMembers,
            setFamilyMembers,
            errors
        };

        switch (currentStep) {
            case 1:
                return <Step1FamilyDetails {...props} />;
            case 2:
                return <Step2FamilyHead {...props} />;
            case 3:
                return <Step3FamilyMembers {...props} />;
            default:
                return null;
        }
    };

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
                    {renderStep()}
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

export default AddResidentWizard;
