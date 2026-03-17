#!/bin/bash

pkg_apps=apps
log="zod-analysis.txt"

# Clear the log file
> "$log"

for pkg in $(ls -d $pkg_apps/*/); do
    pkg_name=$(basename "$pkg")
    echo "Running why zod for $pkg_name"
    {
        echo "=== $pkg_name ==="
        (cd "$pkg" && pnpm why zod)
        echo ""
    } >> "$log"
done

echo "Results saved to $log"