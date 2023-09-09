# Stage 1: Build the app
FROM node:18 AS build

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
RUN pnpm run build

# Stage 2: Run the app
FROM node:18

# Install ffmpeg and related dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg libavcodec-extra && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm pm2

# Set working directory
WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY assets ./assets

# Copy the built app from the previous stage
COPY --from=build /app/dist .

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose the port
EXPOSE 6969

# Start the app
CMD ["pm2-runtime", "node --experimental-specifier-resolution=node index.js" ]