FROM node:22-slim AS frontend-build
WORKDIR /frontend

# Install security updates included after the base image release.
RUN apt-get update \
	&& apt-get upgrade -y \
	&& rm -rf /var/lib/apt/lists/*

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.14-slim
WORKDIR /srv

# Install security updates included after the base image release.
RUN apt-get update \
	&& apt-get upgrade -y \
	&& rm -rf /var/lib/apt/lists/*

# ghcr.io/astral-sh/uv only publishes amd64/arm64, no armv7 (32-bit Pi) --
# install from PyPI instead, which does ship an armv7l wheel.
RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --compile-bytecode

COPY app/ app/
COPY --from=frontend-build /app/static /srv/app/static

ENV LENNOX_BACKEND_CONFIG=/srv/config.yaml
EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
