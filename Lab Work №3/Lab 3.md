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

### YAGNI

'''java
// BookingService.java
@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private RoomService roomService;
    
    public Booking createBooking(BookingRequest request) {
        // Проверка доступности номера
        boolean isAvailable = roomService.isRoomAvailable(
            request.getRoomId(), 
            request.getCheckInDate(), 
            request.getCheckOutDate()
        );
        
        if (!isAvailable) {
            throw new RoomNotAvailableException("Номер недоступен на выбранные даты");
        }
        
        // Создание бронирования
        Booking booking = new Booking();
        booking.setRoomId(request.getRoomId());
        booking.setUserId(request.getUserId());
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setGuests(request.getGuests());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCreatedAt(LocalDateTime.now());
        
        // Сохранение в БД
        return bookingRepository.save(booking);
    }
    
    public Booking getBooking(String bookingId) {
        return bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BookingNotFoundException("Бронирование не найдено"));
    }
    
    public boolean cancelBooking(String bookingId) {
        Booking booking = getBooking(bookingId);
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        return true;
    }
'''
Реализованы только базовые методы для работы с бронированиями. Не реализуются дополнительные возможности, пока нет конкретных требований к ним.

### DRY

'''java

// DateUtils.java - общий утилитный класс
@Component
public class DateUtils {
    
    // Общий метод для форматирования дат
    public String formatDate(LocalDate date) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        return date.format(formatter);
    }
    
    // Общий метод для расчета количества ночей
    public int calculateNights(LocalDate checkIn, LocalDate checkOut) {
        return (int) ChronoUnit.DAYS.between(checkIn, checkOut);
    }
    
    // Общий метод для проверки, находится ли дата в диапазоне
    public boolean isDateInRange(LocalDate date, LocalDate startDate, LocalDate endDate) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }
}

// BookingService.java - использование общих методов
@Service
public class BookingService {
    
    @Autowired
    private DateUtils dateUtils;
    
    public BookingSummary createBookingSummary(Booking booking) {
        BookingSummary summary = new BookingSummary();
        summary.setBookingId(booking.getId());
        summary.setCheckIn(dateUtils.formatDate(booking.getCheckInDate()));
        summary.setCheckOut(dateUtils.formatDate(booking.getCheckOutDate()));
        summary.setNights(dateUtils.calculateNights(
            booking.getCheckInDate(), 
            booking.getCheckOutDate()
        ));
        return summary;
    }
}

// InvoiceService.java - переиспользование того же метода
@Service
public class InvoiceService {
    
    @Autowired
    private DateUtils dateUtils;
    
    public Invoice createInvoice(Booking booking) {
        Invoice invoice = new Invoice();
        invoice.setPeriod(dateUtils.formatDate(booking.getCheckInDate()) + " - " + 
                         dateUtils.formatDate(booking.getCheckOutDate()));
        return invoice;
    }
}

'''
Общая логика работы с датами вынесена в отдельный класс DateUtils. Предотвращает дублирование кода в разных сервисах.

### SOLID

'''typescript

// BookingCard.tsx - только отображение информации о бронировании
const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  return (
    <div className="booking-card">
      <h3>Бронирование #{booking.id}</h3>
      <p>Номер: {booking.roomNumber}</p>
      <p>Даты: {booking.checkIn} - {booking.checkOut}</p>
      <p>Статус: {booking.status}</p>
    </div>
  );
};

// BookingActions.tsx - только действия с бронированием
const BookingActions: React.FC<BookingActionsProps> = ({ bookingId, onCancel }) => {
  return (
    <div className="booking-actions">
      <button onClick={() => onCancel(bookingId)}>Отменить</button>
      <button onClick={() => window.print()}>Распечатать</button>
    </div>
  );
};

// Принцип открытости/закрытости
interface NotificationService {
  send(message: string): void;
}

class EmailNotification implements NotificationService {
  send(message: string): void {
    console.log(`Sending email: ${message}`);
  }
}

class SmsNotification implements NotificationService {
  send(message: string): void {
    console.log(`Sending SMS: ${message}`);
  }
}

class NotificationManager {
  private services: NotificationService[] = [];
  
  addService(service: NotificationService): void {
    this.services.push(service);
  }
  
  notifyAll(message: string): void {
    this.services.forEach(service => service.send(message));
  }
}

class PushNotification implements NotificationService {
  send(message: string): void {
    console.log(`Sending push notification: ${message}`);
  }
}

'''

#### Single Responsibility Principle:

BookingCard отвечает исключительно за отображение информации о бронировании. Его единственная причина для изменения — это изменение формата представления данных о бронировании.

BookingActions отвечает только за предоставление интерфейса для действий с бронированием. Его единственная причина для изменения — изменение доступных действий или их оформления.

#### Open/Closed Principle:

NotificationService интерфейс открыт для расширения - можно создавать новые типы уведомлений, не изменяя существующий код.

NotificationManager закрыт для модификации - при добавлении нового типа уведомления не требуется изменять код менеджера, достаточно добавить новую реализацию интерфейса.

#### Liskov Substitution Principle:

Все классы, реализующие NotificationService, могут быть использованы взаимозаменяемо. Например, PushNotification может заменить EmailNotification без изменения корректности программы.

#### Interface Segregation Principle:

Интерфейс NotificationService содержит только один метод send, что делает его узкоспециализированным. Клиенты не вынуждены зависеть от методов, которые они не используют.

#### Dependency Inversion Principle:

NotificationManager зависит от абстракции NotificationService, а не от конкретных реализаций. Можно легко добавлять новые типы уведомлений и изменять существующие без изменения кода менеджера.

## Дополнительные принципы разработки

### BDUF

#### Частичный отказ

В условиях быстро меняющегося рынка премиум-отелей и сжатых сроков реализации полное предварительное проектирование нецелесообразно. Требования могут измениться в процессе разработки, особенно для инновационных компонентов вроде интеграции с умными замками. Вместо этого стоит выбрать итеративный подход с архитектурным runway. И выполнить детальное проектирование только ключевых компонентов системы — ядра бронирования, интеграционных интерфейсов и модели данных.

### SOC

#### Полное применение

Для системы бронирования отелей, которая обслуживает три различные категории пользователей и интегрируется с внешними системами, разделение ответственности критически важно. Каждый компонент отвечает за свою конкретную задачу - изменения в одном модуле минимально затрагивают другие, компоненты можно тестировать изолированно.

### MVP

#### Полное применение

Упоминание о "пиковом сезоне" в требованиях напрямую указывает на необходимость быстрого выхода на рынок. MVP позволяет запустить систему в кратчайшие сроки, получив при этом работающий продукт, который можно развивать на основе обратной связи реальных пользователей.

### PoC

#### Частичное применение

Не все компоненты системы требуют PoC. Для стандартных функций достаточно стандартных проверок. Однако для инновационных и технологически рискованных компонентов PoC необходим. Интеграция с умными замками — необходимо доказать возможность безопасной генерации, производительность под нагрузкой — важно убедиться, что система выдержит сотни одновременных бронирований.
