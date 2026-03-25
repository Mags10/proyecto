FROM node:20-alpine
WORKDIR /app
# For development with hot reload, we mount the volume and run install at runtime
# to ensure native dependencies match the container OS and workspaces are linked correctly.
CMD ["sh", "-c", "npm install && cd frontend && npm start -- --host 0.0.0.0 --port 4200 --allowed-hosts --serve-path /awe/"]
