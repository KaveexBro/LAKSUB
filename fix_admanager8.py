with open('src/components/AdManager.tsx', 'r') as f:
    c = f.read()

bad_save = """  const handleSave = async () => {
    if (!currentAd.campaignName || !currentAd.zone) {
      alert("Campaign Name and Zone are required.");
      return;
    }"""

good_save = """  const handleSave = async () => {
    if (!currentAd.campaignName || (!currentAd.zones || currentAd.zones.length === 0)) {
      alert("Campaign Name and at least one Zone are required.");
      return;
    }"""

c = c.replace(bad_save, good_save)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(c)
