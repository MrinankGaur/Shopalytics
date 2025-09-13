# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code from backend directory
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
