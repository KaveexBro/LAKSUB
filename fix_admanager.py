import re

with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

# fix currentAd initialization
content = re.sub(r'const \[currentAd, setCurrentAd\] = useState<Partial<AdCampaign>>\(\{\\.*?  \}\);  \}\);', 
'''const [currentAd, setCurrentAd] = useState<Partial<AdCampaign>>({
    campaignName: '',
    type: 'direct',
    zones: ['home-top'],
    imageUrl: '',
    targetUrl: '',
    isActive: true,
    displayFrequency: 1
  });''', content, flags=re.DOTALL)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
