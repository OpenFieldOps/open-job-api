#!/bin/bash

REPO=$1
API_URL="https://api.github.com/repos/$REPO/releases/latest"

echo "Fetching latest release info from GitHub..."

response=$(curl -s "$API_URL")

download_url=$(echo "$response" | grep "browser_download_url" | cut -d '"' -f 4)

if [ -z "$download_url" ]; then
  echo "❌ Error: Could not find a download URL in the latest release."
  exit 1
fi

filename=$(basename "$download_url")

echo "Downloading $filename from $download_url..."

curl -L -o "$filename" "$download_url"

echo "✅ Download completed : $filename"
