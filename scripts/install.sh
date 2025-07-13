#!/bin/bash


mkdir -p temp
cd temp
../download.sh OpenFieldOps/open-job-panel frontend-dist.tar.gz
../download.sh OpenFieldOps/open-job-api server-darwin-arm64
tar -xzf frontend-dist.tar.gz
rm frontend-dist.tar.gz
mv dist public
cd ../