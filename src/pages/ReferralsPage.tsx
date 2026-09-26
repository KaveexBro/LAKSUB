import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ReferralHub } from '../components/ReferralHub';
import { AdZone } from '../components/AdZone';

export const ReferralsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-16 px-4 md:px-12">
      <Helmet>
        <title>Refer Friends & Earn Points | LAKSUB</title>
        <meta
          name="description"
          content="Invite your friends to LAKSUB and earn +50 POINTS for every real referral. PRO members get unlimited points."
        />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        <ReferralHub isModal={false} />

        <div className="pt-4">
          <AdZone zoneName="global-footer" />
        </div>
      </div>
    </div>
  );
};
