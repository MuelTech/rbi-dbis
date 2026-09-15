import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContentCard from '@/components/ui/ContentCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Image, MapPin, Users, Save, Upload, Settings as SettingsIcon, FileText, List, Plus, X, Database, Download, UploadCloud, History, FileUp, Loader2, Lock, Eye, EyeOff, KeyRound, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { settingsService, BarangaySettings, ProgressUpdate, getBackupUnlock, setBackupUnlock, clearBackupUnlock } from '@/services/settings';
import { useAuth } from '@/context/AuthContext';

interface SettingsProps {
    onShowSuccess?: (message: string) => void;
    setIsNavigationBlocked?: (blocked: boolean) => void;
}

const LAST_BACKUP_META_KEY = 'rbiLastBackupMeta';

interface BackupMetaDisplay {
    version: number;
    exportedAt: string;
    total: number;
}

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const Settings: React.FC<SettingsProps> = ({ onShowSuccess, setIsNavigationBlocked }) => {
    const [activeTab, setActiveTab] = useState('General Information');
    const queryClient = useQueryClient();
    const { logout, user } = useAuth();

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
    const [lastBackupMeta, setLastBackupMeta] = useState<BackupMetaDisplay | null>(() => {
        const raw = localStorage.getItem(LAST_BACKUP_META_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as BackupMetaDisplay;
        } catch {
            return null;
        }
    });
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [progressModal, setProgressModal] = useState<{ type: 'backup' | 'restore'; progress: ProgressUpdate | null } | null>(null);
    const pendingBackupRef = useRef<any>(null);
    const [needsRecoveryKey, setNeedsRecoveryKey] = useState(false);
    const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
    const [recoveryKeyToSave, setRecoveryKeyToSave] = useState<string | null>(null);
    const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
    const [isLoadingKey, setIsLoadingKey] = useState(false);
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);

    const [isUnlocked, setIsUnlocked] = useState<boolean>(() => !!getBackupUnlock());
    const [unlockPassword, setUnlockPassword] = useState('');
    const [showUnlockPassword, setShowUnlockPassword] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const relock = () => {
        clearBackupUnlock();
        setIsUnlocked(false);
        setUnlockPassword('');
    };

    const isLockError = (message: string) => /lock|unlock|expired/i.test(message);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unlockPassword) return;
        setUnlockError(null);
        setIsUnlocking(true);
        try {
            const { unlockToken } = await settingsService.verifyPassword(unlockPassword);
            setBackupUnlock(unlockToken);
            setIsUnlocked(true);
            setUnlockPassword('');
        } catch (err: any) {
            setUnlockError(err?.message || 'Incorrect password');
        } finally {
            setIsUnlocking(false);
        }
    };

    const saveMutation = useMutation({
        mutationFn: (data: BarangaySettings) => settingsService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            if (onShowSuccess) onShowSuccess('Settings saved successfully');
            if (setIsNavigationBlocked) setIsNavigationBlocked(false);
        },
    });

    const [isBackupRunning, setIsBackupRunning] = useState(false);
    const [isRestoreRunning, setIsRestoreRunning] = useState(false);

    const handleBackup = async () => {
        setIsBackupRunning(true);
        setProgressModal({ type: 'backup', progress: null });
        try {
            const data = await settingsService.backupWithProgress(
                (update) => {
                    setProgressModal((prev) => prev ? { ...prev, progress: update } : null);
                },
                (key) => setRecoveryKeyToSave(key)
            );
            // Small delay so user sees 100% before modal closes
            await new Promise((r) => setTimeout(r, 400));
            setProgressModal(null);
            downloadJson(data, `rbi-backup-${new Date().toISOString().slice(0, 10)}.json`);
            const now = new Date();
            setLastBackup(now.toLocaleString());
            const meta: BackupMetaDisplay = {
                version: data.version,
                exportedAt: data.exportedAt ?? data.createdAt ?? new Date().toISOString(),
                total: data.meta?.total ?? 0,
            };
            setLastBackupMeta(meta);
            localStorage.setItem(LAST_BACKUP_META_KEY, JSON.stringify(meta));
            if (onShowSuccess) onShowSuccess('Backup downloaded successfully');
        } catch (err: any) {
            setProgressModal(null);
            if (isLockError(err?.message || '')) relock();
            if (onShowSuccess) onShowSuccess(`Backup failed: ${err?.message || 'Unknown error'}`);
        } finally {
            setIsBackupRunning(false);
        }
    };

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

    const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingRestoreFile(file);
        setShowRestoreConfirm(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const finishRestoreSuccess = async () => {
        // Small delay so user sees 100% before modal closes
        await new Promise((r) => setTimeout(r, 400));
        setProgressModal(null);
        queryClient.invalidateQueries();
        clearBackupUnlock();
        setIsUnlocked(false);
        if (onShowSuccess) onShowSuccess('Data restored successfully. Please log in again.');
        if (setIsNavigationBlocked) setIsNavigationBlocked(false);
        setTimeout(() => logout(), 1200);
    };

    const runRestore = async (backup: any, recoveryKey?: string) => {
        setProgressModal({ type: 'restore', progress: null });
        await settingsService.restoreWithProgress(
            backup,
            (update) => {
                setProgressModal((prev) => prev ? { ...prev, progress: update } : null);
            },
            recoveryKey
        );
        await finishRestoreSuccess();
    };

    const handleRecoveryKeySubmit = async () => {
        const backup = pendingBackupRef.current;
        if (!backup || !recoveryKeyInput.trim()) return;
        setNeedsRecoveryKey(false);
        setIsRestoreRunning(true);
        setRestoreError(null);
        try {
            await runRestore(backup, recoveryKeyInput.trim());
        } catch (err: any) {
            setProgressModal(null);
            const msg = err?.message || 'Restore failed';
            setRestoreError(msg);
            if (err?.code === 'RECOVERY_KEY_REQUIRED') {
                setNeedsRecoveryKey(true);
                if (onShowSuccess) onShowSuccess('Recovery key was not accepted. Please check it and try again.');
            } else {
                if (isLockError(msg)) relock();
                if (onShowSuccess) onShowSuccess(`Restore failed: ${msg}`);
            }
        } finally {
            setIsRestoreRunning(false);
        }
    };

    const handleShowRecoveryKey = async () => {
        setIsLoadingKey(true);
        try {
            const { recoveryKey } = await settingsService.getRecoveryKey();
            setEncryptionKey(recoveryKey);
        } catch (err: any) {
            if (onShowSuccess) onShowSuccess(`Could not load recovery key: ${err?.message || 'error'}`);
        } finally {
            setIsLoadingKey(false);
        }
    };

    const handleRegenerateRecoveryKey = async () => {
        setShowRegenConfirm(false);
        try {
            const { recoveryKey } = await settingsService.regenerateRecoveryKey();
            setEncryptionKey(recoveryKey);
            setRecoveryKeyToSave(recoveryKey);
            if (onShowSuccess) onShowSuccess('New recovery key generated. Save it now.');
        } catch (err: any) {
            if (onShowSuccess) onShowSuccess(`Could not regenerate recovery key: ${err?.message || 'error'}`);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            if (onShowSuccess) onShowSuccess('Copied to clipboard');
        } catch {
            if (onShowSuccess) onShowSuccess('Copy failed');
        }
    };

    const handleRestoreConfirm = async () => {
        if (!pendingRestoreFile) return;
        setShowRestoreConfirm(false);
        setIsRestoreRunning(true);
        setRestoreError(null);
        try {
            const text = await pendingRestoreFile.text();
            let backup;
            try {
                backup = JSON.parse(text);
            } catch {
                if (onShowSuccess) onShowSuccess('Invalid backup file: not valid JSON');
                setIsRestoreRunning(false);
                setPendingRestoreFile(null);
                return;
            }
            if (!backup || typeof backup !== 'object' || Array.isArray(backup) || typeof backup.data !== 'object' || backup.data === null) {
                if (onShowSuccess) onShowSuccess('Invalid backup file: missing backup data');
                setIsRestoreRunning(false);
                setPendingRestoreFile(null);
                return;
            }
            pendingBackupRef.current = backup;

            await runRestore(backup);
        } catch (err: any) {
            setProgressModal(null);
            const msg = err?.message || 'Restore failed';
            setRestoreError(msg);
            if (err?.code === 'RECOVERY_KEY_REQUIRED') {
                setNeedsRecoveryKey(true);
            } else {
                if (isLockError(msg)) relock();
                if (onShowSuccess) onShowSuccess(`Restore failed: ${msg}`);
            }
        } finally {
            setIsRestoreRunning(false);
            setPendingRestoreFile(null);
        }
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
                        !isUnlocked ? (
                        <div className="max-w-md mx-auto">
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                    <Lock size={24} className="text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 mb-2">Backup & Restore Locked</h2>
                                <p className="text-sm text-gray-500 mb-6 max-w-xs">
                                    Enter your password to access backup and restore.
                                </p>

                                <form onSubmit={handleUnlock} className="w-full space-y-5 text-left">
                                    {unlockError && (
                                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center">
                                            {unlockError}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500">Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type={showUnlockPassword ? 'text' : 'password'}
                                                value={unlockPassword}
                                                onChange={(e) => setUnlockPassword(e.target.value)}
                                                placeholder="Enter your password"
                                                autoFocus
                                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showUnlockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!unlockPassword || isUnlocking}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUnlocking ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Lock size={18} />
                                        )}
                                        {isUnlocking ? 'Verifying...' : 'Unlock'}
                                    </button>
                                </form>
                            </div>
                        </div>
                        ) : (
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
                                        {lastBackupMeta && (
                                            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                                                <p>Version {lastBackupMeta.version}</p>
                                                <p>Exported {new Date(lastBackupMeta.exportedAt).toLocaleString()}</p>
                                                <p>{lastBackupMeta.total} total records</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleBackup}
                                        disabled={isBackupRunning}
                                        className="w-full bg-[#10B981] hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 active:scale-95 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isBackupRunning ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Download size={18} />
                                        )}
                                        {isBackupRunning ? 'Backing up...' : 'Download Backup'}
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
                                        disabled={isRestoreRunning}
                                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRestoreRunning ? (
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                        ) : (
                                            <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                        )}
                                        <span className="text-sm font-bold text-gray-500 group-hover:text-blue-600 transition-colors">
                                            {isRestoreRunning ? 'Restoring...' : 'Select File to Restore'}
                                        </span>
                                    </button>

                                    {restoreError && (
                                        <div className="w-full mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                                            <p className="text-xs font-medium text-red-600">{restoreError}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {user?.roleType === 'SuperAdmin' && (
                                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                        <h2 className="text-sm font-bold text-gray-900">Backup Encryption</h2>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-6 max-w-2xl">
                                        Backups are encrypted with AES-256-GCM. Restoring on this server is automatic. Keep the recovery key somewhere safe and off this computer so you can restore on a new installation.
                                    </p>
                                    {encryptionKey && (
                                        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Recovery Key</p>
                                            <code className="text-sm text-gray-800 tracking-wider break-all">{encryptionKey}</code>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={handleShowRecoveryKey}
                                            disabled={isLoadingKey}
                                            className="bg-white border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoadingKey ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                                            Show Recovery Key
                                        </button>
                                        {encryptionKey && (
                                            <button
                                                onClick={() => copyToClipboard(encryptionKey)}
                                                className="bg-white border border-gray-200 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                                            >
                                                <Copy size={16} /> Copy
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowRegenConfirm(true)}
                                            className="bg-white border border-red-200 text-red-600 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <RefreshCw size={16} /> Regenerate
                                        </button>
                                    </div>
                                </div>
                            )}

                            <ConfirmationModal
                                isOpen={showRegenConfirm}
                                onClose={() => setShowRegenConfirm(false)}
                                onConfirm={handleRegenerateRecoveryKey}
                                title="Regenerate Recovery Key?"
                                message="A new recovery key will be created. Backups made before now will still require the OLD key. Make sure you have the current key saved before continuing."
                                confirmText="Regenerate"
                                variant="danger"
                            />

                            <ConfirmationModal
                                isOpen={showRestoreConfirm}
                                onClose={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
                                onConfirm={handleRestoreConfirm}
                                title="Restore Backup?"
                                message={`This will overwrite all current data with the contents of "${pendingRestoreFile?.name}". This action cannot be undone. Continue?`}
                                confirmPhrase="RESTORE"
                                confirmText="Restore"
                            />

                            {recoveryKeyToSave && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                                                <KeyRound size={24} className="text-amber-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Save Your Recovery Key</h3>
                                            <p className="text-sm text-gray-500 mb-5 max-w-xs">
                                                Store this key somewhere safe and off this computer. It is the only way to decrypt your backups if this server is lost.
                                            </p>
                                            <code className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 tracking-wider break-all mb-5">
                                                {recoveryKeyToSave}
                                            </code>
                                            <div className="flex items-center justify-center gap-3 w-full mb-4">
                                                <button
                                                    onClick={() => copyToClipboard(recoveryKeyToSave)}
                                                    className="flex-1 border border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Copy size={16} /> Copy
                                                </button>
                                                <button
                                                    onClick={() => downloadJson({ recoveryKey: recoveryKeyToSave }, 'rbi-recovery-key.json')}
                                                    className="flex-1 border border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Download size={16} /> Download
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setRecoveryKeyToSave(null)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                                            >
                                                I've saved it
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {needsRecoveryKey && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                                <Lock size={24} className="text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Recovery Key Required</h3>
                                            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                                                This backup was encrypted on a different installation. Enter the recovery key to decrypt it.
                                            </p>
                                            <input
                                                value={recoveryKeyInput}
                                                onChange={(e) => setRecoveryKeyInput(e.target.value)}
                                                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                                                autoFocus
                                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-center tracking-wider text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all mb-5"
                                            />
                                            {restoreError && (
                                                <div className="w-full mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center">
                                                    {restoreError}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-end gap-3 w-full">
                                                <button
                                                    onClick={() => { setNeedsRecoveryKey(false); setRecoveryKeyInput(''); }}
                                                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleRecoveryKeySubmit}
                                                    disabled={!recoveryKeyInput.trim() || isRestoreRunning}
                                                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {isRestoreRunning && <Loader2 size={16} className="animate-spin" />}
                                                    Decrypt &amp; Restore
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Progress Modal */}
                            {progressModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
                                        <div className="flex flex-col items-center text-center">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                                                progressModal.type === 'backup' ? 'bg-green-50' : 'bg-blue-50'
                                            }`}>
                                                {progressModal.type === 'backup' ? (
                                                    <Download className="w-8 h-8 text-green-500" />
                                                ) : (
                                                    <UploadCloud className="w-8 h-8 text-blue-500" />
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {progressModal.type === 'backup' ? 'Backing Up Data' : 'Restoring Data'}
                                            </h3>

                                            {progressModal.progress ? (
                                                <p className="text-sm text-gray-500 mb-5">
                                                    {progressModal.progress.step}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 mb-5">
                                                    {progressModal.type === 'backup' ? 'Preparing backup...' : 'Preparing restore...'}
                                                </p>
                                            )}

                                            <div className="w-full">
                                                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                                    <span>Progress</span>
                                                    <span className="font-semibold text-gray-700">
                                                        {progressModal.progress?.percent ?? 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ease-out ${
                                                            progressModal.type === 'backup' ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{ width: `${progressModal.progress?.percent ?? 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        )
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
