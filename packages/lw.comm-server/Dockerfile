FROM resin/raspberrypi3-node:10

ADD config.js grblStrings.js firmwareFeatures.js LICENSE lw.comm-server.service package.json README.md server.js version.txt /laserweb/
ADD app /laserweb/app/

RUN cd /laserweb && npm install

EXPOSE 8000

ADD docker_entrypoint.sh /

ENTRYPOINT ["/docker_entrypoint.sh"]
CMD []
