import re

with open('src/components/AdZone.tsx', 'r') as f:
    content = f.read()

bad_div = """          <div 
            key={ad.id} 
            className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] w-full max-w-[1000px]\""""

good_div = """          <div 
            key={ad.id} 
            className={`group relative flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] w-full max-w-[1000px] ${ad.deviceTargeting === 'desktop' ? 'hidden md:flex' : ad.deviceTargeting === 'mobile' ? 'flex md:hidden' : 'flex'}`}"""

content = content.replace(bad_div, good_div)

with open('src/components/AdZone.tsx', 'w') as f:
    f.write(content)

