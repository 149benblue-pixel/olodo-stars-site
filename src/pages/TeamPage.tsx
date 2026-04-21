import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, Zap, Target, Phone, Mail, ArrowUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  rating?: number;
  availability?: boolean;
}

interface Official {
  id: string;
  name: string;
  role: string;
  contact?: string;
}

const PLAYER_PLACEHOLDER = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400&h=533";
const OFFICIAL_PLACEHOLDER = "https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&q=80&w=200&h=200";

const TeamPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerSort, setPlayerSort] = useState('number');
  const [officialSort, setOfficialSort] = useState('name');

  useEffect(() => {
    const playersQuery = query(collection(db, 'players'), orderBy('number', 'asc'));
    const officialsQuery = query(collection(db, 'officials'), orderBy('name', 'asc'));

    const unsubPlayers = onSnapshot(playersQuery, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
    });

    const unsubOfficials = onSnapshot(officialsQuery, (snapshot) => {
      setOfficials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Official)));
      setLoading(false);
    });

    return () => {
      unsubPlayers();
      unsubOfficials();
    };
  }, []);

  const getPositionIcon = (pos: string) => {
    switch (pos) {
      case 'Goalkeeper': return <Shield className="w-4 h-4" />;
      case 'Defender': return <Shield className="w-4 h-4" />;
      case 'Midfielder': return <Zap className="w-4 h-4" />;
      case 'Striker': return <Target className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    switch (playerSort) {
      case 'name': return a.name.localeCompare(b.name);
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'availability': return (a.availability === b.availability) ? 0 : a.availability ? -1 : 1;
      case 'position': {
        const order: Record<string, number> = { 'Goalkeeper': 1, 'Defender': 2, 'Midfielder': 3, 'Striker': 4 };
        return (order[a.position] || 99) - (order[b.position] || 99);
      }
      default: return a.number - b.number;
    }
  });

  const sortedOfficials = [...officials].sort((a, b) => {
    if (officialSort === 'role') return a.role.localeCompare(b.role);
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-1 tracking-tight">
            Our <span className="text-red-600">Squad</span>
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Meet the talented individuals who represent Olodo Hot Stars on and off the pitch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" render={<a href="#players" />} nativeButton={false} className="h-7 px-3 text-[10px] font-black uppercase tracking-widest rounded-full border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                Squad
              </Button>
              <Button variant="outline" size="sm" render={<a href="#officials" />} nativeButton={false} className="h-7 px-3 text-[10px] font-black uppercase tracking-widest rounded-full border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                Staff
              </Button>
            </div>

            <div className="h-4 w-[1px] bg-gray-200 mx-1" />

            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <div className="w-[90px]">
                <Select 
                  value={playerSort} 
                  onValueChange={setPlayerSort}
                >
                  <SelectTrigger className="h-5 border-none bg-transparent focus:ring-0 text-[9px] font-black uppercase tracking-wider p-0">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Jersey #</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-20">
          {/* Players Section */}
          <section id="players">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-red-600" />
                Registered Players
              </h2>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {players.length} Total
              </div>
            </div>

            {players.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-500">The squad list is currently being updated.</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-8 pb-8 -mx-4 px-4 scrollbar-hide snap-x">
                {sortedPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 w-[280px] snap-start"
                  >
                    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-white group h-full">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <img
                          src={player.photo || PLAYER_PLACEHOLDER}
                          alt={player.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLAYER_PLACEHOLDER;
                          }}
                        />
                        <div className="absolute top-4 right-4">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white">
                            {player.number}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
                          <div className="flex justify-between items-end mb-2">
                            <Badge className="bg-red-600 hover:bg-red-600 border-none flex items-center gap-1 w-fit shadow-sm">
                              {getPositionIcon(player.position)}
                              {player.position}
                            </Badge>
                            {player.availability === false && (
                              <Badge className="bg-gray-500 hover:bg-gray-500 border-none text-[10px]">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-md">{player.name}</h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Matches</div>
                            <div className="text-xl font-black text-gray-900">{player.matchesPlayed || 0}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                            {player.position === 'Goalkeeper' ? (
                              <>
                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Sheets</div>
                                <div className="text-xl font-black text-gray-900">{player.cleanSheets || 0}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Goals</div>
                                <div className="text-xl font-black text-gray-900">{player.goals || 0}</div>
                              </>
                            )}
                          </div>
                          <div className="bg-red-50 p-2 rounded-xl border border-red-100">
                            <div className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-1">Rating</div>
                            <div className="text-xl font-black text-red-600">{player.rating || '0.0'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Officials Section */}
          <section id="officials">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Club Officials
              </h2>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {officials.length} Total
              </div>
            </div>

            {officials.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No officials found</h3>
                <p className="text-gray-500">The management team list is currently being updated.</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-6 pb-8 -mx-4 px-4 scrollbar-hide snap-x">
                {sortedOfficials.map((official) => (
                  <motion.div
                    key={official.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="flex-shrink-0 w-[320px] snap-start"
                  >
                    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-white flex items-center p-6 gap-6 h-full">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
                        <img
                          src={official.photo || OFFICIAL_PLACEHOLDER}
                          alt={official.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = OFFICIAL_PLACEHOLDER;
                          }}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <Badge variant="outline" className="mb-2 text-xs px-2 py-0.5 text-red-600 border-red-200 bg-red-50">
                          {official.role}
                        </Badge>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{official.name}</h3>
                        {official.contact && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4 text-red-400" />
                            <span className="truncate font-medium">{official.contact}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
