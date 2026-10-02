FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Chromium for running the Karma unit tests headless (yarn test --watch=false --browsers=ChromeHeadlessCI)
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium
