import React from 'react';

const BusinessPermitTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    selectedResident,
    businessName,
    businessType,
    businessAddress,
    tradeName,
    barangayName,
    municipality,
    punongBarangay,
    dateIssued,
    validUntil,
    busNo,
    amountPaid,
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
        <h2 className="text-[18pt] font-serif font-bold uppercase border-b-2 border-black inline-block pb-1">Business Clearance</h2>
      </div>

      {/* Salutation */}
      <div className="mb-8">
        <p className="text-[12pt] font-serif font-bold uppercase">To Whom It May Concern:</p>
      </div>

      {/* Body */}
      <div className="mb-8">
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          This is to certify that Mr./Mrs. <span className="font-bold uppercase">{selectedResident || 'OWNER NAME'}</span>, owner of a <span className="font-bold uppercase">{businessType || 'BUSINESS TYPE'}</span> with business address located at <span className="font-bold">{businessAddress || 'BUSINESS ADDRESS'}</span> under the trade name <span className="font-bold uppercase">{tradeName || businessName || 'TRADE NAME'}</span> were allowed to operate its business/ activity within the jurisdiction of <span className="font-bold uppercase">{barangayName || 'BARANGAY 418'} ZONE 43</span>, pursuant to provision of Section 162, Republic Act No. 7160 otherwise known as THE LOCAL GOVERNMENT CODE OF 1991.
        </p>

        <p className="text-[10pt] font-serif leading-relaxed indent-12 mb-6 italic">
          "Failure to comply with the requirements of the City Government of Manila shall cause this clearance to be revoke and cancelled."
        </p>

        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          This Business Clearance is issued upon the request of the owner for Business Permit and Licensing Office only.
        </p>

        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-4">
          Issued this <span className="font-bold">{dateIssued || '21st'}</span> day of <span className="font-bold">{dateIssued || 'January, 2026'}</span>.
        </p>

        <p className="text-[12pt] font-serif leading-relaxed indent-12">
          Valid until <span className="font-bold">{validUntil || 'December 31, 2026'}</span>.
        </p>
      </div>

      {/* Attestation */}
      <div className="mt-16">
        <p className="text-[12pt] font-serif font-bold uppercase mb-16">Attested by:</p>
      </div>

      {/* Signatories */}
      <div className="mt-8 flex justify-end">
        <div className="text-center w-[250px]">
          <p className="text-[12pt] font-serif font-bold uppercase border-b border-black pb-1">Hon. {punongBarangay || 'BARANGAY CHAIRWOMAN'}</p>
          <p className="text-[10pt] font-serif font-bold mt-1">Barangay Chairman</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
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
        <div className="grid grid-cols-[100px_1fr] gap-1">
          <span>Amount Paid:</span>
          <span>₱ {amountPaid || '0'}.00</span>
        </div>
      </div>

      {/* Watermark/Seal Placeholder */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-[20px] border-gray-100 opacity-50 pointer-events-none flex items-center justify-center">
        <div className="w-[300px] h-[300px] rounded-full border-[10px] border-gray-100"></div>
      </div>
    </div>
  );
};

export default BusinessPermitTemplate;
