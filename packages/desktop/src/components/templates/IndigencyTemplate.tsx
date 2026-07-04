import React from 'react';

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
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg p-[20mm] relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      {/* Document Header */}
      <div className="text-center mb-12">
        <p className="text-[10pt] tracking-widest uppercase text-gray-500 mb-1">Republic of the Philippines</p>
        <p className="text-[10pt] tracking-widest uppercase text-gray-500 mb-2">City of Manila</p>
        <h1 className="text-[16pt] font-bold text-blue-900 uppercase mb-1">{barangayName || 'BARANGAY 418'} ZONE 43 DISTRICT IV</h1>
        <p className="text-[9pt] font-bold tracking-widest uppercase text-gray-600">Office of the Barangay Chairman</p>
      </div>

      {/* Document Title */}
      <div className="text-center mb-12">
        <h2 className="text-[18pt] font-serif font-bold uppercase border-b-2 border-black inline-block pb-1 tracking-widest">Certificate of Indigency</h2>
      </div>

      {/* Salutation */}
      <div className="mb-8">
        <p className="text-[12pt] font-serif font-bold uppercase">To Whom It May Concern:</p>
      </div>

      {/* Body */}
      <div className="mb-8">
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          This is to certify that <span className="font-bold uppercase">{selectedResident || '_________________________________'}</span> is a bonafide resident of {barangayName || 'Barangay 418'}, Zone 43 with residence and postal address <span className="font-bold">{address || '___________________________________'}</span>, Sampaloc, Manila.
        </p>

        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          That he/she is a person of good moral character and a law-abiding citizen of {barangayName || 'Barangay 418'}, Zone 43. As per record, has no derogatory, no criminal record has been filed against him/her in the barangay as of this date. He/She is one of the indigent family of our barangay.
        </p>

        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-8">
          This certification is being issued upon the request of the person mentioned above, for <span className="font-bold uppercase">{purpose || '_________________________________'}</span>.
        </p>

        <p className="text-[12pt] font-serif leading-relaxed indent-12">
          Done in the City of Manila this <span className="font-bold">{day || '_____'}</span> day of <span className="font-bold">{month || '_______________'}</span>, <span className="font-bold">{year || '20__'}</span>.
        </p>
      </div>

      {/* Attestation */}
      <div className="mt-16">
        <p className="text-[12pt] font-serif font-bold uppercase mb-16">Attested by:</p>
      </div>

      {/* Signatories */}
      <div className="mt-8 flex justify-end">
        <div className="text-center w-[250px]">
          <p className="text-[12pt] font-serif font-bold uppercase border-b border-black pb-1">{punongBarangay || 'AMELIA V. ARELLANO'}</p>
          <p className="text-[10pt] font-serif font-bold mt-1">Barangay Chairwoman</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center space-y-2">
        <p className="text-[10pt] font-serif font-bold uppercase">Valid for three months upon date issued</p>
        <p className="text-[10pt] font-serif font-bold uppercase">Not Valid Without Barangay Seal</p>
      </div>

      {/* OR Details */}
      <div className="mt-8 text-[9pt] font-mono text-gray-600">
        <div className="grid grid-cols-[100px_1fr] gap-1">
          <span>OR Number:</span>
          <span>{data.orNumber || 'N/A'}</span>
        </div>
        <div className="grid grid-cols-[100px_1fr] gap-1">
          <span>Doc Number:</span>
          <span>{data.documentNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Watermark/Seal Placeholder */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-[20px] border-gray-100 opacity-50 pointer-events-none flex items-center justify-center">
        <div className="w-[300px] h-[300px] rounded-full border-[10px] border-gray-100"></div>
      </div>
    </div>
  );
};

export default IndigencyTemplate;
