import React from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Unsaved Changes", 
    message = "You have unsaved edits. If you exit now, your changes will be lost.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false,
    variant = "danger"
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: "bg-red-100",
            iconColor: "text-red-500",
            confirmBg: "bg-red-600 hover:bg-red-700",
            confirmShadow: "shadow-red-200",
            Icon: AlertTriangle,
        },
        warning: {
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-500",
            confirmBg: "bg-yellow-600 hover:bg-yellow-700",
            confirmShadow: "shadow-yellow-200",
            Icon: AlertTriangle,
        },
        info: {
            iconBg: "bg-blue-100",
            iconColor: "text-blue-500",
            confirmBg: "bg-blue-600 hover:bg-blue-700",
            confirmShadow: "shadow-blue-200",
            Icon: Info,
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center shrink-0`}>
                            <styles.Icon size={20} className={styles.iconColor} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading}
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
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2.5 rounded-lg ${styles.confirmBg} text-white font-bold text-[14px] transition-colors shadow-lg ${styles.confirmShadow} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
