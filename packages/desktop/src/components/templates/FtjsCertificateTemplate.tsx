import React from 'react';
import Letterhead from '@/components/templates/Letterhead';

const FtjsCertificateTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    selectedResident,
    age,
    civilStatus,
    address,
    yearsOfResidency,
    validUntil,
    witnessName,
    barangayName,
    punongBarangay,
    secretary,
    issueDay,
    issueMonth,
    issueYear,
    orNumber,
  } = data;

  const witness = witnessName || secretary || '';

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      <Letterhead barangayName={barangayName} />

      <div className="relative px-[20mm] pb-[20mm]">
        <div className="text-center mb-10 mt-6">
          <h2 className="text-[18pt] font-serif font-bold uppercase tracking-wide">
            Barangay Certificate
          </h2>
          <p className="text-[12pt] font-serif mt-1">
            (First Time Jobseeker Assistance Act. RA 11261)
          </p>
        </div>

        <div className="mb-8">
          <p className="text-[12pt] font-bold uppercase">To Whom It May Concern:</p>
        </div>

        <div className="space-y-6 text-[12pt] leading-loose">
          <p className="indent-12">
            This is to certify that{' '}
            <span className="font-bold underline">{selectedResident || '________________'}</span>,{' '}
            <span className="font-bold">{age || '__'} years old</span>,{' '}
            {civilStatus || '________'}, a resident of{' '}
            <span className="font-bold">{address || '________________'}</span>, for{' '}
            <span className="font-bold">{yearsOfResidency || '__'} year/s</span> is a qualified
            availee of RA 11261 or the First Time Jobseeker Act of 2019.
          </p>

          <p className="indent-12">
            I further certify that the holder/bearer was informed of her/his rights, including the
            duties and responsibilities accorded by RA 11261 through the Oath of Undertaking
            she/he has signed and executed in the presence of our Barangay Official.
          </p>

          <p className="indent-12">
            Signed this <span className="font-bold">{issueDay || '____'}</span> day of{' '}
            <span className="font-bold underline">{issueMonth || '__________'}</span>,{' '}
            <span className="font-bold">{issueYear || '2026'}</span> in Barangay 418 zone 43,
            District IV, Metro Manila, Philippines.
          </p>

          <p className="indent-12">
            This certification is valid only until{' '}
            <span className="font-bold underline">{validUntil || '________________'}</span>.
          </p>
        </div>

        <div className="mt-16 flex justify-end">
          <div className="w-[280px] text-center space-y-6">
            <div>
              <p className="text-[12pt] font-bold uppercase underline underline-offset-4">
                {punongBarangay || 'AMELIA V. ARELLANO'}
              </p>
              <p className="text-[11pt] uppercase mt-1">Barangay Chairwoman</p>
            </div>
            <div>
              <p className="text-[12pt] font-bold underline underline-offset-4">
                {data.issueDateDisplay || '________________'}
              </p>
              <p className="text-[11pt] mt-1">Date</p>
            </div>
            <div className="text-left pt-4">
              <p className="text-[12pt]">Witnessed by:</p>
              <p className="text-[12pt] font-bold underline underline-offset-4 mt-6">
                {witness || '________________'}
              </p>
              <p className="text-[11pt] mt-1">Barangay Secretary</p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-[10pt] font-mono">
          OR No.: {orNumber || '2026-418-________'}
        </div>
      </div>
    </div>
  );
};

export default FtjsCertificateTemplate;
