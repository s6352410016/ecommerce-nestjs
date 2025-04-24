# Stage 1: Build Stage
FROM node:22.14.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --only=production && npm install -g @nestjs/cli

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM node:22.14.0-alpine AS production

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy package.json and install production dependencies
COPY package*.json ./

RUN npm install --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 8080

# Set the default command
CMD ["node", "dist/main"]
