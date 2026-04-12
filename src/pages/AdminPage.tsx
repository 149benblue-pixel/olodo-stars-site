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
import { db } from '../firebase';
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
  LayoutDashboard,
  Settings as SettingsIcon,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';
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
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === '149benblue@gmail.com';

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

    return () => {
      unsubPlayers();
      unsubOfficials();
      unsubMatches();
      unsubNews();
      unsubGallery();
      unsubDonations();
      unsubStats();
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
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm mb-12 flex flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="players" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <Users className="w-4 h-4" /> Players
            </TabsTrigger>
            <TabsTrigger value="officials" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <Shield className="w-4 h-4" /> Officials
            </TabsTrigger>
            <TabsTrigger value="matches" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Matches
            </TabsTrigger>
            <TabsTrigger value="news" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4" /> News
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Gallery
            </TabsTrigger>
            <TabsTrigger value="donations" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <Heart className="w-4 h-4" /> Donations
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg px-6 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" /> Settings
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
            <SettingsManager stats={teamStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Sub-components for Admin Panel

const PlayerManager = ({ players }: { players: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'Goalkeeper',
    matchesPlayed: '0',
    goals: '0',
    assists: '0',
    rating: '0.0',
    photo: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'players'), {
        ...formData,
        number: Number(formData.number),
        matchesPlayed: Number(formData.matchesPlayed),
        goals: Number(formData.goals),
        assists: Number(formData.assists),
        rating: Number(formData.rating)
      });
      setIsAdding(false);
      setFormData({ name: '', number: '', position: 'Goalkeeper', matchesPlayed: '0', goals: '0', assists: '0', rating: '0.0', photo: '' });
      toast.success('Player added successfully');
    } catch (error) {
      toast.error('Error adding player');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await deleteDoc(doc(db, 'players', id));
        toast.success('Player deleted');
      } catch (error) {
        toast.error('Error deleting player');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Squad</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700 rounded-full">
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
            <div className="space-y-2 md:col-span-2 lg:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Player Photo</label>
              <ImageUpload 
                folder="players" 
                onUploadComplete={(url) => setFormData({...formData, photo: url})} 
              />
              {formData.photo && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Save className="w-3 h-3" /> Image ready
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Matches</label>
              <Input type="number" value={formData.matchesPlayed} onChange={e => setFormData({...formData, matchesPlayed: e.target.value})} />
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
              <label className="text-xs font-bold text-gray-500 uppercase">Rating</label>
              <Input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Save Player</Button>
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
              <TableHead>Stats (M/G/A)</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map(player => (
              <TableRow key={player.id}>
                <TableCell className="font-bold text-red-600">{player.number}</TableCell>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell>{player.matchesPlayed}/{player.goals}/{player.assists}</TableCell>
                <TableCell className="font-bold">{player.rating}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(player.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    contact: '',
    photo: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'officials'), {
        ...formData
      });
      setIsAdding(false);
      setFormData({ name: '', role: '', contact: '', photo: '' });
      toast.success('Official added successfully');
    } catch (error) {
      toast.error('Error adding official');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this official?')) {
      try {
        await deleteDoc(doc(db, 'officials', id));
        toast.success('Official deleted');
      } catch (error) {
        toast.error('Error deleting official');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Officials</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700 rounded-full">
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
              <label className="text-xs font-bold text-gray-500 uppercase">Contact (Optional)</label>
              <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+254..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Official Photo</label>
              <ImageUpload 
                folder="officials" 
                onUploadComplete={(url) => setFormData({...formData, photo: url})} 
              />
              {formData.photo && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Save className="w-3 h-3" /> Image ready
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Save Official</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {officials.map(official => (
              <TableRow key={official.id}>
                <TableCell>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                    <img src={official.photo || 'https://via.placeholder.com/40'} alt={official.name} className="w-full h-full object-cover" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{official.name}</TableCell>
                <TableCell>{official.role}</TableCell>
                <TableCell>{official.contact || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(official.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'matches'), {
        ...formData,
        date: new Date(formData.date)
      });
      setIsAdding(false);
      setFormData({ opponent: '', score: '', date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), competition: '', isUpcoming: true, venue: '', time: '', videoUrl: '' });
      toast.success('Match added successfully');
    } catch (error) {
      toast.error('Error adding match');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this match?')) {
      try {
        await deleteDoc(doc(db, 'matches', id));
        toast.success('Match deleted');
      } catch (error) {
        toast.error('Error deleting match');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Matches</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700 rounded-full">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Match'}
        </Button>
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
                <label className="text-xs font-bold text-gray-500 uppercase">Match Highlights (Video)</label>
                <div className="space-y-4">
                  <Input 
                    value={formData.videoUrl} 
                    onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                    placeholder="Paste YouTube/Vimeo URL or upload below"
                  />
                  <VideoUpload 
                    onUploadComplete={(url) => setFormData({...formData, videoUrl: url})} 
                  />
                </div>
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
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Save Match</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Opponent</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Result/Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map(match => (
              <TableRow key={match.id}>
                <TableCell>{format(match.date, 'MMM dd, yyyy')}</TableCell>
                <TableCell className="font-bold">{match.opponent}</TableCell>
                <TableCell>{match.competition}</TableCell>
                <TableCell>
                  {match.isUpcoming ? (
                    <span className="text-blue-600 font-bold">Upcoming</span>
                  ) : (
                    <span className="text-gray-900 font-black">{match.score}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(match.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const NewsManager = ({ news }: { news: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'news'), {
        ...formData,
        date: serverTimestamp()
      });
      setIsAdding(false);
      setFormData({ title: '', content: '', image: '' });
      toast.success('News posted');
    } catch (error) {
      toast.error('Error posting news');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this article?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
        toast.success('Article deleted');
      } catch (error) {
        toast.error('Error deleting article');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage News</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700 rounded-full">
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
              <label className="text-xs font-bold text-gray-500 uppercase">Article Image</label>
              <ImageUpload 
                folder="news" 
                onUploadComplete={(url) => setFormData({...formData, image: url})} 
              />
              {formData.image && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Save className="w-3 h-3" /> Image ready
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Content</label>
              <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="min-h-[200px]" required />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Publish Article</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {news.map(item => (
          <Card key={item.id} className="border-none shadow-sm bg-white p-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-gray-500">{format(item.date, 'MMM dd, yyyy')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const GalleryManager = ({ items }: { items: any[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    caption: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      toast.error('Please upload an image first');
      return;
    }
    try {
      await addDoc(collection(db, 'gallery'), {
        ...formData,
        date: serverTimestamp()
      });
      setIsAdding(false);
      setFormData({ url: '', caption: '' });
      toast.success('Image added to gallery');
    } catch (error) {
      toast.error('Error adding to gallery');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this image?')) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
        toast.success('Image deleted');
      } catch (error) {
        toast.error('Error deleting image');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Gallery</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700 rounded-full">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Photo'}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-none shadow-lg bg-white p-6">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Gallery Photo</label>
              <ImageUpload 
                folder="gallery" 
                onUploadComplete={(url) => setFormData({...formData, url: url})} 
              />
              {formData.url && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Save className="w-3 h-3" /> Image ready
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Caption</label>
              <Input value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} placeholder="Match celebration..." />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Add to Gallery</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map(item => (
          <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm">
            <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-white hover:text-red-500">
                <Trash2 className="w-6 h-6" />
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

const SettingsManager = ({ stats }: { stats: any }) => {
  const [formData, setFormData] = useState({
    wins: '0',
    draws: '0',
    losses: '0',
    goalsScored: '0',
    goalsConceded: '0',
    totalMatches: '0',
    averageRating: '0.0'
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
  }, [stats]);

  const handleSave = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Team Statistics</h2>
      <Card className="border-none shadow-lg bg-white p-8">
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
    </div>
  );
};

export default AdminPage;
