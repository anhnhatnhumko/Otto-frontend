# Class Diagram

Tai lieu nay mo ta class diagram theo goc nhin nghiep vu cua du an Otto. Ban nay duoc rut gon de khac ro voi database diagram: it field hon, co them method chinh, va tap trung vao cach cac doi tuong phoi hop trong he thong.

Luu y:
- Day la domain class diagram, khong sao chep nguyen tung cot trong MongoDB.
- `Ward` trong so do tuong ung voi schema `Location` duoc dang ky alias `Ward`.
- `Payment` mo ta thanh toan qua cong ngoai nhu Stripe/VNPAY.
- `Wallet` va `Transaction` mo ta dong tien noi bo cua he thong Otto.

## Domain Class Diagram

```mermaid
classDiagram
    class User {
        +id: ObjectId
        +fullName: string
        +email: string
        +phone: string
        +role: UserRole
        +status: UserStatus
        +address: string
        +rating: number
        +updateProfile()
        +activate()
        +deactivate()
    }

    class Service {
        +id: ObjectId
        +name: string
        +pricePerHour: number
        +minHours: number
        +maxHours: number
        +isActive: boolean
        +estimatePrice(hours)
        +toggleAvailability()
    }

    class Province {
        +id: ObjectId
        +name: string
        +code: string
    }

    class Ward {
        +id: ObjectId
        +name: string
        +type: string
    }

    class Order {
        +id: ObjectId
        +scheduleTime: Date
        +totalHours: number
        +totalPrice: number
        +status: OrderStatus
        +paymentMethod: PaymentMethod
        +isRefunded: boolean
        +assignTasker(tasker)
        +start()
        +complete()
        +cancel()
        +markRefunded()
    }

    class Payment {
        +id: ObjectId
        +amount: number
        +method: PaymentMethod
        +status: PaymentStatus
        +transactionId: string
        +markPending()
        +markSuccess()
        +markFailed()
    }

    class Wallet {
        +id: ObjectId
        +balance: number
        +pendingBalance: number
        +totalEarning: number
        +credit(amount)
        +debit(amount)
        +hold(amount)
        +release(amount)
    }

    class Transaction {
        +id: ObjectId
        +amount: number
        +type: TransactionType
        +status: TransactionStatus
        +paymentMethod: PaymentMethod
        +externalId: string
        +markCompleted()
        +markFailed()
    }

    class BankAccount {
        +id: ObjectId
        +bankName: string
        +accountNumber: string
        +accountHolder: string
        +verifyOwner()
    }

    class Review {
        +id: ObjectId
        +rating: number
        +comment: string
        +publish()
    }

    class Notification {
        +id: ObjectId
        +title: string
        +content: string
        +type: string
        +isRead: boolean
        +markRead()
    }

    class ChatMessage {
        +id: ObjectId
        +text: string
        +senderRole: UserRole
        +read: boolean
        +markAsRead()
    }

    class TaskerRequest {
        +id: ObjectId
        +status: RequestStatus
        +adminNote: string
        +submit()
        +approve()
        +reject(note)
    }

    class UserRole {
        <<enumeration>>
        CUSTOMER
        TASKER
        ADMIN
    }

    class UserStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
        BLOCKED
    }

    class OrderStatus {
        <<enumeration>>
        PENDING
        ASSIGNED
        IN_PROGRESS
        COMPLETED
        CANCELLED
        TIMEOUT
    }

    class PaymentMethod {
        <<enumeration>>
        CASH
        WALLET
        STRIPE
        VNPAY
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        SUCCESS
        FAILED
        REFUNDED
    }

    class TransactionType {
        <<enumeration>>
        DEPOSIT
        WITHDRAW
        PAYMENT
        REFUND
        PAYOUT
    }

    class TransactionStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
    }

    class RequestStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    Province "1" o-- "0..*" Ward : contains
    Province "1" --> "0..*" User : region
    Ward "1" --> "0..*" User : primaryWard

    User "1" --> "0..*" Order : creates
    User "0..1" --> "0..*" Order : accepts
    Service "1" --> "0..*" Order : bookedAs
    Province "1" --> "0..*" Order : serviceProvince
    Ward "1" --> "0..*" Order : serviceWard

    Order "1" --> "0..1" Payment : has
    User "1" --> "0..*" Payment : pays

    User "1" --> "1" Wallet : owns
    Wallet "1" *-- "0..*" Transaction : records
    Order "0..1" --> "0..*" Transaction : relatedTo
    User "1" --> "0..*" BankAccount : registers

    Order "1" --> "0..1" Review : has
    User "1" --> "0..*" Review : writesOrReceives

    User "1" --> "0..*" Notification : receives
    Order "0..1" --> "0..*" Notification : context

    Order "0..1" --> "0..*" ChatMessage : chatContext
    User "0..1" --> "0..*" ChatMessage : sends

    User "1" --> "0..*" TaskerRequest : submits
```

## Cach doc nhanh

- `User` va `Order` la 2 lop trung tam nhat cua he thong.
- `Order` la doi tuong nghiep vu chinh, lien ket voi `Service`, `Payment`, `Review`, `Notification`, `ChatMessage`.
- `Wallet` va `Transaction` tao thanh cum nghiep vu ve vi noi bo, tach biet voi `Payment`.
- Cac `enumeration` nhu `OrderStatus`, `PaymentMethod`, `TransactionType` lam ro hon cac trang thai nghiep vu, thay vi liet ke chi tiet cot DB.

## Khac voi Database Diagram o dau

- Database diagram tap trung vao bang/collection, field, kieu du lieu, khoa lien ket.
- Class diagram tap trung vao doi tuong nghiep vu, thuoc tinh chinh va hanh vi chinh.
- Vi vay, class diagram nay co `method` nhu `assignTasker()`, `markSuccess()`, `credit()`, trong khi database diagram thi khong.

## Nguon doi chieu

- `src/users/user.schema.ts`
- `src/services/service.schema.ts`
- `src/locations/province.schema.ts`
- `src/locations/location.schema.ts`
- `src/orders/order.schema.ts`
- `src/reviews/review.schema.ts`
- `src/payments/schemas/payment.schema.ts`
- `src/wallet/schemas/wallet.schema.ts`
- `src/wallet/schemas/transaction.schema.ts`
- `src/wallet/schemas/bank-account.schema.ts`
- `src/notifications/notification.schema.ts`
- `src/chat/message.schema.ts`
- `src/tasker-requests/tasker-request.schema.ts`
