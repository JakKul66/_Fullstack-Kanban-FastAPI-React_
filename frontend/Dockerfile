# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite development server, expose to network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]