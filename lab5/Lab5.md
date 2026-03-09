# Лабораторная работа №5
## Реализация микросервисной архитектуры и CI/CD для системы бронирования отеля

---

# Тема
Контейнеризация приложения и организация CI/CD с использованием Docker, Docker Compose, GitHub Actions и Docker Hub.

---

# Цель работы

Получить практические навыки:

- контейнеризации веб-приложения
- организации взаимодействия сервисов
- работы с Docker и Docker Compose
- настройки непрерывной интеграции (CI)
- настройки непрерывного развёртывания (CD)
- публикации Docker-образов
- развёртывания приложения на удалённом сервере

---

# Описание проекта

В рамках лабораторной работы было реализовано веб-приложение **Hotel Booking System**, позволяющее пользователю получить список доступных номеров в отеле.

Система состоит из трёх основных частей:

- **Frontend** — веб-интерфейс на HTML + JavaScript
- **Backend** — REST API на Node.js + Express
- **Database** — PostgreSQL

Пользователь открывает страницу в браузере, нажимает кнопку **Load rooms**, после чего frontend отправляет HTTP-запрос к backend. Backend, в свою очередь, выполняет SQL-запрос к базе данных PostgreSQL и возвращает список номеров в формате JSON. Полученные данные отображаются на странице.


---

# Пункт 1 — Контейнеризация приложения

## Архитектура контейнеров

Для выполнения требований лабораторной работы приложение было разделено на **3 контейнера**:

1. **Web container**
   - образ на базе `nginx:alpine`
   - содержит статические файлы frontend
   - отвечает за выдачу HTML-страницы пользователю

2. **Backend container**
   - образ на базе `node:20-alpine`
   - реализует REST API
   - обрабатывает запросы frontend и взаимодействует с базой данных

3. **Database container**
   - образ `postgres:16`
   - хранит данные о номерах
   - инициализируется при первом запуске через SQL-файл

Архитектура системы:

```text
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

Контейнеры взаимодействуют через внутреннюю Docker-сеть, создаваемую Docker Compose автоматически.

---

## Backend сервис

Backend реализован на **Node.js + Express**.

Основные функции backend:

- приём HTTP-запросов от frontend
- предоставление REST API
- подключение к PostgreSQL
- выполнение SQL-запросов
- возврат данных в формате JSON

### Основной endpoint

```text
GET /rooms
```

Этот endpoint выполняет SQL-запрос к базе данных:

```sql
SELECT * FROM rooms;
```

И возвращает ответ вида:

```json
[
  {
    "id": 1,
    "name": "Standard room",
    "price": 100
  },
  {
    "id": 2,
    "name": "Deluxe room",
    "price": 200
  }
]
```

### Проверочный endpoint

Для диагностики также используется endpoint:

```text
GET /health
```

Он нужен для проверки того, что backend контейнер успешно запущен и отвечает на запросы.

---

## Dockerfile backend

Файл `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

### Пояснение по шагам

- `FROM node:20-alpine` — используется лёгкий базовый образ Node.js
- `WORKDIR /app` — задаётся рабочая директория внутри контейнера
- `COPY package*.json ./` — копируются файлы зависимостей
- `RUN npm install` — устанавливаются npm-пакеты
- `COPY . .` — копируется исходный код backend
- `EXPOSE 8080` — открывается порт backend
- `CMD ["node", "server.js"]` — запускается сервер

---

## Frontend сервис

Frontend представляет собой простую HTML-страницу с JavaScript-кодом.

Основные функции frontend:

- отображение кнопки загрузки данных
- отправка HTTP-запроса к backend
- получение JSON-ответа
- вывод списка номеров на страницу

Frontend работает как статический сайт, поэтому для его раздачи был выбран веб-сервер **Nginx**.

---

## Dockerfile frontend

Файл `web/Dockerfile`:

```dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html
```

### Пояснение

- `FROM nginx:alpine` — используется лёгкий образ Nginx
- `COPY . /usr/share/nginx/html` — статические файлы копируются в стандартную директорию Nginx

После запуска контейнера frontend становится доступен пользователю через браузер.

---

## Docker Compose

Для запуска всех контейнеров используется файл `docker-compose.yml`.

Он позволяет:

- поднимать несколько сервисов одной командой
- автоматически создавать сеть контейнеров
- задавать зависимости между сервисами
- инициализировать базу данных через SQL-файл

Файл `lab5/docker-compose.yml`:

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

### Пояснение по сервисам

#### `postgres`
- поднимает контейнер базы данных
- создаёт БД `hotel`
- использует пользователя `postgres`
- автоматически выполняет SQL-скрипт `init.sql`

#### `backend`
- собирается из папки `backend`
- пробрасывает порт `8080`
- зависит от сервиса `postgres`

#### `web`
- собирается из папки `web`
- пробрасывает порт `3000`
- зависит от сервиса `backend`

---

## Инициализация базы данных

Для автоматического создания таблицы и загрузки стартовых данных используется файл `init.sql`.

Файл `lab5/init.sql`:

```sql
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price INT
);

INSERT INTO rooms (name, price) VALUES
('Standard room', 100),
('Deluxe room', 200);
```

### Что делает этот файл

1. создаёт таблицу `rooms`
2. добавляет в неё две записи:
   - `Standard room`
   - `Deluxe room`

При первом запуске контейнера PostgreSQL этот скрипт выполняется автоматически.

---

## Запуск приложения

Для запуска контейнеров используется команда:

```bash
docker compose up --build
```

### Что происходит при выполнении команды

- собирается образ backend
- собирается образ web
- скачивается образ PostgreSQL
- создаётся Docker-сеть
- запускаются три контейнера
- PostgreSQL инициализируется через `init.sql`

После запуска приложение становится доступно по адресам:

| Адрес | Описание |
|------|----------|
| http://localhost:3000 | Web-интерфейс |
| http://localhost:8080/rooms | Backend API |
| http://localhost:8080/health | Проверка состояния backend |

---

## Проверка взаимодействия backend и базы данных

Чтобы показать, что backend действительно работает с PostgreSQL, была выполнена проверка непосредственно внутри контейнера базы данных.

### Подключение к PostgreSQL

```bash
docker exec -it postgres_container psql -U postgres -d hotel
```

### SQL-запрос

```sql
SELECT * FROM rooms;
```

### Результат

```text
 id |     name       | price
----+----------------+------
  1 | Standard room  | 100
  2 | Deluxe room    | 200
```

После этого на frontend была нажата кнопка **Load rooms**, и в браузере отобразились те же данные. Это подтверждает реальную цепочку взаимодействия:

```text
Frontend → Backend → PostgreSQL
```

При необходимости данные можно было изменить напрямую в БД, а затем снова запросить их через frontend, чтобы убедиться, что backend берёт информацию не из статического массива, а из базы данных.

---

# Пункт 2 — Непрерывная интеграция (CI)

Для автоматизации сборки и проверки проекта используется **GitHub Actions**.

CI-пайплайн запускается автоматически при каждом `push` в репозиторий.

Основные задачи CI:

1. получить актуальную версию проекта из репозитория
2. установить зависимости backend
3. выполнить тесты
4. проверить сборку Docker-образов

---

## Файл CI pipeline

Файл `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push]

jobs:

  build-and-test:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v4

      - name: Install backend dependencies
        working-directory: ./lab5/backend
        run: npm install

      - name: Run tests
        working-directory: ./lab5/backend
        run: npm test

      - name: Build backend image
        run: docker build -t hotel-backend ./lab5/backend

      - name: Build web image
        run: docker build -t hotel-web ./lab5/web
```

---

## Подробное описание шагов CI

### 1. `actions/checkout@v4`
GitHub Actions получает содержимое репозитория и подготавливает его для последующих шагов.

### 2. `npm install`
В папке backend устанавливаются все зависимости проекта:
- `express`
- `cors`
- `pg`
- `jest`
- `supertest`

### 3. `npm test`
Запускаются тесты backend. Если хотя бы один тест завершится с ошибкой, пайплайн будет остановлен.

### 4. `docker build`
Выполняется проверка того, что Docker-образы backend и web собираются без ошибок.

Таким образом, CI гарантирует, что после каждого изменения кода проект остаётся работоспособным.

---

# Пункт 3 — Интеграционные тесты

Для тестирования backend использовались:

- **Jest** — тестовый фреймворк
- **Supertest** — библиотека для отправки HTTP-запросов к Express-приложению

Jest используется как основной инструмент запуска и проверки тестов, а Supertest позволяет выполнять запросы к API без ручного запуска сервера.

---

## Где используется Jest

Jest используется:

- в файле `backend/tests/test.js`
- в команде `npm test`
- в CI pipeline GitHub Actions

В `package.json` backend тесты запускаются через:

```json
"scripts": {
  "test": "jest"
}
```

Это означает, что команда:

```bash
npm test
```

запускает Jest, который ищет тестовые файлы и выполняет их.

---

## Пример теста

Файл `backend/tests/test.js`:

```javascript
const request = require("supertest");
const app = require("../app/app");

describe("API test", () => {

  it("GET /rooms should return 200", async () => {

    const res = await request(app).get("/rooms");

    expect(res.statusCode).toBe(200);

  });

  it("GET /health should return status ok", async () => {

    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });

  });

});
```

---

## Что проверяют тесты

### Тест 1 — `/rooms`
Проверяет, что endpoint `/rooms` доступен и возвращает HTTP статус `200 OK`.

### Тест 2 — `/health`
Проверяет, что backend успешно запущен и endpoint `/health` возвращает корректный JSON-ответ.

Таким образом, интеграционные тесты подтверждают корректную работу API.

---

# Пункт 4 — Непрерывное развёртывание (CD)

Для публикации Docker-образов используется **Docker Hub**.

CD-пайплайн автоматизирует:

1. сборку backend-образа
2. сборку web-образа
3. публикацию образов в Docker Hub

---

## Настройка секретов

Для работы CD в GitHub были добавлены секреты:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

Они используются для авторизации в Docker Hub внутри GitHub Actions.

---

## Пример шагов CD pipeline

Файл `.github/workflows/cd.yml` содержит шаги публикации:

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}

- name: Build backend image
  run: docker build -t ${{ secrets.DOCKER_USERNAME }}/hotel-backend:latest ./lab5/backend

- name: Push backend image
  run: docker push ${{ secrets.DOCKER_USERNAME }}/hotel-backend:latest

- name: Build web image
  run: docker build -t ${{ secrets.DOCKER_USERNAME }}/hotel-web:latest ./lab5/web

- name: Push web image
  run: docker push ${{ secrets.DOCKER_USERNAME }}/hotel-web:latest
```

---

## Результат работы CD

После успешного выполнения пайплайна в Docker Hub публикуются два образа:

```text
username/hotel-backend:latest
username/hotel-web:latest
```

Это позволяет в дальнейшем разворачивать приложение не из исходников, а из уже готовых образов.

---

# Развёртывание на VPS

После публикации Docker-образов приложение было развёрнуто на удалённом VPS-сервере.

На сервере были выполнены следующие шаги:

1. установка Docker
2. подготовка `docker-compose.yml`
3. загрузка образов из Docker Hub
4. запуск контейнеров

---

## Загрузка образов

```bash
docker pull username/hotel-backend:latest
docker pull username/hotel-web:latest
```

---

## Запуск контейнеров на сервере

Для запуска использовался `docker compose up -d`.

В результате на сервере были подняты:

- контейнер frontend
- контейнер backend
- контейнер PostgreSQL

После запуска приложение стало доступно по публичному IP-адресу:

```text
http://SERVER_IP:3000
```

Backend API:

```text
http://SERVER_IP:8080/rooms
http://SERVER_IP:8080/health
```

---

## Проверка работоспособности на VPS

На VPS были проверены:

- доступность frontend в браузере
- корректная работа endpoint `/rooms`
- корректная работа endpoint `/health`
- реальное взаимодействие backend с PostgreSQL

Также была выполнена ручная проверка БД через `psql`, что подтвердило наличие данных в таблице `rooms`.

---

# Итоговая архитектура CI/CD

```text
Developer
   │
   ▼
GitHub repository
   │
   ▼
GitHub Actions (CI)
   │
   ├── установка зависимостей
   ├── запуск тестов
   └── сборка Docker-образов
   │
   ▼
GitHub Actions (CD)
   │
   ├── сборка образов
   └── публикация в Docker Hub
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

```text
hotel-booking
├── .github
│   └── workflows
│       ├── ci.yml
│       └── cd.yml
└── lab5
    ├── backend
    │   ├── app
    │   │   └── app.js
    │   ├── tests
    │   │   └── test.js
    │   ├── server.js
    │   ├── db.js
    │   ├── package.json
    │   ├── package-lock.json
    │   └── Dockerfile
    ├── web
    │   ├── index.html
    │   └── Dockerfile
    ├── init.sql
    └── docker-compose.yml
```

---

# Вывод

В ходе лабораторной работы была реализована контейнерная архитектура веб-приложения для системы бронирования отеля.

Были получены практические навыки:

- контейнеризации приложения
- настройки Docker Compose
- организации взаимодействия между frontend, backend и PostgreSQL
- написания интеграционных тестов на Jest и Supertest
- настройки CI pipeline в GitHub Actions
- настройки CD pipeline и публикации Docker-образов в Docker Hub
- развёртывания контейнеризированного приложения на VPS-сервере

Результат работы показал, что использование docker и CI/CD значительно упрощает процесс сборки, тестирования и развёртывания приложения.
