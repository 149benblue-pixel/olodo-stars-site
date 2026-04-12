import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadComplete, folder = 'general' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onUploadComplete(downloadURL);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-8 h-8 text-gray-300" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photo
          </label>
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG or GIF. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};
