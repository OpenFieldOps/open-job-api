#!/bin/bash

# Usage: ./download.sh <repo> <filename>
# Example: ./download.sh OpenFieldOps/open-job-api server-linux

REPO="$1"
FILENAME="$2"

if [ -z "$REPO" ] || [ -z "$FILENAME" ]; then
  echo "❌ Usage: $0 <repo> <filename>"
  echo "   Example: $0 OpenFieldOps/open-job-api server-linux"
  exit 1
fi

API_URL="https://api.github.com/repos/$REPO/releases/latest"

echo "🔍 Fetching latest release info from GitHub for '$REPO'..."

# Récupère les URLs de tous les assets
download_url=$(curl -s "$API_URL" | grep "browser_download_url" | grep "$FILENAME" | cut -d '"' -f 4 | head -n 1)

if [ -z "$download_url" ]; then
  echo "❌ Fichier '$FILENAME' introuvable dans la dernière release de '$REPO'."
  exit 1
fi

# Extraire le nom du fichier depuis l’URL (optionnel, si tu veux forcer le nom depuis $2, utilise `"$FILENAME"` directement)
filename=$(basename "$download_url")

echo "⬇️  Téléchargement de '$filename' depuis : $download_url"

curl -L -o "$filename" "$download_url"

if [ $? -ne 0 ]; then
  echo "❌ Échec du téléchargement."
  exit 1
fi

# Rendre exécutable si c’est un binaire ou script
chmod +x "$filename"

echo "✅ Téléchargement terminé : $filename (exécutable)"
