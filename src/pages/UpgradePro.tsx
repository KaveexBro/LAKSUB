import React from 'react';
import { motion } from 'motion/react';
import { Crown, Zap, Clock, ShieldCheck, Download, Star, Check, ArrowRight, MessageSquare } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const UpgradePro: React.FC = () => {
  const benefits = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Instant Downloads",
      description: "Skip the 15-second wait time on every subtitle. Get your files immediately."
    },
    {
      icon: <Download className="w-6 h-6 text-blue-500" />,
      title: "Unlimited Daily Downloads",
      description: "Free users are limited to 10 downloads per day. Pro members get unlimited access."
    },
    {
      icon: <Crown className="w-6 h-6 text-netflix-red" />,
      title: "Top-of-Queue Priority",
      description: "Your subtitle requests are visually highlighted and placed at the top of our team's queue for 24-48h delivery."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      title: "Verified Quality",
      description: "Priority support and access to high-quality, verified translations from top creators."
    },
    {
      icon: <Star className="w-6 h-6 text-purple-500" />,
      title: "Support Creators",
      description: "Your subscription helps us reward the talented translators who keep LAKSUB running."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-orange-500" />,
      title: "Exclusive Community",
      description: "Join our private group for requests and direct communication with the team."
    }
  ];

  return (
    <div className="min-h-screen bg-netflix-bg text-white pb-20">
      <Helmet>
        <title>Upgrade to Pro - LAKSUB</title>
        <meta name="description" content="Unlock the full potential of LAKSUB with a Pro membership. Instant downloads, unlimited access, and more." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-netflix-red/20 to-transparent z-0" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-netflix-red/20 text-netflix-red px-4 py-2 rounded-full font-black uppercase tracking-widest text-xs mb-6 border border-netflix-red/30"
          >
            <Crown className="w-4 h-4" /> Premium Membership
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter leading-none"
          >
            Unlock the <span className="text-netflix-red">Pro</span> Experience
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium"
          >
            Elevate your movie night with instant access, unlimited downloads, and exclusive features designed for true cinema lovers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <a 
              href="https://t.me/KaveeshGimhan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Contact to Upgrade <ArrowRight className="w-6 h-6" />
            </a>
            <p className="mt-4 text-gray-500 text-sm font-bold uppercase tracking-widest">Secure payment via Telegram</p>
          </motion.div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-netflix-surface/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 hover:border-netflix-red/30 transition-colors group"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-3">{benefit.title}</h3>
              <p className="text-gray-400 font-medium leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto px-4 md:px-12 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Plan Comparison</h2>
          <p className="text-gray-400 font-medium">See why Pro is the better choice for you.</p>
        </div>

        <div className="bg-netflix-surface rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-6 text-gray-500 font-black uppercase tracking-widest text-xs">Feature</th>
                <th className="p-6 text-gray-500 font-black uppercase tracking-widest text-xs text-center">Free</th>
                <th className="p-6 text-netflix-red font-black uppercase tracking-widest text-xs text-center">Pro</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              <tr className="border-b border-white/5">
                <td className="p-6">Wait Time</td>
                <td className="p-6 text-center text-gray-500">15 Seconds</td>
                <td className="p-6 text-center text-green-500 font-black">Instant</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-6">Daily Downloads</td>
                <td className="p-6 text-center text-gray-500">10 / Day</td>
                <td className="p-6 text-center text-green-500 font-black">Unlimited</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-6">Early Access</td>
                <td className="p-6 text-center text-gray-500">No</td>
                <td className="p-6 text-center text-green-500 font-black flex justify-center"><Check className="w-5 h-5" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-6">Support Creators</td>
                <td className="p-6 text-center text-gray-500">No</td>
                <td className="p-6 text-center text-green-500 font-black flex justify-center"><Check className="w-5 h-5" /></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-6">Private Group</td>
                <td className="p-6 text-center text-gray-500">No</td>
                <td className="p-6 text-center text-green-500 font-black flex justify-center"><Check className="w-5 h-5" /></td>
              </tr>
              <tr>
                <td className="p-6">Top-of-Queue Priority</td>
                <td className="p-6 text-center text-gray-500">No</td>
                <td className="p-6 text-center text-green-500 font-black flex justify-center"><Check className="w-5 h-5" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 text-center py-20">
        <div className="bg-gradient-to-r from-netflix-red/20 via-netflix-red/10 to-netflix-red/20 p-12 rounded-[3rem] border border-netflix-red/20 shadow-2xl">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Ready to go Pro?</h2>
          <p className="text-gray-400 mb-10 text-lg font-medium">Join hundreds of other members and enjoy the best subtitle experience in Sri Lanka.</p>
          <a 
            href="https://t.me/KaveeshGimhan" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-white"
          >
            Get Started Now
          </a>
        </div>
      </div>
    </div>
  );
};
