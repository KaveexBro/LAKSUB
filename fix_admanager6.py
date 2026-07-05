with open('src/components/AdManager.tsx', 'r') as f:
    c = f.read()

bad = """  const [currentAd, setCurrentAd] = useState<Partial<AdCampaign>>({\\
    campaignName: '',\\
    type: 'direct',\\
    zones: ['home-top'],\\
    imageUrl: '',\\
    targetUrl: '',\\
    isActive: true,\\
    displayFrequency: 1\\
  });
  });"""

good = """  const [currentAd, setCurrentAd] = useState<Partial<AdCampaign>>({
    campaignName: '',
    type: 'direct',
    zones: ['home-top'],
    imageUrl: '',
    targetUrl: '',
    isActive: true,
    displayFrequency: 1
  });"""

c = c.replace(bad, good)

# Also fix the duplicate }); at the top
bad2 = """  const [currentAd, setCurrentAd] = useState<Partial<AdCampaign>>({

    campaignName: '',\\
    type: 'direct',\\
    zones: ['home-top'],\\
    imageUrl: '',\\
    targetUrl: '',\\
    isActive: true,\\
    displayFrequency: 1\\
  });
  });"""

c = c.replace(bad2, good)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(c)
