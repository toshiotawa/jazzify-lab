#!/bin/bash

# Fix TypeScript any types in gameStore.ts
sed -i 's/params?: any/params?: unknown/g' src/stores/gameStore.ts

# Fix gameEngine type
sed -i 's/gameEngine: any | null/gameEngine: unknown | null/g' src/stores/gameStore.ts

# Fix other any types
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l ": any" | while read file; do
  echo "Processing $file..."
  # Replace common any patterns
  sed -i 's/error: any/error: Error | unknown/g' "$file"
  sed -i 's/data: any/data: unknown/g' "$file"
  sed -i 's/response: any/response: unknown/g' "$file"
  sed -i 's/: any\[\]/: unknown[]/g' "$file"
done

echo "Fixed any types. Running ESLint to check..."
npm run lint
