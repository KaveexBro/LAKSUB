import re
with open('src/components/AdManager.tsx', 'r') as f:
    c = f.read()

c = re.sub(r'if \(!currentAd.campaignName \|\| !currentAd.zone\) \{[\s\n]*alert\("Campaign Name and Zone are required."\);[\s\n]*return;[\s\n]*\}',
'''if (!currentAd.campaignName || (!currentAd.zones || currentAd.zones.length === 0)) {
      alert("Campaign Name and at least one Zone are required.");
      return;
    }''', c)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(c)
