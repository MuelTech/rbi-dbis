import React from 'react';
import { DocumentConfig } from '@/types';
import BusinessClearanceTemplate from '@/components/templates/BusinessClearanceTemplate';
import IndigencyTemplate from '@/components/templates/IndigencyTemplate';

export const documentConfigs: DocumentConfig[] = [
  {
    id: 'barangay-business-clearance',
    name: 'Barangay Business Clearance',
    Template: BusinessClearanceTemplate,
    fields: [
      {
        key: 'businessName',
        label: 'Business Name',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. Sari-Sari Store',
        required: true,
        width: 'full'
      },
      {
        key: 'businessAddress',
        label: 'Business Address',
        type: 'text',
        source: 'input',
        placeholder: 'Complete business address',
        residentAttribute: 'address',
        required: true,
        width: 'full'
      },
      {
        key: 'natureOfBusiness',
        label: 'Nature of Business',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. Retail',
        required: true,
        width: 'full'
      },
      {
        key: 'ownershipType',
        label: 'Type of Ownership',
        type: 'select',
        source: 'input',
        options: ['Sole Proprietorship', 'Partnership', 'Corporation', 'Cooperative'],
        defaultValue: 'Sole Proprietorship',
        width: 'full'
      },
      {
        key: 'amountPaid',
        label: 'Amount Paid',
        type: 'currency',
        source: 'system',
        defaultValue: '500',
        width: 'full'
      }
    ]
  },
  // Placeholder for other documents
  {
    id: 'barangay-clearance',
    name: 'Barangay Clearance',
    Template: ({ data }) => <div>Template for Barangay Clearance (Coming Soon)</div>,
    fields: []
  },
  {
    id: 'certificate-of-indigency',
    name: 'Certificate of Indigency',
    Template: IndigencyTemplate,
    fields: [
      {
        key: 'address',
        label: 'Resident Address',
        type: 'text',
        source: 'input',
        residentAttribute: 'address',
        required: true,
        width: 'full'
      },
      {
        key: 'civilStatus',
        label: 'Civil Status',
        type: 'select',
        source: 'input',
        residentAttribute: 'civil_status',
        options: ['Single', 'Married', 'Widowed', 'Separated'],
        required: true,
        width: 'half'
      },
      {
        key: 'purpose',
        label: 'Purpose',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. Medical Assistance',
        required: true,
        width: 'full'
      },
      {
        key: 'amountPaid',
        label: 'Amount Paid',
        type: 'currency',
        source: 'system',
        defaultValue: '0',
        width: 'full'
      }
    ]
  },
  {
    id: 'certificate-of-residency',
    name: 'Certificate of Residency',
    Template: ({ data }) => <div>Template for Certificate of Residency (Coming Soon)</div>,
    fields: []
  }
];

export const getDocumentConfig = (name: string): DocumentConfig | undefined => {
  return documentConfigs.find(doc => doc.name === name);
};
