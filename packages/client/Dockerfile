# Docker Image which is used as foundation to create
# a custom Docker Image with this Dockerfile
FROM node

# A directory within the virtualized Docker environment
# Becomes more relevant when using Docker Compose later
WORKDIR /usr/app

# Copies package.json and package-lock.json to Docker environment
COPY package*.json ./

# Installs all node packages
RUN npm install
RUN npm install -g webpack webpack-cli webpack-dev-server

# Copies everything over to Docker environment
COPY . .

# Uses port which is used by the actual application
EXPOSE 3000

# Finally runs the application
RUN webpack serve --config webpack.dev.js --host 0.0.0.0
