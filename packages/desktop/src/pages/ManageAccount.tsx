import React, { useState, useRef, useEffect } from 'react';
import { Shield, Upload, User, Lock, Phone, Save, CheckCircle, XCircle, Edit } from 'lucide-react';
import ContentCard from '@/components/ui/ContentCard';
import { useAuth } from '@/context/AuthContext';
import { User as UserType } from '@/types';

const initialFormState = {
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    phoneNumber: '',
    status: true, // true = Active, false = Disabled
    role: 'Admin' as 'Admin' | 'SuperAdmin',
    permission: 'Resident Access' as 'Full Access' | 'Resident Access' | 'Document Access' | 'Resident & Document Access'
};

interface ManageAccountProps {
    onShowSuccess?: (message: string) => void;
    setIsNavigationBlocked?: (blocked: boolean) => void;
}

const ManageAccount: React.FC<ManageAccountProps> = ({ onShowSuccess, setIsNavigationBlocked }) => {
    const { users, addUser, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    // Form State
    const [formData, setFormData] = useState(initialFormState);
    const [pristineData, setPristineData] = useState(initialFormState);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Navigation Blocking Logic
    useEffect(() => {
        if (setIsNavigationBlocked) {
            const isDirty = JSON.stringify(formData) !== JSON.stringify(pristineData);
            setIsNavigationBlocked(isDirty);
        }
    }, [formData, pristineData, setIsNavigationBlocked]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as 'Admin' | 'SuperAdmin';
        setFormData(prev => ({
            ...prev,
            role: newRole,
            permission: newRole === 'SuperAdmin' ? 'Full Access' : 'Resident Access'
        }));
    };

    const handleEdit = (user: UserType) => {
        setIsEditing(true);
        setEditingId(user.id);
        setErrors({}); // Clear errors when editing
        const editData = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            password: user.password || '',
            phoneNumber: user.phoneNumber || '',
            status: user.status === 'Active',
            role: user.role,
            permission: user.permission
        };
        setFormData(editData);
        setPristineData(editData);
        
        // Scroll to top
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        
        // Password validation: required for new users, optional for editing
        if (!isEditing && !formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        const statusString = formData.status ? 'Active' : 'Disabled';
        
        if (isEditing && editingId) {
            // Update existing user
            const userToUpdate: UserType = {
                id: editingId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                password: formData.password,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                permission: formData.permission,
                status: statusString as 'Active' | 'Disabled',
                // Preserve lastLogin from existing user
                lastLogin: users.find(u => u.id === editingId)?.lastLogin
            };
            updateUser(userToUpdate);
            setIsEditing(false);
            setEditingId(null);
            if (onShowSuccess) onShowSuccess('Account updated successfully');
        } else {
            // Add new user
            const newUser: UserType = {
                id: String(users.length + 1).padStart(3, '0'),
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                password: formData.password,
                phoneNumber: formData.phoneNumber,
                role: formData.role,
                permission: formData.permission,
                status: statusString as 'Active' | 'Disabled',
                lastLogin: 'Never'
            };
            addUser(newUser);
            if (onShowSuccess) onShowSuccess('Account created successfully');
        }

        // Reset form
        setFormData(initialFormState);
        setPristineData(initialFormState);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <ContentCard>
                <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8" ref={formRef}>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-[18px] font-bold text-gray-800">Manage Accounts</h2>
                    </div>

                    {/* Account Registration */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[16px] font-bold text-gray-800">
                                {isEditing ? 'Edit Account' : 'Account Registration'}
                            </h3>
                            {isEditing && editingId && (
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">
                                    Editing: usr_{editingId}
                                </span>
                            )}
                        </div>
                        <div className="border border-gray-100 rounded-2xl p-8">
                            <div className="flex gap-10">
                                {/* Profile Picture */}
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors mb-3 bg-gray-50/50">
                                        <Upload size={24} className="mb-1" />
                                        <span className="text-xs font-medium">Upload</span>
                                    </div>
                                    <p className="text-center text-xs text-gray-500 font-medium">Profile Picture</p>
                                </div>

                                {/* Form */}
                                <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-6">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">First Name</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                                                    errors.firstName 
                                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.firstName && <p className="text-xs text-red-500 font-medium ml-1">{errors.firstName}</p>}
                                    </div>
                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">Last Name</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                                                    errors.lastName 
                                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.lastName && <p className="text-xs text-red-500 font-medium ml-1">{errors.lastName}</p>}
                                    </div>
                                    {/* Username */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">Username</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                                                    errors.username 
                                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.username && <p className="text-xs text-red-500 font-medium ml-1">{errors.username}</p>}
                                    </div>
                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="password" 
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder={isEditing ? "Unchanged" : "......."}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-gray-400 ${
                                                    errors.password 
                                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
                                    </div>
                                    {/* Phone Number */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">Phone Number</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                placeholder="09XX-XXX-XXXX" 
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                                                    errors.phoneNumber 
                                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                                                }`}
                                            />
                                        </div>
                                        {errors.phoneNumber && <p className="text-xs text-red-500 font-medium ml-1">{errors.phoneNumber}</p>}
                                    </div>
                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">Status</label>
                                        <div className="flex items-center gap-3 h-[42px]">
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.status ? 'bg-green-500' : 'bg-gray-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${formData.status ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                            <span className={`text-sm font-bold ${formData.status ? 'text-green-600' : 'text-gray-500'}`}>
                                                {formData.status ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Role */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-600">Role</label>
                                        <div className="relative">
                                            <select 
                                                name="role"
                                                value={formData.role}
                                                onChange={handleRoleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="SuperAdmin">SuperAdmin</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Permission */}
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[13px] font-bold text-gray-600">Permission</label>
                                        {formData.role === 'SuperAdmin' ? (
                                            <div className="h-[42px] flex items-center gap-2 px-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                                                <Shield size={16} className="fill-blue-600" />
                                                <span className="text-sm font-bold">SuperAdmin has Full Access</span>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select 
                                                    name="permission"
                                                    value={formData.permission}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                                                >
                                                    <option value="Resident Access">Resident Access</option>
                                                    <option value="Document Access">Document Access</option>
                                                    <option value="Resident & Document Access">Resident & Document Access</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-8 gap-3">
                                {isEditing && (
                                    <button 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditingId(null);
                                            setFormData(initialFormState);
                                            setPristineData(initialFormState);
                                        }}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button 
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    <Save size={18} />
                                    {isEditing ? 'Update Account' : 'Save Account'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Registered Users Table */}
                    <div>
                        <h3 className="text-[16px] font-bold text-gray-800 mb-6">Registered Users</h3>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                            <table className="w-full border-separate border-spacing-0 table-fixed">
                                <thead className="bg-white sticky top-0 z-10">
                                    <tr className="border-b border-gray-50">
                                        <th className="w-[10%] text-left py-4 pl-8 pr-4 text-[12px] font-bold text-blue-500">Username ID</th>
                                        <th className="w-[15%] text-left py-4 px-4 text-[12px] font-bold text-blue-500">Username</th>
                                        <th className="w-[15%] text-left py-4 px-4 text-[12px] font-bold text-blue-500">Role</th>
                                        <th className="w-[15%] text-left py-4 px-4 text-[12px] font-bold text-blue-500">Permission</th>
                                        <th className="w-[20%] text-left py-4 px-4 text-[12px] font-bold text-blue-500">Last Login</th>
                                        <th className="w-[15%] text-left py-4 px-4 text-[12px] font-bold text-blue-500">Status</th>
                                        <th className="w-[10%] text-center py-4 px-4 text-[12px] font-bold text-blue-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pl-8 pr-4 text-sm font-medium text-gray-900">{user.id}</td>
                                            <td className="py-4 px-4 text-sm font-bold text-gray-800">{user.username}</td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                                    user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-600">{user.permission}</td>
                                            <td className="py-4 px-4 text-sm text-gray-500">{user.lastLogin}</td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                                    user.status === 'Active'
                                                        ? 'bg-green-50 text-green-600 border-green-200'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                                }`}>
                                                    {user.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all mx-auto"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </ContentCard>
        </div>
    );
};

export default ManageAccount;
