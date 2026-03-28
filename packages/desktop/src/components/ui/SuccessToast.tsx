import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
            <div className="bg-white border border-green-500 rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 min-w-[300px]">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm shadow-green-200">
                    <Check size={14} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[15px] font-medium text-gray-700">{message}</span>
            </div>
        </div>
    );
};

export default SuccessToast;
