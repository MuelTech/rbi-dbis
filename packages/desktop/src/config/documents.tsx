import React from 'react';
import { DocumentConfig } from '@/types';
import BusinessClearanceTemplate from '@/components/templates/BusinessClearanceTemplate';
import IndigencyTemplate from '@/components/templates/IndigencyTemplate';
import FtjsCertificateTemplate from '@/components/templates/FtjsCertificateTemplate';
import BarangayClearanceTemplate from '@/components/templates/BarangayClearanceTemplate';

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
    id: 'barangay-clearance',
    name: 'Barangay Clearance',
    Template: BarangayClearanceTemplate,
    fields: [
      {
        key: 'address',
        label: 'Residence / Postal Address',
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
        placeholder: 'e.g. LOCAL EMPLOYMENT',
        required: true,
        width: 'full'
      },
      {
        key: 'day',
        label: 'Day',
        type: 'text',
        source: 'input',
        width: 'half'
      },
      {
        key: 'month',
        label: 'Month',
        type: 'text',
        source: 'input',
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
    id: 'barangay-certificate-ftjs',
    name: 'Barangay Certificate (FTJS)',
    Template: FtjsCertificateTemplate,
    fields: [
      {
        key: 'age',
        label: 'Age',
        type: 'text',
        source: 'input',
        required: true,
        width: 'half'
      },
      {
        key: 'civilStatus',
        label: 'Civil Status',
        type: 'select',
        source: 'input',
        options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'],
        defaultValue: 'Single',
        width: 'half'
      },
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
        key: 'yearsOfResidency',
        label: 'Years of Residency',
        type: 'text',
        source: 'input',
        required: true,
        width: 'half'
      },
      {
        key: 'validUntil',
        label: 'Valid Until',
        type: 'text',
        source: 'input',
        placeholder: 'e.g. January 28, 2027',
        width: 'half'
      },
      {
        key: 'witnessName',
        label: 'Barangay Secretary (Witness)',
        type: 'text',
        source: 'input',
        width: 'full'
      }
    ]
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
  }
];

export const getDocumentConfig = (name: string): DocumentConfig | undefined => {
  return documentConfigs.find(doc => doc.name.toLowerCase() === name.toLowerCase());
};
