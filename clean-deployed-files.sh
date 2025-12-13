#!/bin/bash

# Script to remove deployed files from Git

echo "Removing deployed files from Git..."

# Remove Next.js build files
git rm -r --cached __next.*.txt 2>/dev/null || true
git rm -r --cached _next/ 2>/dev/null || true
git rm -r --cached _not-found/ 2>/dev/null || true
git rm --cached 404.html 2>/dev/null || true
git rm -r --cached 404/ 2>/dev/null || true

# Remove root HTML files (keep README.md)
git rm --cached index.html 2>/dev/null || true
git rm --cached index.txt 2>/dev/null || true

# Remove login and signup folders
git rm -r --cached login/ 2>/dev/null || true
git rm -r --cached signup/ 2>/dev/null || true

# Remove icons and images (if they're from out folder)
git rm --cached apple-icon.png 2>/dev/null || true
git rm --cached icon-dark-32x32.png 2>/dev/null || true
git rm --cached icon-light-32x32.png 2>/dev/null || true
git rm --cached icon.svg 2>/dev/null || true
git rm --cached placeholder-logo.png 2>/dev/null || true
git rm --cached placeholder-logo.svg 2>/dev/null || true
git rm --cached placeholder-user.jpg 2>/dev/null || true
git rm --cached placeholder.jpg 2>/dev/null || true
git rm --cached placeholder.svg 2>/dev/null || true
git rm --cached professional-middle-eastern-man-avatar.jpg 2>/dev/null || true
git rm --cached professional-middle-eastern-woman-avatar.jpg 2>/dev/null || true
git rm --cached professional-older-middle-eastern-man-avatar.jpg 2>/dev/null || true

echo "✅ Files removed from Git tracking"
echo ""
echo "📝 Now commit the changes:"
echo "  git commit -m 'Remove deployed files from root'"
echo "  git push origin main"

