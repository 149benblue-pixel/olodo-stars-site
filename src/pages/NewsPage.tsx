import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Newspaper, Calendar, ArrowRight, Search, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewsModal } from '../components/NewsModal';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: any;
  image?: string;
  approved?: boolean;
}

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: ''
  });

  useEffect(() => {
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(newsQuery, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      } as NewsItem)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'news'), {
        ...formData,
        date: serverTimestamp(),
        approved: false // Public submissions require approval
      });
      toast.success('News submitted! It will appear once approved by an admin.');
      setIsSubmitting(false);
      setFormData({ title: '', content: '', image: '' });
    } catch (error) {
      toast.error('Error submitting news. Please try again.');
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const isApproved = item.approved !== false; // Show approved or legacy posts
    return matchesSearch && isApproved;
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
            Club <span className="text-red-600">News</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            The latest stories, match reports, and announcements from Olodo Hot Stars.
          </p>
          <Button 
            onClick={() => setIsSubmitting(true)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" /> Submit Your Story
          </Button>
        </div>

        <div className="max-w-xl mx-auto mb-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search news articles..."
            className="pl-12 h-14 rounded-full border-gray-200 shadow-sm focus:ring-red-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredNews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No news found</h3>
            <p className="text-gray-500">Try searching for something else or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group"
              >
                <div className="h-56 overflow-hidden relative">
                  <img
                    src={item.image || `https://picsum.photos/seed/${item.id}/800/600`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(item.date, 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 mb-6 line-clamp-4 flex-grow">
                    {item.content}
                  </p>
                  <button 
                    onClick={() => setSelectedNews(item)}
                    className="flex items-center gap-2 text-red-600 font-bold hover:gap-3 transition-all"
                  >
                    Read Full Story <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Submission Modal */}
        <Dialog open={isSubmitting} onOpenChange={setIsSubmitting}>
          <DialogContent className="sm:max-w-[600px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Submit Your Story</DialogTitle>
              <DialogDescription>
                Share your Olodo Hot Stars moments with the community. Your post will be reviewed by an admin before being published.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Article Title</label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Amazing Win at the Local Derby"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Image URL (Optional)</label>
                <Input 
                  value={formData.image} 
                  onChange={e => setFormData({...formData, image: e.target.value})} 
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase">Content</label>
                <Textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="Tell your story..."
                  className="min-h-[150px] rounded-2xl"
                  required 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsSubmitting(false)} className="flex-1 rounded-full">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 rounded-full">
                  Submit for Approval
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
      </div>
    </div>
  );
};

export default NewsPage;
