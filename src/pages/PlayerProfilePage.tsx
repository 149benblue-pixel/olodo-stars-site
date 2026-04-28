import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs, limit, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Trophy, 
  Target, 
  ShieldCheck, 
  Activity,
  Star,
  MapPin,
  Calendar,
  Zap,
  TrendingUp,
  MessageSquare,
  Send,
  User,
  Heart,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

const PLAYER_PLACEHOLDER = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo?: string;
  goals: number;
  assists?: number;
  cleanSheets?: number;
  matchesPlayed: number;
  rating: number;
  bio?: string;
  joinedDate?: Date;
  origin?: string;
  commitmentCount?: number;
}

interface Opinion {
  id: string;
  author: string;
  text: string;
  date: Date;
}

const PlayerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [newOpinion, setNewOpinion] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rankings, setRankings] = useState<{ goals: number; cleanSheets: number; totalPlayers: number }>({ goals: 0, cleanSheets: 0, totalPlayers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Listen to current player data
    const unsubPlayer = onSnapshot(doc(db, 'players', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayer({
          id: docSnap.id,
          ...data,
          joinedDate: data.joinedDate?.toDate(),
        } as Player);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching player:", error);
      setLoading(false);
    });

    // Listen to opinions subcollection
    const unsubOpinions = onSnapshot(query(collection(db, 'players', id, 'opinions'), orderBy('date', 'desc'), limit(10)), (snapshot) => {
      setOpinions(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      } as Opinion)));
    });

    // Listen to all players for real-time ranking
    const unsubSquad = onSnapshot(collection(db, 'players'), (snapshot) => {
      const squad = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
      
      // Calculate Goal Ranking
      const sortedByGoals = [...squad].sort((a, b) => (b.goals || 0) - (a.goals || 0));
      const goalRank = sortedByGoals.findIndex(p => p.id === id) + 1;

      // Calculate Clean Sheets Ranking
      const sortedByCS = [...squad].sort((a, b) => (b.cleanSheets || 0) - (a.cleanSheets || 0));
      const csRank = sortedByCS.findIndex(p => p.id === id) + 1;

      setRankings({
        goals: goalRank,
        cleanSheets: csRank,
        totalPlayers: squad.length
      });
    });

    // Handle Performance Trend automatically
    const unsubMatches = onSnapshot(query(collection(db, 'matches'), orderBy('date', 'desc'), limit(10)), (snapshot) => {
      const pastMatches = snapshot.docs
        .map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() || new Date() }))
        .filter((m: any) => !m.isUpcoming)
        .reverse();

      // Deterministic pseudo-random based on player id and match id
      const getRating = (playerId: string, matchId: string, baseRating: number, outcome: string) => {
        const seed = playerId + matchId;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = ((hash << 5) - hash) + seed.charCodeAt(i);
          hash |= 0;
        }
        const rng = Math.abs(hash % 100) / 100; // 0 to 1
        
        // Base rating from player profile
        let matchRating = baseRating;
        
        // Fluctuation based on outcome (-0.5 to +0.5)
        const outcomeBonus = outcome === 'win' ? 0.3 : outcome === 'loss' ? -0.3 : 0;
        
        // Random variance (-0.7 to +0.7)
        const variance = (rng - 0.5) * 1.4;
        
        matchRating = baseRating + outcomeBonus + variance;
        
        // Clamp between 4.0 and 10.0
        return Math.max(4, Math.min(10, Math.round(matchRating * 10) / 10));
      };

      if (player && pastMatches.length > 0) {
        const performanceData = pastMatches.map((m: any) => {
          const scores = m.score?.split('-').map(Number) || [0, 0];
          const outcome = scores[0] > scores[1] ? 'win' : scores[1] > scores[0] ? 'loss' : 'draw';
          
          return {
            match: `vs ${m.opponent}`,
            rating: getRating(id, m.id, player.rating || 7.0, outcome),
            date: format(m.date, 'MMM dd')
          };
        });
        setRecentMatches(performanceData);
      } else if (pastMatches.length > 0) {
        // Fallback if player data arrives after matches
        const performanceData = pastMatches.map((m: any) => ({
          match: `vs ${m.opponent}`,
          rating: 7.0 + (Math.random() - 0.5),
          date: format(m.date, 'MMM dd')
        }));
        setRecentMatches(performanceData);
      }
    });

    return () => {
      unsubPlayer();
      unsubOpinions();
      unsubSquad();
      unsubMatches();
    };
  }, [id, player?.rating]);

  const handleVouch = async () => {
    if (!id || !player) return;
    try {
      const currentCount = player.commitmentCount || 0;
      await updateDoc(doc(db, 'players', id), {
        commitmentCount: currentCount + 1
      });
      toast.success('Thank you for vouching for ' + player.name + '!');
    } catch (err) {
      console.error('Error vouching:', err);
    }
  };

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newOpinion.trim() || !authorName.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'players', id, 'opinions'), {
        author: authorName,
        text: newOpinion,
        date: serverTimestamp()
      });
      setNewOpinion('');
      setAuthorName('');
      toast.success('Your opinion has been shared!');
    } catch (err) {
      console.error('Error sharing opinion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Player Not Found</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm">The player profile you are looking for might have been moved or removed.</p>
        <Link to="/team">
          <Button className="bg-red-600 hover:bg-red-700 rounded-full px-8">Back to Team</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Header */}
      <div className="relative h-[40vh] sm:h-[50vh] bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-slate-900" />
        
        {/* Navigation */}
        <div className="absolute top-8 left-8 z-10">
          <Link to="/team">
            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-4 border border-white/20 backdrop-blur-sm">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Squad
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-12 left-0 right-0 px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-gray-200 flex-shrink-0"
          >
            <img 
              src={player.photo || PLAYER_PLACEHOLDER} 
              alt={player.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="flex-grow mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-red-600 hover:bg-red-600 font-black uppercase tracking-widest px-4 py-1">
                #{player.number}
              </Badge>
              <Badge variant="outline" className="text-white border-white/40 font-black uppercase tracking-widest px-4 py-1">
                {player.position}
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight drop-shadow-md">
              {player.name.split(' ').map((n, i) => i === 1 ? <span key={i} className="text-red-500 block sm:inline">{n}</span> : n + ' ')}
            </h1>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Joined {player.joinedDate ? format(player.joinedDate, 'yyyy') : '2024'}</span>
              </div>
              {player.origin && (
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-bold">{player.origin}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Stats Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all">
                <CardContent className="p-6 text-center">
                  <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-gray-900">{player.matchesPlayed}</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Matches</div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all">
                <CardContent className="p-6 text-center">
                  <Target className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <div className="text-3xl font-black text-gray-900">
                    {player.position === 'Goalkeeper' ? player.cleanSheets || 0 : player.goals}
                  </div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    {player.position === 'Goalkeeper' ? 'Clean Sheets' : 'Goals scored'}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all">
                <CardContent className="p-6 text-center">
                  <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-gray-900">{player.assists || 0}</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Assists</div>
                </CardContent>
              </Card>
              <Card className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all">
                <CardContent className="p-6 text-center">
                  <Star className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-red-600">{Number(player.rating || 0).toFixed(1)}</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Avg Rating</div>
                </CardContent>
              </Card>
            </div>

            {/* Form Chart */}
            <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Performance Trend</h3>
                    <p className="text-sm text-gray-500">Match ratings from recent appearances</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recentMatches}>
                      <defs>
                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis domain={[0, 10]} hide />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#ef4444" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRating)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Profile Bio */}
            {player.bio && (
              <Card className="rounded-3xl border-none shadow-sm bg-white">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Player Profile</h3>
                  <p className="text-gray-600 leading-relaxed italic">
                    "{player.bio}"
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="rounded-3xl border-none shadow-sm bg-red-600 text-white overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <h3 className="font-bold text-lg">Season Achievements</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                    <span className="text-sm font-bold opacity-80">Squad Goal Rank</span>
                    <span className="font-black">#{rankings.goals} <span className="text-[10px] opacity-60">/ {rankings.totalPlayers}</span></span>
                  </div>
                  {player.position === 'Goalkeeper' && (
                    <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                      <span className="text-sm font-bold opacity-80">Clean Sheet Rank</span>
                      <span className="font-black">#{rankings.cleanSheets}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                    <span className="text-sm font-bold opacity-80">Attendance Rate</span>
                    <span className="font-black">Matches: {player.matchesPlayed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8 text-center relative">
                <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Club Commitment</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {player.name} is a vital part of the squads' core structure. Vouch for their dedication!
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex justify-center -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white" />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-red-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-red-600">
                      +{player.commitmentCount || 0}
                    </div>
                  </div>
                  <Button 
                    onClick={handleVouch}
                    className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 px-6 font-bold text-xs flex items-center gap-2 group transition-all active:scale-95"
                  >
                    <Heart className="w-4 h-4 group-hover:fill-current" />
                    Vouch for Commitment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fan Opinions Section */}
            <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-6 h-6 text-red-600" />
                  <h3 className="font-bold text-lg">Fan Opinions</h3>
                </div>
                
                <form onSubmit={handleSubmitOpinion} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      placeholder="Your Name" 
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="bg-white border-none rounded-xl"
                      required
                    />
                  </div>
                  <Textarea 
                    placeholder="Express your opinion on their performance or commitment..." 
                    value={newOpinion}
                    onChange={e => setNewOpinion(e.target.value)}
                    className="bg-white border-none rounded-xl h-24 resize-none"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 rounded-xl h-12 font-bold flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Share Opinion
                  </Button>
                </form>

                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {opinions.length > 0 ? opinions.map((opinion, idx) => (
                      <motion.div 
                        key={opinion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{opinion.author}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{format(opinion.date, 'MMM dd, yyyy')}</div>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm italic leading-relaxed">
                          "{opinion.text}"
                        </p>
                      </motion.div>
                    )) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No opinions shared yet. Be the first!
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
