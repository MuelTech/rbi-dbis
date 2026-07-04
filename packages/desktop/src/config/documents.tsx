import React from 'react';
import { DocumentConfig } from '@/types';
import BusinessClearanceTemplate from '@/components/templates/BusinessClearanceTemplate';
import BusinessPermitTemplate from '@/components/templates/BusinessPermitTemplate';
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
      }
    ]
  },
  {
    id: 'business-permit',
    name: 'Business Permit',
    Template: BusinessPermitTemplate,
    fields: [
      {
        key: 'businessType',
        label: 'Business Type',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. House Space Rental',
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
        key: 'tradeName',
        label: 'Trade Name',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. NOEH House Space Rental',
        required: true,
        width: 'full'
      },
      {
        key: 'validUntil',
        label: 'Valid Until',
        type: 'text',
        source: 'input',
        defaultValue: 'December 31, 2026',
        width: 'full'
      },
      {
        key: 'busNo',
        label: 'Business Number',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. 2026-418-0006',
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
        key: 'purpose',
        label: 'Purpose',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. Medical Assistance',
        required: true,
        width: 'full'
      },
      {
        key: 'day',
        label: 'Day',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. 21st',
        width: 'half'
      },
      {
        key: 'month',
        label: 'Month',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. January',
        width: 'half'
      },
      {
        key: 'year',
        label: 'Year',
        type: 'text',
        source: 'input',
        defaultValue: '2026',
        width: 'half'
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
