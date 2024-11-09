# 1. Use a base image
FROM node:14

# 2. Set the working directory in the container
WORKDIR /app

# 3. Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port the app runs on (e.g., 3000)
EXPOSE 5000

# 7. Define the command to run the app
CMD ["node", "server.js"]
