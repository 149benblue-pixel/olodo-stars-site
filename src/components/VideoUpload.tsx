import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Video, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  initialVideo?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, folder = 'videos', initialVideo }) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const displayLabel = uploading ? 'Uploading highlights...' : fileName ? `Selected: ${fileName}` : initialVideo ? 'Video Uploaded' : 'Upload Match Highlights';
  const iconColor = (fileName || initialVideo) ? 'text-red-600' : 'text-gray-300 group-hover:text-red-400';
  const buttonText = (fileName || initialVideo) ? 'Change' : 'Select';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g., 20MB limit for simple storage)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Video file too large. Max 20MB.');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onUploadComplete(downloadURL);
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer hover:border-red-300 transition-colors group">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1">
            <Video className={`w-6 h-6 ${iconColor} transition-colors`} />
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              {buttonText}
            </span>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </label>
        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-700">
            {displayLabel}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            MP4, WebM or OGG. Max 20MB.
          </p>
        </div>
      </div>
    </div>
  );
};
