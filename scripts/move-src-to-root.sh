#!/bin/bash
# Move all src/ contents to root level so @/ alias resolves correctly in v0 sandbox

cd /vercel/share/v0-project

# Move directories
for dir in components hooks lib integrations pages assets; do
  if [ -d "src/$dir" ]; then
    cp -r "src/$dir" "./$dir"
    echo "Copied src/$dir -> ./$dir"
  fi
done

# Move root-level src files
for file in src/App.tsx src/App.css src/index.css src/main.tsx src/vite-env.d.ts; do
  if [ -f "$file" ]; then
    cp "$file" "./$(basename $file)"
    echo "Copied $file -> ./$(basename $file)"
  fi
done

echo "Done copying files from src/ to root"
