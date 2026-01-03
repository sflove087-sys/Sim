import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CameraIcon } from '@heroicons/react/24/solid';
import Button from '../common/Button';
import Input from '../common/Input';
import { useToast } from '../../context/ToastContext';
import { apiUpdateProfile } from '../../services/api';
import LoadingModal from '../common/LoadingModal';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const Profile: React.FC = () => {
    const { user, login } = useAuth();
    const { addToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.photoUrl || null);
    const [isSaving, setIsSaving] = useState(false);

    if (!user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addToast('ফাইলের আকার 2MB এর বেশি হতে পারবে না।', 'error');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            addToast('অনুগ্রহ করে নাম দিন।', 'error');
            return;
        }

        setIsSaving(true);
        try {
            let photoBase64: string | undefined;
            let mimeType: string | undefined;
            if (selectedFile) {
                photoBase64 = await toBase64(selectedFile);
                mimeType = selectedFile.type;
            }

            const updatedUser = await apiUpdateProfile({ name, photoBase64, mimeType });
            login(updatedUser); // Update user in context and session storage
            addToast('প্রোফাইল সফলভাবে আপডেট করা হয়েছে।', 'success');
            setIsEditing(false);

        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'প্রোফাইল আপডেট করা যায়নি।', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <LoadingModal isOpen={isSaving} />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">প্রোফাইল</h1>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                <div className="relative w-32 h-32 mx-auto mb-4">
                    {previewUrl ? (
                         <img src={previewUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-md" />
                    ) : (
                         <UserCircleIcon className="h-32 w-32 text-indigo-300 dark:text-indigo-700" />
                    )}
                   {isEditing && (
                        <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition shadow-lg">
                            <CameraIcon className="h-5 w-5" />
                            <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                   )}
                </div>

                {!isEditing ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{user.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{user.role === 'Admin' ? 'অ্যাডমিন' : 'ব্যবহারকারী'}</p>
                        <div className="mt-6 text-left space-y-4">
                            <div className="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <EnvelopeIcon className="h-6 w-6 text-slate-500 mr-4" />
                                <span className="text-slate-700 dark:text-slate-300">{user.email}</span>
                            </div>
                            <div className="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <PhoneIcon className="h-6 w-6 text-slate-500 mr-4" />
                                <span className="text-slate-700 dark:text-slate-300">{user.mobile}</span>
                            </div>
                        </div>
                        <div className="mt-8">
                            <Button variant="secondary" onClick={() => setIsEditing(true)}>প্রোফাইল এডিট করুন</Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4 mt-6">
                        <Input
                            id="name"
                            label="আপনার নাম"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        <div className="flex space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setPreviewUrl(user.photoUrl || null); }} className="w-1/2">
                                বাতিল
                            </Button>
                            <Button type="submit" isLoading={isSaving} className="w-1/2">
                                সংরক্ষণ করুন
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;