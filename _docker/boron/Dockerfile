FROM node:boron
WORKDIR /usr/src
RUN git clone --depth=1 --branch master https://github.com/Mattersight/mock-acd-nodejs.git apps/mock-acd-nodejs

FROM node:boron
COPY --from=0 /usr/src/apps /usr/src/apps
WORKDIR /usr/src/apps/mock-acd-nodejs
RUN npm install --no-bin-links
EXPOSE 80 9143
ENTRYPOINT ["node", "mode"]
