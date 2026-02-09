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



