import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface User {
  id: string;
  displayId?: number;
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  role: 'SuperAdmin' | 'Admin';
  roleType?: string;
  permission: 'Full Access' | 'Resident Access' | 'Document Access' | 'Resident & Document Access';
  lastLogin?: string;
  status: 'Active' | 'Disabled';
  isActive?: boolean;
  userInfo?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profileImage?: string | null;
  };
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export interface Transaction {
  id: string;
  displayId?: number;
  dateIssued: string;
  personnel: string;
  resident: string;
  type: string;
  fee: number;
}

export interface Resident {
  id: string; // resident_id
  displayId?: number;
  lastName: string; // last_name
  firstName: string; // first_name
  middleName?: string; // middle_name
  suffix?: string; // suffix
  placeOfBirth?: string; // place_of_birth
  dateOfBirth?: string; // date_of_birth
  sex: 'Male' | 'Female';
  civilStatus?: string; // civil_status
  address?: string; // address
  voter: 'Yes' | 'No'; // is_voter
  isOwner?: boolean; // is_owner
  studentType?: string; // student_type
  status: 'Active' | 'Deceased' | 'Move out'; // status_type
  isArchived?: boolean; // is_archived
  contactNumber?: string; // contact_number
  occupation?: string; // occupation_type
  record?: boolean; // record (true = No bad record)
  age: number;

  // New snake_case attributes for Document system compatibility
  resident_id?: string;
  last_name?: string;
  first_name?: string;
  middle_name?: string;
  place_of_birth?: string;
  date_of_birth?: string;
  civil_status?: string;
  is_voter?: boolean;
  is_owner?: boolean;
  student_type?: string;
  status_type?: string;
  is_archived?: boolean;
  contact_number?: string;
  occupation_type?: string;
}

export interface ResidentOrder {
  displayId: number;
  orderDate: string;
  documentType: string;
  amount: number;
  personnelName: string;
}

export interface ResidentAuditTrail {
  id: string;
  timestamp: string;
  personnelName: string;
  actionType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
}

export interface ResidentDetail extends Resident {
  isVoter?: boolean;
  isPwd?: boolean;
  isSoloParent?: boolean;
  profileImage?: string | null;
  familyHead: { name: string } | null;
  relationshipToHead: string | null;
  household: { householdNo: string; streetName: string; alley: string } | null;
  orders: ResidentOrder[];
  auditTrails: ResidentAuditTrail[];
}

export interface RegistrationHeadPayload {
  lastName: string;
  firstName: string;
  middleName?: string;
  suffix?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  sex: 'Male' | 'Female';
  civilStatus?: string;
  isVoter: boolean;
  isPwd: boolean;
  isSoloParent: boolean;
  isOwner: boolean;
  occupationType?: string;
  contactNumber?: string;
  studentType?: string;
}

export interface RegistrationMemberPayload {
  relationshipType: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  suffix?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  sex: 'Male' | 'Female';
  civilStatus?: string;
  isVoter: boolean;
  isPwd: boolean;
  isSoloParent: boolean;
  occupationType?: string;
  contactNumber?: string;
  studentType?: string;
}

export interface RegistrationPayload {
  household: { blockNumber: string; brgyHouseholdNo: string };
  address: { houseNo: string; streetName: string; alleyName: string };
  head: RegistrationHeadPayload;
  pet?: {
    isPetOwner: boolean;
    numberOfDogs: number;
    numberOfCats: number;
    others?: string;
  };
  vehicle?: {
    numberOfMotorcycles: number;
    motorcyclePlateNumber?: string;
    numberOfVehicles: number;
    vehiclePlateNumber?: string;
  };
  familyMembers: RegistrationMemberPayload[];
}

export interface RegistrationResult {
  headDisplayId: number;
  familyDisplayId: number;
  householdDisplayId: number;
  memberCount: number;
}

export type FieldSource = 'resident' | 'input' | 'system';

export interface DocumentField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'currency';
  source: FieldSource;
  residentAttribute?: keyof Resident;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  width?: 'full' | 'half' | 'third';
}

export interface DocumentConfig {
  id: string;
  name: string;
  fields: DocumentField[];
  Template: React.FC<{ data: any }>;
}

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}