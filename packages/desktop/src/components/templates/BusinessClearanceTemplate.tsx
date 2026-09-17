import React from 'react';
import Letterhead from '@/components/templates/Letterhead';

const BusinessClearanceTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    businessName,
    selectedResident,
    businessAddress,
    natureOfBusiness,
    barangayName,
    punongBarangay,
  } = data;

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      <Letterhead barangayName={barangayName} />

      <div className="relative px-[20mm] pb-[20mm]">
      <div className="text-center mb-12">
        <h2 className="text-[18pt] font-serif font-bold uppercase border-b-2 border-black inline-block pb-1">Business Clearance</h2>
      </div>

      <div className="mb-8">
        <p className="text-[12pt] font-serif font-bold uppercase">To Whom It May Concern:</p>
      </div>

      <div className="mb-8">
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          THIS IS TO CERTIFY that Mr./Mrs.{' '}
          <span className="font-bold uppercase">{selectedResident || 'OWNER NAME'}</span>, owner of a{' '}
          <span className="font-bold uppercase">{natureOfBusiness || 'BUSINESS'}</span> with
          business address located at{' '}
          <span className="font-bold">{businessAddress || 'BUSINESS ADDRESS'}</span> under the trade
          name <span className="font-bold uppercase">{businessName || 'TRADE NAME'}</span> were
          allowed to operate its business/ activity within the jurisdiction of{' '}
          <span className="font-bold uppercase">{barangayName || 'BARANGAY 418'} ZONE 43</span>,
          pursuant to provision of Section 162, Republic Act No. 7160 otherwise known as THE LOCAL
          GOVERNMENT CODE OF 1991.
        </p>
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          “Failure to comply with the requirements of the City Government of Manila shall cause this
          clearance to be revoke and cancelled.”
        </p>
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-8">
          This Business Clearance is issued upon the request of the owner for Business Permit and
          Licensing Office only.
        </p>
        <p className="text-[12pt] font-serif leading-relaxed indent-12">
          Issued this <span className="font-bold">{data.day || '____'}</span> day of{' '}
          <span className="font-bold">{data.month || '__________'}</span>,{' '}
          <span className="font-bold">{data.year || '2026'}</span> at {barangayName || 'Barangay 418'}, Sampaloc, Manila.
        </p>
        {data.validUntil && (
          <p className="text-[12pt] font-serif leading-relaxed indent-12 mt-4">
            Valid until <span className="font-bold">{data.validUntil}</span>.
          </p>
        )}
      </div>

      <div className="mt-24 flex justify-end">
        <div className="text-center w-[250px]">
          <p className="text-[12pt] font-serif font-bold uppercase border-b border-black pb-1">Hon. {punongBarangay}</p>
          <p className="text-[10pt] font-serif font-bold mt-1">Barangay Chairwoman</p>
        </div>
      </div>

      <div className="mt-16 space-y-1 text-[11pt] font-serif uppercase">
        <p>Not valid without barangay seal</p>
        <p className="font-mono text-[10pt] normal-case">
          OR No.: {data.orNumber || 'N/A'}
        </p>
      </div>

      </div>
    </div>
  );
};

export default BusinessClearanceTemplate;
