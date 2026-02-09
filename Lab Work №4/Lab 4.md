# Описание REST API — Booking Service

## 1.1 GET /bookings

**Описание:** получить список бронирований.  
**Роль:** `ADMIN`

### Query Parameters

| Параметр | Тип | Обязательный | Описание |
|--------|----|-------------|----------|
| page | int | нет | номер страницы (по умолчанию 0) |
| size | int | нет | размер страницы (по умолчанию 20) |
| status | string | нет | фильтр по статусу (`CREATED`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`) |
| dateFrom | date | нет | начало интервала по `checkInDate` |
| dateTo | date | нет | конец интервала по `checkInDate` |

### Пример запроса

```
GET /api/v1/bookings?page=0&size=20&status=CONFIRMED&dateFrom=2026-03-01&dateTo=2026-03-31
```

### Ответ 200 OK

```json
{
  "items": [
    { "...": "BookingResponse" }
  ],
  "page": 0,
  "size": 20,
  "total": 134
}
```

---

## 1.2 GET /bookings/{bookingId}

**Описание:** получить конкретное бронирование.  
**Роли:** `ADMIN`, `GUEST` (только свои бронирования)

### Path Parameters

| Параметр | Тип | Описание |
|--------|------|----------|
| bookingId | string | идентификатор бронирования |

### Пример запроса

```
GET /api/v1/bookings/bkg_10001
```

### Ответ 200 OK

Возвращает объект `BookingResponse`.

**Headers:**
```
ETag: "W/\"bkg_10001:v3\""
```

---

## 1.3 POST /bookings

**Описание:** создать бронирование гостем.  
**Роль:** `GUEST`

### Headers

```
Authorization: Bearer <JWT>
Idempotency-Key: 2f21c2b7-0aa2-49be-9f75-1cf2b61f1b22
Content-Type: application/json
```

### Body — BookingCreateRequest

```json
{
  "hotelId": "H001",
  "roomType": "DELUXE",
  "checkInDate": "2026-03-10",
  "checkOutDate": "2026-03-12",
  "guests": 2,
  "guestContacts": {
    "email": "guest@example.com",
    "phone": "+1-555-0100"
  },
  "specialRequests": "Late check-in",
  "paymentToken": "tok_abc123"
}
```

### Ответ 201 Created

```json
{
  "id": "bkg_10001",
  "status": "CREATED",
  "etag": "W/\"bkg_10001:v1\""
}
```

### Возможные ошибки

- `400 Bad Request` — неверные даты или формат  
- `409 Conflict` — отсутствие доступных номеров  
- `402 Payment Required` — платёж отклонён  

---

## 1.4 PUT /bookings/{bookingId}

**Описание:** изменить бронирование.

### Роли
- `ADMIN` — может изменять даты, гостей и назначенный номер  
- `GUEST` — может изменять бронирование только в статусе `CREATED`

### Headers

```
If-Match: "W/\"bkg_10001:v3\""
Content-Type: application/json
```

### Body — BookingUpdateRequest

```json
{
  "checkInDate": "2026-03-11",
  "checkOutDate": "2026-03-13",
  "guests": 2,
  "specialRequests": "Need baby crib"
}
```

### Ответ 200 OK

Возвращает обновлённый `BookingResponse` с новым `ETag`.

### Возможные ошибки

- `409 Conflict` — конфликт версии или запрещённое изменение  
- `400 Bad Request` — некорректные даты  

---

## 1.5 DELETE /bookings/{bookingId}

**Описание:** отменить бронирование (soft-cancel).  
**Роли:** `ADMIN`, `GUEST` (только свои бронирования)

### Пример запроса

```
DELETE /api/v1/bookings/bkg_10001
```

### Ответ 204 No Content

### Возможные ошибки

- `409 Conflict` — отмена невозможна в статусе `COMPLETED`

---

## 1.6 POST /bookings/{bookingId}/assign-room

**Описание:** назначить номер для бронирования.  
**Роль:** `ADMIN`

### Body — AssignRoomRequest

```json
{
  "roomId": "rm_512"
}
```

### Пример запроса

```
POST /api/v1/bookings/bkg_10001/assign-room
```

### Ответ 200 OK

Возвращает `BookingResponse` с установленным `roomId`.

### Возможные ошибки

- `409 Conflict` — номер недоступен или не соответствует типу

---

## 1.7 GET /rooms

**Описание:** получить список номеров.  
**Роль:** `ADMIN`

### Query Parameters

| Параметр | Тип | Описание |
|--------|------|----------|
| hotelId | string | фильтр по отелю |
| type | string | тип номера (`DELUXE`, `SUITE`, ...) |
| status | string | статус (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `CLEANING`) |
| page | int | номер страницы |
| size | int | размер страницы |

### Ответ 200 OK

Возвращает постраничный список `RoomResponse`.

---

## 1.8 GET /rooms/{roomId}

**Описание:** получить номер по идентификатору.  
**Роль:** `ADMIN`

### Пример запроса

```
GET /api/v1/rooms/rm_512
```

### Ответ 200 OK

Возвращает объект `RoomResponse`.


------------------------------------------------------------------------
# Тестирование API --- Booking Service


Base URL:

    https://87567a97-ab63-4b5d-96e1-ebb7c5089149.mock.pstmn.io/api/v1

------------------------------------------------------------------------

# 1. Тестирование GET /bookings

## Тестируемое API

Получение списка бронирований

## Метод

GET

## Строка запроса

    GET {{baseUrl}}/bookings?page=0&size=20&status=CONFIRMED

Params:

    page=0
    size=20
    status=CONFIRMED

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="828" height="337" alt="image" src="https://github.com/user-attachments/assets/a2421df8-ad6c-42d8-b6e5-3d8562cd015a" />


------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="1148" height="403" alt="image" src="https://github.com/user-attachments/assets/b11c29a3-0019-4803-97c4-ae3e386b80b3" />


------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains items", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("items");
});

pm.test("Items is array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.items).to.be.an("array");
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования

<img width="811" height="680" alt="image" src="https://github.com/user-attachments/assets/7b7a2664-6b6f-418d-8f71-c4667bb2d2ca" />


------------------------------------------------------------------------

# 2. Тестирование GET /bookings/{bookingId}

## Тестируемое API

Получение бронирования

## Метод

GET

## Строка запроса

    GET {{baseUrl}}/bookings/bkg_10001

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="779" height="265" alt="image" src="https://github.com/user-attachments/assets/23946ae6-3681-424f-a7b7-3dfe90615660" />


------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="384" height="220" alt="image" src="https://github.com/user-attachments/assets/f4b529d1-bc18-4a88-8c4f-132e39e1067d" />


------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Booking has id", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.id).to.exist;
});

pm.test("Booking has status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.exist;
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования

<img width="777" height="684" alt="image" src="https://github.com/user-attachments/assets/45ac9982-c550-4f1c-b00d-5418d7fcdb61" />


------------------------------------------------------------------------

# 3. Тестирование POST /bookings

## Тестируемое API

Создание бронирования

## Метод

POST

## Строка запроса

    POST {{baseUrl}}/bookings

Headers:

    Authorization: Bearer token
    Content-Type: application/json

Body:

``` json
{
  "hotelId": "H001",
  "roomType": "DELUXE",
  "checkInDate": "2026-03-10",
  "checkOutDate": "2026-03-12",
  "guests": 2
}
```

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="674" height="213" alt="image" src="https://github.com/user-attachments/assets/0ebca69f-d408-4068-8dc2-8513f2060557" />
<img width="407" height="232" alt="image" src="https://github.com/user-attachments/assets/6c3fa9d8-568d-4022-bf09-27f1d62d5096" />


------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="394" height="182" alt="image" src="https://github.com/user-attachments/assets/90eadbfc-f97c-4468-8f7f-75b6d8766000" />


------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Booking created", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
});

pm.test("Status is CREATED", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("CREATED");
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования

<img width="655" height="638" alt="image" src="https://github.com/user-attachments/assets/9f292903-cbf4-4d6d-ad7f-693cda364526" />


------------------------------------------------------------------------

# 4. Тестирование PUT /bookings/{bookingId}

## Тестируемое API

Изменение бронирования

## Метод

PUT

## Строка запроса

    PUT {{baseUrl}}/bookings/bkg_10001

Body:

``` json
{
  "checkInDate": "2026-03-11",
  "checkOutDate": "2026-03-13",
  "guests": 2
}
```

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="783" height="283" alt="image" src="https://github.com/user-attachments/assets/812a90d7-00a5-448c-8401-2a639852fbbd" />
<img width="765" height="238" alt="image" src="https://github.com/user-attachments/assets/c2b8b045-2e19-4826-b7e1-db8f1566eb23" />


------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="1171" height="353" alt="image" src="https://github.com/user-attachments/assets/a5e36843-31a3-485f-82aa-d2f1ab842ab2" />


------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Booking updated", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования

<img width="815" height="665" alt="image" src="https://github.com/user-attachments/assets/63ba0f2a-33de-4496-b71c-c4be62f4296e" />


------------------------------------------------------------------------

# 5. Тестирование DELETE /bookings/{bookingId}

## Тестируемое API

Отмена бронирования

## Метод

DELETE

## Строка запроса

    DELETE {{baseUrl}}/bookings/bkg_10001

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="782" height="260" alt="image" src="https://github.com/user-attachments/assets/a0bc2b97-0b18-46ca-8e77-218ff8282420" />



------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="1160" height="319" alt="image" src="https://github.com/user-attachments/assets/7fda582f-1761-4d57-b5f6-c8fcae3d9632" />



------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is JSON", function () {
    pm.response.to.have.header("Content-Type");
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования

<img width="791" height="664" alt="image" src="https://github.com/user-attachments/assets/bcf3c5f3-591c-41e8-a5ad-0ee67d59bef1" />


------------------------------------------------------------------------

# 6. Тестирование GET /rooms

## Тестируемое API

Получение списка номеров

## Метод

GET

## Строка запроса

    GET {{baseUrl}}/rooms

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="1002" height="401" alt="image" src="https://github.com/user-attachments/assets/54307c9b-016e-4011-bba1-cb576152c739" />


------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="389" height="588" alt="image" src="https://github.com/user-attachments/assets/069409af-84e5-4c6a-90f7-b41ce76d30b5" />


------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Rooms returned", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.items).to.exist;
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования



------------------------------------------------------------------------

# 7. Тестирование GET /rooms/{roomId}

## Тестируемое API

Получение номера

## Метод

GET

## Строка запроса

    GET {{baseUrl}}/rooms/rm_512

------------------------------------------------------------------------

## Принтскрин передаваемых заголовков и параметров

<img width="656" height="265" alt="image" src="https://github.com/user-attachments/assets/c0b361c1-49f5-4de3-a7d8-938bb12b8afa" />


------------------------------------------------------------------------

## Принтскрин полученного ответа

<img width="490" height="335" alt="image" src="https://github.com/user-attachments/assets/afc67be2-062a-49e4-a0b8-47d9a1c72888" />


------------------------------------------------------------------------

## Код автотестов

``` javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room returned", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.roomId).to.exist;
});
```

------------------------------------------------------------------------

## Принтскрин результатов тестирования

<img width="739" height="646" alt="image" src="https://github.com/user-attachments/assets/43f0f734-11e5-41b8-9ef8-8b7281306f85" />


------------------------------------------------------------------------
