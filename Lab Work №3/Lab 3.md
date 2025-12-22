# Лабораторная работа №2

## Вариант 15: 
Крупная компания разрабатывает систему бронирования и управления отелями премиум-класса.

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
