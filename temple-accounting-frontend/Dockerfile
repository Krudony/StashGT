# Frontend Dockerfile - Node.js + Vite + React
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY src ./src
COPY index.html vite.config.js ./
COPY tailwind.config.js postcss.config.js ./

# Expose port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
