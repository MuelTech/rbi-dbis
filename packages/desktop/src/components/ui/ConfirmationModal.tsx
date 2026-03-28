import React from 'react';
import { X, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Unsaved Changes", 
    message = "You have unsaved edits. If you exit now, your changes will be lost." 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <Info size={20} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-2">
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 transition-colors"
                    >
                        Stay on this Page
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] transition-colors shadow-lg shadow-red-200"
                    >
                        Discard Changes and Exit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
