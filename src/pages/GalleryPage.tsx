import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Maximize2, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  date: any;
}

const GalleryPage = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      setImages(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
          </div>
        ) : images.length > 0 ? (
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
                  alt={image.caption}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 text-center">
                  <Maximize2 className="w-8 h-8 text-white mb-2" />
                  <h3 className="text-white font-bold text-lg">{image.caption}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Photos Yet</h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Our gallery is currently empty. Check back soon as we add photos from our latest matches and events.
            </p>
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-16 bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">More Photos Coming Soon</h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              We're constantly capturing new memories. Check back often for updates from our latest matches and events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
