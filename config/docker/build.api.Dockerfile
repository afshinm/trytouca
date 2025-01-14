# ---- builder stage ----

FROM node:18-alpine AS builder_dev

COPY api /home

RUN apk add --no-cache yarn \
    && yarn --cwd=/home install \
    && yarn --cwd=/home build \
    && yarn --cwd=/home lint \
    && yarn --cwd=/home test

# ---- builder stage ----

FROM node:18-alpine AS builder


COPY --from=builder_dev /home/dist              /home/dist
COPY --from=builder_dev /home/env               /home/env
COPY --from=builder_dev /home/package.json      /home/package.json
COPY --from=builder_dev /home/samples           /home/samples

RUN apk add --no-cache yarn \
    && yarn --cwd=/home install --frozen-lockfile --production \
    && yarn --cwd=/home cache clean

# ---- production image ----

FROM node:18-alpine

COPY --from=builder /home/dist          /opt/touca/dist
COPY --from=builder /home/env           /opt/touca/env
COPY --from=builder /home/samples       /opt/touca/samples
COPY --from=builder /home/node_modules  /opt/touca/node_modules

EXPOSE 8081

CMD ["node", "/opt/touca/dist/server.js"]
