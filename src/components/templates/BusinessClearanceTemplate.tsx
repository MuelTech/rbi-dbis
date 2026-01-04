import React from 'react';

const BusinessClearanceTemplate: React.FC<{ data: any }> = ({ data }) => {
  const {
    businessName,
    selectedResident,
    businessAddress,
    natureOfBusiness,
    amountPaid,
    status
  } = data;

  return (
    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-lg p-[20mm] relative text-gray-900 print:shadow-none print:w-full print:max-w-none">
      {/* Document Header */}
      <div className="text-center mb-12">
        <p className="text-[10pt] tracking-widest uppercase text-gray-500 mb-1">Republic of the Philippines</p>
        <p className="text-[10pt] tracking-widest uppercase text-gray-500 mb-2">City of Manila</p>
        <h1 className="text-[16pt] font-bold text-blue-900 uppercase mb-1">Barangay 418</h1>
        <p className="text-[9pt] font-bold tracking-widest uppercase text-gray-600">Office of the Barangay Captain</p>
      </div>

      {/* Document Title */}
      <div className="text-center mb-12">
        <h2 className="text-[18pt] font-serif font-bold uppercase border-b-2 border-black inline-block pb-1">Barangay Business Clearance</h2>
      </div>

      {/* Salutation */}
      <div className="mb-8">
        <p className="text-[12pt] font-serif font-bold uppercase">To Whom It May Concern:</p>
      </div>

      {/* Body */}
      <div className="mb-8">
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-8">
          This is to certify that the business establishment described below:
        </p>

        <div className="space-y-4 pl-8">
          <div className="grid grid-cols-[180px_1fr] items-end gap-4">
            <span className="text-[12pt] font-serif font-bold">Business Name:</span>
            <div className="border-b border-black text-[12pt] font-serif font-bold uppercase px-2">
              {businessName}
            </div>
          </div>
          <div className="grid grid-cols-[180px_1fr] items-end gap-4">
            <span className="text-[12pt] font-serif font-bold">Proprietor/Owner:</span>
            <div className="border-b border-black text-[12pt] font-serif font-bold uppercase px-2">
              {selectedResident || 'JUAN DELA CRUZ'}
            </div>
          </div>
          <div className="grid grid-cols-[180px_1fr] items-end gap-4">
            <span className="text-[12pt] font-serif font-bold">Business Address:</span>
            <div className="border-b border-black text-[12pt] font-serif font-bold uppercase px-2">
              {businessAddress}
            </div>
          </div>
          <div className="grid grid-cols-[180px_1fr] items-end gap-4">
            <span className="text-[12pt] font-serif font-bold">Nature of Business:</span>
            <div className="border-b border-black text-[12pt] font-serif font-bold uppercase px-2">
              {natureOfBusiness}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-6">
          Has been inspected and found to be complying with the existing rules and regulations of this Barangay.
        </p>
        <p className="text-[12pt] font-serif leading-relaxed indent-12 mb-8">
          This clearance is being issued upon the request of the above-mentioned person for whatever legal intent/purpose it may serve.
        </p>
        <p className="text-[12pt] font-serif leading-relaxed indent-12">
          Issued this <span className="font-bold">4th</span> day of <span className="font-bold">January, 2026</span> at Barangay 418, Sampaloc, Manila.
        </p>
      </div>

      {/* Signatories */}
      <div className="mt-24 flex justify-end">
        <div className="text-center w-[250px]">
          <p className="text-[12pt] font-serif font-bold uppercase border-b border-black pb-1">Hon. Juan Dela Cruz</p>
          <p className="text-[10pt] font-serif font-bold mt-1">Barangay Captain</p>
        </div>
      </div>

      {/* Footer / OR Details */}
      <div className="mt-24 text-[9pt] font-mono text-gray-600">
        <div className="grid grid-cols-[100px_1fr] gap-1">
          <span>OR Number:</span>
          <span>1234567</span>
        </div>
        <div className="grid grid-cols-[100px_1fr] gap-1">
          <span>Amount Paid:</span>
          <span>₱ {amountPaid}.00</span>
        </div>
        <div className="grid grid-cols-[100px_1fr] gap-1">
          <span>Date Issued:</span>
          <span>January 4, 2026</span>
        </div>
      </div>

      {/* Watermark/Seal Placeholder */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-[20px] border-gray-100 opacity-50 pointer-events-none flex items-center justify-center">
        <div className="w-[300px] h-[300px] rounded-full border-[10px] border-gray-100"></div>
      </div>
    </div>
  );
};

export default BusinessClearanceTemplate;
