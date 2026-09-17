import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, FileText, User, Calendar, MapPin, CheckCircle, Printer, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ContentCard from '@/components/ui/ContentCard';
import CustomDropdown from '@/components/ui/CustomDropdown';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { getDocumentConfig, documentConfigs } from '@/config/documents';
import { DocumentConfig } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { residentsService } from '@/services/residents';
import { documentsService } from '@/services/documents';
import { getFullName } from '@/utils/formatName';
import type { FtjsStatus } from '@/services/documents';

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

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showIssueActions, setShowIssueActions] = useState(false);
  const [issuePdfName, setIssuePdfName] = useState('document.pdf');

  // Pre-fill State
  const [previousDocumentData, setPreviousDocumentData] = useState<{
    id: string;
    formData: Record<string, any> | null;
    purpose: string | null;
    issueDate: string;
  } | null>(null);
  const [showPrefillBanner, setShowPrefillBanner] = useState(false);
  const [ftjsStatus, setFtjsStatus] = useState<FtjsStatus | null>(null);
  const [ftjsMode, setFtjsMode] = useState<'issue' | 'reprint' | null>(null);

  const FTJS_TYPE_NAME = 'Barangay Certificate (FTJS)';

  const selectableDocTypes = useMemo(() => {
    // Only types with real templates; DB seed must include the same names.
    return documentConfigs.map((c) => c.name);
  }, []);

  const resetForm = () => {
    setSearchQuery('');
    setSelectedResident('');
    setSelectedResidentId('');
    setPurpose('');
    setOtherPurpose('');
    setDocumentType('Barangay Business Clearance');
    setActiveConfig(null);
    setFormData({});
    setFtjsStatus(null);
    setFtjsMode(null);
    setPreviousDocumentData(null);
    setShowPrefillBanner(false);
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

  // Fetch active residents from API (documents are only issued to living, present residents)
  const { data: residentsData } = useQuery({
    queryKey: ['residents', { pageSize: 1000, status: ['Active'] }],
    queryFn: () => residentsService.list({ pageSize: 1000, status: ['Active'] }),
  });
  const residents = residentsData?.data ?? [];

  // Fetch document types from API to get database IDs
  const { data: docTypes } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => documentsService.getTypes(),
  });

  // Fetch resident details when selected (to get address)
  const { data: residentDetails } = useQuery({
    queryKey: ['resident', selectedResidentId],
    queryFn: () => residentsService.getById(selectedResidentId),
    enabled: !!selectedResidentId,
  });

  const filteredResidents = useMemo(() => 
    residents.filter(r => 
      r.status === 'Active' &&
      getFullName(r).toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.length > 0
    ), [residents, searchQuery]
  );

  const handleProceed = async () => {
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

    // Get database document type ID
    const dbDocType = docTypes?.find(dt => dt.documentName === documentType);
    if (!dbDocType) {
      alert('Document type not found in database.');
      return;
    }

    setActiveConfig(config);

    const initialData: Record<string, any> = {
      selectedResident: getFullName(resident),
      purpose: purpose === 'Other' ? otherPurpose : purpose,
      barangayName: settings.barangayName,
      municipality: settings.municipality,
      province: settings.province,
      punongBarangay: settings.punongBarangay,
      secretary: settings.secretary || '',
      witnessName: settings.secretary || '',
      documentTypeId: dbDocType.id,
    };

    const now = new Date();
    const formatDateLong = (d: Date) =>
      d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });

    if (documentType === FTJS_TYPE_NAME) {
      const until = new Date(now.getTime());
      until.setFullYear(until.getFullYear() + 1);
      initialData.validUntil = formatDateLong(until);
      initialData.issueDateDisplay = formatDateLong(now);
      initialData.issueDay = String(now.getUTCDate());
      initialData.issueMonth = now.toLocaleDateString('en-US', {
        month: 'long',
        timeZone: 'UTC',
      });
      initialData.issueYear = String(now.getUTCFullYear());
    }

    if (documentType === 'Barangay Clearance' || documentType === 'Certificate of Indigency') {
      initialData.day = initialData.day || String(now.getUTCDate());
      initialData.month =
        initialData.month ||
        now.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
      initialData.year = initialData.year || String(now.getUTCFullYear());
    }

    if (documentType === 'Barangay Business Clearance') {
      initialData.day = String(now.getUTCDate());
      initialData.month = now.toLocaleDateString('en-US', {
        month: 'long',
        timeZone: 'UTC',
      });
      initialData.year = String(now.getUTCFullYear());
    }

    config.fields.forEach(field => {
      if (field.residentAttribute) {
        // For address, use residentDetails if available
        if (field.residentAttribute === 'address' && residentDetails?.household) {
          initialData[field.key] = `${residentDetails.household.streetName}, ${residentDetails.household.alley}, Sampaloc, Manila`;
        } else {
          const attr = resident[field.residentAttribute as keyof typeof resident] ?? (resident as any)[field.residentAttribute];
          if (attr) {
            initialData[field.key] = String(attr);
          }
        }
      } else if (field.defaultValue && initialData[field.key] === undefined) {
        initialData[field.key] = field.defaultValue;
      }
    });

    setFormData(initialData);

    // Fetch OR Number for preview
    try {
      const { orNumber } = await documentsService.getNextOrNumber();
      setFormData(prev => ({ ...prev, orNumber }));
    } catch {
      // OR Number fetch failed - will show N/A
    }

    // FTJS: once-only / reprint path
    if (documentType === FTJS_TYPE_NAME) {
      try {
        const status = await documentsService.getFtjsStatus(selectedResidentId);
        setFtjsStatus(status);
        if (status.hasFtjs) {
          if (!status.isValid) {
            alert(
              `FTJS already used (expired ${
                status.validUntil
                  ? new Date(status.validUntil).toLocaleDateString()
                  : 'unknown'
              }). New FTJS certificate not allowed.`
            );
            setFtjsStatus(null);
            setFtjsMode(null);
            return;
          }
          const reprintData: Record<string, any> = {
            ...initialData,
            ...(status.formData || {}),
            selectedResident: getFullName(resident),
            documentTypeId: dbDocType.id,
            purpose: purpose === 'Other' ? otherPurpose : purpose,
            barangayName: settings.barangayName,
            municipality: settings.municipality,
            province: settings.province,
            punongBarangay: settings.punongBarangay,
            secretary: settings.secretary || '',
            orNumber: status.orNumber || '',
            issueDateDisplay: status.issueDate
              ? formatDateLong(new Date(status.issueDate))
              : initialData.issueDateDisplay,
          };
          setFormData(reprintData);
          setActiveConfig(config);
          setFtjsMode('reprint');
          setShowPrefillBanner(false);
          setStep(2);
          return;
        }
        setFtjsMode('issue');
      } catch {
        setFtjsMode('issue');
      }
    } else {
      setFtjsStatus(null);
      setFtjsMode(null);
    }

    // Fetch previous document for pre-fill
    try {
      const lastDoc = await documentsService.getLastDocument(
        selectedResidentId,
        dbDocType.id
      );
      if (lastDoc && lastDoc.formData && documentType !== FTJS_TYPE_NAME) {
        setPreviousDocumentData(lastDoc);
        setShowPrefillBanner(true);
      } else {
        setPreviousDocumentData(null);
        setShowPrefillBanner(false);
      }
    } catch {
      setPreviousDocumentData(null);
      setShowPrefillBanner(false);
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setActiveConfig(null);
    setFormData({});
    setPreviousDocumentData(null);
    setShowPrefillBanner(false);
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUsePreviousData = () => {
    if (previousDocumentData?.formData) {
      setFormData(prev => ({
        ...prev,
        ...previousDocumentData.formData,
      }));
    }
    setShowPrefillBanner(false);
  };

  const handlePrint = () => {
    // Show confirmation modal first
    setShowConfirmModal(true);
  };

  const handleConfirmIssue = async () => {
    if (!selectedResidentId || !activeConfig) return;

    // Reprint path: do not create a new Document/Order
    if (ftjsMode === 'reprint') {
      setShowConfirmModal(false);
      const sanitize = (s: string) =>
        s
          .replace(/[\\/:*?"<>|]+/g, "_")
          .replace(/\s+/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "");
      const residentName = formData.selectedResident || "Resident";
      const docName = activeConfig?.name || documentType;
      const dateStr = new Date().toISOString().slice(0, 10);
      setIssuePdfName(
        `${sanitize(residentName)}_${sanitize(docName)}_reprint_${dateStr}.pdf`
      );
      setShowIssueActions(true);
      return;
    }

    // Get documentTypeId from formData (database ID)
    const documentTypeId = formData.documentTypeId;
    if (!documentTypeId) {
      alert('Document type not found. Please try again.');
      setShowConfirmModal(false);
      return;
    }

    setIsIssuing(true);

    try {
      const result = await documentsService.create({
        residentId: selectedResidentId,
        documentTypeId,
        purpose: purpose === 'Other' ? otherPurpose : purpose,
        formData,
        validityPeriod:
          documentType === FTJS_TYPE_NAME
            ? formData.validUntil || undefined
            : undefined,
      });

      // Update formData with OR Number
      setFormData(prev => ({
        ...prev,
        orNumber: result.order?.orNumber ?? '',
      }));

      setShowConfirmModal(false);

      // Build a meaningful default file name for the Save-as-PDF option.
      const sanitize = (s: string) =>
        s
          .replace(/[\\/:*?"<>|]+/g, "_")
          .replace(/\s+/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "");
      const residentName = formData.selectedResident || "Resident";
      const docName = activeConfig?.name || documentType;
      const dateStr = new Date().toISOString().slice(0, 10);
      setIssuePdfName(
        `${sanitize(residentName)}_${sanitize(docName)}_${dateStr}.pdf`
      );

      // Wait for the preview to render the OR number, then let the user
      // choose to save the PDF or print it.
      setTimeout(() => {
        setShowIssueActions(true);
        setIsIssuing(false);
      }, 150);
    } catch (err: any) {
      const message =
        err?.message ||
        err?.error ||
        (typeof err === 'string' ? err : '') ||
        'Failed to create document. Please try again.';
      alert(message);
      setShowConfirmModal(false);
      setIsIssuing(false);
    }
  };

  const finalizeIssue = () => {
    setShowIssueActions(false);
    resetForm();
    setStep(1);
  };

  const handleSavePdf = async () => {
    setShowIssueActions(false);
    try {
      if (window.electronAPI) {
        const res: any = await window.electronAPI.invoke("save-pdf", issuePdfName);
        if (res?.error) throw new Error(res.error);
      } else {
        // Not running in Electron (e.g. browser dev) — fall back to print.
        window.print();
      }
    } catch (err: any) {
      alert(
        `The document was issued, but saving the PDF failed: ${
          err?.message ?? "unknown error"
        }`
      );
    } finally {
      finalizeIssue();
    }
  };

  const handlePrintDocument = () => {
    setShowIssueActions(false);
    // Let the modal unmount before printing so it isn't captured.
    setTimeout(() => {
      window.print();
      finalizeIssue();
    }, 150);
  };

  const handleCancelIssue = () => {
    setShowConfirmModal(false);
  };

  return (
    <ContentCard className="relative">
      {/* Header inside the card - Hidden on Print */}
      <div className="sticky top-0 left-0 w-full p-6 border-b border-gray-50 bg-white z-20 print:hidden">
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
      <div className="flex-1 overflow-y-auto custom-scrollbar print:overflow-visible">
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
                        options={Array.from(new Set([...(settings.purposes ?? []), 'Other']))}
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
                        options={selectableDocTypes}
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

                    {ftjsMode === 'reprint' && ftjsStatus?.hasFtjs && (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className="text-amber-600" />
                          <div>
                            <p className="text-sm font-medium text-amber-900">
                              FTJS already issued on{' '}
                              {ftjsStatus.issueDate
                                ? new Date(ftjsStatus.issueDate).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'unknown'}
                              {' '}— valid until{' '}
                              {ftjsStatus.validUntil
                                ? new Date(ftjsStatus.validUntil).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'unknown'}
                              .
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              You are reprinting the same certificate. No new availment; validity end date is unchanged.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {showPrefillBanner && previousDocumentData && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Previous {documentType} found
                            </p>
                            <p className="text-xs text-blue-600">
                              Issued on {new Date(previousDocumentData.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleUsePreviousData}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Use Previous Data
                        </button>
                      </div>
                    )}

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
                {ftjsMode === 'reprint' ? 'Reprint Certificate' : 'Issue & Print'}
            </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelIssue}
        onConfirm={handleConfirmIssue}
        title={ftjsMode === 'reprint' ? 'Reprint FTJS Certificate' : 'Issue Document'}
        message={
          ftjsMode === 'reprint'
            ? `Reprint ${documentType} using the existing issuance record? This does not create a new availment.`
            : `Are you sure you want to issue this ${documentType}? This action cannot be undone.`
        }
        confirmText={
          isIssuing
            ? 'Issuing...'
            : ftjsMode === 'reprint'
              ? 'Reprint Certificate'
              : 'Issue & Print'
        }
        cancelText="Cancel"
        isLoading={isIssuing}
      />

      {/* Post-issue actions: save a named PDF or print */}
      {showIssueActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Document Issued</h3>
              <p className="text-sm text-gray-500 mb-6">
                Save it as a PDF, or send it to a printer.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleSavePdf}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  <FileText size={18} /> Save PDF
                </button>
                <button
                  onClick={handlePrintDocument}
                  className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <Printer size={18} /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentCard>
  );
};

export default Document;
