import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, MessageSquare, Phone, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'wouter';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://formspree.io/f/xojzqlkp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          _replyto: formData.email
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert("Failed to send message. Please try again later.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("An error occurred while sending the message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-12 pb-12 px-4 md:px-12">
      <Helmet>
        <title>Contact Us - LAKSUB</title>
        <meta name="description" content="Contact the LAKSUB (Sinhala Subtitles) team for support or inquiries." />
      </Helmet>
      
      <div className="max-w-6xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-sm">Back to Home</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-netflix-red/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-netflix-red" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Contact Us</h1>
          </div>

          <p className="text-gray-400 text-lg leading-relaxed">
            Have a question, feedback, or need support? We're here to help. Fill out the form or reach out to us through our social channels.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 bg-netflix-surface border border-gray-800 rounded-xl hover:border-netflix-red/50 transition-colors">
              <div className="w-10 h-10 bg-netflix-red/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-netflix-red" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Telegram</p>
                <a href="https://t.me/KaveeshGimhan" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-netflix-red transition-colors">
                  @KaveeshGimhan
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-netflix-surface border border-gray-800 rounded-xl hover:border-netflix-red/50 transition-colors">
              <div className="w-10 h-10 bg-netflix-red/10 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-netflix-red" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Email Support</p>
                <p className="text-white font-bold">support@laksub.com</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-netflix-surface p-8 rounded-2xl border border-gray-800 shadow-2xl"
        >
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold">Message Sent!</h2>
              <p className="text-gray-400">Thank you for reaching out. We'll get back to you as soon as possible.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 text-netflix-red font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:border-netflix-red focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:border-netflix-red focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:border-netflix-red focus:outline-none transition-colors"
                  placeholder="How can we help?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Message</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:border-netflix-red focus:outline-none transition-colors resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-netflix-red text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};
