#!/bin/bash

MACOS_BIN="server-darwin-arm64"
LINUX_BIN="server-linux"

function download_binary() {
  ../download.sh OpenFieldOps/open-job-panel frontend-dist.tar.gz
  ../download.sh OpenFieldOps/open-job-api $1
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