FROM alpine:3.16 as build
RUN apk update
RUN apk upgrade
RUN apk add nodejs yarn
WORKDIR /opt/build
RUN mkdir dist
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY src/ ./src/
COPY src/static/ ./dist/static/ 
RUN yarn install
RUN yarn build


FROM alpine:3.16
RUN apk update
RUN apk upgrade
RUN apk add nodejs yarn
WORKDIR /opt/fshare
COPY package.json .
COPY yarn.lock .
COPY --from=build /opt/build/dist/ ./dist/
RUN yarn install --production
CMD ["node", "/opt/fshare/dist/main.js"]
