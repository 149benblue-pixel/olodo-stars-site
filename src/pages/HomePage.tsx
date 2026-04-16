import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, Calendar, ArrowRight, Heart, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HomePage = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [pastMatches, setPastMatches] = useState<any[]>([]);
  const [allPastMatches, setAllPastMatches] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Matches
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const allMatches = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        date: d.data().date?.toDate() || new Date() 
      })) as any[];
      
      const upcoming = allMatches.filter(m => m.isUpcoming).sort((a, b) => a.date.getTime() - b.date.getTime());
      const past = allMatches.filter(m => !m.isUpcoming).sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setUpcomingMatches(upcoming.slice(0, 3));
      setPastMatches(past.slice(0, 3));
      setAllPastMatches(past.reverse()); // For chart trend
    });

    // Fetch News
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'), limit(3));
    const unsubNews = onSnapshot(newsQuery, (snapshot) => {
      setLatestNews(snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        date: d.data().date?.toDate() || new Date() 
      })));
    });

    // Fetch Stats
    const unsubStats = onSnapshot(doc(db, 'settings', 'teamStats'), (d) => {
      if (d.exists()) setStats(d.data());
    });

    // Fetch Player Count
    const unsubPlayers = onSnapshot(collection(db, 'players'), (s) => {
      setPlayerCount(s.size);
      setLoading(false);
    });

    return () => {
      unsubMatches();
      unsubNews();
      unsubStats();
      unsubPlayers();
    };
  }, []);

  const chartData = React.useMemo(() => {
    return allPastMatches.map(m => {
      const scores = m.score?.split('-').map(Number) || [0, 0];
      return {
        date: format(m.date, 'MMM dd'),
        scored: scores[0],
        conceded: scores[1],
        opponent: m.opponent
      };
    }).slice(-8); // Last 8 matches
  }, [allPastMatches]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000" 
            alt="Football Stadium" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
              OLODO <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">HOT STARS</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              More than a club. A community. A passion. <span className="text-white font-black border-b-2 border-red-600 pb-1">#FutaSikuZote</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/team" 
                className="w-full sm:w-auto px-10 py-5 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-2xl shadow-red-600/40"
              >
                Meet the Team <Users className="w-5 h-5" />
              </Link>
              <Link 
                to="/donate" 
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
              >
                Support Us <Heart className="w-5 h-5 text-red-600" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-900/40 backdrop-blur-xl border-t border-white/10 py-10 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 gap-12">
            <div className="text-center group">
              <div className="text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{playerCount}</div>
              <div className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">Active Players</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{stats?.wins || 0}</div>
              <div className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">Season Victories</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{stats?.averageRating || '0.0'}</div>
              <div className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">Team Rating</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{stats?.goalsScored || 0}</div>
              <div className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">Goals Scored</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest Highlights</h2>
              <p className="text-gray-600 max-w-xl">
                Stay updated with the most recent match results and upcoming fixtures for the Olodo Hot Stars.
              </p>
            </div>
            <Link to="/performance" className="text-red-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All Fixtures <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Upcoming Fixtures */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-red-600" />
                  Upcoming Fixtures
                </h3>
              </div>
              
              <div className="space-y-4">
                {upcomingMatches.length > 0 ? upcomingMatches.map((match) => (
                  <motion.div 
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-red-200 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-2 flex items-center justify-center text-red-600 font-bold text-lg">O</div>
                        <div className="text-sm font-bold truncate">Olodo Stars</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-black text-gray-300 uppercase italic">VS</div>
                        <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {format(match.date, 'MMM dd')}
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center text-gray-500 font-bold text-lg">
                          {match.opponent.charAt(0)}
                        </div>
                        <div className="text-sm font-bold truncate">{match.opponent}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {match.venue || 'TBD'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {match.time || format(match.date, 'HH:mm')}
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 italic">
                    No upcoming matches scheduled.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Results */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-red-600" />
                  Recent Results
                </h3>
              </div>

              <div className="space-y-4">
                {pastMatches.length > 0 ? pastMatches.map((match) => (
                  <motion.div 
                    key={match.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-sm font-bold mb-1">Olodo Stars</div>
                        <div className="text-3xl font-black text-gray-900">{match.score?.split('-')[0] || '0'}</div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FT</div>
                        <div className="h-8 w-[1px] bg-gray-100" />
                        <div className="text-[10px] font-bold text-gray-500">{format(match.date, 'MMM dd')}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-sm font-bold mb-1 truncate w-full text-center">{match.opponent}</div>
                        <div className="text-3xl font-black text-gray-900">{match.score?.split('-')[1] || '0'}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">
                        {match.competition || 'Regional League'}
                      </span>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 italic">
                    No recent results available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Season Stats Section */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600/5 -skew-x-12 translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Season <span className="text-red-600">Overview</span></h2>
              <p className="text-gray-400 text-lg mb-10">
                Our performance this season has been exceptional. We're consistently pushing boundaries and achieving new milestones.
              </p>
              
              <div className="space-y-8">
                {/* Performance Graph */}
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm font-bold uppercase tracking-widest text-gray-400">Goal Trend</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                        <span className="text-[10px] font-bold uppercase text-gray-500">Scored</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                        <span className="text-[10px] font-bold uppercase text-gray-500">Conceded</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] w-full min-h-[250px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScoredHome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#111827', 
                              borderRadius: '12px', 
                              border: '1px solid #374151',
                              fontSize: '12px'
                            }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="scored" 
                            stroke="#dc2626" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorScoredHome)" 
                            name="Scored"
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="conceded" 
                            stroke="#4b5563" 
                            strokeWidth={2}
                            fillOpacity={0} 
                            name="Conceded"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                        Insufficient data for trend analysis.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold uppercase tracking-widest text-sm">Win Rate</span>
                    <span className="text-red-600 font-black">{stats?.totalMatches ? Math.round((stats.wins / stats.totalMatches) * 100) : 0}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${stats?.totalMatches ? (stats.wins / stats.totalMatches) * 100 : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Goals Per Match</div>
                    <div className="text-3xl font-black">{stats?.totalMatches ? (stats.goalsScored / stats.totalMatches).toFixed(1) : '0.0'}</div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Clean Sheets</div>
                    <div className="text-3xl font-black">{stats?.cleanSheets || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-40 bg-red-600 rounded-3xl p-6 flex flex-col justify-end">
                  <div className="text-4xl font-black">{stats?.wins || 0}</div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80">Victories</div>
                </div>
                <div className="h-60 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-end">
                  <div className="text-4xl font-black">{stats?.goalsScored || 0}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Goals</div>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-60 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-end">
                  <div className="text-4xl font-black">{stats?.totalMatches || 0}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Matches Played</div>
                </div>
                <div className="h-40 bg-white rounded-3xl p-6 flex flex-col justify-end text-gray-900">
                  <div className="text-4xl font-black">{stats?.averageRating || '0.0'}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Team Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Preview */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Club News</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay informed with the latest announcements, transfer news, and club updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestNews.length > 0 ? latestNews.map((item, i) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={item.image || `https://picsum.photos/seed/football${i}/800/600`} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Announcement</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {item.content}
                  </p>
                  <Link to="/news" className="text-gray-900 font-bold text-sm flex items-center gap-2 hover:text-red-600 transition-colors">
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-red-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Support the Stars</h2>
          <p className="text-xl text-red-100 mb-10">
            Every contribution helps us grow, improve our facilities, and support our players. Join us in our journey to the top.
          </p>
          <Link 
            to="/donate" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-red-600 rounded-full font-black text-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
          >
            Donate Now <Heart className="w-6 h-6 fill-red-600" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

