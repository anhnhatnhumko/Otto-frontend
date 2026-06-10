# Entity Relationship Diagram

Tai lieu nay mo ta ERD cua du an Otto duoc suy ra tu cac schema Mongoose trong `otto-backend`.

Luu y:
- Day la MongoDB nen moi "bang" thuc te la `collection`.
- Khoa chinh mac dinh la `_id` kieu `ObjectId`.
- Mot so lien ket dang luu o dang `string` logic thay vi `ObjectId ref`, dac biet trong `notifications` va `chat_messages`.
- `wards` dung schema `Location` va duoc dang ky alias `Ward`.

## Core ERD

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string email UK
        string phone UK
        string role
        string fullName
        string status
        ObjectId provinceId FK
        ObjectId wardId FK
        ObjectId[] wardIds
        ObjectId[] skills
        number rating
        number totalJobs
        number earnings
        string address
    }

    SERVICES {
        ObjectId _id PK
        string name
        number pricePerHour
        number minHours
        number maxHours
        boolean isActive
    }

    PROVINCES {
        ObjectId _id PK
        string name UK
        string code UK
    }

    WARDS {
        ObjectId _id PK
        string name
        string type
        ObjectId provinceId FK
    }

    ORDERS {
        ObjectId _id PK
        ObjectId customerId FK
        ObjectId taskerId FK
        ObjectId[] offeredTaskers
        ObjectId[] rejectedTaskers
        ObjectId serviceId FK
        date startTime
        date endTime
        number totalHours
        number totalPrice
        ObjectId provinceId FK
        ObjectId wardId FK
        string address
        string addressDetail
        string status
        string paymentMethod
        boolean isRefunded
    }

    REVIEWS {
        ObjectId _id PK
        ObjectId orderId FK
        ObjectId customerId FK
        ObjectId taskerId FK
        number rating
        string comment
    }

    PAYMENTS {
        ObjectId _id PK
        ObjectId orderId FK
        ObjectId customerId FK
        number amount
        string method
        string status
        string transactionId
    }

    WALLETS {
        ObjectId _id PK
        ObjectId userId FK
        number balance
        number pendingBalance
        number totalEarning
    }

    TRANSACTIONS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId orderId FK
        number amount
        string type
        string status
        string paymentMethod
        string externalId UK
        string bankName
        string accountNumber
    }

    BANK_ACCOUNTS {
        ObjectId _id PK
        ObjectId userId FK
        string bankName
        string accountNumber
        string accountHolder
    }

    NOTIFICATIONS {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string type
        boolean isRead
        string orderId
        string senderId
        string senderName
    }

    CHAT_MESSAGES {
        ObjectId _id PK
        string orderId
        string senderId
        string senderRole
        string text
        boolean read
    }

    TASKER_REQUESTS {
        ObjectId _id PK
        object formData
        string[] services
        string status
        string adminNote
    }

    PROVINCES ||--o{ WARDS : contains
    PROVINCES ||--o{ USERS : user_region
    PROVINCES ||--o{ ORDERS : order_region

    WARDS ||--o{ USERS : primary_ward
    WARDS ||--o{ ORDERS : service_location

    USERS o{--o{ SERVICES : skills

    USERS ||--o{ ORDERS : creates
    USERS o|--o{ ORDERS : accepts
    SERVICES ||--o{ ORDERS : booked_as

    ORDERS ||--o| PAYMENTS : has
    USERS ||--o{ PAYMENTS : pays

    USERS ||--|| WALLETS : owns
    USERS ||--o{ TRANSACTIONS : makes
    ORDERS o|--o{ TRANSACTIONS : relates_to
    USERS ||--o{ BANK_ACCOUNTS : registers

    ORDERS ||--o| REVIEWS : has_review
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ REVIEWS : receives

    USERS ||--o{ NOTIFICATIONS : receives
    ORDERS o|--o{ NOTIFICATIONS : logical_order_link

    ORDERS o|--o{ CHAT_MESSAGES : logical_order_link
    USERS o|--o{ CHAT_MESSAGES : logical_sender_link
```

## Supporting entities

- `fake_banks`: collection mo phong ngan hang de test nap/rut trong moi truong demo.
- `tasker_requests`: luu ho so dang ky tasker va quy trinh duyet.
- `notifications`, `chat_messages`: lien quan den realtime va lich su thong bao/tin nhan.

## Source schemas

- `src/users/user.schema.ts`
- `src/services/service.schema.ts`
- `src/orders/order.schema.ts`
- `src/reviews/review.schema.ts`
- `src/payments/schemas/payment.schema.ts`
- `src/wallet/schemas/wallet.schema.ts`
- `src/wallet/schemas/transaction.schema.ts`
- `src/wallet/schemas/bank-account.schema.ts`
- `src/notifications/notification.schema.ts`
- `src/chat/message.schema.ts`
- `src/tasker-requests/tasker-request.schema.ts`
- `src/locations/province.schema.ts`
- `src/locations/location.schema.ts`
- `src/orders/order-status.enum.ts`
