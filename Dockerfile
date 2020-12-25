# lockydev/guardian

FROM node:12.8.0-alpine

ENV COMPlus_EnableDiagnostics=0
WORKDIR /usr/share/guardian

RUN apk update && apk upgrade \
    && apk add --no-cache git \
	&& apk --no-cache add --virtual builds-deps build-base python

ENV PORT 8082
EXPOSE 8082

COPY . /usr/share/guardian
RUN cd /usr/share/guardian
RUN yarn

CMD ["yarn", "start"]