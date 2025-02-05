FROM node:20-alpine

RUN apk add --no-cache ffmpeg streamlink

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn install --immutable

COPY . .

RUN yarn prisma generate

RUN yarn build

EXPOSE 3042

CMD ["yarn", "start"]
