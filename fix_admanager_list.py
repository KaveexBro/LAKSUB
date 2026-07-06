with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

bad = """                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Tag className="w-3 h-3" /> Zone: <span className="text-white font-mono bg-white/10 px-1.5 rounded">{ad.zones?.join(', ') || ad.zone}</span>
                </div>"""

good = """                <div className="flex flex-col gap-2 text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Zone: <span className="text-white font-mono bg-white/10 px-1.5 rounded truncate">{ad.zones?.join(', ') || ad.zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Device:</span> 
                    <span className="text-white font-mono bg-white/10 px-1.5 rounded uppercase text-[10px]">
                      {ad.deviceTargeting || 'all'}
                    </span>
                  </div>
                </div>"""

content = content.replace(bad, good)
with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
