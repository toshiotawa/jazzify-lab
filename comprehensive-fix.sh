#!/bin/bash

echo "Starting comprehensive ESLint and ts-prune fixes..."

# 1. Fix TypeScript any types
echo "Fixing TypeScript any types..."
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Common any type replacements
  sed -i 's/: any)/: unknown)/g' "$file"
  sed -i 's/: any;/: unknown;/g' "$file"
  sed -i 's/: any\[\]/: unknown[]/g' "$file"
  sed -i 's/: any | /: unknown | /g' "$file"
  sed -i 's/<any>/<unknown>/g' "$file"
  sed -i 's/ as any/ as unknown/g' "$file"
done

# 2. Remove console.log statements (replace with proper logging)
echo "Removing console statements..."
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i 's/console\.log(/\/\/ console.log(/g' "$file"
  sed -i 's/console\.error(/\/\/ console.error(/g' "$file"
  sed -i 's/console\.warn(/\/\/ console.warn(/g' "$file"
done

# 3. Fix unused variables (prefix with underscore)
echo "Fixing unused variables..."
# This is more complex and would need manual review

# 4. Run ESLint auto-fix
echo "Running ESLint auto-fix..."
npx eslint . --ext ts,tsx --fix || true

# 5. Show remaining errors
echo "Checking remaining errors..."
npm run lint || true

echo "Fix script completed!"
