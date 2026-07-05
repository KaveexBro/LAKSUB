import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Application } from '../types';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';

export const ApplyCreator: React.FC = () => {
  const { user, userData, signIn } = useAuth();
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    if (!contactInfo.trim()) {
      setError("Please provide your contact information.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newApp: Omit<Application, 'id'> = {
        userId: user.uid,
        userName: userData.displayName,
        contactInfo: contactInfo.trim(),
        status: 'pending',
        message,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'applications'), newApp);
      setSuccess(true);
      setMessage('');
      setContactInfo('');
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-netflix-bg text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">Join LakSub Creators</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">Sign in to apply as a creator and start monetizing your subtitle translations.</p>
        <button onClick={signIn} className="btn-primary px-8 py-3">
          Sign In to Apply
        </button>
      </div>
    );
  }

  if (userData?.role === 'creator' || userData?.role === 'admin') {
    return (
      <div className="min-h-screen bg-netflix-bg text-white flex flex-col items-center justify-center px-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">You're Already a Creator!</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">Head over to your dashboard to start uploading and earning.</p>
        <Link href="/dashboard">
          <button className="btn-primary px-8 py-3">
            Go to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-12 px-4 md:px-12 flex flex-col items-center">
      <Helmet>
        <title>Apply as Creator - LAKSUB</title>
        <meta name="description" content="Join LAKSUB as a creator and start uploading Sinhala subtitles." />
      </Helmet>
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">Become a Creator</h1>
        <p className="text-gray-400 mb-10 text-center text-lg">Translate subtitles, share with the community, and earn LKR for every Pro download and ad view.</p>

        <div className="bg-netflix-surface p-6 md:p-10 rounded-xl border border-gray-800 shadow-2xl">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
              <p className="text-gray-400 mb-8">Our team will review your application and get back to you soon. Thank you for your interest in joining LakSub.</p>
              <Link href="/">
                <button className="btn-white px-8 py-3">
                  Return Home
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Why do you want to become a creator?</label>
                <textarea 
                  required 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:border-white focus:outline-none min-h-[150px] resize-y" 
                  placeholder="Tell us about your experience with subtitle translation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Contact Information (Telegram or WhatsApp)</label>
                <input 
                  type="text"
                  required 
                  value={contactInfo} 
                  onChange={e => setContactInfo(e.target.value)} 
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-white focus:border-white focus:outline-none" 
                  placeholder="e.g., Telegram: @username or WhatsApp: +947..."
                />
              </div>

              <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800 text-sm text-gray-400">
                <h4 className="font-bold text-white mb-2">Creator Requirements:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Must provide high-quality, accurate translations.</li>
                  <li>Earnings require a minimum of 100 user ratings to withdraw.</li>
                  <li>Maintain a 4.5+ average rating for bonus commissions.</li>
                </ul>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-netflix-red text-white py-4 rounded-md font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? 'Submitting...' : <><Send className="w-5 h-5" /> Submit Application</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
