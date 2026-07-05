#!/bin/bash
awk '
/label className="block text-sm font-medium text-gray-400 mb-1">Description/ {
    print "              </div>"
    print "            </div>"
    print "            <div>"
    print $0
    next
}
{
    # We want to replace the `<div>` immediately preceding it, so we buffer it
    if ($0 ~ /^[ \t]*<div>[ \t]*$/) {
        buffered_div = $0
        next
    }
    if (buffered_div != "") {
        print buffered_div
        buffered_div = ""
    }
    print $0
}
END {
    if (buffered_div != "") print buffered_div
}
' src/components/EditSubtitleModal.tsx > tmp.tsx && mv tmp.tsx src/components/EditSubtitleModal.tsx
