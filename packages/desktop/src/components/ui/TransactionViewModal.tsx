import React from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@/services/dashboard';
import { documentsService } from '@/services/documents';
import { getDocumentConfig } from '@/config/documents';
import { useSettings } from '@/hooks/useSettings';

interface TransactionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionViewModal: React.FC<TransactionViewModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { settings } = useSettings();

  // Fetch document details using the document ID
  const { data: documentData, isLoading } = useQuery({
    queryKey: ['document', transaction?.documentId],
    queryFn: () => documentsService.getById(transaction?.documentId || ''),
    enabled: !!transaction?.documentId,
  });

  if (!isOpen || !transaction) return null;

  // Get the document config based on document type
  const config = getDocumentConfig(transaction.documentType);

  // Prepare template data
  const templateData = documentData ? {
    ...documentData.formData,
    selectedResident: transaction.resident,
    orNumber: transaction.orNumber,
    dateIssued: new Date(documentData.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    barangayName: settings.barangayName,
    municipality: settings.municipality,
    province: settings.province,
    punongBarangay: settings.punongBarangay,
  } : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Document Preview</h3>
              <p className="text-sm text-gray-500">OR Number: {transaction.orNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body - Document Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : templateData && config ? (
            <div className="bg-white shadow-lg print:shadow-none">
              <config.Template data={templateData} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText size={48} className="mb-4 text-gray-300" />
              <p>Document template not available</p>
              <p className="text-sm">Type: {transaction.documentType}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionViewModal;
