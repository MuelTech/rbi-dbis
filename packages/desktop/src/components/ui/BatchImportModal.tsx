import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, FileText, Check, X, AlertTriangle, Users, ChevronLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '@/components/ui/Modal';
import { Resident } from '@/types';
import { residentsService } from '@/services/residents';

// --- Types ---

type ImportRowStatus = 'success' | 'duplicate' | 'error';

interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
  status: ImportRowStatus;
  message: string;
}

interface ImportResult {
  success: number;
  updated: number;
  duplicates: number;
  errors: number;
}

interface ImportFamily {
  family_id: string;
  household: Record<string, string>;
  address: Record<string, string>;
  pet: Record<string, string> | null;
  vehicle: Record<string, string> | null;
  head: Record<string, string>;
  members: Record<string, string>[];
}

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
  existingResidents: Resident[];
}

// --- Constants ---

const TEMPLATE_COLUMNS = [
  'family_id',
  'relationship',
  'block',
  'household_number',
  'house_number',
  'street_name',
  'alley',
  'has_pets',
  'number_of_dogs',
  'number_of_cats',
  'other_animals',
  'has_vehicles',
  'number_of_motorcycles',
  'motorcycle_plate_numbers',
  'number_of_other_vehicles',
  'vehicle_plate_numbers',
  'last_name',
  'first_name',
  'middle_name',
  'suffix',
  'date_of_birth',
  'place_of_birth',
  'civil_status',
  'sex',
  'contact_number',
  'occupation',
  'is_student',
  'education_level',
  'is_voter',
  'is_pwd',
  'is_solo_parent',
  'is_owner',
];

const REQUIRED_FIELDS = ['family_id', 'relationship', 'last_name', 'first_name', 'date_of_birth', 'sex'];

const MAX_ROWS = 500;

// --- Validation ---

interface ValidationError {
  field: string;
  message: string;
}

function validateRow(row: Record<string, string>, isHead: boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push({ field, message: `Missing required field: ${field}` });
    }
  }
  if (isHead) {
    const headRequired = ['block', 'household_number', 'house_number', 'street_name', 'alley'];
    for (const field of headRequired) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({ field, message: `Missing required field for head: ${field}` });
      }
    }
  }
  if (row.date_of_birth && row.date_of_birth.trim() !== '') {
    const parsed = Date.parse(row.date_of_birth);
    if (isNaN(parsed)) {
      errors.push({ field: 'date_of_birth', message: 'Invalid date format' });
    } else if (new Date(parsed) > new Date()) {
      errors.push({ field: 'date_of_birth', message: 'Birthdate is in the future' });
    }
  }
  if (row.sex && !['male', 'female'].includes(row.sex.toLowerCase().trim())) {
    errors.push({ field: 'sex', message: 'Sex must be "Male" or "Female"' });
  }
  const yesNoFields = ['is_voter', 'is_pwd', 'is_solo_parent', 'is_owner', 'has_pets', 'has_vehicles'];
  for (const field of yesNoFields) {
    if (row[field] && row[field].trim() !== '' && !['yes', 'no'].includes(row[field].toLowerCase().trim())) {
      errors.push({ field, message: 'Must be "Yes" or "No"' });
    }
  }
  return errors;
}

// --- Grouping ---

function parseGroupedRows(rows: Record<string, string>[]): ImportFamily[] {
  const familyMap = new Map<string, ImportFamily>();
  for (const row of rows) {
    const familyId = (row.family_id || '').trim();
    if (!familyId) continue;
    if (!familyMap.has(familyId)) {
      familyMap.set(familyId, {
        family_id: familyId,
        household: { block: row.block || '', household_number: row.household_number || '' },
        address: { house_number: row.house_number || '', street_name: row.street_name || '', alley: row.alley || '' },
        pet: null,
        vehicle: null,
        head: row,
        members: [],
      });
    }
    const family = familyMap.get(familyId)!;
    if (row.relationship?.toLowerCase() === 'head') {
      family.head = row;
      family.household = { block: row.block || '', household_number: row.household_number || '' };
      family.address = { house_number: row.house_number || '', street_name: row.street_name || '', alley: row.alley || '' };
      if (row.has_pets === 'Yes' || row.has_pets === 'yes') {
        family.pet = { has_pets: row.has_pets, number_of_dogs: row.number_of_dogs || '0', number_of_cats: row.number_of_cats || '0', other_animals: row.other_animals || '' };
      }
      if (row.has_vehicles === 'Yes' || row.has_vehicles === 'yes') {
        family.vehicle = { has_vehicles: row.has_vehicles, number_of_motorcycles: row.number_of_motorcycles || '0', motorcycle_plate_numbers: row.motorcycle_plate_numbers || '', number_of_other_vehicles: row.number_of_other_vehicles || '0', vehicle_plate_numbers: row.vehicle_plate_numbers || '' };
      }
    } else {
      family.members.push(row);
    }
  }
  return Array.from(familyMap.values());
}

// --- Sub-components ---

const StatusBadge = ({ status }: { status: ImportRowStatus }) => {
  const config: Record<ImportRowStatus, { className: string; label: string }> = {
    success: {
      className: 'text-[#166534] bg-[#F0FDF4]',
      label: 'Ready',
    },
    duplicate: {
      className: 'text-[#9A3412] bg-[#FFFBEB]',
      label: 'Duplicate',
    },
    error: {
      className: 'text-[#991B1B] bg-[#FEF2F2]',
      label: 'Error',
    },
  };

  const { className, label } = config[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold ${className}`}>
      {label}
    </span>
  );
};

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, label: 'Upload', icon: Upload },
    { number: 2, label: 'Preview', icon: FileText },
    { number: 3, label: 'Results', icon: Check },
  ];

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isUpcoming = currentStep < step.number;

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted || isActive
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-[14px] font-bold">{step.number}</span>
                )}
              </div>
              <span
                className={`mt-2 text-[12px] font-bold ${
                  isActive || isCompleted ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-4 mb-6 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// --- Main Component ---

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingResidents,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>('skip');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>({ success: 0, updated: 0, duplicates: 0, errors: 0 });
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const existingResidentsRef = useRef(existingResidents);
  existingResidentsRef.current = existingResidents;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const successCount = parsedRows.filter((r) => r.status === 'success').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = parsedRows.filter((r) => r.status === 'error').length;
  const importableCount = successCount + (duplicateAction === 'overwrite' ? duplicateCount : 0);
  const totalRows = parsedRows.length;

  const successFamilies = parseGroupedRows(parsedRows.map((r) => r.data));

  const resetState = useCallback(() => {
    setStep(1);
    setFileName('');
    setParsedRows([]);
    setDuplicateAction('skip');
    setImporting(false);
    setImportResult({ success: 0, updated: 0, duplicates: 0, errors: 0 });
    setFileError('');
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const checkDuplicate = (row: Record<string, string>): boolean => {
    return existingResidentsRef.current.some(
      (r) =>
        r.lastName?.toLowerCase().trim() === row.last_name?.toLowerCase().trim() &&
        r.firstName?.toLowerCase().trim() === row.first_name?.toLowerCase().trim() &&
        r.dateOfBirth?.substring(0, 10) === row.date_of_birth?.trim().substring(0, 10)
    );
  };

  const processFile = useCallback(
    (file: File) => {
      setFileError('');

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
        setFileError('Invalid file type. Please upload a .csv, .xlsx, or .xls file.');
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (json.length === 0) {
            setFileError('The uploaded file has no data rows. Please add resident data below the header row.');
            return;
          }

          if (json.length > MAX_ROWS) {
            setFileError(`File contains ${json.length} rows. Maximum allowed is ${MAX_ROWS} rows per import.`);
            return;
          }

          const normalizedRows = json.map((row) => {
            const normalized: Record<string, string> = {};
            for (const key of Object.keys(row)) {
              normalized[key.toLowerCase().trim().replace(/\s+/g, '_')] = String(row[key]).trim();
            }
            return normalized;
          });

          const importRows: ImportRow[] = normalizedRows.map((row, index) => {
            const isHead = row.relationship?.toLowerCase() === 'head';
            const errors = validateRow(row, isHead);
            if (errors.length > 0) {
              return {
                rowNumber: index + 2,
                data: row,
                status: 'error' as ImportRowStatus,
                message: errors.map((e) => e.message).join('; '),
              };
            }

            const isDup = checkDuplicate(row);
            if (isDup) {
              return {
                rowNumber: index + 2,
                data: row,
                status: 'duplicate' as ImportRowStatus,
                message: 'Resident already exists (matching name + birthdate)',
              };
            }

            return {
              rowNumber: index + 2,
              data: row,
              status: 'success' as ImportRowStatus,
              message: '',
            };
          });

          setParsedRows(importRows);
          setStep(2);
        } catch {
          setFileError('Failed to parse file. Please ensure it is a valid CSV or Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
    },
    []
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Residents');
    XLSX.writeFile(wb, 'resident_import_template.xlsx');
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const importableRows = parsedRows.filter(r => 
        r.status === 'success' || (r.status === 'duplicate' && duplicateAction === 'overwrite')
      ).map(r => r.data);
      const families = parseGroupedRows(importableRows);
      const result = await residentsService.batchImport({ families, duplicateAction });
      setImportResult({
        success: result.created,
        updated: result.updated,
        duplicates: result.skipped,
        errors: result.errors.length,
      });
      setImporting(false);
      setStep(3);
    } catch (err: any) {
      setImportResult({ success: 0, updated: 0, duplicates: 0, errors: 1 });
      setImporting(false);
      setStep(3);
    }
  }, [parsedRows, duplicateAction]);

  const handleDone = useCallback(() => {
    const count = importResult.success;
    resetState();
    onImportComplete(count);
  }, [importResult.success, resetState, onImportComplete]);

  // --- Render Steps ---

  const renderStep1 = () => (
    <div className="flex flex-col items-center py-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-md mx-auto border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-400 bg-blue-50/30'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-gray-700">Click to upload or drag & drop</p>
        <p className="text-[13px] text-gray-400 mt-1">Supports .csv, .xlsx, .xls</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      {fileError && (
        <div className="mt-4 flex items-center gap-2 text-red-500 text-[13px] font-medium">
          <AlertTriangle className="w-4 h-4" />
          {fileError}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#22C55E] hover:bg-green-600 text-white rounded-xl text-[13px] font-bold shadow-sm shadow-green-200 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download Import Template
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#F0FDF4] border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#166534]">{successCount}</div>
          <div className="text-[13px] font-medium text-[#166534]/70">Ready</div>
        </div>
        <div className="bg-[#FFFBEB] border border-orange-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#9A3412]">{duplicateCount}</div>
          <div className="text-[13px] font-medium text-[#9A3412]/70">Duplicates</div>
        </div>
        <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#991B1B]">{errorCount}</div>
          <div className="text-[13px] font-medium text-[#991B1B]/70">Errors</div>
        </div>
      </div>

      {duplicateCount > 0 && (
        <div className="bg-[#FFFBEB] border border-orange-200 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-[13px] font-bold text-[#9A3412]">Duplicate handling:</span>

          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${
              duplicateAction === 'skip'
                ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-200 text-blue-700'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <input
              type="radio"
              name="dupAction"
              className="hidden"
              checked={duplicateAction === 'skip'}
              onChange={() => setDuplicateAction('skip')}
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                duplicateAction === 'skip' ? 'border-blue-600' : 'border-gray-300'
              }`}
            >
              {duplicateAction === 'skip' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
            </div>
            <span className="text-[13px] font-medium">Skip duplicates</span>
          </label>

          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${
              duplicateAction === 'overwrite'
                ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-200 text-blue-700'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <input
              type="radio"
              name="dupAction"
              className="hidden"
              checked={duplicateAction === 'overwrite'}
              onChange={() => setDuplicateAction('overwrite')}
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                duplicateAction === 'overwrite' ? 'border-blue-600' : 'border-gray-300'
              }`}
            >
              {duplicateAction === 'overwrite' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
            </div>
            <span className="text-[13px] font-medium">Overwrite existing</span>
          </label>
        </div>
      )}

      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-auto max-h-[35vh]">
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4 text-[13px] font-bold text-blue-500 whitespace-nowrap">Family ID</th>
                <th className="text-left py-3 px-4 text-[13px] font-bold text-blue-500 whitespace-nowrap">Head Name</th>
                <th className="text-left py-3 px-4 text-[13px] font-bold text-blue-500 whitespace-nowrap">Members</th>
                <th className="text-left py-3 px-4 text-[13px] font-bold text-blue-500 whitespace-nowrap">Status</th>
                <th className="text-left py-3 px-4 text-[13px] font-bold text-blue-500 whitespace-nowrap">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {successFamilies.map((family) => {
                const headRow = parsedRows.find(
                  (r) => r.data.family_id === family.family_id && r.data.relationship?.toLowerCase() === 'head'
                );
                const allRowsForFamily = parsedRows.filter((r) => r.data.family_id === family.family_id);
                const hasError = allRowsForFamily.some((r) => r.status === 'error');
                const allDuplicate = allRowsForFamily.every((r) => r.status === 'duplicate');
                const firstError = allRowsForFamily.find((r) => r.status === 'error');
                const familyStatus: ImportRowStatus = hasError ? 'error' : allDuplicate ? 'duplicate' : 'success';
                const familyMessage = hasError && firstError ? firstError.message : allDuplicate ? 'All residents already exist' : '';

                return (
                  <tr key={family.family_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-[14px] font-bold text-gray-900">{family.family_id}</td>
                    <td className="px-4 py-3 text-[14px] text-gray-700 font-medium">
                      {family.head.first_name} {family.head.last_name}
                    </td>
                    <td className="px-4 py-3 text-[14px] text-gray-700 font-medium">{family.members.length}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={familyStatus} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 font-medium max-w-[200px] truncate">
                      {familyMessage}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col items-center py-6">
      <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border-2 border-green-300 flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-[#166534]" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 text-center">Import Complete!</h3>

      <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-md mx-auto">
        <div className="bg-[#F0FDF4] border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#166534]">{importResult.success}</div>
          <div className="text-[13px] font-medium text-[#166534]/70">Imported</div>
        </div>
        <div className="bg-[#FFFBEB] border border-orange-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#9A3412]">{importResult.updated}</div>
          <div className="text-[13px] font-medium text-[#9A3412]/70">Overwritten</div>
        </div>
        <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-[#991B1B]">{importResult.errors}</div>
          <div className="text-[13px] font-medium text-[#991B1B]/70">Failed</div>
        </div>
      </div>

      <p className="text-[13px] text-gray-500 font-medium text-center mt-4">
        {fileName} — {totalRows} rows processed
      </p>
    </div>
  );

  // --- Footer ---

  const renderFooter = () => (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
      <div>
        {step === 2 && (
          <button
            onClick={() => {
              setStep(1);
              setParsedRows([]);
              setFileName('');
              setFileError('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {(step === 1 || step === 2) && (
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}

        {step === 2 && (
          <button
            onClick={handleImport}
            disabled={importableCount === 0 || importing}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-[14px] font-semibold shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {importableCount} Records
              </>
            )}
          </button>
        )}

        {step === 3 && (
          <button
            onClick={handleDone}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] hover:bg-green-600 text-white rounded-xl text-[14px] font-semibold shadow-sm shadow-green-200 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Batch Import Residents" maxWidth="max-w-4xl" disableScroll={true}>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <StepIndicator currentStep={step} />
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {renderFooter()}
    </Modal>
  );
};

export default BatchImportModal;
