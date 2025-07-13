

DOCKER_COMPOSE_FILE="https://raw.githubusercontent.com/OpenFieldOps/open-job-api/refs/heads/main/docker-compose.yml"

download_docker_compose() {
  echo "🔍 Downloading Docker Compose file from $DOCKER_COMPOSE_FILE"
  curl -L -o docker-compose.yml "$DOCKER_COMPOSE_FILE"
  
  if [ $? -ne 0 ]; then
    echo "❌ Failed to download Docker Compose file."
    return 1
  fi
  
  echo "✅ Docker Compose file downloaded successfully."
}

download_docker_compose

docker compose up -d