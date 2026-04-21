import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Smartphone, Landmark, Send, CheckCircle2, Phone, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

const DonationsPage = () => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [donationPhone, setDonationPhone] = useState('+254 716 773 610');

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'socialLinks'), (d) => {
      if (d.exists() && d.data().whatsapp) {
        setDonationPhone(d.data().whatsapp);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const donationAmount = Number(amount);
    
    if (!amount || isNaN(donationAmount) || donationAmount <= 0) {
      toast.error('Please enter a valid amount greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'donations'), {
        amount: donationAmount,
        donorName: name || 'Anonymous',
        message: message,
        date: serverTimestamp()
      });
      setIsSuccess(true);
      toast.success('Thank you for your generous donation!');
    } catch (error) {
      console.error('Error submitting donation:', error);
      toast.error('Failed to process donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-12 text-center shadow-xl"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-8">
            Your contribution of <span className="font-bold text-gray-900">KES {amount}</span> has been recorded. 
            <br /><br />
            Please complete your donation by sending to:
            <span className="block text-2xl font-black text-red-600 mt-2">{donationPhone}</span>
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(donationPhone.replace(/\s+/g, ''));
                toast.success('Number copied to clipboard!');
              }}
              variant="outline"
              className="w-full rounded-full py-6 text-lg font-bold border-red-200 text-red-600"
            >
              Copy Number
            </Button>
            <Button 
              onClick={() => setIsSuccess(false)}
              className="w-full bg-red-600 hover:bg-red-700 rounded-full py-6 text-lg font-bold"
            >
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4 tracking-tight">
            Support the <span className="text-red-600">Stars</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your support helps us provide equipment, training, and opportunities for our players.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Donation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-red-600 text-white p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-white" />
                  Make a Contribution
                </CardTitle>
                <p className="text-red-100 opacity-80">Every contribution helps the team grow 💪</p>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Amount (KES)</label>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="Enter amount" 
                      className="h-14 text-lg font-bold border-gray-200 focus:ring-red-600"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Your Name (Optional)</label>
                    <Input 
                      type="text" 
                      placeholder="Enter your name" 
                      className="h-14 border-gray-200 focus:ring-red-600"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Message (Optional)</label>
                    <Textarea 
                      placeholder="Write a message of support..." 
                      className="min-h-[120px] border-gray-200 focus:ring-red-600"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Processing...' : 'Donate Now'}
                    <Send className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-red-100 rounded-2xl text-red-600">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Direct Support</h3>
                  <p className="text-gray-500">Send your donation directly via M-Pesa</p>
                </div>
              </div>
              
              <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center mb-8">
                <p className="text-gray-600 mb-4 font-medium text-lg">
                  Support Olodo Hot Stars by sending your donation to:
                </p>
                <div className="text-3xl md:text-4xl font-black text-red-600 mb-4 tracking-tight">
                  {donationPhone}
                </div>
                <p className="text-gray-500 italic">
                  Thank you for your support!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-14 rounded-2xl border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => window.location.href = `tel:${donationPhone.replace(/\s+/g, '')}`}
                >
                  <Phone className="w-5 h-5 mr-2" /> Call to Donate
                </Button>
                <Button 
                  className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-bold"
                  onClick={() => window.open(`https://wa.me/${donationPhone.replace(/\s+/g, '').replace('+', '')}?text=I%20would%20like%20to%20support%20Olodo%20Hot%20Stars`, '_blank')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                </Button>
              </div>
            </div>

            <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
              <h3 className="text-lg font-bold text-red-900 mb-4">Why Donate?</h3>
              <ul className="space-y-3 text-red-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Provide quality football kits and equipment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Support our youth academy programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Maintain and improve our training facilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Cover travel costs for away matches</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DonationsPage;
