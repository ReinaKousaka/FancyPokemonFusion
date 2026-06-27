# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package config and lock file
COPY package*.json ./

# Install all dependencies (including devDependencies like Vite)
RUN npm ci

# Copy all project source
COPY . .

# Build the frontend assets (Vite compiles React into /dist)
RUN npm run build


# Stage 2: Run the production server
FROM node:20-alpine

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install only production dependencies (express, @google/genai, react, react-dom)
RUN npm ci --only=production

# Copy built frontend assets from Stage 1
COPY --from=builder /app/dist ./dist

# Copy backend server handlers and assets
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# Define the listening port
ENV PORT=8080
EXPOSE 8080

# Start the production Express server
CMD ["node", "server/production.js"]
