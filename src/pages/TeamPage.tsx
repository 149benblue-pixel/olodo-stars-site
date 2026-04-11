import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, Zap, Target, Phone, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo?: string;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  rating?: number;
}

interface Official {
  id: string;
  name: string;
  role: string;
  photo?: string;
  contact?: string;
}

const TeamPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);

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
          <div className="flex justify-center mb-12">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-full shadow-sm">
              <TabsTrigger value="players" className="rounded-full px-8 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
                Players
              </TabsTrigger>
              <TabsTrigger value="officials" className="rounded-full px-8 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
                Officials
              </TabsTrigger>
            </TabsList>
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
                {players.map((player) => (
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
                          src={player.photo || `https://picsum.photos/seed/${player.id}/400/533`}
                          alt={player.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white">
                            {player.number}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                          <Badge className="mb-2 bg-red-600 hover:bg-red-600 border-none flex items-center gap-1 w-fit">
                            {getPositionIcon(player.position)}
                            {player.position}
                          </Badge>
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
                            <div className="text-sm text-gray-500 uppercase tracking-widest text-[10px] font-bold">Goals</div>
                            <div className="text-lg font-bold text-gray-900">{player.goals || 0}</div>
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
                {officials.map((official) => (
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
                          src={official.photo || `https://picsum.photos/seed/${official.id}/200/200`}
                          alt={official.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
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
