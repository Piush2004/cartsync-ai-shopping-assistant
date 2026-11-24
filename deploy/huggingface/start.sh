#!/usr/bin/env bash
set -e
mkdir -p /home/user/app/data
cd /home/user/app/api
python -m alembic upgrade head
python -m uvicorn main:app --host 127.0.0.1 --port 8010 &
cd /home/user/app/web
exec node node_modules/next/dist/bin/next start -p 7860 -H 0.0.0.0
