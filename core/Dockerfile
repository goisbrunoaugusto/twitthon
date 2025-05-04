FROM python:3.13.3-alpine

RUN apk update && apk add --no-cache postgresql-dev gcc python3-dev musl-dev

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "python core/manage.py makemigrations\
    && python core/manage.py migrate\
    && python core/manage.py runserver 0.0.0.0:8000"]