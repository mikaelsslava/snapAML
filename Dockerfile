# Multi-stage build for optimized image size

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 4000

# Set the user to non-root for security
USER node

# Start the application
CMD ["npm", "start"]
