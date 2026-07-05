#!/bin/bash
sed -i -e '/}))}/a\' -e '                </div>\n              </div>' src/components/EditSubtitleModal.tsx
