import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContentCard from '@/components/ui/ContentCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Image, MapPin, Users, Save, Upload, Settings as SettingsIcon, FileText, List, Plus, X, Database, Download, UploadCloud, History, FileUp, Loader2 } from 'lucide-react';
import { settingsService, BarangaySettings } from '@/services/settings';

interface SettingsProps {
    onShowSuccess?: (message: string) => void;
    setIsNavigationBlocked?: (blocked: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ onShowSuccess, setIsNavigationBlocked }) => {
    const [activeTab, setActiveTab] = useState('General Information');
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: () => settingsService.get(),
    });

    const [formData, setFormData] = useState<BarangaySettings | null>(null);
    const [purposes, setPurposes] = useState<string[]>([]);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
            setPurposes(settings.purposes);
        }
    }, [settings]);

    const [newPurpose, setNewPurpose] = useState('');
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const saveMutation = useMutation({
        mutationFn: (data: BarangaySettings) => settingsService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            if (onShowSuccess) onShowSuccess('Settings saved successfully');
            if (setIsNavigationBlocked) setIsNavigationBlocked(false);
        },
    });

    const backupMutation = useMutation({
        mutationFn: () => settingsService.backup(),
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rbi-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            const now = new Date();
            setLastBackup(now.toLocaleString());
            if (onShowSuccess) onShowSuccess('Backup downloaded successfully');
        },
    });

    const restoreMutation = useMutation({
        mutationFn: (data: any) => settingsService.restore(data),
        onSuccess: () => {
            queryClient.invalidateQueries();
            if (onShowSuccess) onShowSuccess('Data restored successfully. Please log in again.');
            if (setIsNavigationBlocked) setIsNavigationBlocked(false);
        },
    });

    const isDirty = JSON.stringify(formData) !== JSON.stringify(settings) || JSON.stringify(purposes) !== JSON.stringify(settings?.purposes);

    useEffect(() => {
        if (setIsNavigationBlocked) {
            setIsNavigationBlocked(isDirty);
        }
    }, [isDirty, setIsNavigationBlocked]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleAddPurpose = () => {
        if (newPurpose.trim()) {
            setPurposes([...purposes, newPurpose.trim()]);
            setNewPurpose('');
        }
    };

    const handleRemovePurpose = (index: number) => {
        setPurposes(purposes.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!formData) return;
        const payload = { ...formData, purposes };
        await saveMutation.mutateAsync(payload);
    };

    const handleBackup = () => {
        backupMutation.mutate();
    };

    const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingRestoreFile(file);
        setShowRestoreConfirm(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRestoreConfirm = async () => {
        if (!pendingRestoreFile) return;
        try {
            const text = await pendingRestoreFile.text();
            let backup;
            try {
                backup = JSON.parse(text);
            } catch {
                if (onShowSuccess) onShowSuccess('Invalid backup file: not valid JSON');
                setShowRestoreConfirm(false);
                setPendingRestoreFile(null);
                return;
            }
            await restoreMutation.mutateAsync(backup);
        } catch (err: any) {
            const msg = err?.message || 'Restore failed';
            if (onShowSuccess) onShowSuccess(`Restore failed: ${msg}`);
        }
        setShowRestoreConfirm(false);
        setPendingRestoreFile(null);
    };

    const tabs = [
        { name: 'General Information', id: 'general' },
        { name: 'Document Settings', id: 'document' },
        { name: 'Backup & Restore', id: 'backup' },
    ];

    if (isLoading) {
        return (
            <div className="h-full">
                <ContentCard className="flex flex-col h-full items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                </ContentCard>
            </div>
        );
    }

    return (
        <div className="h-full">
            <ContentCard className="flex flex-col h-full">
                {/* Header / Tabs */}
                <div className="flex-none px-8 pt-8 pb-0 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <SettingsIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    </div>
                    
                    <div className="flex gap-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.name)}
                                className={`pb-4 text-sm font-semibold transition-all relative ${
                                    activeTab === tab.name
                                        ? 'text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.name}
                                {activeTab === tab.name && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                    {activeTab === 'General Information' && (
                        <div className="max-w-5xl mx-auto space-y-6">
                            
                            {/* Branding & Identity */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Image className="w-5 h-5 text-blue-500" />
                                    <h2 className="text-sm font-bold text-gray-900">Branding & Identity</h2>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Logo Upload */}
                                    <div className="flex-shrink-0">
                                        <div className="w-40 h-40 rounded-full border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                                            <span className="text-xs font-medium text-gray-400 group-hover:text-blue-500">Upload Logo</span>
                                        </div>
                                    </div>

                                    {/* Slogan */}
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Barangay Slogan</label>
                                        <textarea 
                                            name="slogan"
                                            value={formData?.slogan ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <MapPin className="w-5 h-5 text-green-500" />
                                    <h2 className="text-sm font-bold text-gray-900">Location Details</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Barangay Name</label>
                                        <input 
                                            type="text" 
                                            name="barangayName"
                                            value={formData?.barangayName ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Municipality / City</label>
                                        <input 
                                            type="text" 
                                            name="municipality"
                                            value={formData?.municipality ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Province</label>
                                        <input 
                                            type="text" 
                                            name="province"
                                            value={formData?.province ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Telephone Number</label>
                                        <input 
                                            type="text" 
                                            name="telephone"
                                            value={formData?.telephone ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Barangay Officials */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Users className="w-5 h-5 text-purple-500" />
                                    <h2 className="text-sm font-bold text-gray-900">Barangay Officials</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Punong Barangay */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Punong Barangay</label>
                                        <input 
                                            type="text" 
                                            name="punongBarangay"
                                            value={formData?.punongBarangay ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full max-w-md p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Kagawad */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-4">Sangguniang Barangay Members (Kagawad)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Councilor 1', name: 'councilor1' },
                                                { label: 'Councilor 2', name: 'councilor2' },
                                                { label: 'Councilor 3', name: 'councilor3' },
                                                { label: 'Councilor 4', name: 'councilor4' },
                                                { label: 'Councilor 5', name: 'councilor5' },
                                                { label: 'Councilor 6', name: 'councilor6' },
                                                { label: 'Councilor 7', name: 'councilor7' },
                                            ].map((councilor, index) => (
                                                <div key={index}>
                                                    <label className="block text-[10px] font-medium text-gray-400 mb-1.5">{councilor.label}</label>
                                                    <input 
                                                        type="text" 
                                                        name={councilor.name}
                                                        value={(formData as any)?.[councilor.name] ?? ''}
                                                        onChange={handleInputChange}
                                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Other Officials */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-2">SK Chairman</label>
                                            <input 
                                                type="text" 
                                                name="skChairman"
                                                value={formData?.skChairman ?? ''}
                                                onChange={handleInputChange}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-2">Brgy. Treasurer</label>
                                            <input 
                                                type="text" 
                                                name="treasurer"
                                                value={formData?.treasurer ?? ''}
                                                onChange={handleInputChange}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-2">Brgy. Secretary</label>
                                            <input 
                                                type="text" 
                                                name="secretary"
                                                value={formData?.secretary ?? ''}
                                                onChange={handleInputChange}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Document Settings' && (
                        <div className="max-w-5xl mx-auto space-y-6">
                            {/* Document Fees */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <h2 className="text-sm font-bold text-gray-900">Document Fees</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Barangay Clearance', name: 'clearanceFee' },
                                        { label: 'Barangay Certificate of Residency', name: 'residencyFee' },
                                        { label: 'Barangay Business Clearance', name: 'businessFee' },
                                        { label: 'Certificate of House Ownership', name: 'ownershipFee' },
                                    ].map((doc, index) => (
                                        <div key={index}>
                                            <label className="block text-xs font-semibold text-gray-500 mb-2">{doc.label}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
                                                <input 
                                                    type="text" 
                                                    name={doc.name}
                                                    value={(formData as any)?.[doc.name] ?? ''}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* List of Purposes */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <List className="w-5 h-5 text-orange-500" />
                                    <h2 className="text-sm font-bold text-gray-900">List of Purposes</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Enter new purpose..."
                                            value={newPurpose}
                                            onChange={(e) => setNewPurpose(e.target.value)}
                                            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={handleAddPurpose}
                                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                                        >
                                            <Plus size={16} />
                                            Add
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {purposes.map((purpose, index) => (
                                            <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full group hover:border-gray-300 transition-colors">
                                                <span className="text-xs font-medium text-gray-600">{purpose}</span>
                                                <button 
                                                    onClick={() => handleRemovePurpose(index)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Backup & Restore' && (
                        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Backup Data */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-8">
                                    <Database className="w-5 h-5 text-green-500" />
                                    <h2 className="text-sm font-bold text-gray-900">Backup Data</h2>
                                </div>

                                <div className="flex-1 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                        <Download className="w-10 h-10 text-green-500" />
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Export System Data</h3>
                                    <p className="text-sm text-gray-500 mb-8 max-w-xs">
                                        Create a secure backup file containing all resident profiles, family records, document settings, and system configurations.
                                    </p>

                                    <div className="w-full bg-gray-50 rounded-xl p-4 mb-8 text-left">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <History size={14} />
                                            <span className="text-xs font-medium">Last Backup:</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">{lastBackup ?? 'No backup yet'}</p>
                                    </div>

                                    <button 
                                        onClick={handleBackup}
                                        disabled={backupMutation.isPending}
                                        className="w-full bg-[#10B981] hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {backupMutation.isPending ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Download size={18} />
                                        )}
                                        {backupMutation.isPending ? 'Backing up...' : 'Download Backup'}
                                    </button>
                                </div>
                            </div>

                            {/* Restore Data */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-8">
                                    <UploadCloud className="w-5 h-5 text-blue-500" />
                                    <h2 className="text-sm font-bold text-gray-900">Restore Data</h2>
                                </div>

                                <div className="flex-1 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                        <FileUp className="w-10 h-10 text-blue-500" />
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Import Backup File</h3>
                                    <p className="text-sm text-gray-500 mb-2 max-w-xs">
                                        Restore your system from a previously saved backup file.
                                    </p>
                                    <p className="text-xs font-bold text-red-500 mb-8">
                                        Warning: This action will overwrite existing data.
                                    </p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json"
                                        onChange={handleRestoreFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={restoreMutation.isPending}
                                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {restoreMutation.isPending ? (
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                        ) : (
                                            <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                        )}
                                        <span className="text-sm font-bold text-gray-500 group-hover:text-blue-600 transition-colors">
                                            {restoreMutation.isPending ? 'Restoring...' : 'Select File to Restore'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <ConfirmationModal
                                isOpen={showRestoreConfirm}
                                onClose={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
                                onConfirm={handleRestoreConfirm}
                                title="Restore Backup?"
                                message={`This will overwrite all current data with the contents of "${pendingRestoreFile?.name}". This action cannot be undone. Continue?`}
                            />
                        </div>
                    )}
                </div>

                {/* Sticky Footer */}
                {activeTab !== 'Backup & Restore' && (
                    <div className="flex-none p-6 bg-white border-t border-gray-100 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saveMutation.isPending || !isDirty}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saveMutation.isPending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </ContentCard>
        </div>
    );
};

export default Settings;
