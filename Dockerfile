# Multi-stage build for optimized image size

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy CSV data files to the production image
COPY src/data ./dist/data

# Expose the application port
EXPOSE 4000

# Set the user to non-root for security
USER node

# Start the application
CMD ["npm", "start"]
