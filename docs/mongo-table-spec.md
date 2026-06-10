# MongoDB Table Specification

Tai lieu nay liet ke cac `collection` trong MongoDB cua du an Otto theo form:

- `Ten cot`
- `Kieu du lieu`
- `Rang buoc`
- `Mo ta`

Luu y:
- Day la MongoDB nen thuc te la `collection`, khong phai bang SQL.
- Khoa chinh mac dinh cua MongoDB la `_id` kieu `ObjectId`.
- Cac cot `createdAt`, `updatedAt` duoc tao tu `timestamps` trong Mongoose.
- `Ward` la alias cua schema `Location`.

## 1. users

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID nguoi dung |
| `email` | string | NOT NULL, UNIQUE | Email dang nhap |
| `phone` | string | NOT NULL, UNIQUE | So dien thoai |
| `password` | string | NOT NULL | Mat khau da ma hoa |
| `role` | string | NOT NULL, ENUM(`CUSTOMER`,`TASKER`,`ADMIN`) | Vai tro nguoi dung |
| `fullName` | string | NULL | Ho va ten |
| `avatar` | string | NULL | Link anh dai dien |
| `status` | string | DEFAULT `ACTIVE`, ENUM(`ACTIVE`,`BLOCKED`) | Trang thai tai khoan |
| `isEmailVerified` | boolean | DEFAULT `false` | Da xac thuc email hay chua |
| `mustChangePassword` | boolean | DEFAULT `false` | Bat buoc doi mat khau |
| `emailVerifyToken` | string | NULL | Token xac thuc email |
| `resetPasswordToken` | string | NULL | Token dat lai mat khau |
| `resetPasswordExpires` | Date | NULL | Han dat lai mat khau |
| `provinceId` | ObjectId | FK -> `provinces._id`, INDEX | Tinh/thanh |
| `wardId` | ObjectId | FK -> `wards._id`, INDEX | Phuong/xa chinh |
| `wardIds` | ObjectId[] | DEFAULT `[]` | Danh sach phuong/xa phu trach |
| `emailVerifyExpires` | Date | NULL | Han xac thuc email |
| `isOnline` | boolean | DEFAULT `false` | Trang thai online |
| `isAvailable` | boolean | DEFAULT `true` | Co san sang nhan viec hay khong |
| `skills` | ObjectId[] | DEFAULT `[]` | Danh sach dich vu tasker co the lam |
| `rating` | number | DEFAULT `0` | Diem danh gia trung binh |
| `totalJobs` | number | DEFAULT `0` | Tong so cong viec hoan thanh |
| `currentLocation.lat` | number | NULL | Vi do hien tai |
| `currentLocation.lng` | number | NULL | Kinh do hien tai |
| `address` | string | NULL | Dia chi chuoi day du |
| `idCard` | string | NULL | So CCCD/CMND |
| `earnings` | number | DEFAULT `0` | Thu nhap tong |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 2. services

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID dich vu |
| `name` | string | NOT NULL, INDEX | Ten dich vu |
| `description` | string | NULL | Mo ta dich vu |
| `pricePerHour` | number | NOT NULL | Gia theo gio |
| `minHours` | number | DEFAULT `2` | So gio toi thieu |
| `maxHours` | number | DEFAULT `12` | So gio toi da |
| `estimatedTime` | number | NULL | Thoi gian uoc tinh |
| `isActive` | boolean | DEFAULT `true`, INDEX | Dich vu dang hoat dong |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 3. provinces

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID tinh/thanh |
| `name` | string | NOT NULL, UNIQUE | Ten tinh/thanh |
| `code` | string | NOT NULL, UNIQUE | Ma tinh/thanh |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 4. wards

Ghi chu: `wards` dung schema `Location`, duoc dang ky alias ten `Ward`.

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID phuong/xa |
| `name` | string | NOT NULL | Ten phuong/xa |
| `type` | string | NOT NULL, INDEX, ENUM(`WARD`,`COMMUNE`,`SPECIAL`) | Loai don vi hanh chinh |
| `provinceId` | ObjectId | NOT NULL, FK -> `provinces._id`, INDEX | Thuoc tinh/thanh nao |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 5. orders

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID don hang |
| `customerId` | ObjectId | NOT NULL, FK -> `users._id`, INDEX | Khach hang tao don |
| `taskerId` | ObjectId | NULL, FK -> `users._id`, INDEX | Tasker nhan don |
| `offeredTaskers` | ObjectId[] | NULL, INDEX | Danh sach tasker da duoc de nghi |
| `offerRound` | number | DEFAULT `0` | So vong de nghi tasker |
| `offerExpiresAt` | Date | NULL, INDEX | Han tasker nhan viec |
| `rejectedTaskers` | ObjectId[] | DEFAULT `[]` | Tasker da tu choi don |
| `serviceId` | ObjectId | NOT NULL, FK -> `services._id`, INDEX | Dich vu duoc dat |
| `serviceSnapshot.name` | string | NOT NULL | Ten dich vu tai thoi diem tao don |
| `serviceSnapshot.pricePerHour` | number | NOT NULL | Gia dich vu tai thoi diem tao don |
| `scheduleTime` | Date | NOT NULL | Moc lich hen tong quat |
| `startTime` | Date | NOT NULL, INDEX | Gio bat dau |
| `endTime` | Date | NOT NULL, INDEX | Gio ket thuc |
| `overdueWarningSentAt` | Date | NULL, INDEX | Da gui canh bao tre hay chua |
| `totalHours` | number | NOT NULL | Tong so gio |
| `totalPrice` | number | NOT NULL | Tong tien |
| `provinceId` | ObjectId | NOT NULL, FK -> `provinces._id`, INDEX | Tinh/thanh cua don |
| `wardId` | ObjectId | NOT NULL, FK -> `wards._id`, INDEX | Phuong/xa cua don |
| `address` | string | NULL | Dia chi day du |
| `addressDetail` | string | NOT NULL | Dia chi chi tiet |
| `note` | string | NULL | Ghi chu cua khach |
| `status` | string | DEFAULT `SEARCHING`, INDEX, ENUM(`PENDING_PAYMENT`,`PAID`,`SEARCHING`,`ASSIGNED`,`IN_PROGRESS`,`WAITING_CONFIRMATION`,`PAYMENT_REQUIRED`,`COMPLETED`,`CANCELLED`,`AUTO_CANCELLED`,`TIMEOUT`) | Trang thai don |
| `paymentTransactionId` | string | NULL | Ma giao dich thanh toan lien quan |
| `completedAt` | Date | NULL | Thoi diem tasker bao hoan thanh |
| `finishedAt` | Date | NULL | Thoi diem ket thuc |
| `paidAt` | Date | NULL | Thoi diem da thanh toan |
| `rating` | number | NULL, MIN `1`, MAX `5` | Diem danh gia |
| `review` | string | NULL | Nhan xet cua khach |
| `paymentMethod` | string | NOT NULL, DEFAULT `cash`, ENUM(`cash`,`wallet`,`stripe`) | Phuong thuc thanh toan |
| `isRefunded` | boolean | DEFAULT `false` | Da hoan tien hay chua |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 6. reviews

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID danh gia |
| `orderId` | ObjectId | NOT NULL, FK -> `orders._id` | Don hang duoc danh gia |
| `customerId` | ObjectId | NOT NULL, FK -> `users._id` | Nguoi danh gia |
| `taskerId` | ObjectId | NOT NULL, FK -> `users._id` | Tasker duoc danh gia |
| `rating` | number | NOT NULL, MIN `1`, MAX `5` | So sao danh gia |
| `comment` | string | NULL | Noi dung nhan xet |
| `createdAt` | Date | AUTO | Ngay tao |

## 7. payments

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID thanh toan |
| `orderId` | ObjectId | NOT NULL, FK -> `orders._id` | Don hang lien quan |
| `customerId` | ObjectId | NOT NULL, FK -> `users._id` | Khach thanh toan |
| `amount` | number | NOT NULL | So tien thanh toan |
| `method` | string | NOT NULL, ENUM(`VNPAY`,`STRIPE`) | Cong thanh toan |
| `status` | string | DEFAULT `PENDING`, ENUM(`PENDING`,`SUCCESS`,`FAILED`) | Ket qua thanh toan |
| `transactionId` | string | NULL | Ma giao dich ngoai he thong |
| `createdAt` | Date | AUTO | Ngay tao |

## 8. wallets

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID vi |
| `userId` | ObjectId | UNIQUE, FK -> `users._id` | Chu so huu vi |
| `balance` | number | DEFAULT `0` | So du kha dung |
| `pendingBalance` | number | DEFAULT `0` | So du dang tam giu/escrow |
| `totalEarning` | number | DEFAULT `0` | Tong thu nhap tich luy |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 9. transactions

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID giao dich vi |
| `userId` | ObjectId | FK -> `users._id`, INDEX | Nguoi so huu giao dich |
| `orderId` | ObjectId | NULL, FK -> `orders._id` | Don hang lien quan |
| `amount` | number | NULL | So tien giao dich |
| `status` | string | ENUM(`PENDING`,`SUCCESS`,`FAILED`) | Trang thai giao dich |
| `externalId` | string | UNIQUE | Ma giao dich ngoai he thong |
| `type` | string | ENUM(`DEPOSIT`,`PAYMENT`,`REFUND`,`WITHDRAW`,`RECEIVE`) | Loai giao dich |
| `paymentMethod` | string | NULL | Cach thanh toan/giao dich |
| `otpCode` | string | NULL | OTP xac thuc |
| `otpExpires` | Date | NULL | Han OTP |
| `isOtpVerified` | boolean | DEFAULT `false` | Da xac thuc OTP hay chua |
| `bankName` | string | NULL | Ten ngan hang khi rut tien |
| `accountNumber` | string | NULL | So tai khoan khi rut tien |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 10. bank_accounts

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID tai khoan ngan hang |
| `userId` | ObjectId | FK -> `users._id` | Chu so huu tai khoan |
| `bankName` | string | NULL | Ten ngan hang |
| `accountNumber` | string | NULL | So tai khoan |
| `accountHolder` | string | NULL | Ten chu tai khoan |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 11. fake_banks

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID du lieu ngan hang gia lap |
| `bankName` | string | NULL | Ten ngan hang |
| `accountNumber` | string | NULL | So tai khoan |
| `balance` | number | DEFAULT `0` | So du mo phong |

## 12. notifications

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID thong bao |
| `userId` | ObjectId | NOT NULL, FK -> `users._id` | Nguoi nhan thong bao |
| `title` | string | NOT NULL | Tieu de thong bao |
| `content` | string | NOT NULL | Noi dung thong bao |
| `isRead` | boolean | DEFAULT `false` | Da doc hay chua |
| `type` | string | NULL | Loai thong bao |
| `orderId` | string | NULL | Don hang lien quan |
| `senderId` | string | NULL | Nguoi gui lien quan |
| `senderName` | string | NULL | Ten nguoi gui |
| `createdAt` | Date | AUTO | Ngay tao |

## 13. chat_messages

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID tin nhan |
| `orderId` | string | NOT NULL | Don hang cua cuoc chat |
| `senderId` | string | NOT NULL | ID nguoi gui |
| `senderRole` | string | NOT NULL | Vai tro nguoi gui |
| `text` | string | NOT NULL | Noi dung tin nhan |
| `read` | boolean | DEFAULT `false` | Da doc hay chua |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## 14. tasker_requests

| Ten cot | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| `_id` | ObjectId | PK | ID yeu cau dang ky tasker |
| `formData.fullName` | string | NULL, REQUIRED trong object `formData` | Ho ten nguoi dang ky |
| `formData.email` | string | NULL, REQUIRED trong object `formData` | Email nguoi dang ky |
| `formData.phone` | string | NULL, REQUIRED trong object `formData` | So dien thoai |
| `formData.idCard` | string | NULL, REQUIRED trong object `formData` | CCCD/CMND |
| `formData.address` | string | NULL, REQUIRED trong object `formData` | Dia chi |
| `formData.district` | string | NULL, REQUIRED trong object `formData` | Quan/huyen |
| `formData.city` | string | NULL, REQUIRED trong object `formData` | Tinh/thanh pho |
| `formData.experience` | string | NULL, REQUIRED trong object `formData` | Kinh nghiem |
| `formData.introduction` | string | NULL, REQUIRED trong object `formData` | Gioi thieu ban than |
| `services` | string[] | DEFAULT `[]` | Danh sach dich vu dang ky |
| `status` | string | DEFAULT `pending` | Trang thai phe duyet |
| `adminNote` | string | DEFAULT `null` | Ghi chu tu admin |
| `createdAt` | Date | AUTO | Ngay tao |
| `updatedAt` | Date | AUTO | Ngay cap nhat |

## Nguon doi chieu

- `src/users/user.schema.ts`
- `src/services/service.schema.ts`
- `src/locations/province.schema.ts`
- `src/locations/location.schema.ts`
- `src/locations/locations.module.ts`
- `src/orders/order.schema.ts`
- `src/orders/order-status.enum.ts`
- `src/reviews/review.schema.ts`
- `src/payments/schemas/payment.schema.ts`
- `src/wallet/schemas/wallet.schema.ts`
- `src/wallet/schemas/transaction.schema.ts`
- `src/wallet/schemas/bank-account.schema.ts`
- `src/wallet/schemas/fake-bank.schema.ts`
- `src/notifications/notification.schema.ts`
- `src/chat/message.schema.ts`
- `src/tasker-requests/tasker-request.schema.ts`
