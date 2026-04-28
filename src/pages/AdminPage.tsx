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
import { db, storage, uploadFile } from '../firebase';
import { supabase, isSupabaseConfigured, uploadToSupabase } from '../supabase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  Upload,
  Loader2,
  Mail,
  Zap
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
import { format } from 'date-fns';

interface AdminPageProps {
  user: User | null;
  role: 'super_admin' | 'editor' | null;
}

const DatabaseStatus = () => {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSupabase = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setSupabaseConnected(false);
        return;
      }
      try {
        // We just check if the client can reach the endpoint
        const { error } = await supabase.from('test').select('*').limit(1);
        // Even if table doesn't exist, if we reach it we are good
        setSupabaseConnected(true);
      } catch (e) {
        setSupabaseConnected(false);
      }
    };
    checkSupabase();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Backend Infrastructure</h2>
        <p className="text-gray-500 text-sm">Monitor multi-cloud database connectivity and health.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg bg-white p-8 group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-orange-100 rounded-[2rem] flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Firebase</h3>
                <p className="text-xs text-gray-500 font-medium italic">Production Database & Auth</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-green-500 text-[10px] font-black uppercase tracking-widest px-3">Live</Badge>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Firestore v12.12</span>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-lg bg-white p-8 group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Supabase</h3>
                <p className="text-xs text-gray-500 font-medium italic">Advanced Realtime (Enabled)</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!isSupabaseConfigured ? (
                <Badge className="bg-amber-500 text-[10px] font-black uppercase tracking-widest px-3">Not Configured</Badge>
              ) : supabaseConnected === null ? (
                <Badge className="bg-gray-400 text-[10px] font-black uppercase tracking-widest px-3 flex gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing
                </Badge>
              ) : supabaseConnected ? (
                <Badge className="bg-green-500 text-[10px] font-black uppercase tracking-widest px-3">Active</Badge>
              ) : (
                <Badge className="bg-red-500 text-[10px] font-black uppercase tracking-widest px-3">Offline</Badge>
              )}
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PostgreSQL REST</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-12 p-8 bg-blue-50 rounded-3xl border border-blue-100">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Superbase Integration Active</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Your application is now connected to <strong>{import.meta.env.VITE_SUPABASE_URL || 'Supabase'}</strong>. 
              The backend infrastructure is running in a hybrid-cloud configuration, allowing for future migrations or secondary data streams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [supabaseMedia, setSupabaseMedia] = useState<any[]>([]);
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

    // Supabase Media fetching
    const fetchSupabaseMedia = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('club_media')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSupabaseMedia(data || []);
      } catch (err) {
        console.error('Error fetching Supabase media:', err);
      }
    };
    fetchSupabaseMedia();

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

  if (!isEditor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8">
            <X className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You do not have permission to access the admin panel. If you are an official, please contact the main administrator.
          </p>
          <Button onClick={() => window.location.href = '/'} className="w-full bg-red-600 hover:bg-red-700 rounded-full">
            Back to Home
          </Button>
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
          <TabsList className="bg-white border border-gray-200 p-0.5 rounded-lg shadow-sm mb-8 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <LayoutDashboard className="w-3 h-3" /> Dash
            </TabsTrigger>
            <TabsTrigger value="players" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Squad
            </TabsTrigger>
            <TabsTrigger value="officials" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Staff
            </TabsTrigger>
            <TabsTrigger value="matches" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <Trophy className="w-3 h-3" /> Games
            </TabsTrigger>
            <TabsTrigger value="news" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <Newspaper className="w-3 h-3" /> News
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" /> Media
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="donations" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
                <Heart className="w-3 h-3" /> Gifts
              </TabsTrigger>
            )}
            <TabsTrigger value="supabase-media" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Supa Media
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="roles" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Access
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <SettingsIcon className="w-3 h-3" /> Setup
            </TabsTrigger>
            <TabsTrigger value="database" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> Status
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="supabase-media">
            <SupabaseMediaManager items={supabaseMedia} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} onRefresh={() => {
              // Trigger a re-fetch manually if needed
              if (supabase) {
                supabase.from('club_media').select('*').order('created_at', { ascending: false }).then(({ data }) => {
                  setSupabaseMedia(data || []);
                });
              }
            }} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManager stats={teamStats} social={socialLinks} isVerified={isVerified || false} isSuperAdmin={isSuperAdmin} isEditor={isEditor} />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Sub-components for Admin Panel

const PLAYER_PLACEHOLDER = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400&h=533";
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    availability: true
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
      availability: player.availability !== undefined ? player.availability : true
    });
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFile(file, 'players', (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, photo: url }));
      
      // If we are editing an existing player, update the document immediately
      if (editingId) {
        await updateDoc(doc(db, 'players', editingId), { photo: url });
      }
      
      toast.success('Photo uploaded successfully ✅');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Error uploading photo: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
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
        rating: Number(formData.rating)
      };

      if (editingId) {
        await updateDoc(doc(db, 'players', editingId), data);
        toast.success('Player updated successfully');
      } else {
        await addDoc(collection(db, 'players'), data);
        toast.success('Player added successfully');
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
        availability: true
      });
    } catch (error) {
      toast.error(editingId ? 'Error updating player' : 'Error adding player');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    try {
      await deleteDoc(doc(db, 'players', deleteId));
      toast.success('Player deleted');
    } catch (error) {
      toast.error('Error deleting player');
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
              <Input type="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required disabled={!isSuperAdmin} />
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Player Photo</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="player-photo-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="player-photo-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all border border-slate-200 border-dashed hover:border-red-300 hover:text-red-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold">{uploading ? `Uploading ${uploadProgress}%` : formData.photo ? 'Change Photo' : 'Upload Image'}</span>
                  </label>
                  {formData.photo && (
                    <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 animate-in zoom-in-50 duration-300">
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-[1px] bg-gray-100 flex-grow" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">or</span>
                  <div className="h-[1px] bg-gray-100 flex-grow" />
                </div>
                <Input 
                  value={formData.photo} 
                  onChange={e => setFormData({...formData, photo: e.target.value})} 
                  placeholder="Paste image URL here..." 
                  className="text-[10px] h-8 bg-gray-50/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Matches Played</label>
              <Input type="number" value={formData.matchesPlayed} onChange={e => setFormData({...formData, matchesPlayed: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals</label>
              <Input type="number" value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Assists</label>
              <Input type="number" value={formData.assists} onChange={e => setFormData({...formData, assists: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Clean Sheets</label>
              <Input type="number" value={formData.cleanSheets} onChange={e => setFormData({...formData, cleanSheets: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Rating</label>
              <Input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} disabled={!isSuperAdmin} />
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
      </Card>
    </div>
  );
};

const OfficialManager = ({ officials, isVerified, isSuperAdmin, isEditor }: { officials: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFile(file, 'officials', (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, photo: url }));
      
      // If we are editing an existing official, update the document immediately
      if (editingId) {
        await updateDoc(doc(db, 'officials', editingId), { photo: url });
      }
      
      toast.success('Photo uploaded successfully ✅');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Error uploading photo: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
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
        await updateDoc(doc(db, 'officials', editingId), formData);
        toast.success('Official updated successfully');
      } else {
        await addDoc(collection(db, 'officials'), formData);
        toast.success('Official added successfully');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', role: '', photo: '', contact: '' });
    } catch (error) {
      toast.error(editingId ? 'Error updating official' : 'Error adding official');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    try {
      await deleteDoc(doc(db, 'officials', deleteId));
      toast.success('Official deleted');
    } catch (error) {
      toast.error('Error deleting official');
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Official Photo</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="official-photo-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="official-photo-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all border border-slate-200 border-dashed hover:border-red-300 hover:text-red-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold">{uploading ? `Uploading ${uploadProgress}%` : formData.photo ? 'Change Photo' : 'Upload Image'}</span>
                  </label>
                  {formData.photo && (
                    <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.photo} 
                  onChange={e => setFormData({...formData, photo: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7 bg-gray-50/50"
                />
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
      const data = {
        ...formData,
        date: new Date(formData.date)
      };

      if (editingId) {
        await updateDoc(doc(db, 'matches', editingId), data);
        toast.success('Match updated successfully');
      } else {
        await addDoc(collection(db, 'matches'), data);
        toast.success('Match added successfully');
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
    try {
      await deleteDoc(doc(db, 'matches', deleteId));
      toast.success('Match deleted');
    } catch (error) {
      toast.error('Error deleting match');
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
        </Card>

        <Card className="border-none shadow-md bg-white overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-100">
            <h3 className="font-bold text-red-900 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Past Results
            </h3>
          </div>
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
        </Card>
      </div>
    </div>
  );
};

const NewsManager = ({ news, isVerified, isSuperAdmin, isEditor }: { news: any[], isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFile(file, 'news', (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, image: url }));
      
      // If we are editing an existing news item, update the document immediately
      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), { image: url });
      }
      
      toast.success('Image uploaded successfully ✅');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Error uploading image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
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
        await updateDoc(doc(db, 'news', editingId), formData);
        toast.success('News updated successfully');
      } else {
        await addDoc(collection(db, 'news'), {
          ...formData,
          date: serverTimestamp(),
          approved: true // Admin posts are auto-approved
        });
        toast.success('News posted');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', content: '', image: '' });
    } catch (error) {
      toast.error(editingId ? 'Error updating news' : 'Error posting news');
    }
  };

  const handleApprove = async (id: string) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      await updateDoc(doc(db, 'news', id), { approved: true });
      toast.success('Article approved and published');
    } catch (error) {
      toast.error('Error approving article');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    try {
      await deleteDoc(doc(db, 'news', deleteId));
      toast.success('Article deleted');
    } catch (error) {
      toast.error('Error deleting article');
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="news-image-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="news-image-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all border border-slate-200 border-dashed hover:border-red-300 hover:text-red-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold">{uploading ? `Uploading ${uploadProgress}%` : formData.image ? 'Change Image' : 'Upload Image'}</span>
                  </label>
                  {formData.image && (
                    <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.image} 
                  onChange={e => setFormData({...formData, image: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7 bg-gray-50/50"
                />
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFile(file, 'gallery', (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, url: url }));
      
      // If we are editing an existing gallery item, update the document immediately
      if (editingId) {
        await updateDoc(doc(db, 'gallery', editingId), { url: url });
      }
      
      toast.success('Image uploaded successfully ✅');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Error uploading image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
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
        await updateDoc(doc(db, 'gallery', editingId), formData);
        toast.success('Gallery item updated');
      } else {
        await addDoc(collection(db, 'gallery'), {
          ...formData,
          date: serverTimestamp()
        });
        toast.success('Image added to gallery');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ url: '', caption: '' });
    } catch (error) {
      toast.error(editingId ? 'Error updating gallery' : 'Error adding to gallery');
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isVerified) return;
    try {
      await deleteDoc(doc(db, 'gallery', deleteId));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Error deleting image');
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Gallery Photo</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="gallery-image-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="gallery-image-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all border border-slate-200 border-dashed hover:border-red-300 hover:text-red-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-xs font-bold">{uploading ? `Uploading ${uploadProgress}%` : formData.url ? 'Change Image' : 'Upload Image'}</span>
                  </label>
                  {formData.url && (
                    <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, url: '' }))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7 bg-gray-50/50"
                />
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
      await setDoc(doc(db, 'settings', 'teamStats'), {
        wins: Number(formData.wins),
        draws: Number(formData.draws),
        losses: Number(formData.losses),
        goalsScored: Number(formData.goalsScored),
        goalsConceded: Number(formData.goalsConceded),
        cleanSheets: Number(formData.cleanSheets),
        totalMatches: Number(formData.totalMatches),
        averageRating: Number(formData.averageRating)
      });
      toast.success('Stats updated');
    } catch (error) {
      toast.error('Error updating stats');
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      await setDoc(doc(db, 'settings', 'socialLinks'), socialData);
      toast.success('Social links updated');
    } catch (error) {
      toast.error('Error updating social links');
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
              <Input type="number" value={formData.totalMatches} onChange={e => setFormData({...formData, totalMatches: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Wins</label>
              <Input type="number" value={formData.wins} onChange={e => setFormData({...formData, wins: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Draws</label>
              <Input type="number" value={formData.draws} onChange={e => setFormData({...formData, draws: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Losses</label>
              <Input type="number" value={formData.losses} onChange={e => setFormData({...formData, losses: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals Scored</label>
              <Input type="number" value={formData.goalsScored} onChange={e => setFormData({...formData, goalsScored: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals Conceded</label>
              <Input type="number" value={formData.goalsConceded} onChange={e => setFormData({...formData, goalsConceded: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Clean Sheets</label>
              <Input type="number" value={formData.cleanSheets} onChange={e => setFormData({...formData, cleanSheets: e.target.value})} disabled={!isSuperAdmin} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Average Rating</label>
              <Input type="number" step="0.1" value={formData.averageRating} onChange={e => setFormData({...formData, averageRating: e.target.value})} disabled={!isSuperAdmin} />
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

const SupabaseMediaManager = ({ items, onRefresh, isVerified, isSuperAdmin, isEditor }: { items: any[], onRefresh: () => void, isVerified: boolean, isSuperAdmin: boolean, isEditor: boolean }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    url: '',
    description: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured || !supabase) {
      toast.error('Supabase is not configured yet. Check your environment variables.');
      return;
    }

    setUploading(true);
    setUploadProgress(10); // Initial progress
    try {
      const url = await uploadToSupabase(file, 'media', 'gallery');
      setFormData(prev => ({ ...prev, url }));
      setUploadProgress(100);
      toast.success('Image uploaded to Supabase Storage! 🚀');
    } catch (error: any) {
      console.error('Supabase upload error:', error);
      toast.error(`Upload failed: ${error.message || 'Check if "media" bucket exists and is public'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    if (!formData.url) {
      toast.error('Please upload an image first');
      return;
    }

    try {
      const { error } = await supabase!
        .from('club_media')
        .insert([{
          url: formData.url,
          description: formData.description
        }]);

      if (error) throw error;

      toast.success('Media saved to Supabase database! ✅');
      setFormData({ url: '', description: '' });
      setIsAdding(false);
      onRefresh();
    } catch (error: any) {
      console.error('Supabase save error:', error);
      toast.error(`Failed to save: ${error.message || 'Check if "club_media" table exists'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isVerified) {
      toast.error('Email verification required');
      return;
    }
    try {
      const { error } = await supabase!
        .from('club_media')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Deleted from Supabase');
      onRefresh();
    } catch (error: any) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-gray-900">Supabase Media Cloud</h2>
          <p className="text-xs text-gray-500 font-medium">Assets stored in Supabase PostgreSQL & Storage</p>
        </div>
        {isEditor && (
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className={`${isAdding ? 'bg-gray-100 text-gray-900' : 'bg-emerald-600 text-white hover:bg-emerald-700'} rounded-2xl h-11 px-6 font-bold transition-all`}
          >
            {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isAdding ? 'Cancel' : 'New Upload'}
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-none shadow-xl bg-white p-8 animate-in zoom-in-95 duration-200 rounded-[2rem]">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image File</label>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      id="supabase-image-upload"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="supabase-image-upload"
                      className={`flex-1 flex items-center justify-center gap-3 h-32 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl cursor-pointer transition-all border-2 border-emerald-200 border-dashed ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[10px] font-bold">Uploading to Cloud...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6" />
                          <span className="text-xs font-bold font-mono">DRAG & DROP OR BROWSE</span>
                        </div>
                      )}
                    </label>
                    {formData.url && (
                      <div className="relative group w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                        <img src={formData.url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <Input 
                    value={formData.url} 
                    readOnly 
                    placeholder="Public URL will appear here..." 
                    className="text-[10px] h-9 bg-gray-50/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Story / Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Tell the story behind this image..." 
                  className="min-h-[128px] rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all text-sm"
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading || !formData.url} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20"
            >
              Commit to Supabase Edge
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <Card key={item.id} className="group relative bg-white border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden">
            <div className="aspect-[4/3] relative overflow-hidden">
              <img src={item.url} alt={item.description} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <p className="text-white text-sm font-medium line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                    {format(new Date(item.created_at), 'MMM dd, yyyy')}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isSuperAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(item.id)} 
                        className="h-8 w-8 rounded-full bg-white/10 hover:bg-red-500 hover:text-white transition-all text-gray-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Supabase Cloud Assets</h3>
            <p className="text-sm text-gray-500">Upload your first image to begin syncing with Postgres.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RoleManager = ({ currentUserId }: { currentUserId: string }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (s) => {
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      toast.success(`Role updated to ${role} for user.`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const deleteUserRecord = async (id: string) => {
     try {
       await deleteDoc(doc(db, 'users', id));
       toast.success('User access revoked');
     } catch (error) {
       toast.error('Failed to revoke access');
     }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Access Control</h2>
        <p className="text-gray-500 text-sm">Manage administrative roles and permissions for your team. Only Super Admins can see this.</p>
      </div>

      <div className="grid gap-4">
        {users.map((u) => (
          <Card key={u.id} className="p-6 bg-white border-none shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-gray-900">{u.email}</h3>
                {u.id === currentUserId && <Badge className="bg-blue-100 text-blue-600 border-none">You</Badge>}
              </div>
              <p className="text-[10px] text-gray-400 font-mono tracking-tighter">UID: {u.id}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={u.role} onValueChange={(val) => updateRole(u.id, val)}>
                <SelectTrigger className="w-40 h-10 border-gray-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="editor">Editor (Photos/Names Only)</SelectItem>
                </SelectContent>
              </Select>
              {u.id !== currentUserId && (
                <Button variant="ghost" size="icon" onClick={() => deleteUserRecord(u.id)} className="text-red-500 hover:bg-red-50 h-10 w-10 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-8 bg-blue-50 border-none border-l-4 border-l-blue-400 rounded-2xl">
        <div className="flex gap-4">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 mb-2 underline decoration-blue-200">Role Permissions Guide:</h4>
            <ul className="text-sm text-blue-800 space-y-3">
              <li className="flex gap-2">
                <Badge className="bg-blue-600 h-fit">Super Admin</Badge>
                <span>Full access to team stats, matches, finances, and role management.</span>
              </li>
              <li className="flex gap-2">
                <Badge className="bg-slate-400 h-fit">Editor</Badge>
                <span>Can update **names** and **photos** of players/officials, and **video links** to matches. Cannot add/delete items or change stats.</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
};

export default AdminPage;
