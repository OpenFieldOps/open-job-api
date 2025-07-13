#!/bin/bash

MACOS_BIN="server-darwin-arm64"
LINUX_BIN="server-linux"

download_latest_release_file() {
  local REPO="$1"
  local FILE="$2"

  if [ -z "$REPO" ] || [ -z "$FILE" ]; then
    echo "❌ Usage: download_latest_release_file <repo> <file>"
    echo "   Example: download_latest_release_file OpenFieldOps/open-job-api server-linux"
    return 1
  fi

  local API_URL="https://api.github.com/repos/$REPO/releases/latest"

  echo "🔍 Fetching latest GitHub release info for '$REPO'..."

  local download_url
  download_url=$(curl -s "$API_URL" | grep "browser_download_url" | grep "$FILE" | cut -d '"' -f 4 | head -n 1)

  if [ -z "$download_url" ]; then
    echo "❌ File '$FILE' not found in the latest release of '$REPO'."
    return 1
  fi

  local file_name
  file_name=$(basename "$download_url")

  echo "⬇️  Downloading '$file_name' from: $download_url"

  curl -L -o "$file_name" "$download_url"

  if [ $? -ne 0 ]; then
    echo "❌ Download failed."
    return 1
  fi

  chmod +x "$file_name"

  echo "✅ Download complete: $file_name (executable)"
}


function download_binary() {
  download_latest_release_file OpenFieldOps/open-job-panel frontend-dist.tar.gz
  download_latest_release_file OpenFieldOps/open-job-api $1
}

CURRENT_PLATFORM_BIN="UNKNOWN"
function update_current_platform() {
  CURRENT_PLATFORM=$(uname -s)
  if [[ "$CURRENT_PLATFORM" == "Darwin" ]]; then
    CURRENT_PLATFORM_BIN=$MACOS_BIN
  elif [[ "$CURRENT_PLATFORM" == "Linux" ]]; then
    CURRENT_PLATFORM_BIN=$LINUX_BIN
  else
    echo "Unsupported platform: $CURRENT_PLATFORM"
    exit 1
  fi
  echo "Current platform: $CURRENT_PLATFORM_BIN"
}



mkdir -p openfield
cd openfield
update_current_platform
download_binary $CURRENT_PLATFORM_BIN
tar -xzf frontend-dist.tar.gz
rm frontend-dist.tar.gz
mv dist public

touch .env
echo "APP_PORT=4000" > .env
echo "JWT_SECRET=MySuperSecret" >> .env
echo "DATABASE_URL=postgresql://devuser:devpass@localhost:5433/devdb" >> .env
echo "S3_ACCESS_KEY_ID=minioadmin" >> .env
echo "S3_SECRET_ACCESS_KEY=minioadminpass" >> .env
echo "S3_BUCKET=dev-bucket" >> .env
echo "S3_ENDPOINT=http://localhost:9000" >> .env  

cd ../
echo "OpenField setup completed successfully."
echo "To run the backend, 'cd openfield && ./server-darwin-arm64'"