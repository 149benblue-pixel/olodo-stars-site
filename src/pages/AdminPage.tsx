import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout, storage, uploadFile, handleFirestoreError, OperationType, firebaseConfig } from '../firebase';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { 
  Users, 
  Trophy, 
  Newspaper, 
  Heart, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Shield,
  Calendar,
  LayoutDashboard,
  Settings as SettingsIcon,
  BarChart3,
  Image as ImageIcon,
  Check,
  Search,
  Zap,
  Loader2,
  PlusCircle,
  Upload,
  Mail
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { format } from 'date-fns';

interface AdminPageProps {
  user: User | null;
  role: string | null;
}

const useOptimizedUpload = (isVerified: boolean) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async (file: File, path: string): Promise<string | null> => {
    if (!isVerified) {
      toast.error('Email verification required');
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP files are allowed');
      return null;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Compressing...');
    setUploadSuccess(false);
    
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        onProgress: (p: number) => {
          // p is 0 to 1
          setUploadProgress(Math.round(p * 50));
        }
      };

      const compressedFile = await imageCompression(file, options);
      
      setUploadStatus('Uploading...');
      setUploadProgress(50); // Ensure we are at least at 50%

      const url = await uploadFile(compressedFile, path, (p) => {
        // p is 0 to 100
        const uploadPart = Math.round(p * 0.5);
        setUploadProgress(50 + uploadPart);
      });
      
      setUploadProgress(100);
      setUploadStatus('Complete!');
      setUploadSuccess(true);
      
      // Keep success state for 2 seconds
      setTimeout(() => setUploadSuccess(false), 2000);
      
      return url;
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Processing failed');
      return null;
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 500);
    }
  };

  return { uploading, uploadProgress, uploadStatus, uploadSuccess, handleUpload };
};

const AdminPage = ({ user, role }: AdminPageProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [players, setPlayers] = useState<any[]>([]);
  const [officials, setOfficials] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = role === 'super_admin' || user?.email === '149benblue@gmail.com';
  const isEditor = role === 'editor' || isSuperAdmin;
  const isVerified = user?.emailVerified || user?.email === '149benblue@gmail.com';

  useEffect(() => {
    if (!isEditor) return;

    const unsubPlayers = onSnapshot(query(collection(db, 'players'), orderBy('number', 'asc')), (s) => {
      setPlayers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOfficials = onSnapshot(query(collection(db, 'officials'), orderBy('name', 'asc')), (s) => {
      setOfficials(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMatches = onSnapshot(query(collection(db, 'matches'), orderBy('date', 'desc')), (s) => {
      setMatches(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() || new Date() })));
    });
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (s) => {
      setNews(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() || new Date() })));
    });
    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('date', 'desc')), (s) => {
      setGallery(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() || new Date() })));
    });
    const unsubDonations = onSnapshot(query(collection(db, 'donations'), orderBy('date', 'desc')), (s) => {
      setDonations(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() || new Date() })));
    });
    const unsubStats = onSnapshot(doc(db, 'settings', 'teamStats'), (d) => {
      if (d.exists()) setTeamStats(d.data());
      setLoading(false);
    });
    const unsubSocial = onSnapshot(doc(db, 'settings', 'socialLinks'), (d) => {
      if (d.exists()) setSocialLinks(d.data());
    });

    return () => {
      unsubPlayers();
      unsubOfficials();
      unsubMatches();
      unsubNews();
      unsubGallery();
      unsubDonations();
      unsubStats();
      unsubSocial();
    };
  }, [isEditor]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-8">
            <LayoutDashboard className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Admin Authentication</h2>
          <p className="text-gray-600 mb-8">
            Please login with your club credentials to access the management panel.
          </p>
          <Button 
            onClick={() => signInWithGoogle()} 
            className="w-full bg-red-600 hover:bg-red-700 rounded-full h-14 font-black uppercase tracking-widest text-xs"
          >
            Login with Google
          </Button>
          <button 
            onClick={() => window.location.href = '/'} 
            className="mt-6 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isEditor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 mb-4">
            Hello <span className="font-bold text-gray-900">{user.email}</span>, you don't have administrative privileges yet.
          </p>
          <p className="text-xs text-gray-400 mb-8 leading-relaxed">
            Your account has been registered as a <span className="font-bold">Viewer</span>. Please contact the team administrator to upgrade your access level.
          </p>
          <div className="flex flex-col gap-4">
            <Button onClick={() => logout()} variant="outline" className="w-full rounded-full border-gray-200">
              Sign Out
            </Button>
            <Button onClick={() => window.location.href = '/'} className="w-full bg-slate-900 hover:bg-black rounded-full">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Admin <span className="text-red-600">Panel</span>
            </h1>
            <p className="text-gray-600">Manage your club's content and performance data.</p>
            {isEditor && !isVerified && (
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 animate-pulse">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold">Please verify your email to enable database writes.</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-full shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="pr-4">
              <div className="text-sm font-bold text-gray-900">{user?.displayName || 'Admin'}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 py-4 mb-8">
            <div className="max-w-7xl mx-auto">
              <TabsList className="bg-white/50 p-1 rounded-xl shadow-sm flex flex-wrap h-auto gap-1 border border-gray-100">
                <TabsTrigger value="dashboard" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dash
                </TabsTrigger>
                <TabsTrigger value="players" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <Users className="w-3.5 h-3.5" /> Squad
                </TabsTrigger>
                <TabsTrigger value="officials" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <Shield className="w-3.5 h-3.5" /> Staff
                </TabsTrigger>
                <TabsTrigger value="matches" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <Trophy className="w-3.5 h-3.5" /> Games
                </TabsTrigger>
                <TabsTrigger value="match-report" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <BarChart3 className="w-3.5 h-3.5" /> Report
                </TabsTrigger>
                <TabsTrigger value="news" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <Newspaper className="w-3.5 h-3.5" /> News
                </TabsTrigger>
                <TabsTrigger value="gallery" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <ImageIcon className="w-3.5 h-3.5" /> Media
                </TabsTrigger>
                {isSuperAdmin && (
                  <TabsTrigger value="donations" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                    <Heart className="w-3.5 h-3.5" /> Gifts
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="roles" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                    <Shield className="w-3.5 h-3.5" /> Access
                  </TabsTrigger>
                )}
                <TabsTrigger value="settings" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <SettingsIcon className="w-3.5 h-3.5" /> Config
                </TabsTrigger>
                <TabsTrigger value="storage" className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2 transition-all">
                  <ImageIcon className="w-3.5 h-3.5" /> Storage
                </TabsTrigger>
              </TabsList>
            </div>
          </div>


          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-600" /> Total Squad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-gray-900">{players.length} Players</div>
                  <p className="text-sm text-gray-500 mt-2">{officials.length} Officials & Staff</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-red-600" /> Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-gray-900">{matches.length} Total</div>
                  <p className="text-sm text-gray-500 mt-2">{matches.filter(m => m.isUpcoming).length} Upcoming fixtures.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" /> Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-gray-900">
                    KES {donations.reduce((acc, d) => acc + (d.amount || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Total support from {donations.length} donors.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="players">
            <PlayerManager players={players} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          <TabsContent value="officials">
            <OfficialManager officials={officials} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          <TabsContent value="matches">
            <MatchManager matches={matches} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          <TabsContent value="match-report">
            <MatchReportManager players={players} matches={matches} isVerified={isVerified || false} />
          </TabsContent>

          <TabsContent value="news">
            <NewsManager news={news} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          <TabsContent value="gallery">
            <GalleryManager items={gallery} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="donations">
              <DonationManager donations={donations} />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="roles">
              <RoleManager currentUserId={user?.uid || ''} />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <SettingsManager stats={teamStats} social={socialLinks} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          <TabsContent value="storage">
            <DirectFirebaseStorage 
              isVerified={isVerified || false}
              isEditor={isEditor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Sub-components for Admin Panel

const PLAYER_PLACEHOLDER = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
const OFFICIAL_PLACEHOLDER = "https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&q=80&w=200&h=200";

const DeleteConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description: string;
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const PlayerManager = ({ players, isVerified, isSuperAdmin, isEditor }: { players: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { uploading, uploadProgress, uploadStatus, uploadSuccess, handleUpload } = useOptimizedUpload(isVerified);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'Goalkeeper',
    photo: '',
    matchesPlayed: '0',
    goals: '0',
    assists: '0',
    cleanSheets: '0',
    rating: '0.0',
    availability: true,
    bio: '',
    origin: '',
    joinedDate: format(new Date(), 'yyyy-MM-dd'),
    commitmentCount: 0
  });

  const handleEdit = (player: any) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setEditingId(player.id);
    setFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
      photo: player.photo || '',
      matchesPlayed: player.matchesPlayed.toString(),
      goals: player.goals.toString(),
      assists: player.assists.toString(),
      cleanSheets: (player.cleanSheets || 0).toString(),
      rating: player.rating.toString(),
      availability: player.availability !== undefined ? player.availability : true,
      bio: player.bio || '',
      origin: player.origin || '',
      joinedDate: player.joinedDate ? (player.joinedDate instanceof Date ? format(player.joinedDate, 'yyyy-MM-dd') : format(player.joinedDate.toDate(), 'yyyy-MM-dd')) : format(new Date(), 'yyyy-MM-dd'),
      commitmentCount: player.commitmentCount || 0
    });
    setLocalPreview(player.photo || null);
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const url = await handleUpload(file, 'players');
    if (url) {
      setFormData(prev => ({ ...prev, photo: url }));
      setLocalPreview(url);
      if (editingId) {
        await updateDoc(doc(db, 'players', editingId), { photo: url });
      }
      toast.success('Optimized photo uploaded! ⚡');
    } else {
      setLocalPreview(formData.photo || null);
    }
  };

  const validateStats = () => {
    const numFields = {
      number: Number(formData.number),
      matchesPlayed: Number(formData.matchesPlayed),
      goals: Number(formData.goals),
      assists: Number(formData.assists),
      cleanSheets: Number(formData.cleanSheets),
      rating: Number(formData.rating),
      commitmentCount: Number(formData.commitmentCount)
    };

    if (numFields.number < 0) return 'Jersey number cannot be negative';
    if (numFields.matchesPlayed < 0) return 'Matches played cannot be negative';
    if (numFields.goals < 0) return 'Goals cannot be negative';
    if (numFields.assists < 0) return 'Assists cannot be negative';
    if (numFields.cleanSheets < 0) return 'Clean sheets cannot be negative';
    if (numFields.rating < 0 || numFields.rating > 10) return 'Rating must be between 0 and 10';
    if (numFields.commitmentCount < 0) return 'Commitment count cannot be negative';
    
    return null;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }

    const error = validateStats();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const data = {
        ...formData,
        number: Number(formData.number),
        matchesPlayed: Number(formData.matchesPlayed),
        goals: Number(formData.goals),
        assists: Number(formData.assists),
        cleanSheets: Number(formData.cleanSheets),
        rating: Number(formData.rating),
        joinedDate: new Date(formData.joinedDate),
        commitmentCount: Number(formData.commitmentCount)
      };

      if (editingId) {
        const path = `players/${editingId}`;
        try {
          await updateDoc(doc(db, 'players', editingId), data);
          toast.success('Player updated successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const path = 'players';
        try {
          await addDoc(collection(db, 'players'), data);
          toast.success('Player added successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({ 
        name: '', 
        number: '', 
        position: 'Goalkeeper', 
        photo: '',
        matchesPlayed: '0', 
        goals: '0', 
        assists: '0', 
        cleanSheets: '0', 
        rating: '0.0', 
        availability: true,
        bio: '',
        origin: '',
        joinedDate: format(new Date(), 'yyyy-MM-dd'),
        commitmentCount: 0
      });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('{'))) {
        toast.error(editingId ? 'Error updating player' : 'Error adding player');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    const path = `players/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'players', deleteId));
      toast.success('Player deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <DeleteConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Player"
        description="Are you sure you want to delete this player? This action cannot be undone."
      />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Squad</h2>
        {isEditor && (
          <Button onClick={() => {
            if (!isVerified) {
              toast.error('Email verification required');
              return;
            }
            setIsAdding(!isAdding);
            if (isAdding) setEditingId(null);
          }} className="bg-red-600 hover:bg-red-700 rounded-full">
            {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isAdding ? 'Cancel' : 'Add Player'}
          </Button>
        )}
      </div>


      {isAdding && (
        <Card className="border-none shadow-lg bg-white p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Jersey Number</label>
              <Input type="number" min="0" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Position</label>
              <Select value={formData.position} onValueChange={v => setFormData({...formData, position: v})} disabled={!isSuperAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="Defender">Defender</SelectItem>
                  <SelectItem value="Midfielder">Midfielder</SelectItem>
                  <SelectItem value="Striker">Striker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Player Photo</label>
              <div className="flex flex-col gap-4">
                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center transition-all hover:border-red-300">
                  {localPreview || formData.photo ? (
                    <>
                      <img src={localPreview || formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
                            <motion.div 
                              className="bg-red-500 h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{uploadStatus} {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 bg-green-500/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white"
                        >
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                            <Check className="w-8 h-8 text-green-500" />
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest italic">Success!</p>
                        </motion.div>
                      )}
                      {!uploading && !uploadSuccess && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label htmlFor="player-photo-upload" className="p-2 bg-white rounded-full cursor-pointer hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-gray-900" />
                          </label>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, photo: '' }));
                              setLocalPreview(null);
                            }}
                            className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <label htmlFor="player-photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-6">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click to upload</span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase">JPG, PNG, WEBP (Max 5MB)</span>
                    </label>
                  )}
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="player-photo-upload"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">External Image URL</label>
                  <Input 
                    value={formData.photo} 
                    onChange={e => {
                      setFormData({...formData, photo: e.target.value});
                      setLocalPreview(null);
                    }} 
                    placeholder="https://example.com/photo.jpg" 
                    className="text-xs h-9 bg-gray-50/50 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Matches Played</label>
              <Input type="number" min="0" value={formData.matchesPlayed} onChange={e => setFormData({...formData, matchesPlayed: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals</label>
              <Input type="number" min="0" value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Assists</label>
              <Input type="number" min="0" value={formData.assists} onChange={e => setFormData({...formData, assists: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Clean Sheets</label>
              <Input type="number" min="0" value={formData.cleanSheets} onChange={e => setFormData({...formData, cleanSheets: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Rating</label>
              <Input type="number" step="0.1" min="0" max="10" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Availability</label>
              <Select value={formData.availability ? 'true' : 'false'} onValueChange={v => setFormData({...formData, availability: v === 'true'})} disabled={!isSuperAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Origin / Hometown</label>
              <Input value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="e.g. Nairobi, Kenya" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Joined Date</label>
              <Input type="date" value={formData.joinedDate} onChange={e => setFormData({...formData, joinedDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Commitment Count</label>
              <Input type="number" min="0" value={formData.commitmentCount.toString()} onChange={e => setFormData({...formData, commitmentCount: Number(e.target.value)})} disabled={!isSuperAdmin} />
            </div>
            <div className="md:col-span-2 lg:col-span-4 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Player Bio</label>
              <Textarea 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                placeholder="Write a short player biography..."
                className="h-24 rounded-xl"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={uploading} className="w-full bg-red-600 hover:bg-red-700">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingId ? 'Update Player' : 'Save Player'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Stats (M/G/A/CS)</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(player => (
              <TableRow key={player.id}>
                <TableCell className="font-bold text-red-600">{player.number}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-full border border-gray-100">
                      <AvatarImage src={player.photo || PLAYER_PLACEHOLDER} className="object-cover" referrerPolicy="no-referrer" />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {player.name}
                  </div>
                </TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell>{player.matchesPlayed}/{player.goals}/{player.assists}/{player.cleanSheets || 0}</TableCell>
                <TableCell className="font-bold">{player.rating}</TableCell>
                <TableCell>
                  <Badge className={player.availability === false ? 'bg-gray-400' : 'bg-green-500'}>
                    {player.availability === false ? 'Unavailable' : 'Available'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(player)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(player.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
    </div>
  );
};

const OfficialManager = ({ officials, isVerified, isSuperAdmin, isEditor }: { officials: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { uploading, uploadProgress, uploadStatus, uploadSuccess, handleUpload } = useOptimizedUpload(isVerified);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    photo: '',
    contact: ''
  });

  const handleEdit = (official: any) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setEditingId(official.id);
    setFormData({
      name: official.name,
      role: official.role,
      photo: official.photo || '',
      contact: official.contact || ''
    });
    setLocalPreview(official.photo || null);
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const url = await handleUpload(file, 'officials');
    if (url) {
      setFormData(prev => ({ ...prev, photo: url }));
      setLocalPreview(url);
      if (editingId) {
        await updateDoc(doc(db, 'officials', editingId), { photo: url });
      }
      toast.success('Optimized official photo uploaded! ⚡');
    } else {
      setLocalPreview(formData.photo || null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      if (editingId) {
        const path = `officials/${editingId}`;
        try {
          await updateDoc(doc(db, 'officials', editingId), formData);
          toast.success('Official updated successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const path = 'officials';
        try {
          await addDoc(collection(db, 'officials'), formData);
          toast.success('Official added successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', role: '', photo: '', contact: '' });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('{'))) {
        toast.error(editingId ? 'Error updating official' : 'Error adding official');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    const path = `officials/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'officials', deleteId));
      toast.success('Official deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <DeleteConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Official"
        description="Are you sure you want to delete this official? This action cannot be undone."
      />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Officials</h2>
        {isEditor && (
          <Button onClick={() => {
            if (!isVerified) {
              toast.error('Email verification required');
              return;
            }
            setIsAdding(!isAdding);
            if (isAdding) setEditingId(null);
          }} className="bg-red-600 hover:bg-red-700 rounded-full">
            {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isAdding ? 'Cancel' : 'Add Official'}
          </Button>
        )}
      </div>


      {isAdding && (
        <Card className="border-none shadow-lg bg-white p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Role (e.g. Coach, Manager)</label>
              <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Official Photo</label>
              <div className="flex flex-col gap-4">
                <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center transition-all hover:border-red-300">
                  {localPreview || formData.photo ? (
                    <>
                      <img src={localPreview || formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
                            <motion.div 
                              className="bg-red-500 h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{uploadStatus} {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 bg-green-500/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white"
                        >
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                            <Check className="w-8 h-8 text-green-500" />
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest italic">Success!</p>
                        </motion.div>
                      )}
                      {!uploading && !uploadSuccess && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label htmlFor="official-photo-upload" className="p-2 bg-white rounded-full cursor-pointer hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-gray-900" />
                          </label>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, photo: '' }));
                              setLocalPreview(null);
                            }}
                            className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <label htmlFor="official-photo-upload" className="flex flex-col items-center justify-center cursor-pointer p-6">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click to upload</span>
                      <span className="text-[10px] text-gray-400 mt-1 uppercase">JPG, PNG, WEBP (Max 5MB)</span>
                    </label>
                  )}
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="official-photo-upload"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">External Image URL</label>
                  <Input 
                    value={formData.photo} 
                    onChange={e => {
                      setFormData({...formData, photo: e.target.value});
                      setLocalPreview(null);
                    }} 
                    placeholder="https://example.com/photo.jpg" 
                    className="text-xs h-9 bg-gray-50/50 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Contact (Optional)</label>
              <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+254..." disabled={!isSuperAdmin} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                {editingId ? 'Update Official' : 'Save Official'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {officials.map(official => (
              <TableRow key={official.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-full border border-gray-100">
                      <AvatarImage src={official.photo || OFFICIAL_PLACEHOLDER} className="object-cover" referrerPolicy="no-referrer" />
                      <AvatarFallback>{official.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {official.name}
                  </div>
                </TableCell>
                <TableCell>{official.role}</TableCell>
                <TableCell>{official.contact || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(official)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(official.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
    </div>
  );
};

const MatchManager = ({ matches, isVerified, isSuperAdmin, isEditor }: { matches: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    opponent: '',
    score: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    competition: '',
    isUpcoming: true,
    venue: '',
    time: '',
    videoUrl: ''
  });

  const handleEdit = (match: any) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setEditingId(match.id);
    setFormData({
      opponent: match.opponent,
      score: match.score || '',
      date: format(match.date, "yyyy-MM-dd'T'HH:mm"),
      competition: match.competition || '',
      isUpcoming: match.isUpcoming,
      venue: match.venue || '',
      time: match.time || '',
      videoUrl: match.videoUrl || ''
    });
    setIsAdding(true);
  };

  const handleAddNext = () => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setFormData({ ...formData, isUpcoming: true, score: '', videoUrl: '' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleAddPrevious = () => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setFormData({ ...formData, isUpcoming: false, venue: '', time: '' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      if (!formData.isUpcoming && formData.score) {
        const scoreRegex = /^\d+-\d+$/;
        if (!scoreRegex.test(formData.score)) {
          toast.error('Score must be in format "X-Y" (e.g. 2-1)');
          return;
        }
      }
      
      const data = {
        ...formData,
        date: new Date(formData.date)
      };

      if (editingId) {
        const path = `matches/${editingId}`;
        try {
          await updateDoc(doc(db, 'matches', editingId), data);
          toast.success('Match updated successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const path = 'matches';
        try {
          await addDoc(collection(db, 'matches'), data);
          toast.success('Match added successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({ opponent: '', score: '', date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), competition: '', isUpcoming: true, venue: '', time: '', videoUrl: '' });
    } catch (error) {
      toast.error(editingId ? 'Error updating match' : 'Error adding match');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    const path = `matches/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'matches', deleteId));
      toast.success('Match deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <DeleteConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Match"
        description="Are you sure you want to delete this match? This action cannot be undone."
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Manage Matches</h2>
        <div className="flex flex-wrap gap-2">
          {isEditor && (
            <>
              <Button onClick={handleAddNext} className="bg-blue-600 hover:bg-blue-700 rounded-full text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-2" /> Next Match
              </Button>
              <Button onClick={handleAddPrevious} className="bg-red-600 hover:bg-red-700 rounded-full text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-2" /> Previous Match
              </Button>
            </>
          )}
          {isAdding && (
            <Button variant="outline" onClick={() => {
              setIsAdding(false);
              setEditingId(null);
            }} className="rounded-full">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          )}
        </div>
      </div>


      {isAdding && (
        <Card className="border-none shadow-lg bg-white p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Opponent</label>
              <Input value={formData.opponent} onChange={e => setFormData({...formData, opponent: e.target.value})} required disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Competition</label>
              <Input value={formData.competition} onChange={e => setFormData({...formData, competition: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Date & Time</label>
              <Input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <Select value={formData.isUpcoming ? 'true' : 'false'} onValueChange={v => setFormData({...formData, isUpcoming: v === 'true'})} disabled={!isSuperAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Upcoming</SelectItem>
                  <SelectItem value="false">Past Result</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!formData.isUpcoming && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Score (e.g. 2-1)</label>
                <Input value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} />
              </div>
            )}
            {!formData.isUpcoming && (
              <div className="space-y-2 md:col-span-2 lg:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Match Highlights (Video URL)</label>
                <Input 
                  value={formData.videoUrl} 
                  onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                  placeholder="Paste YouTube/Vimeo URL"
                />
              </div>
            )}
            {formData.isUpcoming && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Venue</label>
                  <Input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} disabled={!isSuperAdmin} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Match Time</label>
                  <Input value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} placeholder="15:00" disabled={!isSuperAdmin} />
                </div>
              </>
            )}
            <div className="md:col-span-2 lg:col-span-3">
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                {editingId ? 'Update Match' : 'Save Match'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Upcoming Fixtures
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {matches.filter(m => m.isUpcoming).map(match => (
                <TableRow key={match.id}>
                  <TableCell className="text-xs">{format(match.date, 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-bold text-sm">{match.opponent}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(match)} className="text-blue-600 h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {isSuperAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(match.id)} className="text-red-600 h-8 w-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {matches.filter(m => m.isUpcoming).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500 text-sm italic">No upcoming matches</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <div className="p-4 bg-red-50 border-b border-red-100">
          <h3 className="font-bold text-red-900 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Past Results
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Opponent</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.filter(m => !m.isUpcoming).map(match => (
                <TableRow key={match.id}>
                  <TableCell className="text-xs">{format(match.date, 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-bold text-sm">{match.opponent}</TableCell>
                  <TableCell className="font-black text-sm">{match.score}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(match)} className="text-blue-600 h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {isSuperAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(match.id)} className="text-red-600 h-8 w-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {matches.filter(m => !m.isUpcoming).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-sm italic">No past results</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  </div>
);
};

const MatchReportManager = ({ players, matches, isVerified }: { players: any[], matches: any[], isVerified: boolean }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [reportData, setReportData] = useState<{[key: string]: { 
    isPresent: boolean, 
    goals: number, 
    assists: number, 
    conceded: number
  }}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize report data
  useEffect(() => {
    const initialData: any = {};
    players.forEach(p => {
      initialData[p.id] = {
        isPresent: false,
        goals: 0,
        assists: 0,
        conceded: 0
      };
    });
    setReportData(initialData);
  }, [players]);

  const updatePlayerStat = (playerId: string, field: string, value: any) => {
    const numValue = Number(value);
    if (field !== 'isPresent' && (isNaN(numValue) || numValue < 0)) {
      toast.error('Stats cannot be negative');
      return;
    }
    setReportData(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: field === 'isPresent' ? value : numValue
      }
    }));
  };

  const selectedMatch = matches.find(m => m.id === selectedMatchId);
  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.number.toString().includes(searchTerm)
  );

  const handleSubmitReport = async () => {
    if (!selectedMatchId) {
      toast.error('Please select a match first');
      return;
    }
    if (!isVerified) {
      toast.error('Verification required to sync stats');
      return;
    }

    const presentPlayers = Object.keys(reportData).filter(id => reportData[id].isPresent);
    if (presentPlayers.length === 0) {
      toast.error('No players marked as present');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = [];
      for (const playerId of presentPlayers) {
        const stats = reportData[playerId];
        const playerRef = doc(db, 'players', playerId);
        const currentPlayer = players.find(p => p.id === playerId);
        
        if (currentPlayer) {
          const newMatchesPlayed = (Number(currentPlayer.matchesPlayed) || 0) + 1;
          const newGoals = (Number(currentPlayer.goals) || 0) + Number(stats.goals);
          const newAssists = (Number(currentPlayer.assists) || 0) + Number(stats.assists);
          let newCleanSheets = (Number(currentPlayer.cleanSheets) || 0);
          
          if (currentPlayer.position === 'Goalkeeper' && Number(stats.conceded) === 0) {
            newCleanSheets += 1;
          }

          updates.push(updateDoc(playerRef, {
            matchesPlayed: newMatchesPlayed,
            goals: newGoals,
            assists: newAssists,
            cleanSheets: newCleanSheets
          }));
        }
      }

      await Promise.all(updates);
      
      // Update match to mark it as recapped
      const matchPath = `matches/${selectedMatchId}`;
      try {
        await updateDoc(doc(db, 'matches', selectedMatchId), {
          statsSyncDone: true,
          statsSyncDate: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, matchPath);
      }

      toast.success(`Report synced! Updated stats for ${presentPlayers.length} players.`);
      setSelectedMatchId('');
    } catch (error) {
      console.error(error);
      if (!(error instanceof Error && error.message.includes('{'))) {
        toast.error('Error updating stats');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Match Statistics Sync</h2>
          <p className="text-gray-500 text-sm max-w-xl">Update player stats based on match performance. This updates lifecycle totals automatically across the entire platform.</p>
        </div>
        
        {selectedMatchId && (
          <div className="flex items-center gap-4 animate-in slide-in-from-right-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">Active Match</div>
              <div className="font-bold text-gray-900">{selectedMatch?.opponent}</div>
            </div>
            <Button 
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="bg-gray-900 hover:bg-black text-white h-12 px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-gray-200"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Commit Performance Updates'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {/* Selection Strip */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-80">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">1. Select Target Match</label>
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="w-full bg-gray-50 border-none h-11 rounded-lg">
                  <SelectValue placeholder="Choose a recently played match..." />
                </SelectTrigger>
                <SelectContent>
                  {matches.filter(m => !m.statsSyncDone).map(match => (
                    <SelectItem key={match.id} value={match.id}>
                      {match.opponent} ({format(match.date, 'MMM dd')})
                    </SelectItem>
                  ))}
                  {matches.filter(m => m.statsSyncDone).length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Synchronized</div>
                      {matches.filter(m => m.statsSyncDone).map(match => (
                        <SelectItem key={match.id} value={match.id} disabled>
                          ✓ {match.opponent} ({format(match.date, 'MMM dd')})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">2. Filter Squad</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search by name or squad number..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-xs bg-gray-50 border-none rounded-lg w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Width Player List */}
        <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-gray-50 py-6 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-500">Player Performance Ledger</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-none">
                    <TableHead className="w-16 px-8 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">Status</TableHead>
                    <TableHead className="px-4 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">Player</TableHead>
                    <TableHead className="text-center w-32 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">Goals Scored</TableHead>
                    <TableHead className="text-center w-32 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">Assists Provider</TableHead>
                    <TableHead className="text-center w-48 h-14 font-black text-[10px] uppercase tracking-widest text-gray-400">GK Analytics (Conceded)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map(player => {
                    const stats = reportData[player.id] || { isPresent: false, goals: 0, assists: 0, conceded: 0 };
                    return (
                      <TableRow key={player.id} className={`border-gray-50 transition-colors ${stats.isPresent ? 'bg-red-50/20' : 'opacity-40 hover:opacity-100'}`}>
                        <TableCell className="px-8">
                          <button 
                            onClick={() => updatePlayerStat(player.id, 'isPresent', !stats.isPresent)}
                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${stats.isPresent ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-100' : 'bg-white border-gray-200 text-transparent'}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-sm font-black text-gray-900 border-2 border-white shadow-sm ring-1 ring-gray-100">
                              {player.number}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{player.name}</div>
                              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{player.position}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <input 
                              type="number" 
                              disabled={!stats.isPresent}
                              value={stats.goals}
                              onChange={e => updatePlayerStat(player.id, 'goals', Number(e.target.value))}
                              className="w-16 h-11 text-center font-bold text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all disabled:opacity-30"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <input 
                              type="number" 
                              disabled={!stats.isPresent}
                              value={stats.assists}
                              onChange={e => updatePlayerStat(player.id, 'assists', Number(e.target.value))}
                              className="w-16 h-11 text-center font-bold text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all disabled:opacity-30"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-8">
                          {player.position === 'Goalkeeper' ? (
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex flex-col items-center">
                                <input 
                                  type="number" 
                                  disabled={!stats.isPresent}
                                  value={stats.conceded}
                                  onChange={e => updatePlayerStat(player.id, 'conceded', Number(e.target.value))}
                                  className={`w-16 h-11 text-center font-black rounded-xl outline-none transition-all ${stats.conceded === 0 && stats.isPresent ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-900 border-none'}`}
                                />
                                {stats.conceded === 0 && stats.isPresent && (
                                  <span className="text-[8px] font-black text-green-600 uppercase mt-1 animate-pulse">Clean Sheet!</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-black italic">OUTFIELD</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const NewsManager = ({ news, isVerified, isSuperAdmin, isEditor }: { news: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { uploading, uploadProgress, uploadStatus, uploadSuccess, handleUpload } = useOptimizedUpload(isVerified);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: ''
  });

  const handleEdit = (item: any) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      image: item.image || ''
    });
    setLocalPreview(item.image || null);
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const url = await handleUpload(file, 'news');
    if (url) {
      setFormData(prev => ({ ...prev, image: url }));
      setLocalPreview(url);
      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), { image: url });
      }
      toast.success('Optimized news image uploaded! ⚡');
    } else {
      setLocalPreview(formData.image || null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      if (editingId) {
        const path = `news/${editingId}`;
        try {
          await updateDoc(doc(db, 'news', editingId), formData);
          toast.success('News updated successfully');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const path = 'news';
        try {
          await addDoc(collection(db, 'news'), {
            ...formData,
            date: serverTimestamp(),
            approved: true // Admin posts are auto-approved
          });
          toast.success('News posted');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', content: '', image: '' });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('{'))) {
        toast.error(editingId ? 'Error updating news' : 'Error posting news');
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const path = `news/${id}`;
    try {
      await updateDoc(doc(db, 'news', id), { approved: true });
      toast.success('Article approved and published');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    const path = `news/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'news', deleteId));
      toast.success('Article deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <DeleteConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        description="Are you sure you want to delete this news article? This action cannot be undone."
      />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage News</h2>
        {isEditor && (
          <Button onClick={() => {
            if (!isVerified) {
              toast.error('Email verification required');
              return;
            }
            setIsAdding(!isAdding);
            if (isAdding) setEditingId(null);
          }} className="bg-red-600 hover:bg-red-700 rounded-full">
            {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isAdding ? 'Cancel' : 'Post News'}
          </Button>
        )}
      </div>


      {isAdding && (
        <Card className="border-none shadow-lg bg-white p-6">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
              <div className="flex flex-col gap-4">
                <div className="relative group aspect-[21/9] rounded-3xl overflow-hidden border-4 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center transition-all hover:border-red-200">
                  {localPreview || formData.image ? (
                    <>
                      <img src={localPreview || formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                          <Loader2 className="w-10 h-10 text-white animate-spin mb-6" />
                          <div className="w-full max-w-md bg-white/20 h-2.5 rounded-full overflow-hidden mb-3">
                            <motion.div 
                              className="bg-red-500 h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs font-black text-white uppercase tracking-[0.2em]">{uploadStatus} {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 bg-green-500/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white"
                        >
                          <motion.div 
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl"
                          >
                            <Check className="w-10 h-10 text-green-500 stroke-[3px]" />
                          </motion.div>
                          <p className="text-sm font-black uppercase tracking-[0.2em] italic">Cover Image Uploaded!</p>
                        </motion.div>
                      )}
                      {!uploading && !uploadSuccess && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                          <label htmlFor="news-image-upload" className="w-12 h-12 bg-white rounded-2xl cursor-pointer hover:scale-110 transition-transform flex items-center justify-center shadow-xl">
                            <Upload className="w-6 h-6 text-gray-900" />
                          </label>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, image: '' }));
                              setLocalPreview(null);
                            }}
                            className="w-12 h-12 bg-white rounded-2xl hover:scale-110 transition-transform flex items-center justify-center shadow-xl text-red-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <label htmlFor="news-image-upload" className="flex flex-col items-center justify-center cursor-pointer p-12 text-center group">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:shadow-red-100/50">
                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 mb-1">Upload a cover story image</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Landscape works best (16:9)</span>
                    </label>
                  )}
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="news-image-upload"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or External Image URL</label>
                  <Input 
                    value={formData.image} 
                    onChange={e => {
                      setFormData({...formData, image: e.target.value});
                      setLocalPreview(null);
                    }} 
                    placeholder="https://example.com/news-cover.jpg" 
                    className="text-xs h-10 bg-gray-50/50 rounded-xl border-gray-100"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Content</label>
              <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="min-h-[200px]" required disabled={!isSuperAdmin} />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              {editingId ? 'Update Article' : 'Publish Article'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {news.map(item => (
          <Card key={item.id} className={`border-none shadow-sm p-6 flex justify-between items-center ${!item.approved ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : 'bg-white'}`}>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{item.title}</h3>
                {!item.approved && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-100">Pending Approval</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">{format(item.date, 'MMM dd, yyyy')}</p>
            </div>
            <div className="flex gap-2">
              {isSuperAdmin && !item.approved && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApprove(item.id)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Edit className="w-4 h-4" />
              </Button>
              {isSuperAdmin && (
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const GalleryManager = ({ items, isVerified, isSuperAdmin, isEditor }: { items: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const { uploading, uploadProgress, uploadStatus, uploadSuccess, handleUpload } = useOptimizedUpload(isVerified);
  const [formData, setFormData] = useState({
    url: '',
    caption: ''
  });

  const handleEdit = (item: any) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    setEditingId(item.id);
    setFormData({
      url: item.url,
      caption: item.caption || ''
    });
    setLocalPreview(item.url || null);
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const url = await handleUpload(file, 'gallery');
    if (url) {
      setFormData(prev => ({ ...prev, url: url }));
      setLocalPreview(url);
      if (editingId) {
        await updateDoc(doc(db, 'gallery', editingId), { url: url });
      }
      toast.success('Optimized gallery image uploaded! ⚡');
    } else {
      setLocalPreview(formData.url || null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    if (!formData.url) {
      toast.error('Please provide an image URL');
      return;
    }
    try {
      if (editingId) {
        const path = `gallery/${editingId}`;
        try {
          await updateDoc(doc(db, 'gallery', editingId), formData);
          toast.success('Gallery item updated');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        const path = 'gallery';
        try {
          await addDoc(collection(db, 'gallery'), {
            ...formData,
            date: serverTimestamp()
          });
          toast.success('Image added to gallery');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ url: '', caption: '' });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('{'))) {
        toast.error(editingId ? 'Error updating gallery' : 'Error adding to gallery');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    const path = `gallery/${deleteId}`;
    try {
      await deleteDoc(doc(db, 'gallery', deleteId));
      toast.success('Image deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <DeleteConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
      />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Gallery</h2>
        {isEditor && (
          <Button onClick={() => {
            if (!isVerified) {
              toast.error('Email verification required');
              return;
            }
            setIsAdding(!isAdding);
            if (isAdding) setEditingId(null);
          }} className="bg-red-600 hover:bg-red-700 rounded-full">
            {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isAdding ? 'Cancel' : 'Add Photo'}
          </Button>
        )}
      </div>


      {isAdding && (
        <Card className="border-none shadow-lg bg-white p-6">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Gallery Photo</label>
              <div className="flex flex-col gap-4">
                <div className="relative group aspect-video rounded-3xl overflow-hidden border-4 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center transition-all hover:border-red-200">
                  {localPreview || formData.url ? (
                    <>
                      <img src={localPreview || formData.url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                          <Loader2 className="w-10 h-10 text-white animate-spin mb-6" />
                          <div className="w-full max-w-sm bg-white/20 h-2.5 rounded-full overflow-hidden mb-3">
                            <motion.div 
                              className="bg-red-500 h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs font-black text-white uppercase tracking-[0.2em]">{uploadStatus} {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          className="absolute inset-0 bg-green-500/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white"
                        >
                          <motion.div 
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-2xl"
                          >
                            <Check className="w-12 h-12 text-green-500 stroke-[4px]" />
                          </motion.div>
                          <p className="text-lg font-black uppercase tracking-[0.3em] italic drop-shadow-md">Uploaded!</p>
                        </motion.div>
                      )}
                      {!uploading && !uploadSuccess && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                          <label htmlFor="gallery-image-upload" className="w-12 h-12 bg-white rounded-2xl cursor-pointer hover:scale-110 transition-transform flex items-center justify-center shadow-xl">
                            <Upload className="w-6 h-6 text-gray-900" />
                          </label>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, url: '' }));
                              setLocalPreview(null);
                            }}
                            className="w-12 h-12 bg-white rounded-2xl hover:scale-110 transition-transform flex items-center justify-center shadow-xl text-red-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <label htmlFor="gallery-image-upload" className="flex flex-col items-center justify-center cursor-pointer p-12 text-center group">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:shadow-red-100/50">
                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-red-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 mb-1">Click to browse your photos</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">High quality JPG, PNG, WEBP</span>
                    </label>
                  )}
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="gallery-image-upload"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or External Image URL</label>
                  <Input 
                    value={formData.url} 
                    onChange={e => {
                      setFormData({...formData, url: e.target.value});
                      setLocalPreview(null);
                    }} 
                    placeholder="https://example.com/gallery-photo.jpg" 
                    className="text-xs h-10 bg-gray-50/50 rounded-xl border-gray-100"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Caption</label>
              <Input value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} placeholder="Match celebration..." />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
              {editingId ? 'Update Item' : 'Add to Gallery'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map(item => (
          <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm">
            <img src={item.url} alt={item.caption} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-white hover:text-blue-400">
                <Edit className="w-5 h-5" />
              </Button>
              {isSuperAdmin && (
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="text-white hover:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DonationManager = ({ donations }: { donations: any[] }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Recent Donations</h2>
      <Card className="border-none shadow-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map(d => (
              <TableRow key={d.id}>
                <TableCell>{format(d.date, 'MMM dd, HH:mm')}</TableCell>
                <TableCell className="font-bold">{d.donorName}</TableCell>
                <TableCell className="font-black text-green-600">KES {d.amount}</TableCell>
                <TableCell className="max-w-xs truncate">{d.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
    </div>
  );
};

const SettingsManager = ({ stats, social, isVerified, isSuperAdmin, isEditor }: { stats: any, social: any, isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [formData, setFormData] = useState({
    wins: '0',
    draws: '0',
    losses: '0',
    goalsScored: '0',
    goalsConceded: '0',
    cleanSheets: '0',
    totalMatches: '0',
    averageRating: '0.0'
  });

  const [socialData, setSocialData] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    whatsapp: '',
    youtube: '',
    tiktok: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (stats) {
      setFormData({
        wins: String(stats.wins || 0),
        draws: String(stats.draws || 0),
        losses: String(stats.losses || 0),
        goalsScored: String(stats.goalsScored || 0),
        goalsConceded: String(stats.goalsConceded || 0),
        cleanSheets: String(stats.cleanSheets || 0),
        totalMatches: String(stats.totalMatches || 0),
        averageRating: String(stats.averageRating || 0)
      });
    }
    if (social) {
      setSocialData({
        facebook: social.facebook || '',
        instagram: social.instagram || '',
        twitter: social.twitter || '',
        whatsapp: social.whatsapp || '',
        youtube: social.youtube || '',
        tiktok: social.tiktok || '',
        email: social.email || '149benblue@gmail.com',
        phone: social.phone || '+254 723 134611',
        address: social.address || 'Olodo, Kenya'
      });
    }
  }, [stats, social]);

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      const data = {
        wins: Number(formData.wins),
        draws: Number(formData.draws),
        losses: Number(formData.losses),
        goalsScored: Number(formData.goalsScored),
        goalsConceded: Number(formData.goalsConceded),
        cleanSheets: Number(formData.cleanSheets),
        totalMatches: Number(formData.totalMatches),
        averageRating: Number(formData.averageRating)
      };

      if (Object.values(data).some(v => isNaN(v) || v < 0)) {
        toast.error('Stats values must be non-negative');
        return;
      }
      if (data.averageRating > 10) {
        toast.error('Average rating cannot exceed 10');
        return;
      }

      const path = 'settings/teamStats';
      try {
        await setDoc(doc(db, 'settings', 'teamStats'), data);
        toast.success('Stats updated');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('{'))) {
        toast.error('Error updating stats');
      }
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const path = 'settings/socialLinks';
    try {
      await setDoc(doc(db, 'settings', 'socialLinks'), socialData);
      toast.success('Social links updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-red-600" />
          Team Statistics
        </h2>
        <Card className="border-none shadow-lg bg-white p-8">
          <form onSubmit={handleSaveStats} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Total Matches</label>
              <Input type="number" min="0" value={formData.totalMatches} onChange={e => setFormData({...formData, totalMatches: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Wins</label>
              <Input type="number" min="0" value={formData.wins} onChange={e => setFormData({...formData, wins: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Draws</label>
              <Input type="number" min="0" value={formData.draws} onChange={e => setFormData({...formData, draws: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Losses</label>
              <Input type="number" min="0" value={formData.losses} onChange={e => setFormData({...formData, losses: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals Scored</label>
              <Input type="number" min="0" value={formData.goalsScored} onChange={e => setFormData({...formData, goalsScored: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals Conceded</label>
              <Input type="number" min="0" value={formData.goalsConceded} onChange={e => setFormData({...formData, goalsConceded: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Clean Sheets</label>
              <Input type="number" min="0" value={formData.cleanSheets} onChange={e => setFormData({...formData, cleanSheets: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Average Rating</label>
              <Input type="number" step="0.1" min="0" max="10" value={formData.averageRating} onChange={e => setFormData({...formData, averageRating: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="md:col-span-2 lg:col-span-4 pt-4">
              <Button type="submit" className="w-full bg-gray-900 hover:bg-black text-white h-14 rounded-xl font-bold" disabled={!isSuperAdmin}>
                Update Team Stats <Save className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-600" />
          Social Media Links
        </h2>
        <Card className="border-none shadow-lg bg-white p-8">
          <form onSubmit={handleSaveSocial} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Facebook URL</label>
              <Input value={socialData.facebook} onChange={e => setSocialData({...socialData, facebook: e.target.value})} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Instagram URL</label>
              <Input value={socialData.instagram} onChange={e => setSocialData({...socialData, instagram: e.target.value})} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Twitter / X URL</label>
              <Input value={socialData.twitter} onChange={e => setSocialData({...socialData, twitter: e.target.value})} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp Number</label>
              <Input value={socialData.whatsapp} onChange={e => setSocialData({...socialData, whatsapp: e.target.value})} placeholder="+254..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">YouTube Channel</label>
              <Input value={socialData.youtube} onChange={e => setSocialData({...socialData, youtube: e.target.value})} placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">TikTok URL</label>
              <Input value={socialData.tiktok} onChange={e => setSocialData({...socialData, tiktok: e.target.value})} placeholder="https://tiktok.com/@..." />
            </div>
            <div className="md:col-span-2 lg:col-span-3 pt-4">
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-14 rounded-xl font-bold">
                Update Social Links <Save className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-red-600" />
          Primary Contact Information
        </h2>
        <Card className="border-none shadow-lg bg-white p-8">
          <form onSubmit={handleSaveSocial} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Contact Email</label>
              <Input value={socialData.email} onChange={e => setSocialData({...socialData, email: e.target.value})} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Contact Phone</label>
              <Input value={socialData.phone} onChange={e => setSocialData({...socialData, phone: e.target.value})} placeholder="+254..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Office Address / Location</label>
              <Input value={socialData.address} onChange={e => setSocialData({...socialData, address: e.target.value})} placeholder="Olodo, Kenya" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 pt-4">
              <Button type="submit" className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-xl font-bold">
                Update Contact Information <Save className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
};


const DirectFirebaseStorage = ({ isVerified, isEditor }: { isVerified: boolean, isEditor: boolean }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isVerified) return;

    if (!navigator.onLine) {
      toast.error('Internet connection appears unstable or offline.');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      // 1. Size check
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }

      // 2. Type check (browser can be bypassed, check here too)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image.');
      }

      const url = await uploadFile(file, 'uploads', (p) => setProgress(Math.round(p)));
      setProgress(100);
      setDownloadURL(url);
      setHistory(prev => [url, ...prev].slice(0, 10));
      toast.success('File uploaded to Firebase Storage! 🚀');
    } catch (error: any) {
      console.error('Storage upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard! 📋');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Direct Storage Upload</h2>
        <p className="text-gray-500 text-sm max-w-lg italic">
          Based on your Firebase configuration. Quick upload for any assets (logos, sponsor banners, etc.)
        </p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono bg-gray-100/50 w-fit px-2 py-1 rounded">
          <Shield className="w-3 h-3" />
          <span>Bucket: {(firebaseConfig as any).storageBucket || 'Default'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-white p-8 rounded-[2rem]">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-[2.5rem] p-12 hover:bg-gray-50 transition-colors group">
              <input 
                type="file" 
                id="direct-upload" 
                className="hidden" 
                onChange={onUpload}
                disabled={uploading || !isEditor}
                accept="image/*"
              />
              <label 
                htmlFor="direct-upload" 
                className={`flex flex-col items-center gap-4 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform duration-500">
                  {uploading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900 mb-1">Click to Upload</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Max 5MB • JPG/PNG/WEBP<br/>
                    Stored in: /uploads/
                  </p>
                </div>
              </label>

              {uploading && (
                <div className="w-full mt-8 space-y-2">
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{progress}% UPLOADED</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase animate-pulse">Syncing with cloud...</p>
                  </div>
                </div>
              )}
            </div>

            {downloadURL && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span id="status" className="text-sm font-bold text-green-800">Image uploaded successfully!</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-200">Live URL</Badge>
                  </div>
                  <img id="imagePreview" src={downloadURL} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-sm mb-4" />
                  <div className="flex gap-2">
                    <Input value={downloadURL} readOnly className="bg-white border-green-200 text-xs font-mono" />
                    <Button onClick={() => copyToClipboard(downloadURL)} className="bg-green-600 hover:bg-green-700 rounded-lg">
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-none shadow-xl bg-white p-8 rounded-[2rem]">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Recent Uploads History</h3>
          <div className="space-y-4">
            {history.map((url, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-mono truncate">{url}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(url)} className="text-gray-300 hover:text-red-600">
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {history.length === 0 && (
              <div className="py-20 text-center opacity-30">
                <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No Recent Uploads</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const RoleManager = ({ currentUserId }: { currentUserId: string }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addingRole, setAddingRole] = useState('viewer');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (s) => {
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateRole = async (userId: string, role: string) => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      toast.success(`Role updated to ${role}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Valid email required');
      return;
    }
    
    const existingUser = users.find(u => u.email.toLowerCase() === newEmail.toLowerCase());
    if (existingUser) {
      toast.error('User already exists in system');
      return;
    }

    const encodedId = `pre_${newEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const path = `users/${encodedId}`;
    try {
      await setDoc(doc(db, 'users', encodedId), {
        email: newEmail.toLowerCase(),
        role: addingRole,
        isPreAuthorized: true,
        displayName: 'Invited User'
      });
      toast.success(`Pre-authorized ${newEmail} as ${addingRole}`);
      setNewEmail('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteUserRecord = async (id: string) => {
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('User access revoked');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-red-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Access Control Center</h2>
          <p className="text-gray-500 text-sm max-w-lg">Manage administrative roles and permissions. Changes take effect immediately upon next user login.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gray-900 hover:bg-black text-white rounded-xl h-12 px-6"
        >
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Pre-authorize User'}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-none shadow-xl bg-white p-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Email</label>
              <Input 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                placeholder="email@example.com"
                className="h-12 bg-gray-50 border-none rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Role</label>
              <Select value={addingRole} onValueChange={setAddingRole}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateUser}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl"
              >
                Create Access
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between py-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-500">System Users ({filteredUsers.length})</CardTitle>
          <div className="w-72">
            <div className="relative">
              <LayoutDashboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search email or UID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-xs bg-gray-50 border-none rounded-xl w-full"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-none">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-12">User Profile</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-12">Permission Level</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-gray-100">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-black">
                          {u.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{u.email}</span>
                          {u.id === currentUserId && (
                            <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] h-4">You</Badge>
                          )}
                          {u.isPreAuthorized && (
                            <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] h-4">Pre-Auth</Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2 mt-1">
                          <Shield className="w-2.5 h-2.5" />
                          {u.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(val) => updateRole(u.id, val)}>
                      <SelectTrigger className={`w-40 h-9 border-none font-bold text-xs rounded-lg transition-all ${
                        u.role === 'super_admin' ? 'bg-red-50 text-red-600' : 
                        u.role === 'editor' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.id !== currentUserId && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteUserRecord(u.id)} 
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 h-9 w-9 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Shield className="w-8 h-8 opacity-20" />
                      <p className="text-sm">No users found matching your search</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <Card className="p-8 bg-blue-50 border-none rounded-3xl">
        <div className="flex gap-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-blue-900 mb-3 uppercase tracking-widest text-xs">Security Protocols</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-blue-800/80 leading-relaxed">
              <div>
                <p className="font-bold text-blue-900 mb-2">Super Admin Privileges</p>
                Full CRUD access to critical infrastructure. Database wide edits, deletions, and role governance.
              </div>
              <div>
                <p className="font-bold text-blue-900 mb-2">Editor Guardrails</p>
                Restricted to content curation. Permission to modify visuals (photos) and identifiers (names) but barred from lifecycle data changes or finance records.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminPage;
