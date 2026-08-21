FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run inyecta PORT (normalmente 8080); en local sin esa variable cae a 8000.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
