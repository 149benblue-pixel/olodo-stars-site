import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, Calendar, ArrowRight, Heart, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

const HomePage = () => {
  const [nextMatch, setNextMatch] = useState<any>(null);
  const [lastResult, setLastResult] = useState<any>(null);
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
      const past = allMatches.filter(m => !m.isUpcoming);
      
      setNextMatch(upcoming[0] || null);
      setLastResult(past[0] || null);
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
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
              OLODO <span className="text-red-600">HOT STARS</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
              More than a club. A community. A passion. <span className="font-bold text-red-500">#FutaSikuZote</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/team" 
                className="w-full sm:w-auto px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Meet the Team <Users className="w-5 h-5" />
              </Link>
              <Link 
                to="/donate" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Support Us <Heart className="w-5 h-5 text-red-600" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/5 backdrop-blur-sm border-t border-white/10 py-8 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{playerCount}</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats?.wins || 0}</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Wins this Season</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats?.averageRating || '0.0'}</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Team Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats?.goalsScored || 0}</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Goals Scored</div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Next Match */}
            <div className="lg:col-span-2 bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <span className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Next Match
                </span>
              </div>
              {nextMatch ? (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-6">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">{format(nextMatch.date, 'EEEE, MMMM dd • HH:mm')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8 mb-8">
                      <div className="text-center flex-1">
                        <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center text-red-600 font-bold text-3xl">O</div>
                        <div className="font-bold text-xl">Olodo Hot Stars</div>
                      </div>
                      <div className="text-4xl font-black text-gray-300 italic">VS</div>
                      <div className="text-center flex-1">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-500 font-bold text-3xl">
                          {nextMatch.opponent.charAt(0)}
                        </div>
                        <div className="font-bold text-xl">{nextMatch.opponent}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="text-gray-500">
                      <span className="font-bold text-gray-900">Venue:</span> {nextMatch.venue || 'TBD'}
                    </div>
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors">
                      Match Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 italic">
                  No upcoming matches scheduled.
                </div>
              )}
            </div>

            {/* Recent Result */}
            <div className="bg-red-600 rounded-3xl p-8 text-white shadow-lg shadow-red-200 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Trophy className="w-48 h-48" />
              </div>
              <h3 className="text-xl font-bold mb-6">Last Result</h3>
              {lastResult ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium opacity-80">Olodo Hot Stars</span>
                    <span className="text-3xl font-black">{lastResult.score?.split('-')[0] || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium opacity-80">{lastResult.opponent}</span>
                    <span className="text-3xl font-black">{lastResult.score?.split('-')[1] || '0'}</span>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <div className="text-sm font-medium mb-1 opacity-80">Competition</div>
                    <div className="font-bold">{lastResult.competition || 'Regional League'}</div>
                  </div>
                  <Link to="/performance" className="inline-flex items-center gap-2 text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors">
                    Match Report <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-red-200 italic">
                  No recent results.
                </div>
              )}
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
                    <div className="text-3xl font-black">12</div>
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

