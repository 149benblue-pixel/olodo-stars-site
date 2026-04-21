import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Users, 
  BarChart3, 
  Image as ImageIcon, 
  Newspaper, 
  Heart, 
  Settings, 
  Menu, 
  X,
  Trophy,
  Calendar,
  Info,
  Twitter,
  Youtube,
  Music2,
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Toaster } from 'sonner';

// Pages (to be implemented)
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import PerformancePage from './pages/PerformancePage';
import GalleryPage from './pages/GalleryPage';
import NewsPage from './pages/NewsPage';
import DonationsPage from './pages/DonationsPage';
import AdminPage from './pages/AdminPage';

const TopBar = ({ social }: { social: any }) => (
  <div className="bg-slate-900 text-white py-2 hidden sm:block">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
      <div className="flex items-center gap-6">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(social?.address || 'Olodo, Kenya')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-red-500 transition-colors"
        >
          <MapPin className="w-3 h-3 text-red-500" />
          <span>{social?.address || 'Olodo, Kenya'}</span>
        </a>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-red-500" />
          <span>Mon - Sat: 8:00 - 18:00</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <a href={`mailto:${social?.email || '149benblue@gmail.com'}`} className="hover:text-red-500 transition-colors flex items-center gap-2">
          <Mail className="w-3 h-3 text-red-500" />
          <span>{social?.email || '149benblue@gmail.com'}</span>
        </a>
        <a href={`tel:${(social?.phone || '+254 723 134611').replace(/\s+/g, '')}`} className="hover:text-red-500 transition-colors flex items-center gap-2">
          <Phone className="w-3 h-3 text-red-500" />
          <span>{social?.phone || '+254 723 134611'}</span>
        </a>
      </div>
    </div>
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const Navbar = ({ user }: { user: User | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Performance', path: '/performance', icon: BarChart3 },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Donate', path: '/donate', icon: Heart },
  ];

  const isAdmin = user?.email === '149benblue@gmail.com';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-500/20 group-hover:rotate-6 transition-transform">
                O
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">
                  OLODO <span className="text-red-600">STARS</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none mt-1">
                  Football Club
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-4 py-2 text-xs font-black uppercase tracking-widest transition-all hover:text-red-600 ${
                  location.pathname === item.path ? 'text-red-600' : 'text-slate-600'
                }`}
              >
                {item.name}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-600 rounded-full"
                  />
                )}
              </Link>
            ))}
            
            <div className="h-6 w-[1px] bg-slate-200 mx-4" />

            {isAdmin && (
              <Link
                to="/admin"
                className={`p-2 rounded-xl transition-all ${
                  location.pathname === '/admin' ? 'bg-red-50 text-red-600 shadow-inner' : 'text-slate-400 hover:text-red-600 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <button
                  onClick={() => logout()}
                  className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="ml-4 px-6 py-2.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                Join The Club
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 overflow-hidden shadow-2xl"
          >
            <div className="px-4 pt-4 pb-8 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                    location.pathname === item.path
                      ? 'text-red-600 bg-red-50 shadow-inner'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-30" />
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest ${
                    location.pathname === '/admin' ? 'text-red-600 bg-red-50' : 'text-slate-600'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <div className="pt-6 mt-4 border-t border-slate-100">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-slate-900 shadow-xl"
                  >
                    Logout Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-red-600 shadow-xl shadow-red-600/20"
                  >
                    Login with Google
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = ({ social }: { social: any }) => {
  return (
    <footer className="bg-slate-950 text-white pt-24 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-30" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center space-x-3 mb-8 group">
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-red-600/20">
                O
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter leading-none">
                  OLODO <span className="text-red-600">STARS</span>
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] leading-none mt-2">
                  Football Club
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
              Nurturing the next generation of football legends. Join our journey as we redefine excellence on and off the pitch.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Facebook, link: social?.facebook, color: 'hover:bg-blue-600' },
                { icon: Instagram, link: social?.instagram, color: 'hover:bg-pink-600' },
                { icon: Twitter, link: social?.twitter, color: 'hover:bg-sky-500' },
                { icon: Youtube, link: social?.youtube, color: 'hover:bg-red-600' },
                { icon: Music2, link: social?.tiktok, color: 'hover:bg-slate-800' },
                { icon: MessageCircle, link: social?.whatsapp ? `https://wa.me/${social.whatsapp.replace(/\+/g, '')}` : null, color: 'hover:bg-green-500' },
              ].map((item, i) => item.link && (
                <a 
                  key={i}
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`p-3.5 bg-white/5 rounded-2xl transition-all duration-300 hover:-translate-y-2 border border-white/5 hover:border-white/20 ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10">Navigation</h3>
            <ul className="space-y-5">
              {[
                { name: 'Meet The Squad', path: '/team' },
                { name: 'Match Center', path: '/performance' },
                { name: 'Club Gallery', path: '/gallery' },
                { name: 'Latest News', path: '/news' },
                { name: 'Support Us', path: '/donate' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-slate-400 hover:text-white hover:translate-x-2 transition-all flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-10">Get In Touch</h3>
            <div className="space-y-8">
              <a href={`mailto:${social?.email || '149benblue@gmail.com'}`} className="flex items-start gap-4 group cursor-pointer">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-red-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Email Us</div>
                  <div className="text-slate-200 font-bold group-hover:text-red-500 transition-colors">{social?.email || '149benblue@gmail.com'}</div>
                </div>
              </a>
              <a href={`tel:${(social?.phone || '+254 723 134611').replace(/\s+/g, '')}`} className="flex items-start gap-4 group cursor-pointer">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-red-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Call Support</div>
                  <div className="text-slate-200 font-bold group-hover:text-red-500 transition-colors">{social?.phone || '+254 723 134611'}</div>
                </div>
              </a>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(social?.address || 'Olodo, Kenya')}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-4 group cursor-pointer"
              >
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-red-600 transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Our Location</div>
                  <div className="text-slate-200 font-bold group-hover:text-red-500 transition-colors">{social?.address || 'Olodo, Kenya'}</div>
                </div>
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Olodo Hot Stars FC. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    const unsubSocial = onSnapshot(doc(db, 'settings', 'socialLinks'), (d) => {
      if (d.exists()) setSocialLinks(d.data());
    });

    return () => {
      unsubscribe();
      unsubSocial();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
          <div className="absolute inset-0 flex items-center justify-center text-red-600 font-black text-xl">O</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
        <TopBar social={socialLinks} />
        <Navbar user={user} />
        <main className="flex-grow pt-16 md:pt-20">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
              <Route path="/team" element={<PageWrapper><TeamPage /></PageWrapper>} />
              <Route path="/performance" element={<PageWrapper><PerformancePage /></PageWrapper>} />
              <Route path="/gallery" element={<PageWrapper><GalleryPage /></PageWrapper>} />
              <Route path="/news" element={<PageWrapper><NewsPage /></PageWrapper>} />
              <Route path="/donate" element={<PageWrapper><DonationsPage /></PageWrapper>} />
              <Route path="/admin" element={<PageWrapper><AdminPage user={user} /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer social={socialLinks} />
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
