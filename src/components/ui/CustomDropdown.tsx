import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomDropdownProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, disabled, placeholder = 'Select', className }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <button 
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-sm font-medium text-gray-700 transition-all ${!disabled ? 'hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'opacity-60 cursor-not-allowed bg-gray-50'}`}
            >
                <span className={!value ? 'text-gray-400' : ''}>{value || placeholder}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-100 max-h-[200px] overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomDropdown;
