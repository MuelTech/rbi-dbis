import React from 'react';
import Letterhead from '@/components/templates/Letterhead';

const BarangayClearanceTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    selectedResident,
    address,
    purpose,
    day,
    month,
    year,
    barangayName,
    punongBarangay,
    orNumber,
  } = data;

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      <Letterhead barangayName={barangayName} />
      <div className="relative px-[20mm] pb-[20mm]">
        <div className="text-center mb-10 mt-6">
          <h2 className="text-[18pt] font-serif font-bold uppercase tracking-widest">
            Barangay Certificate
          </h2>
        </div>

        <div className="mb-8">
          <p className="text-[12pt] font-bold uppercase">To Whom It May Concern:</p>
        </div>

        <div className="space-y-6 text-[12pt] leading-loose">
          <p className="indent-8">
            <span className="font-bold">THIS IS TO CERTIFY</span> that{' '}
            <span className="font-bold uppercase">
              {selectedResident || '________________'}
            </span>{' '}
            is a bonafide resident of Barangay 418, Zone 43 with residence and postal address{' '}
            <span className="font-bold">{address || '________________'}</span>.
          </p>
          <p className="indent-8">
            She/he are person of good moral character and a law-abiding citizen of Barangay 418,
            Zone 43. As per record, has no derogatory, no criminal record has been filed against
            him/her in the barangay as of this date.
          </p>
          <p className="indent-8">
            This certification is being issued upon the request of the person mentioned above, for{' '}
            <span className="font-bold uppercase">{purpose || '________________'}</span>.
          </p>
          <p className="indent-8">
            Done in the City of Manila this{' '}
            <span className="font-bold">{day || '_____'}</span> day of{' '}
            <span className="font-bold">{month || '__________'}</span>,{' '}
            <span className="font-bold">{year || '2026'}</span>.
          </p>
        </div>

        <div className="mt-16 flex justify-end">
          <div className="text-center w-[260px]">
            <p className="text-[12pt] font-bold uppercase mb-2">Attested by:</p>
            <p className="text-[12pt] font-bold uppercase underline underline-offset-4">
              {punongBarangay || 'AMELIA V. ARELLANO'}
            </p>
            <p className="text-[11pt] uppercase mt-1">Punong Barangay</p>
          </div>
        </div>

        <div className="mt-14 space-y-1 text-[11pt] uppercase">
          <p>Not valid for any loan</p>
          <p>Not valid without barangay seal</p>
          <p>Valid for six months upon date issued</p>
          <p className="font-mono text-[10pt] normal-case">
            OR No.: {orNumber || '2026-418-________'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarangayClearanceTemplate;
