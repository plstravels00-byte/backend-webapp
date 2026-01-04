# Node base image
FROM node:20-alpine

# App directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Cloud Run uses PORT env
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
