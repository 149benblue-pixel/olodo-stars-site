import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: Date;
  image?: string;
}

interface NewsModalProps {
  item: NewsItem | null;
  onClose: () => void;
}

export const NewsModal = ({ item, onClose }: NewsModalProps) => {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] rounded-3xl overflow-hidden p-0 gap-0 border-none outline-none">
        {item && (
          <div className="flex flex-col max-h-[90vh]">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={item.image || `https://picsum.photos/seed/${item.id}/800/600`}
                alt={item.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white inline-flex items-center gap-1.5 mb-3 shadow-lg">
                  <Calendar className="w-3 h-3" />
                  {format(item.date, 'MMMM dd, yyyy')}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-lg">
                  {item.title}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar bg-white">
              <div className="prose prose-slate max-w-none">
                {item.content.split('\n').map((paragraph, i) => (
                  paragraph.trim() && (
                    <p key={i} className="text-gray-700 text-lg leading-relaxed mb-6 font-medium">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button 
                onClick={onClose}
                className="bg-slate-900 hover:bg-black text-white rounded-full px-8 h-12 font-bold"
              >
                Close Article
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
