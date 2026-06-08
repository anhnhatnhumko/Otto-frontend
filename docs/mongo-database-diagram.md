# Mongo Database Diagram

Diagram này được dựng từ các Mongoose schema trong `otto-backend/src`, nên phản ánh cấu trúc model MongoDB hiện tại của hệ thống.

Lưu ý:
- `Ward` là alias của schema `Location`.
- Một số quan hệ đang lưu dưới dạng `string` thay vì `ObjectId ref`, ví dụ `ChatMessage.orderId`, `ChatMessage.senderId`, `Notification.orderId`, `Notification.senderId`.
- Một số trường là mảng `ObjectId`, ví dụ `User.skills`, `User.wardIds`, `Order.offeredTaskers`, `Order.rejectedTaskers`.
- `TaskerRequest.services` hiện lưu `string[]`, không ref trực tiếp sang `Service`.

```mermaid
erDiagram
    PROVINCE {
        ObjectId _id PK
        string name
        string code
        date createdAt
        date updatedAt
    }

    WARD {
        ObjectId _id PK
        string name
        string type "WARD|COMMUNE|SPECIAL"
        ObjectId provinceId FK
        date createdAt
        date updatedAt
    }

    USER {
        ObjectId _id PK
        string email UK
        string phone UK
        string password
        string role "CUSTOMER|TASKER|ADMIN"
        string fullName
        string avatar
        string status "ACTIVE|BLOCKED"
        boolean isEmailVerified
        boolean mustChangePassword
        string emailVerifyToken
        string resetPasswordToken
        date resetPasswordExpires
        ObjectId provinceId FK
        ObjectId wardId FK
        ObjectId[] wardIds FK
        date emailVerifyExpires
        boolean isOnline
        boolean isAvailable
        ObjectId[] skills FK
        number rating
        number totalJobs
        object currentLocation
        string address
        string idCard
        number earnings
        date createdAt
        date updatedAt
    }

    SERVICE {
        ObjectId _id PK
        string name
        string description
        number pricePerHour
        number minHours
        number maxHours
        number estimatedTime
        boolean isActive
        date createdAt
        date updatedAt
    }

    ORDER {
        ObjectId _id PK
        ObjectId customerId FK
        ObjectId taskerId FK
        ObjectId[] offeredTaskers FK
        number offerRound
        date offerExpiresAt
        ObjectId[] rejectedTaskers FK
        ObjectId serviceId FK
        object serviceSnapshot
        date scheduleTime
        date startTime
        date endTime
        date overdueWarningSentAt
        number totalHours
        number totalPrice
        ObjectId provinceId FK
        ObjectId wardId FK
        string address
        string addressDetail
        string note
        string status "PENDING_PAYMENT|PAID|SEARCHING|ASSIGNED|IN_PROGRESS|WAITING_CONFIRMATION|PAYMENT_REQUIRED|COMPLETED|CANCELLED|AUTO_CANCELLED|TIMEOUT"
        string paymentTransactionId
        date completedAt
        date finishedAt
        date paidAt
        number rating
        string review
        string paymentMethod "cash|wallet|stripe"
        boolean isRefunded
        date createdAt
        date updatedAt
    }

    REVIEW {
        ObjectId _id PK
        ObjectId orderId FK
        ObjectId customerId FK
        ObjectId taskerId FK
        number rating
        string comment
        date createdAt
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId orderId FK
        ObjectId customerId FK
        number amount
        string method "VNPAY|STRIPE"
        string status "PENDING|SUCCESS|FAILED"
        string transactionId
        date createdAt
    }

    WALLET {
        ObjectId _id PK
        ObjectId userId FK
        number balance
        number pendingBalance
        number totalEarning
        date createdAt
        date updatedAt
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId orderId FK
        number amount
        string status "PENDING|SUCCESS|FAILED"
        string externalId UK
        string type "DEPOSIT|PAYMENT|REFUND|WITHDRAW|RECEIVE"
        string paymentMethod
        string otpCode
        date otpExpires
        boolean isOtpVerified
        string bankName
        string accountNumber
        date createdAt
        date updatedAt
    }

    BANK_ACCOUNT {
        ObjectId _id PK
        ObjectId userId FK
        string bankName
        string accountNumber
        string accountHolder
        date createdAt
        date updatedAt
    }

    FAKE_BANK {
        ObjectId _id PK
        string bankName
        string accountNumber
        number balance
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string content
        boolean isRead
        string type
        string orderId
        string senderId
        string senderName
        date createdAt
    }

    CHAT_MESSAGE {
        ObjectId _id PK
        string orderId
        string senderId
        string senderRole
        string text
        boolean read
        date createdAt
        date updatedAt
    }

    TASKER_REQUEST {
        ObjectId _id PK
        object formData
        string[] services
        string status
        string adminNote
        date createdAt
        date updatedAt
    }

    PROVINCE ||--o{ WARD : contains
    PROVINCE ||--o{ USER : user_province
    PROVINCE ||--o{ ORDER : order_province
    WARD ||--o{ USER : user_ward
    WARD ||--o{ ORDER : order_ward

    USER o{--o{ SERVICE : skills

    USER ||--o{ ORDER : customer_orders
    USER o|--o{ ORDER : tasker_orders
    SERVICE ||--o{ ORDER : service_orders

    USER ||--|| WALLET : owns
    USER ||--o{ BANK_ACCOUNT : has
    USER ||--o{ TRANSACTION : wallet_transactions
    ORDER o|--o{ TRANSACTION : related_transactions

    ORDER ||--o| PAYMENT : payment_record
    USER ||--o{ PAYMENT : customer_payments

    ORDER ||--o| REVIEW : review
    USER ||--o{ REVIEW : writes_review
    USER ||--o{ REVIEW : receives_review

    USER ||--o{ NOTIFICATION : receives
    ORDER o|--o{ NOTIFICATION : logical_order_link
    USER o|--o{ NOTIFICATION : logical_sender_link

    ORDER o|--o{ CHAT_MESSAGE : logical_order_link
    USER o|--o{ CHAT_MESSAGE : logical_sender_link
```

## Nguồn schema

- `src/users/user.schema.ts`
- `src/orders/order.schema.ts`
- `src/services/service.schema.ts`
- `src/reviews/review.schema.ts`
- `src/payments/schemas/payment.schema.ts`
- `src/wallet/schemas/wallet.schema.ts`
- `src/wallet/schemas/transaction.schema.ts`
- `src/wallet/schemas/bank-account.schema.ts`
- `src/wallet/schemas/fake-bank.schema.ts`
- `src/notifications/notification.schema.ts`
- `src/chat/message.schema.ts`
- `src/tasker-requests/tasker-request.schema.ts`
- `src/locations/province.schema.ts`
- `src/locations/location.schema.ts`
- `src/locations/locations.module.ts`
- `src/orders/order-status.enum.ts`
