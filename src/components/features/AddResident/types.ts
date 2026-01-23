export interface FamilyMember {
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

export interface FormData {
    // Step 1: Family Details
    block: string;
    householdNumber: string;
    houseNumber: string;
    streetName: string;
    alley: string;
    hasPets: string;
    numberOfDogs: string;
    numberOfCats: string;
    otherAnimals: string;
    hasVehicles: string;
    numberOfMotorcycles: string;
    motorcyclePlateNumbers: string;
    numberOfOtherVehicles: string;
    otherVehiclePlateNumbers: string;

    // Step 2: Family Head
    headFirstName: string;
    headMiddleName: string;
    headLastName: string;
    headSuffix: string;
    headBirthDate: string;
    headBirthPlace: string;
    headCivilStatus: string;
    headSex: string;
    headOccupation: string;
    headContactNumber: string;
    headIsStudent: string;
    headEducationLevel: string;
    headIsVoter: boolean;
    headIsPwd: boolean;
    headIsSoloParent: boolean;
}

export interface WizardStepProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    familyMembers: FamilyMember[];
    setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
    errors: Record<string, string>;
}

export const BLOCK_LIMITS: Record<string, number> = {
    '1': 51,
    '2': 55,
    '3': 50,
};

export const BLOCK_OPTIONS = [
    { value: '1', label: 'Block 1' },
    { value: '2', label: 'Block 2' },
    { value: '3', label: 'Block 3' },
];

export const SUFFIX_OPTIONS = [
    { value: 'Jr.', label: 'Jr.' },
    { value: 'Sr.', label: 'Sr.' },
    { value: 'III', label: 'III' },
];

export const CIVIL_STATUS_OPTIONS = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Widowed', label: 'Widowed' },
    { value: 'Separated', label: 'Separated' },
];

export const OCCUPATION_OPTIONS = [
    { value: 'Employed', label: 'Employed' },
    { value: 'Self-Employed', label: 'Self-Employed' },
    { value: 'Unemployed', label: 'Unemployed' },
    { value: 'Student', label: 'Student' },
];

export const EDUCATION_LEVEL_OPTIONS = [
    { value: 'Elementary', label: 'Elementary' },
    { value: 'High School', label: 'High School' },
    { value: 'College', label: 'College' },
    { value: 'Vocational', label: 'Vocational' },
];

export const RELATIONSHIP_OPTIONS = [
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Child', label: 'Child' },
    { value: 'Parent', label: 'Parent' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Grandparent', label: 'Grandparent' },
    { value: 'Grandchild', label: 'Grandchild' },
    { value: 'Other', label: 'Other' },
];
