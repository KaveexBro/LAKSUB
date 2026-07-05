#!/bin/bash
sed -i 's/zone: '"'"'home-top'"'"',/zone: '"'"'home-top'"'"',\n    zones: ['"'"'home-top'"'"'],/g' src/components/AdManager.tsx
