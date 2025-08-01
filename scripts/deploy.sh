#!/bin/bash

# Build and deploy script
echo "Building Docker image..."
docker build -t chatbot-widget .

echo "Tagging for registry..."
docker tag chatbot-widget your-registry.com/chatbot-widget:latest

echo "Pushing to registry..."
docker push your-registry.com/chatbot-widget:latest

echo "Deploying to production..."
# Replace with your deployment command
# kubectl apply -f k8s-deployment.yaml
# or docker-compose up -d
