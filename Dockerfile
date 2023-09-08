FROM node:18

# Install pnpm
RUN npm install -g pnpm

# Install ffmpeg and related dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg libavcodec-extra && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the app
RUN pnpm build

# Expose the port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]