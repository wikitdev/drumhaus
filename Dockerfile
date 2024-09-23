FROM node:22-bullseye

COPY drumhaus /server
WORKDIR /server
RUN apt update && \ 
  apt install build-essential python3 -y && \
  npm install
EXPOSE 3000
ENTRYPOINT npm run dev
