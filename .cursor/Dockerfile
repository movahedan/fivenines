# Cloud Agent base image for the fivenines monorepo.
# System-level, stable toolchain only. Repo dependency install lives in
# .cursor/scripts/install.sh; per-boot service setup lives in
# .cursor/scripts/start.sh. Do NOT copy the repo in here — Cursor checks out
# the requested revision separately.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Stable system packages: git/curl for tooling, PostgreSQL for the local dev DB
# used by @apps/nestjs and @apps/auth, plus sudo so the runtime user can control
# the postgres cluster from start.sh.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        gnupg \
        sudo \
        unzip \
        xz-utils \
        postgresql \
        postgresql-contrib \
    && rm -rf /var/lib/apt/lists/*

# Node.js (repo requires Node >= 26). Installed from the official binary tarball
# into /usr/local so `node`/`npm` are on the default PATH for every shell.
ARG NODE_VERSION=26.8.1
RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && node --version \
    && npm --version

# Bun (pinned to the repo's packageManager version) into /usr/local/bin.
ARG BUN_VERSION=1.4.0
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local/bun bash -s "bun-v${BUN_VERSION}" \
    && ln -sf /usr/local/bun/bin/bun /usr/local/bin/bun \
    && ln -sf /usr/local/bun/bin/bunx /usr/local/bin/bunx \
    && bun --version

# The ubuntu:24.04 image ships an `ubuntu` user (uid 1000). Grant passwordless
# sudo so start.sh can start PostgreSQL and manage the cluster at boot.
RUN echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-ubuntu \
    && chmod 0440 /etc/sudoers.d/90-ubuntu

USER ubuntu
WORKDIR /home/ubuntu
