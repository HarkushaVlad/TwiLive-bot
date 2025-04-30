FROM node:20-alpine

RUN apk add --no-cache ffmpeg streamlink python3 py3-pip

RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install

COPY . .

RUN yarn prisma generate
RUN mkdir -p /app/data

RUN yarn build

EXPOSE 3042

CMD ["sh", "-c", "npx prisma migrate deploy && yarn start"]