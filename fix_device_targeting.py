import re

with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

# Replace initialization
content = re.sub(
    r"displayFrequency: 1\n\s*\}\);",
    r"displayFrequency: 1,\n    deviceTargeting: 'all'\n  });",
    content
)

# Add field to form
form_field = """          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Device Targeting</label>
            <select
              value={currentAd.deviceTargeting || 'all'}
              onChange={e => setCurrentAd({...currentAd, deviceTargeting: e.target.value as 'all' | 'desktop' | 'mobile'})}
              className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
            >
              <option value="all">All Devices</option>
              <option value="desktop">Desktop Only</option>
              <option value="mobile">Mobile Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Display Frequency</label>"""

content = content.replace(
"""          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Display Frequency</label>""", form_field)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)

