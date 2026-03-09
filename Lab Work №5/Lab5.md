
# Лабораторная работа №5
## Реализация микросервисной архитектуры и CI/CD для системы бронирования отеля

---

# Тема
Контейнеризация приложения и организация CI/CD с использованием Docker, Docker Compose, GitHub Actions и Docker Hub.

---

# Цель работы

Получить практические навыки:

- контейнеризации веб‑приложения
- организации взаимодействия сервисов
- работы с Docker и Docker Compose
- настройки непрерывной интеграции (CI)
- настройки непрерывного развёртывания (CD)
- публикации Docker‑образов
- развёртывания приложения на удалённом сервере

---

# Описание проекта

В рамках лабораторной работы было реализовано веб‑приложение, которое позволяет пользователю получить список доступных номеров в отеле.

Система состоит из:

- **Frontend** — веб‑интерфейс (HTML + JavaScript)
- **Backend** — REST API на Node.js
- **Database** — PostgreSQL

Frontend отправляет HTTP‑запросы backend сервису, который обращается к базе данных и возвращает список номеров.

---

# Архитектура контейнеров

Приложение состоит из трёх контейнеров:

1. **Web container**
   - Nginx
   - статические файлы приложения

2. **Backend container**
   - Node.js + Express
   - REST API

3. **Database container**
   - PostgreSQL
   - хранение данных о номерах

Архитектура системы:

```
Browser
   │
   ▼
Web container (Nginx)
   │ HTTP
   ▼
Backend container (Node.js API)
   │ SQL
   ▼
PostgreSQL container
```

Контейнеры взаимодействуют через внутреннюю Docker‑сеть.

---

# Dockerfile backend

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

Backend реализует REST API.

Пример endpoint:

```
GET /rooms
```

Он выполняет SQL‑запрос к базе данных:

```sql
SELECT * FROM rooms;
```

---

# Dockerfile frontend

Frontend представляет собой статическую HTML страницу.

```dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html
```

Nginx используется как веб‑сервер для отдачи HTML страницы.

---

# Docker Compose

Для запуска всех контейнеров используется **Docker Compose**.

```yaml
services:

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: hotel
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  web:
    build: ./web
    ports:
      - "3000:80"
    depends_on:
      - backend
```

---

# Инициализация базы данных

При запуске контейнера PostgreSQL автоматически выполняется SQL‑файл `init.sql`.

```sql
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price INT
);

INSERT INTO rooms (name, price) VALUES
('Standard room',100),
('Deluxe room',200);
```

Это создаёт таблицу `rooms` и добавляет тестовые данные.

---

# Запуск приложения

Контейнеры запускаются командой:

```
docker compose up --build
```

После запуска приложение доступно:

| Адрес | Описание |
|------|----------|
| http://localhost:3000 | Web интерфейс |
| http://localhost:8080/rooms | Backend API |

---

# Проверка взаимодействия сервисов

Для проверки взаимодействия backend и базы данных был выполнен SQL‑запрос внутри контейнера PostgreSQL:

```
docker exec -it postgres_container psql -U postgres -d hotel
```

SQL‑запрос:

```sql
SELECT * FROM rooms;
```

Результат:

```
id | name          | price
1  | Standard room | 100
2  | Deluxe room   | 200
```

После нажатия кнопки **Load rooms** на frontend данные отображаются в браузере, что подтверждает взаимодействие:

```
Frontend → Backend → PostgreSQL
```

---

# Непрерывная интеграция (CI)

Для автоматической сборки проекта используется **GitHub Actions**.

Pipeline запускается при каждом `push`.

Основные этапы:

1. клонирование репозитория
2. установка зависимостей
3. запуск тестов
4. сборка Docker‑образов

Файл:

```
.github/workflows/ci.yml
```

Пример конфигурации:

```yaml
name: CI

on: [push]

jobs:

  build-and-test:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v4

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm install

      - name: Run tests
        working-directory: ./backend
        run: npm test

      - name: Build backend image
        run: docker build -t hotel-backend ./backend

      - name: Build web image
        run: docker build -t hotel-web ./web
```

---

# Интеграционные тесты

Для тестирования backend используются:

- **Jest**
- **Supertest**

Пример теста:

```javascript
const request = require("supertest");
const app = require("../app/server");

describe("API test", () => {

  it("GET /rooms", async () => {

    const res = await request(app).get("/rooms");

    expect(res.statusCode).toBe(200);

  });

});
```

---

# Непрерывное развёртывание (CD)

Docker‑образы публикуются в Docker Hub.

Pipeline выполняет:

1. сборку образов
2. публикацию образов

```yaml
- name: Build backend image
  run: docker build -t ${{ secrets.DOCKER_USERNAME }}/hotel-backend:latest ./backend

- name: Push backend image
  run: docker push ${{ secrets.DOCKER_USERNAME }}/hotel-backend:latest
```

После выполнения pipeline образы доступны:

```
username/hotel-backend
username/hotel-web
```

---

# Развёртывание на VPS

На сервере выполнены команды:

```
docker pull username/hotel-backend
docker pull username/hotel-web
```

Запуск:

```
docker compose up -d
```

Приложение доступно:

```
http://SERVER_IP:3000
```

API:

```
http://SERVER_IP:8080/rooms
```

---

# Итоговая архитектура CI/CD

```
Developer
   │
   ▼
GitHub repository
   │
   ▼
GitHub Actions (CI)
   │
   ├── запуск тестов
   └── сборка Docker образов
   │
   ▼
Docker Hub
   │
   ▼
VPS сервер
   │
   └── docker compose up
```

---

# Структура проекта

```
hotel-booking
│
├── backend
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── Dockerfile
│
├── web
│   ├── index.html
│   └── Dockerfile
│
├── init.sql
├── docker-compose.yml
│
└── .github
    └── workflows
        ├── ci.yml
        └── cd.yml
```

---

# Вывод

В ходе лабораторной работы была реализована контейнерная архитектура веб‑приложения.

Были получены практические навыки:

- контейнеризации приложения
- настройки Docker Compose
- организации взаимодействия сервисов
- настройки CI/CD
- публикации Docker‑образов
- развёртывания приложения на VPS сервере

