import React from 'react';
import Letterhead from '@/components/templates/Letterhead';

const IndigencyTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    selectedResident,
    address,
    purpose,
    day,
    month,
    year,
    barangayName,
    punongBarangay,
  } = data;

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      {/* Official letterhead (full-bleed) */}
      <Letterhead barangayName={barangayName} />

      <div className="relative px-[20mm] pb-[20mm]">
        {/* Document Title */}
        <div className="text-center mb-10 mt-6">
          <h2 className="text-[18pt] font-serif font-bold uppercase tracking-widest">
            Certificate of Indigency
          </h2>
        </div>

        {/* Salutation */}
        <div className="mb-8">
          <p className="text-[12pt] font-bold uppercase">To Whom It May Concern:</p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-[12pt] leading-loose">
          <p>
            <span className="font-bold">THIS IS TO CERTIFY</span> that{' '}
            <span className="font-bold uppercase">{selectedResident || '________________'}</span> is a
            bonafide resident Barangay 418, Zone 43 with residence and postal address{' '}
            <span className="font-bold">{address || '___________________________________'}</span>,
            Sampaloc, Manila.
          </p>

          <p>
            That he/she is a person of good moral character and a law-abiding citizen of Barangay
            418, Zone 43. As per record, has no derogatory, no criminal record has been filed
            against him/her in the barangay as of this date. He/She is one of the indigent family
            of our barangay.
          </p>

          <p>
            This certification is being issued upon the request of the person mentioned above, for{' '}
            <span className="font-bold uppercase">{purpose || '________________'}</span>.
          </p>

          <p>
            Done in the City of Manila this{' '}
            <span className="font-bold">{day || '_____'}</span> day of{' '}
            <span className="font-bold">{month || '_______________'}</span>,{' '}
            <span className="font-bold">{year || '202_'}</span>.
          </p>
        </div>

        {/* Attestation */}
        <div className="mt-16">
          <p className="text-[12pt] font-bold uppercase mb-20">Attested by:</p>
          <div className="ml-6">
            <p className="text-[12pt] font-bold uppercase underline underline-offset-4">
              {punongBarangay || 'AMELIA V. ARELLANO'}
            </p>
            <p className="text-[11pt] uppercase mt-2">Barangay Chairwoman</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 space-y-1 text-[11pt] uppercase">
          <p>Valid for three months upon date issued</p>
          <p>Not valid without barangay seal</p>
          <p className="font-mono text-[10pt] normal-case">
            OR No.: {data.orNumber || '2026-418-________'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IndigencyTemplate;
