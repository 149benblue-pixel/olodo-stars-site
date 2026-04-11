import React from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Maximize2 } from 'lucide-react';

const GalleryPage = () => {
  const images = [
    { id: 1, url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800', title: 'Stadium View' },
    { id: 2, url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800', title: 'Training Session' },
    { id: 3, url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800', title: 'Match Day' },
    { id: 4, url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=800', title: 'Team Celebration' },
    { id: 5, url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=800', title: 'Youth Academy' },
    { id: 6, url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800', title: 'Goal Moment' },
    { id: 7, url: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800', title: 'Fans Support' },
    { id: 8, url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=800', title: 'Night Match' },
  ];

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4 tracking-tight">
            Club <span className="text-red-600">Gallery</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Capturing the moments that define our club, from intense matches to community celebrations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-sm"
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
                <Maximize2 className="w-8 h-8 text-white mb-2" />
                <h3 className="text-white font-bold text-lg">{image.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">More Photos Coming Soon</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            We're constantly capturing new memories. Check back often for updates from our latest matches and events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
