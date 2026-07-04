import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, FileText, User, Calendar, MapPin, CheckCircle, Printer, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ContentCard from '@/components/ui/ContentCard';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { getDocumentConfig } from '@/config/documents';
import { DocumentConfig } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { residentsService } from '@/services/residents';
import { documentsService } from '@/services/documents';

interface DocumentProps {
  setIsNavigationBlocked?: (blocked: boolean) => void;
}

const Document: React.FC<DocumentProps> = ({ setIsNavigationBlocked }) => {
  const { settings } = useSettings();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [otherPurpose, setOtherPurpose] = useState('');
  const [documentType, setDocumentType] = useState('Barangay Business Clearance');

  // Dynamic State
  const [activeConfig, setActiveConfig] = useState<DocumentConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const resetForm = () => {
    setSearchQuery('');
    setSelectedResident('');
    setSelectedResidentId('');
    setPurpose('');
    setOtherPurpose('');
    setDocumentType('Barangay Business Clearance');
    setActiveConfig(null);
    setFormData({});
  };

  // Block navigation when on Step 2
  useEffect(() => {
    if (setIsNavigationBlocked) {
      setIsNavigationBlocked(step === 2);
    }
    return () => {
      if (setIsNavigationBlocked) {
        setIsNavigationBlocked(false);
      }
    };
  }, [step, setIsNavigationBlocked]);

  // Fetch real residents from API
  const { data: residentsData } = useQuery({
    queryKey: ['residents', { pageSize: 1000 }],
    queryFn: () => residentsService.list({ pageSize: 1000 }),
  });
  const residents = residentsData?.data ?? [];

  const getFullName = (r: any) => {
    const first = r.firstName || r.first_name || '';
    const middle = r.middleName || r.middle_name || '';
    const last = r.lastName || r.last_name || '';
    const suffix = r.suffix || '';
    return `${first} ${middle ? middle + '. ' : ''}${last}${suffix ? ' ' + suffix : ''}`.trim();
  };

  const filteredResidents = useMemo(() => 
    residents.filter(r => 
      getFullName(r).toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.length > 0
    ), [residents, searchQuery]
  );

  const handleProceed = () => {
    const config = getDocumentConfig(documentType);
    if (!config) {
      alert('Configuration not found.');
      return;
    }
    if (!selectedResidentId) {
      alert('Please select a resident.');
      return;
    }

    const resident = residents.find(r => r.id === selectedResidentId);
    if (!resident) return;

    setActiveConfig(config);

    const initialData: Record<string, any> = {
      selectedResident: getFullName(resident),
      purpose: purpose === 'Other' ? otherPurpose : purpose,
      barangayName: settings.barangayName,
      municipality: settings.municipality,
      province: settings.province,
      punongBarangay: settings.punongBarangay,
    };

    config.fields.forEach(field => {
      if (field.residentAttribute) {
        const attr = resident[field.residentAttribute as keyof typeof resident] ?? (resident as any)[field.residentAttribute];
        if (attr) {
          initialData[field.key] = String(attr);
        }
      } else if (field.defaultValue) {
        initialData[field.key] = field.defaultValue;
      }
    });

    setFormData(initialData);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setActiveConfig(null);
    setFormData({});
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePrint = async () => {
    if (!selectedResidentId || !activeConfig) return;

    try {
      const result = await documentsService.create({
        residentId: selectedResidentId,
        documentTypeId: activeConfig.id,
        purpose: purpose === 'Other' ? otherPurpose : purpose,
      });

      setFormData(prev => ({
        ...prev,
        orNumber: result.order?.orNumber ?? '',
      }));

      window.print();

      setTimeout(() => {
        resetForm();
        setStep(1);
      }, 500);
    } catch (err) {
      alert('Failed to create document. Please try again.');
    }
  };

  return (
    <ContentCard className="relative">
      {/* Header inside the card - Hidden on Print */}
      <div className="absolute top-0 left-0 w-full p-6 border-b border-gray-50 bg-white z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <FileText size={20} />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Document Issuance</h2>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 text-sm font-medium">
                {step === 1 ? 'Step 1: Request Initialization' : 'Step 2: Editor & Preview'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pt-20 custom-scrollbar print:pt-0 print:overflow-visible">
        {step === 1 ? (
            <div className="flex items-center justify-center min-h-full p-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-xl">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Request</h2>
                    <p className="text-gray-500 text-sm">Select the resident and document type to proceed.</p>
                </div>

                <div className="space-y-5">
                    {/* Resident Name Search */}
                    <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Resident Name</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Search resident..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedResident('');
                            setSelectedResidentId('');
                        }}
                        />
                        {/* Dropdown results */}
                        {filteredResidents.length > 0 && !selectedResident && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filteredResidents.map((resident, index) => (
                            <button
                                key={resident.id || index}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors"
                                onClick={() => {
                                setSearchQuery(getFullName(resident));
                                setSelectedResident(getFullName(resident));
                                setSelectedResidentId(resident.id || resident.resident_id || '');
                                }}
                            >
                                {getFullName(resident)}
                            </button>
                            ))}
                        </div>
                        )}
                    </div>
                    </div>

                    {/* Purpose Dropdown */}
                    <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Purpose</label>
                    <CustomDropdown
                        value={purpose}
                        onChange={setPurpose}
                        options={[
                        'Employment',
                        'Scholarship',
                        'Business Permit',
                        'Proof of Residency',
                        'Other'
                        ]}
                        placeholder="Select Purpose"
                    />
                    </div>

                    {/* Other Purpose Input */}
                    {purpose === 'Other' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Specify Purpose</label>
                        <input 
                        type="text"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Enter specific purpose..."
                        value={otherPurpose}
                        onChange={(e) => setOtherPurpose(e.target.value)}
                        />
                    </div>
                    )}

                    {/* Request Document Dropdown */}
                    <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Request Document</label>
                    <CustomDropdown
                        value={documentType}
                        onChange={setDocumentType}
                        options={[
                        'Barangay Clearance',
                        'Barangay Business Clearance',
                        'Business Permit',
                        'Certificate of Indigency',
                        'Certificate of Residency'
                        ]}
                        placeholder="Select Document Type"
                    />
                    </div>

                    {/* Proceed Button */}
                    <button 
                        onClick={handleProceed}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6 text-sm"
                    >
                    Proceed to Editor
                    <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row h-full p-6 gap-6 print:p-0 print:block">
                {/* Left Column - Editor - Hidden on Print */}
                <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scrollbar print:hidden">
                    
                    {/* Request Details Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Request Details</h3>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-[11px] font-bold">
                                <CheckCircle size={12} />
                                No bad record
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><User size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">Resident Owner</p>
                                    <p className="text-sm font-bold text-gray-900">{formData.selectedResident}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><FileText size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">Document Type</p>
                                    <p className="text-sm font-bold text-gray-900">{documentType}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><Calendar size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">Date Issued</p>
                                    <p className="text-sm font-bold text-gray-900">{formData.dateIssued}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><MapPin size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">Address</p>
                                    <p className="text-sm font-bold text-gray-900">{formData.address || '—'}</p>
                                </div>
                            </div>
                            {formData.orNumber && (
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><FileText size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">OR Number</p>
                                    <p className="text-sm font-bold text-gray-900">{formData.orNumber}</p>
                                </div>
                            </div>
                            )}
                            {formData.documentNumber && (
                            <div className="flex gap-3">
                                <div className="mt-0.5 text-gray-400"><FileText size={16} /></div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase">Document Number</p>
                                    <p className="text-sm font-bold text-gray-900">{formData.documentNumber}</p>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Form Fields */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex-1">
                        <h3 className="font-bold text-gray-900 mb-4">Document Details</h3>
                        <div className="space-y-4">
                            {activeConfig?.fields.map((field) => (
                                <div key={field.key} className={`space-y-1.5 ${field.width === 'half' ? 'inline-block w-[48%] mr-[2%]' : 'w-full'}`}>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase">{field.label}</label>
                                    {field.type === 'select' ? (
                                        <CustomDropdown
                                            value={formData[field.key] || ''}
                                            onChange={(val) => handleInputChange(field.key, val)}
                                            options={field.options || []}
                                        />
                                    ) : field.type === 'currency' ? (
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₱</span>
                                            <input 
                                                type="number"
                                                value={formData[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <input 
                                            type={field.type}
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Preview */}
                <div className="flex-1 bg-gray-100 rounded-2xl p-8 overflow-y-auto flex justify-center items-start custom-scrollbar print:bg-white print:p-0 print:overflow-visible">
                    {activeConfig && <activeConfig.Template data={formData} />}
                </div>
            </div>
        )}
      </div>

      {/* Footer Actions (Only for Step 2) - Hidden on Print */}
      {step === 2 && (
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between z-10 print:hidden">
            <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-[13px] transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Initialization
            </button>
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
                <Printer size={16} />
                Issue & Print
            </button>
        </div>
      )}
    </ContentCard>
  );
};

export default Document;
