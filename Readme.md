# Twitthon


![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white) ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

## Installation
Prerequisites:
* [Docker Installed](https://docs.docker.com/get-started/get-docker/)
* [Docker Compose Installed](https://docs.docker.com/compose/install/)
* a .env file as shown at [.env-example](.env-exemplo)
## Usage
Enter the root directory of the project you've just cloned and run:
```bash
docker compose up --build
```
## Tests
To run tests you'll need to access the container
```bash
sudo docker exec -it <ContainerID> /bin/sh
```

Then run the command
```bash
cd core && python manage.py test
```

The Container ID can be found by running
```bash
sudo docker ps
```

## Swagger Documentation
The Swagger documentation can be found after the project is running in the url http://localhost:8000/swagger/
