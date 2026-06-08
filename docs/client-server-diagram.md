# Client-Server Architecture Diagram

Tai lieu nay duoc suy ra tu code hien tai cua 3 phan:
- `otto-frontend` (Next.js web app)
- `otto-mobile-1` (Expo React Native app)
- `otto-backend` (NestJS API + Socket.IO + MongoDB)

## Tong quan kien truc

```mermaid
flowchart LR
    subgraph CLIENTS[Client Layer]
        WEB[Web Browser\nCustomer / Tasker / Admin]
        MOBILE[Mobile App\nExpo React Native]
    end

    subgraph FRONTEND[Web Frontend Layer]
        NEXTUI[Next.js App Router UI\nPages + Components + Hooks]
        NEXTPROXY[Next.js API Proxy\n/app/api/[...slug]]
    end

    subgraph BACKEND[Backend Layer]
        API[NestJS REST API\nAuth, Users, Orders, Services,\nLocations, Customers, Tasker,\nPayments, Wallet, Notifications,\nChat, Admin, Upload]
        SOCKET[Socket.IO Gateways\nNotificationsGateway\nChatGateway\nAdminGateway]
        JOBS[Background Logic\nScheduleModule + timeout jobs]
    end

    subgraph DATA[Data Layer]
        MONGO[(MongoDB)]
    end

    subgraph EXTERNAL[External Services]
        STRIPE[Stripe]
        RESEND[Resend Email API]
        CLOUDINARY[Cloudinary]
    end

    WEB --> NEXTUI
    NEXTUI -->|REST /api/*| NEXTPROXY
    NEXTPROXY -->|Forward cookies + HTTP| API
    WEB -.->|Socket.IO realtime| SOCKET

    MOBILE -->|REST via EXPO_PUBLIC_API_BASE| API
    MOBILE -.->|Socket.IO realtime| SOCKET

    API --> JOBS
    API <--> MONGO
    SOCKET <--> MONGO

    API -->|Checkout / webhook / wallet flows| STRIPE
    API -->|Send OTP / verify / order mail| RESEND
    API -->|Upload avatar| CLOUDINARY
```

## Cach he thong giao tiep

### 1. Web client

- Nguoi dung web truy cap giao dien Next.js.
- Cac request REST tu web thuong di qua `Next.js API Proxy` tai `app/api/[...slug]/route.ts`.
- Proxy nay chuyen tiep cookie `accessToken` len backend NestJS.
- Realtime notification, chat, admin update di truc tiep tu browser den Socket.IO cua backend.

### 2. Mobile client

- Mobile app Expo goi thang backend qua `EXPO_PUBLIC_API_BASE`.
- Mobile khong di qua lop proxy cua Next.js.
- Realtime tren mobile cung di truc tiep den Socket.IO backend.

### 3. Backend NestJS

- Backend cung cap REST API cho auth, order, wallet, payment, profile, chat, notification, admin.
- Backend dung `JwtAuthGuard` va cookie `accessToken` de xac thuc cho web; mobile co the gui token kem request/socket auth.
- Backend co cac gateway realtime rieng cho notification, chat va admin panel.
- Backend dung scheduler de xu ly cac job nhu timeout don hang.

### 4. Data va dich vu ngoai

- MongoDB la CSDL chinh cua he thong.
- Stripe xu ly thanh toan online va cac luong nap tien / xac nhan thanh toan.
- Resend duoc dung de gui email OTP, verify email, reset password, thong bao don hang.
- Cloudinary duoc dung de upload va toi uu avatar.

## Luong chinh trong du an

### Dang nhap web

```text
Browser -> Next.js UI -> /api/auth/login -> NestJS AuthController
NestJS -> tao JWT -> set cookie accessToken -> Browser
```

### Goi API tu web

```text
Browser -> Next.js /api/* proxy -> NestJS REST API -> MongoDB
```

### Goi API tu mobile

```text
Mobile App -> NestJS REST API -> MongoDB
```

### Notification / chat realtime

```text
Browser or Mobile -> Socket.IO -> NotificationsGateway / ChatGateway / AdminGateway
```

### Thanh toan va OTP

```text
Client -> NestJS Payments/Wallet -> Stripe or internal wallet flow
NestJS -> Resend -> gui OTP / email thong bao
```

## Nhan xet kien truc

- Day la mo hinh client-server nhieu client: `web` va `mobile` cung dung chung mot backend.
- Web co them mot lop `Next.js proxy`, giup xu ly cookie va gom API call ve cung domain frontend.
- Backend dong vai tro trung tam: REST API, realtime Socket.IO, xu ly nghiep vu, va truy cap MongoDB.
- MongoDB chi duoc truy cap boi backend, client khong ket noi truc tiep database.

## Nguon doi chieu trong code

### Frontend

- `app/api/[...slug]/route.ts`
- `lib/socket.ts`
- `lib/api-url.ts`

### Mobile

- `src/api/auth.ts`
- `src/api/customer.ts`
- `src/lib/socket.ts`

### Backend

- `src/main.ts`
- `src/app.module.ts`
- `src/auth/auth.controller.ts`
- `src/notifications/notifications.gateway.ts`
- `src/chat/chat.gateway.ts`
- `src/admin/admin.gateway.ts`
- `src/payments/payments.controller.ts`
- `src/mail/mail.service.ts`
- `src/avatar/cloudinary.service.ts`
