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
  initialImage?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadComplete, folder = 'general', initialImage }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayImage = preview || initialImage;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant Preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onUploadComplete(downloadURL);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      if (error.code === 'storage/retry-limit-exceeded') {
        toast.error('Upload failed: Connection timed out. Please ensure Firebase Storage is enabled in your console.');
      } else if (error.code === 'storage/unauthorized') {
        toast.error('Upload failed: Unauthorized. Please check your Firebase Storage security rules.');
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
      setPreview(null); // Reset preview on error
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl); // Clean up
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer hover:border-red-300 transition-colors group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          {displayImage ? (
            <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-6 h-6 text-gray-300 group-hover:text-red-400 transition-colors" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Select</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </label>
        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading...' : 'Click to change photo'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG or GIF. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};
