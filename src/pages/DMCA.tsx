import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'wouter';

export const DMCA: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-12 pb-12 px-4 md:px-12">
      <Helmet>
        <title>DMCA Policy - LAKSUB</title>
        <meta name="description" content="LAKSUB DMCA Copyright Infringement Policy." />
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-netflix-surface p-8 md:p-12 rounded-2xl border border-gray-800 shadow-2xl"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-sm">Back to Home</span>
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-netflix-red/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-netflix-red" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">DMCA Policy</h1>
        </div>

        <div className="space-y-6 text-gray-300 leading-relaxed font-sinhala-text text-lg">
          <p>
            LAKSUB respects the intellectual property of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at http://www.copyright.gov/legislation/dmca.pdf, LAKSUB will respond expeditiously to claims of copyright infringement committed using the LAKSUB website.
          </p>
          <p>
            If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to LAKSUB's Designated Copyright Agent.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">DMCA Notice of Alleged Infringement ("Notice")</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.</li>
            <li>Identify the material that you claim is infringing (or to be the subject of infringing activity) and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material, including at a minimum, if applicable, the URL of the link shown on the Site where such material may be found.</li>
            <li>Provide your mailing address, telephone number, and, if available, email address.</li>
            <li>Include both of the following statements in the body of the Notice:
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>"I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."</li>
                <li>"I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."</li>
              </ul>
            </li>
            <li>Provide your full legal name and your electronic or physical signature.</li>
          </ol>
          <p className="mt-8">
            Deliver this Notice, with all items completed, to LAKSUB via email to: <br/>
            <strong>legal@laksub.com</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
