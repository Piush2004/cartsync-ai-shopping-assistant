# One container: Next.js website on :7860 (public) + FastAPI on :8010 (internal).
FROM node:22-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm ci
COPY web/ ./
# Browser calls /api/v1 on the same origin; Next proxies it to FastAPI.
ENV NEXT_PUBLIC_API_URL=/api/v1 \
    API_PROXY_TARGET=http://127.0.0.1:8010 \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM python:3.12-slim
RUN useradd -m -u 1000 user
COPY --from=web /usr/local/bin/node /usr/local/bin/node
USER user
ENV HOME=/home/user PATH=/home/user/.local/bin:$PATH PYTHONUNBUFFERED=1
WORKDIR /home/user/app
COPY --chown=user api/requirements.txt api/requirements.txt
RUN pip install --no-cache-dir --user -r api/requirements.txt alembic
COPY --chown=user api/ api/
COPY --from=web --chown=user /web /home/user/app/web
COPY --chown=user start.sh start.sh
ENV LOCAL_LLM_URL="" \
    CORS_ALLOWED_ORIGINS=http://localhost:7860 \
    SQLALCHEMY_DATABASE_URL=sqlite:////home/user/app/data/cartsync.db
EXPOSE 7860
CMD ["bash", "start.sh"]
