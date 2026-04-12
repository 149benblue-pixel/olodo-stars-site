import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, Zap, Target, Phone, Mail, ArrowUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo?: string;
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
  photo?: string;
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
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4 tracking-tight">
            Our <span className="text-red-600">Squad</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet the talented individuals who represent Olodo Hot Stars on and off the pitch.
          </p>
        </div>

        <Tabs defaultValue="players" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <div className="flex-grow flex justify-center md:justify-start">
              <TabsList className="bg-white border border-gray-200 p-1 rounded-full shadow-sm">
                <TabsTrigger value="players" className="rounded-full px-8 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
                  Players
                </TabsTrigger>
                <TabsTrigger value="officials" className="rounded-full px-8 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
                  Officials
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Sort By:</span>
              <div className="w-[140px]">
                <Select 
                  value={playerSort} 
                  onValueChange={setPlayerSort}
                >
                  <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 text-sm font-medium">
                    <SelectValue />
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

          <TabsContent value="players">
            {players.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-500">The squad list is currently being updated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {sortedPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-white group">
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
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                          <div className="flex justify-between items-end mb-2">
                            <Badge className="bg-red-600 hover:bg-red-600 border-none flex items-center gap-1 w-fit">
                              {getPositionIcon(player.position)}
                              {player.position}
                            </Badge>
                            {player.availability === false && (
                              <Badge className="bg-gray-500 hover:bg-gray-500 border-none text-[10px]">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-white leading-tight">{player.name}</h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm text-gray-500 uppercase tracking-widest text-[10px] font-bold">Matches</div>
                            <div className="text-lg font-bold text-gray-900">{player.matchesPlayed || 0}</div>
                          </div>
                          <div>
                            {player.position === 'Goalkeeper' ? (
                              <>
                                <div className="text-sm text-gray-500 uppercase tracking-widest text-[10px] font-bold">Clean Sheets</div>
                                <div className="text-lg font-bold text-gray-900">{player.cleanSheets || 0}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm text-gray-500 uppercase tracking-widest text-[10px] font-bold">Goals</div>
                                <div className="text-lg font-bold text-gray-900">{player.goals || 0}</div>
                              </>
                            )}
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 uppercase tracking-widest text-[10px] font-bold">Rating</div>
                            <div className="text-lg font-bold text-red-600">{player.rating || '0.0'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="officials">
            {officials.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No officials found</h3>
                <p className="text-gray-500">The management team list is currently being updated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedOfficials.map((official) => (
                  <motion.div
                    key={official.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white flex items-center p-4 gap-6">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
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
                      <div className="flex-grow">
                        <Badge variant="outline" className="mb-1 text-red-600 border-red-200 bg-red-50">
                          {official.role}
                        </Badge>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{official.name}</h3>
                        {official.contact && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{official.contact}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamPage;
