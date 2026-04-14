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
import { db, storage } from '../firebase';
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
  Loader2
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
}

const AdminPage = ({ user }: AdminPageProps) => {
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

  const isAdmin = user?.email === '149benvolio@gmail.com' || user?.email === '149benblue@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

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
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8">
            <X className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You do not have permission to access the admin panel. Please login with an administrator account.
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
            <TabsTrigger value="donations" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <Heart className="w-3 h-3" /> Gifts
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5">
              <SettingsIcon className="w-3 h-3" /> Setup
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
            <PlayerManager players={players} />
          </TabsContent>

          <TabsContent value="officials">
            <OfficialManager officials={officials} />
          </TabsContent>

          <TabsContent value="matches">
            <MatchManager matches={matches} />
          </TabsContent>

          <TabsContent value="news">
            <NewsManager news={news} />
          </TabsContent>

          <TabsContent value="gallery">
            <GalleryManager items={gallery} />
          </TabsContent>

          <TabsContent value="donations">
            <DonationManager donations={donations} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManager stats={teamStats} social={socialLinks} />
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

const PlayerManager = ({ players }: { players: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `players/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
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
    if (!deleteId) return;
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
        <Button onClick={() => {
          setIsAdding(!isAdding);
          if (isAdding) setEditingId(null);
        }} className="bg-red-600 hover:bg-red-700 rounded-full">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Player'}
        </Button>
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
              <Input type="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Position</label>
              <Select value={formData.position} onValueChange={v => setFormData({...formData, position: v})}>
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
                    accept="image/jpeg,image/png" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="player-photo-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="player-photo-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer transition-colors border border-gray-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading... ⏳' : 'Upload Photo'}
                  </label>
                  {formData.photo && (
                    <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.photo} 
                  onChange={e => setFormData({...formData, photo: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals</label>
              <Input type="number" value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Assists</label>
              <Input type="number" value={formData.assists} onChange={e => setFormData({...formData, assists: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Clean Sheets</label>
              <Input type="number" value={formData.cleanSheets} onChange={e => setFormData({...formData, cleanSheets: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Rating</label>
              <Input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Availability</label>
              <Select value={formData.availability ? 'true' : 'false'} onValueChange={v => setFormData({...formData, availability: v === 'true'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                {editingId ? 'Update Player' : 'Save Player'}
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
                      <AvatarImage src={player.photo || PLAYER_PLACEHOLDER} className="object-cover" />
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
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(player.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

const OfficialManager = ({ officials }: { officials: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    photo: '',
    contact: ''
  });

  const handleEdit = (official: any) => {
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `officials/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
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
    if (!deleteId) return;
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
        <Button onClick={() => {
          setIsAdding(!isAdding);
          if (isAdding) setEditingId(null);
        }} className="bg-red-600 hover:bg-red-700 rounded-full">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Official'}
        </Button>
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
              <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required />
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
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer transition-colors border border-gray-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading... ⏳' : 'Upload Photo'}
                  </label>
                  {formData.photo && (
                    <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.photo} 
                  onChange={e => setFormData({...formData, photo: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Contact (Optional)</label>
              <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+254..." />
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
                      <AvatarImage src={official.photo || OFFICIAL_PLACEHOLDER} className="object-cover" />
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
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(official.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

const MatchManager = ({ matches }: { matches: any[] }) => {
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
    setFormData({ ...formData, isUpcoming: true, score: '', videoUrl: '' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleAddPrevious = () => {
    setFormData({ ...formData, isUpcoming: false, venue: '', time: '' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!deleteId) return;
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
          <Button onClick={handleAddNext} className="bg-blue-600 hover:bg-blue-700 rounded-full text-xs sm:text-sm">
            <Plus className="w-4 h-4 mr-2" /> Next Match
          </Button>
          <Button onClick={handleAddPrevious} className="bg-red-600 hover:bg-red-700 rounded-full text-xs sm:text-sm">
            <Plus className="w-4 h-4 mr-2" /> Previous Match
          </Button>
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
              <Input value={formData.opponent} onChange={e => setFormData({...formData, opponent: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Competition</label>
              <Input value={formData.competition} onChange={e => setFormData({...formData, competition: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Date & Time</label>
              <Input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <Select value={formData.isUpcoming ? 'true' : 'false'} onValueChange={v => setFormData({...formData, isUpcoming: v === 'true'})}>
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
                  <Input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Match Time</label>
                  <Input value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} placeholder="15:00" />
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
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(match.id)} className="text-red-600 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(match.id)} className="text-red-600 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

const NewsManager = ({ news }: { news: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: ''
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      image: item.image || ''
    });
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `news/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
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
    try {
      await updateDoc(doc(db, 'news', id), { approved: true });
      toast.success('Article approved and published');
    } catch (error) {
      toast.error('Error approving article');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
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
        <Button onClick={() => {
          setIsAdding(!isAdding);
          if (isAdding) setEditingId(null);
        }} className="bg-red-600 hover:bg-red-700 rounded-full">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Post News'}
        </Button>
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
                    accept="image/jpeg,image/png" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="news-image-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="news-image-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer transition-colors border border-gray-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading... ⏳' : 'Upload Image'}
                  </label>
                  {formData.image && (
                    <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.image} 
                  onChange={e => setFormData({...formData, image: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Content</label>
              <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="min-h-[200px]" required />
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
              {!item.approved && (
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
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const GalleryManager = ({ items }: { items: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    caption: ''
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      url: item.url,
      caption: item.caption || ''
    });
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
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
    if (!deleteId) return;
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
        <Button onClick={() => {
          setIsAdding(!isAdding);
          if (isAdding) setEditingId(null);
        }} className="bg-red-600 hover:bg-red-700 rounded-full">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Photo'}
        </Button>
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
                    accept="image/jpeg,image/png" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="gallery-image-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="gallery-image-upload"
                    className={`flex items-center justify-center gap-2 w-full h-10 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer transition-colors border border-gray-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading... ⏳' : 'Upload Image'}
                  </label>
                  {formData.url && (
                    <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={formData.url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <Input 
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  placeholder="Or paste image URL" 
                  className="text-[10px] h-7"
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
            <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-white hover:text-blue-400">
                <Edit className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="text-white hover:text-red-400">
                <Trash2 className="w-5 h-5" />
              </Button>
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

const SettingsManager = ({ stats, social }: { stats: any, social: any }) => {
  const [formData, setFormData] = useState({
    wins: '0',
    draws: '0',
    losses: '0',
    goalsScored: '0',
    goalsConceded: '0',
    totalMatches: '0',
    averageRating: '0.0'
  });

  const [socialData, setSocialData] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    whatsapp: '',
    youtube: '',
    tiktok: ''
  });

  useEffect(() => {
    if (stats) {
      setFormData({
        wins: String(stats.wins || 0),
        draws: String(stats.draws || 0),
        losses: String(stats.losses || 0),
        goalsScored: String(stats.goalsScored || 0),
        goalsConceded: String(stats.goalsConceded || 0),
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
        tiktok: social.tiktok || ''
      });
    }
  }, [stats, social]);

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'teamStats'), {
        wins: Number(formData.wins),
        draws: Number(formData.draws),
        losses: Number(formData.losses),
        goalsScored: Number(formData.goalsScored),
        goalsConceded: Number(formData.goalsConceded),
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
              <Input type="number" value={formData.totalMatches} onChange={e => setFormData({...formData, totalMatches: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Wins</label>
              <Input type="number" value={formData.wins} onChange={e => setFormData({...formData, wins: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Draws</label>
              <Input type="number" value={formData.draws} onChange={e => setFormData({...formData, draws: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Losses</label>
              <Input type="number" value={formData.losses} onChange={e => setFormData({...formData, losses: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals Scored</label>
              <Input type="number" value={formData.goalsScored} onChange={e => setFormData({...formData, goalsScored: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Goals Conceded</label>
              <Input type="number" value={formData.goalsConceded} onChange={e => setFormData({...formData, goalsConceded: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Average Rating</label>
              <Input type="number" step="0.1" value={formData.averageRating} onChange={e => setFormData({...formData, averageRating: e.target.value})} />
            </div>
            <div className="md:col-span-2 lg:col-span-4 pt-4">
              <Button type="submit" className="w-full bg-gray-900 hover:bg-black text-white h-14 rounded-xl font-bold">
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
    </div>
  );
};

export default AdminPage;
