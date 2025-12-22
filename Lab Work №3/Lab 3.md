# Лабораторная работа №2

## Вариант 15: 
Крупная компания разрабатывает систему бронирования и управления отелями премиум-класса.

## Тема: 
Использование принципов проектирования на уровне методов и классов

## Диаграмма контейнеров

<img width="1058" height="967" alt="image" src="https://github.com/user-attachments/assets/36e40ad3-d98a-4b3d-8a4d-ea1d1675a644" />

## Диаграмма компонентов - Backend API

<img width="1854" height="1074" alt="image" src="https://github.com/user-attachments/assets/8ad86331-81bc-47ea-83d1-5fb6afb15ec6" />

## Диаграмма последовательностей

<img width="2515" height="2184" alt="sequence" src="https://github.com/user-attachments/assets/79d6952c-0ad7-4f92-a185-c5e0f475072b" />

Диаграмма последовательностей показывает процесс бронирования номера от инициации гостем до сохранения в базе данных. Процесс включает проверку доступности номера, обработку платежа через внешнюю систему и отправку подтверждения.

## Модель БД

<img width="787" height="878" alt="classdiag" src="https://github.com/user-attachments/assets/9466d446-d521-4e1c-be40-5f758c982858" />

Модель базы данных включает 6 основных сущностей и 5 перечислений. Схема спроектирована с учетом нормализации и включает все необходимые данные для реализации варианта использования сценария "Бронирование номера".

## Применение основных принципов разработки

### KISS 

```java
// BookingValidator.java
@Component
public class BookingValidator {
    
    // Простой и понятный метод валидации
    public ValidationResult validate(BookingRequest request) {
        ValidationResult result = new ValidationResult();
        
        if (request.getCheckInDate() == null) {
            result.addError("Дата заезда обязательна");
        }
        
        if (request.getCheckOutDate() == null) {
            result.addError("Дата выезда обязательна");
        }
        
        if (request.getCheckInDate() != null && request.getCheckOutDate() != null) {
            if (!request.getCheckInDate().isBefore(request.getCheckOutDate())) {
                result.addError("Дата заезда должна быть раньше даты выезда");
            }
        }
        
        if (request.getGuests() < 1 || request.getGuests() > 10) {
            result.addError("Количество гостей должно быть от 1 до 10");
        }
        
        return result;
    }
    
    // Простой класс для хранения результата валидации
    public static class ValidationResult {
        private List<String> errors = new ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public boolean isValid() {
            return errors.isEmpty();
        }
        
        public List<String> getErrors() {
            return errors;
        }
    }
}

```
Код максимально простой и понятный. Каждая проверка выполняется явно, без сложных конструкций. Класс ValidationResult инкапсулирует логику работы с ошибками.


