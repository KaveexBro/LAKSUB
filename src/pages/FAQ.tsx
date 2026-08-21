import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { AdZone } from '../components/AdZone';

const faqs = [
  {
    englishQuestion: "What is LAKSUB?",
    sinhalaQuestion: "LAKSUB යනු කුමක්ද?",
    englishAnswer: "LAKSUB is Sri Lanka's premium platform for high-quality Sinhala subtitles. Our dedicated community of translators provides the most accurate and perfectly synced Sinhala subtitle files.",
    sinhalaAnswer: "LAKSUB යනු උසස් තත්ත්වයේ සිංහල උපසිරැසි සඳහා ශ්‍රී ලංකාවේ ප්‍රමුඛතම වේදිකාවයි. අපගේ කැපවූ පරිවර්තක ප්‍රජාව විසින් ඉතාමත් නිවැරදි සිංහල උපසිරැසි ලබා දෙයි."
  },
  {
    englishQuestion: "Can I earn money with LAKSUB?",
    sinhalaQuestion: "මට LAKSUB හරහා මුදල් ඉපයිය හැකිද?",
    englishAnswer: "Yes! For all subtitlers who can create high-quality subtitles, LAKSUB is a great platform to make money. We reward content creators based on their uploads, quality, and engagement.",
    sinhalaAnswer: "ඔව්! ගුණාත්මක උපසිරැසි නිර්මාණය කළ හැකි සියලුම උපසිරැසිකරුවන් සඳහා මුදල් ඉපයීමට LAKSUB යනු කදිම වේදිකාවකි. ඔබගේ නිර්මාණ සහ ඒ සඳහා ලැබෙන ප්‍රතිචාර මත අප මුදල් ගෙවීම් සිදු කරනු ලබයි."
  },
  {
    englishQuestion: "How do I become a subtitler on LAKSUB?",
    sinhalaQuestion: "LAKSUB හි උපසිරැසිකරුවෙකු වන්නේ කෙසේද?",
    englishAnswer: "You can simply sign up, go to your profile or the \"Apply\" section, and fill out the creator application. Once approved, you can start uploading your subtitles and building your portfolio.",
    sinhalaAnswer: "ඔබට අපගේ වේදිකාවේ ලියාපදිංචි වී, \"Apply\" (ඉල්ලුම් කරන්න) පිටුව හරහා නිර්මාණකරුවෙකු වීමට ඉල්ලුම් කළ හැකිය. එය අනුමත වූ පසු, ඔබට උපසිරැසි පළ කිරීම ආරම්භ කළ හැකිය."
  },
  {
    englishQuestion: "Are the subtitles completely free to download?",
    sinhalaQuestion: "උපසිරැසි භාගත කිරීම සම්පූර්ණයෙන්ම නොමිලේද?",
    englishAnswer: "Yes, basic downloading is entirely free. However, we also offer a 'Pro' plan for power users who want an ad-free experience, direct downloads, and other premium features.",
    sinhalaAnswer: "ඔව්, සාමාන්‍ය පරිශීලකයන් සඳහා උපසිරැසි භාගත කිරීම සම්පූර්ණයෙන්ම නොමිලේ. නමුත් ඔබට වෙළඳ දැන්වීම් වලින් තොරව සෘජුවම උපසිරැසි භාගත කිරීමට අවශ්‍යනම් අපගේ 'Pro' පැකේජය හරහා එය ලබාගත හැක."
  },
  {
    englishQuestion: "Can I request a subtitle for a specific movie or series?",
    sinhalaQuestion: "මට අවශ්‍ය චිත්‍රපටයක් හෝ කතාමාලාවක් සඳහා උපසිරැසියක් ඉල්ලා සිටිය හැකිද?",
    englishAnswer: "Absolutely. Registered users can use our 'Requests' page feature to ask the creator community for specific subtitles that are not currently available on the site.",
    sinhalaAnswer: "අනිවාර්යයෙන්ම. ලියාපදිංචි වූ පරිශීලකයින්ට අපගේ 'Requests' (ඉල්ලීම්) පිටුව හරහා දැනට නොමැති චිත්‍රපට හෝ කතාමාලා සඳහා උපසිරැසි ඉල්ලා සිටිය හැක."
  },
  {
    englishQuestion: "What should I do if a subtitle doesn't sync with my video?",
    sinhalaQuestion: "උපසිරැසිය වීඩියෝව සමඟ සමමුහුර්ත (sync) නොවේ නම් මා කුමක් කළ යුතුද?",
    englishAnswer: "Subtitles are synced for specific video releases (e.g., Web-DL, BluRay). Check the description on the subtitle page to match the video version, or use your video player's built-in subtitle delay/sync feature.",
    sinhalaAnswer: "අපගේ උපසිරැසි නිර්මාණය කර ඇත්තේ නිශ්චිත වීඩියෝ පිටපත් සඳහාය (උදා: Web-DL, BluRay). කරුණාකර උපසිරැසි පිටුවේ සඳහන් කර ඇති වීඩියෝ පිටපතම ලබාගැනීමට හෝ ඔබේ Video Player හි ඇති Subtitle Delay/Sync විශේෂාංගය භාවිතා කිරීමට කටයුතු කරන්න."
  }
];

const FAQItem = ({ faq, index }: { faq: any, index: number }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="mb-6 bg-netflix-surface border border-gray-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-gray-700">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 md:p-8 flex items-start justify-between focus:outline-none"
      >
        <div className="flex-1 pr-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-200 mb-2 font-sinhala-text">
            {faq.sinhalaQuestion}
          </h3>
          <h4 className="text-lg md:text-xl font-bold text-gray-400">
            {faq.englishQuestion}
          </h4>
        </div>
        <div className={`p-2 bg-white/5 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-netflix-red/20 text-netflix-red' : 'text-gray-400'}`}>
          <ChevronDown className="w-6 h-6" />
        </div>
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-6 md:px-8 pb-8 pt-0"
        >
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-300 text-lg mb-4 font-sinhala-text leading-relaxed">
              {faq.sinhalaAnswer}
            </p>
            <p className="text-gray-400 leading-relaxed font-medium">
              {faq.englishAnswer}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const FAQ: React.FC = () => {
  return (
    <main className="min-h-screen bg-netflix-bg text-white pb-24 pt-24">
      <Helmet>
        <title>FAQ | Frequently Asked Questions | LAKSUB</title>
        <meta name="description" content="Find answers to commonly asked questions about LAKSUB Sinhala Subtitles." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 md:px-12">
        <AdZone zoneName="faq-top" />
        
        <div className="flex flex-col items-center text-center mb-16 mt-8">
          <div className="w-20 h-20 bg-netflix-red/10 border-2 border-netflix-red rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(229,9,20,0.3)]">
            <HelpCircle className="w-10 h-10 text-netflix-red" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter uppercase">FAQ</h1>
          <h2 className="text-2xl font-bold text-gray-400 font-sinhala-text mb-4">නිතර අසන ප්‍රශ්න</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Find answers to commonly asked questions about using LAKSUB for downloading Sinhala subtitles.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} index={idx} />
          ))}
        </div>
        
        <AdZone zoneName="faq-bottom" />
      </div>
    </main>
  );
};
