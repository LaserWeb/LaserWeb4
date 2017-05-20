FROM resin/raspberrypi3-node:7

ADD dist /laserweb/dist/
ADD docs /laserweb/docs/
ADD src /laserweb/src/
ADD LICENSE.md *.js *.json /laserweb/

RUN cd /laserweb && npm install && npm run bundle-dev && npm install -g http-server

EXPOSE 8080
EXPOSE 8000

ADD docker_entrypoint.sh /

ENTRYPOINT ["/docker_entrypoint.sh"]
CMD []
