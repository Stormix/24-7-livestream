# Stage 1: Build the app
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json ./
COPY bun.lockb ./
COPY tsconfig.json ./
COPY src ./src

# Install production dependencies
RUN bun install --production

# Expose the port
EXPOSE 6969

# Start the app
CMD ["bun", "run", "src/index.ts" ]