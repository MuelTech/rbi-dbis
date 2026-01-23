import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    error?: string;
    className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Select", error, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[14px] text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${value ? 'text-gray-700' : 'text-gray-400'}`}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-lg transition-colors flex items-center justify-between ${
                                    value === option.value
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                            >
                                {option.label}
                                {value === option.value && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default CustomSelect;
