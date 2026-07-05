#!/bin/bash
cat << 'INNER_EOF' > /tmp/rep.tsx
  const [currentAd, setCurrentAd] = useState<Partial<AdCampaign>>({
    campaignName: '',
    type: 'direct',
    zones: ['home-top'],
    imageUrl: '',
    targetUrl: '',
    isActive: true,
    displayFrequency: 1
  });
INNER_EOF
sed -i -e '/const \[currentAd/,/displayFrequency: 1/c\' -e "$(cat /tmp/rep.tsx | sed 's/$/\\/')" src/components/AdManager.tsx
sed -i 's/  });\\/  });/g' src/components/AdManager.tsx
