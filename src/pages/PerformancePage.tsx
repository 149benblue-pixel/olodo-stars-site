import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Calendar, MapPin, Clock, ArrowRight, Target, Shield, Zap, Play, X as CloseIcon, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

interface Match {
  id: string;
  opponent: string;
  score?: string;
  date: any;
  competition: string;
  isUpcoming: boolean;
  venue?: string;
  time?: string;
  videoUrl?: string;
}

interface TeamStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  averageRating: number;
}

const PerformancePage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'asc'));
    
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      } as Match)));
    });

    const unsubStats = onSnapshot(doc(db, 'settings', 'teamStats'), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as TeamStats);
      } else {
        // Default stats if not found
        setStats({
          totalMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsConceded: 0,
          averageRating: 0
        });
      }
      setLoading(false);
    });

    return () => {
      unsubMatches();
      unsubStats();
    };
  }, []);

  const upcomingMatches = matches.filter(m => m.isUpcoming).sort((a, b) => a.date.getTime() - b.date.getTime());
  const pastMatches = matches.filter(m => !m.isUpcoming).sort((a, b) => b.date.getTime() - a.date.getTime());

  const chartData = useMemo(() => {
    const past = matches.filter(m => !m.isUpcoming).sort((a, b) => a.date.getTime() - b.date.getTime());
    return past.map(m => {
      const scores = m.score?.split('-').map(Number) || [0, 0];
      return {
        date: format(m.date, 'MMM dd'),
        scored: scores[0],
        conceded: scores[1],
        opponent: m.opponent
      };
    }).slice(-10); // Last 10 matches
  }, [matches]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4 tracking-tight">
            Team <span className="text-red-600">Performance</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tracking our journey, celebrating our wins, and preparing for the next challenge.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Total Wins</div>
                <div className="text-3xl font-black text-gray-900">{stats?.wins || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Goals Scored</div>
                <div className="text-3xl font-black text-gray-900">{stats?.goalsScored || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Goals Conceded</div>
                <div className="text-3xl font-black text-gray-900">{stats?.goalsConceded || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Win Rate</div>
                <div className="text-3xl font-black text-gray-900">
                  {stats?.totalMatches ? Math.round((stats.wins / stats.totalMatches) * 100) : 0}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Graph */}
        <Card className="border-none shadow-lg bg-white mb-16 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-lg text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Goal Trend</CardTitle>
                  <p className="text-sm text-gray-500">Goals scored vs conceded over the last 10 matches</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase">Scored</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-xs font-bold text-gray-600 uppercase">Conceded</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[500px] w-full min-h-[500px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={500}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScored" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                      }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="scored" 
                      stroke="#dc2626" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScored)" 
                      name="Goals Scored"
                      isAnimationActive={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conceded" 
                      stroke="#d1d5db" 
                      strokeWidth={2}
                      fillOpacity={0} 
                      name="Goals Conceded"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 italic">
                  Not enough match data to display trend.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upcoming Matches */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Fixtures</h2>
            </div>
            {upcomingMatches.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <p className="text-gray-500">No upcoming matches scheduled.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6"
                  >
                    <div className="flex-shrink-0 text-center sm:text-left min-w-[120px]">
                      <div className="text-red-600 font-black text-2xl">{format(match.date, 'dd')}</div>
                      <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">{format(match.date, 'MMM yyyy')}</div>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{match.competition}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">vs {match.opponent}</h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{match.venue || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{match.time || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors">
                      Remind Me
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Past Results */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recent Results</h2>
            </div>
            {pastMatches.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <p className="text-gray-500">No recent results available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastMatches.map((match) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{match.competition}</span>
                      <span className="text-xs text-gray-500">{format(match.date, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-right font-bold text-lg">Olodo Hot Stars</div>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                          Number(match.score?.split('-')[0]) > Number(match.score?.split('-')[1]) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          {match.score?.split('-')[0] || '0'}
                        </div>
                        <div className="text-gray-300 font-bold">-</div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                          Number(match.score?.split('-')[1]) > Number(match.score?.split('-')[0]) ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          {match.score?.split('-')[1] || '0'}
                        </div>
                      </div>
                      <div className="flex-1 text-left font-bold text-lg">{match.opponent}</div>
                    </div>
                    {match.videoUrl && (
                      <div className="mt-6 flex justify-center">
                        <Button 
                          onClick={() => setSelectedVideo(match.videoUrl!)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-current" /> Watch Highlights
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Modal */}
        <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden rounded-3xl">
            <DialogHeader className="p-4 bg-white/10 backdrop-blur-md absolute top-0 left-0 right-0 z-10 border-b border-white/10">
              <DialogTitle className="text-white flex items-center justify-between">
                Match Highlights
              </DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full mt-14">
              {selectedVideo?.includes('youtube.com') || selectedVideo?.includes('youtu.be') ? (
                <iframe
                  src={selectedVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video 
                  src={selectedVideo || ''} 
                  controls 
                  className="w-full h-full"
                  autoPlay
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PerformancePage;

