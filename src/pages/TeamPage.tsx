import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, Zap, Target, Phone, Mail, ArrowUpDown, ExternalLink } from 'lucide-react';
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

const PLAYER_PLACEHOLDER = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
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

        <div className="flex flex-col items-center mb-8">
          <Tabs defaultValue="squad" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white border border-gray-100 p-1 rounded-2xl shadow-sm h-14">
                <TabsTrigger 
                  value="squad" 
                  className="rounded-xl px-8 font-black uppercase tracking-widest text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white h-full transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  The Squad
                </TabsTrigger>
                <TabsTrigger 
                  value="officials" 
                  className="rounded-xl px-8 font-black uppercase tracking-widest text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white h-full transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Staff & Officials
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex justify-end mb-6">
              <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
                <div className="w-[110px]">
                  <Select 
                    value={playerSort} 
                    onValueChange={setPlayerSort}
                  >
                    <SelectTrigger className="h-5 border-none bg-transparent focus:ring-0 text-[10px] font-black uppercase tracking-wider p-0 shadow-none">
                      <SelectValue placeholder="Sort By" />
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

            <TabsContent value="squad" className="mt-0 outline-none">
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    Registered Players
                  </h2>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                    {players.length} Players
                  </div>
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No players found</h3>
                    <p className="text-gray-500">The squad list is currently being updated.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedPlayers.map((player) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Link to={`/player/${player.id}`} className="block h-full">
                          <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all bg-white group h-full rounded-2xl relative">
                            <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 transition-colors z-10 pointer-events-none" />
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
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="bg-white text-red-600 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                                  View Profile <ExternalLink className="w-3 h-3" />
                                </div>
                              </div>
                              <div className="absolute top-4 right-4 z-20">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white">
                                  {player.number}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 z-20">
                                <div className="flex justify-between items-end mb-2">
                                  <Badge className="bg-red-600 hover:bg-red-600 border-none flex items-center gap-1 w-fit shadow-sm text-[10px] uppercase font-black py-0.5">
                                    {getPositionIcon(player.position)}
                                    {player.position}
                                  </Badge>
                                  {player.availability === false && (
                                    <Badge className="bg-gray-500 hover:bg-gray-500 border-none text-[8px] uppercase font-black">
                                      Out
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md">{player.name}</h3>
                              </div>
                            </div>
                            <CardContent className="p-4 relative z-20">
                              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                                <div className="bg-gray-50 p-2 rounded-xl">
                                  <div className="text-[8px] text-gray-400 uppercase mb-0.5 tracking-tight">MP</div>
                                  <div className="text-sm font-black text-gray-900">{player.matchesPlayed || 0}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-xl">
                                  <div className="text-[8px] text-gray-400 uppercase mb-0.5 tracking-tight">
                                    {player.position === 'Goalkeeper' ? 'CS' : 'G'}
                                  </div>
                                  <div className="text-sm font-black text-gray-900">
                                    {player.position === 'Goalkeeper' ? (player.cleanSheets || 0) : (player.goals || 0)}
                                  </div>
                                </div>
                                <div className="bg-red-50 p-2 rounded-xl">
                                  <div className="text-[8px] text-red-400 uppercase mb-0.5 tracking-tight">RAT</div>
                                  <div className="text-sm font-black text-red-600">{Number(player.rating || 0).toFixed(1)}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="officials" className="mt-0 outline-none">
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    Management Team
                  </h2>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                    {officials.length} Staff
                  </div>
                </div>

                {officials.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No officials found</h3>
                    <p className="text-gray-500">The management team list is currently being updated.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedOfficials.map((official) => (
                      <motion.div
                        key={official.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                      >
                        <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-white flex items-center p-5 gap-5 h-full rounded-2xl">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
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
                            <Badge variant="outline" className="mb-2 text-[10px] px-2 py-0.5 text-red-600 border-red-200 bg-red-50 font-black uppercase">
                              {official.role}
                            </Badge>
                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{official.name}</h3>
                            {official.contact && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Phone className="w-3.5 h-3.5 text-red-400" />
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
