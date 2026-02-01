# Admin Push Notification Controller - Complete Documentation
# إشعارات الدفع للمسؤول - التوثيق الكامل

This document describes the Admin Push Notification system: send notifications on demand, schedule for later, target user segments (e.g. new users), and repeat notifications.

---

## Table of Contents

1. [Overview](#overview)
2. [Authorization](#authorization)
3. [API Endpoints](#api-endpoints)
4. [User Segments](#user-segments)
5. [Repeat Options](#repeat-options)
6. [Data Models (DTOs)](#data-models-dtos)
7. [Database Schema](#database-schema)
8. [Background Service](#background-service)
9. [Error Responses](#error-responses)
10. [Examples](#examples)

---

## Overview

| Feature | Description | Base Route |
|---------|-------------|------------|
| **Send Now** | Send push notification immediately to a user segment | `POST /api/admin/push-notifications/send` |
| **Schedule** | Schedule notification for a specific time with optional repeat | `POST /api/admin/push-notifications/schedule` |
| **List Scheduled** | List scheduled notifications with optional status filter | `GET /api/admin/push-notifications/scheduled` |
| **Cancel Scheduled** | Cancel a pending scheduled notification | `DELETE /api/admin/push-notifications/scheduled/{id}` |

**Controller:** `SouqAlHal.Api/Controllers/Admin/AdminPushNotificationController.cs`  
**Service:** `SouqAlHal.Infrastructure/Services/Notifications/AdminPushNotificationService.cs`

---

## Authorization

All endpoints require **Admin** role. The controller uses:

```csharp
[Authorize(Policy = Policies.AdminOnly)]
```

- **Policy:** `admin.only` → requires role `"admin"`
- **Header:** `Authorization: Bearer <JWT_TOKEN>` (or equivalent auth)

---

## API Endpoints

### 1. Send Now – Send Immediately

Send a push notification immediately to a user segment.

**Endpoint:** `POST /api/admin/push-notifications/send`

**Request Body (AdminPushNotificationDto):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Notification title |
| `body` | string | Yes | Notification body/message |
| `imageUrl` | string | No | Optional image URL |
| `clickAction` | string | No | Deep link or action when user taps |
| `data` | object | No | Additional key-value data for the app |
| `userSegment` | string | No | `All`, `NewUsers`, `ByRole`, `SpecificUserIds` (default: `All`) |
| `newUsersDays` | int | No | For `NewUsers`: registered in last N days |
| `roleName` | string | No | For `ByRole`: e.g. `farmer`, `trader`, `transporter` |
| `userIds` | long[] | No | For `SpecificUserIds`: list of user IDs |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "sentCount": 42
  },
  "message": "Notification sent to 42 devices"
}
```

---

### 2. Schedule – Schedule for Later

Schedule a push notification for a specific time with optional repeat.

**Endpoint:** `POST /api/admin/push-notifications/schedule`

**Request Body (ScheduleAdminPushNotificationDto):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Notification title |
| `body` | string | Yes | Notification body/message |
| `scheduledAt` | datetime | Yes | When to send (must be in the future, UTC) |
| `imageUrl` | string | No | Optional image URL |
| `clickAction` | string | No | Deep link or action when user taps |
| `data` | object | No | Additional key-value data |
| `userSegment` | string | No | Same as Send Now (default: `All`) |
| `newUsersDays` | int | No | For `NewUsers` segment |
| `roleName` | string | No | For `ByRole` segment |
| `userIds` | long[] | No | For `SpecificUserIds` segment |
| `repeatType` | string | No | `None`, `Daily`, `Weekly` (default: `None`) |
| `repeatCount` | int | No | How many times to repeat (null = indefinite for Daily/Weekly) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "scheduledPushNotificationId": 1,
    "title": "تذكير يومي",
    "body": "لا تنسَ تصفح المزادات الجديدة",
    "scheduledAt": "2025-02-02T10:00:00Z",
    "userSegment": "All",
    "repeatType": "Daily",
    "repeatCount": 5,
    "executedCount": 0,
    "status": "Pending",
    "createdAt": "2025-02-01T12:00:00Z",
    "lastSentAt": null
  },
  "message": "Notification scheduled successfully"
}
```

---

### 3. List Scheduled – Get Scheduled Notifications

List scheduled notifications with optional status filter and pagination.

**Endpoint:** `GET /api/admin/push-notifications/scheduled`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | (all) | Filter: `Pending`, `Completed`, `Cancelled` |
| `page` | int | 1 | Page number |
| `pageSize` | int | 20 | Items per page |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "scheduledPushNotificationId": 1,
      "title": "تذكير يومي",
      "body": "لا تنسَ تصفح المزادات الجديدة",
      "scheduledAt": "2025-02-02T10:00:00Z",
      "userSegment": "All",
      "repeatType": "Daily",
      "repeatCount": 5,
      "executedCount": 2,
      "status": "Pending",
      "createdAt": "2025-02-01T12:00:00Z",
      "lastSentAt": "2025-02-02T10:00:00Z"
    }
  ],
  "message": "Scheduled notifications retrieved"
}
```

---

### 4. Cancel Scheduled – Cancel a Pending Notification

Cancel a scheduled notification. Only `Pending` notifications can be cancelled.

**Endpoint:** `DELETE /api/admin/push-notifications/scheduled/{id}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | long | ScheduledPushNotificationId |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cancelled": true
  },
  "message": "Scheduled notification cancelled"
}
```

**Response (404 Not Found):** When notification not found or already processed.

---

## User Segments

| Segment | Required Params | Description |
|---------|-----------------|-------------|
| **All** | — | All active users with device tokens (not blocked/blacklisted) |
| **NewUsers** | `newUsersDays` | Users registered in the last N days |
| **ByRole** | `roleName` | Users with the given role (e.g. `farmer`, `trader`, `transporter`, `agri_service`, `gov_employee`) |
| **SpecificUserIds** | `userIds` | Only the specified user IDs |

**Note:** Only users with active device tokens receive push notifications. Users without tokens get the notification saved in the database but no push is sent.

---

## Repeat Options

| RepeatType | Description | RepeatCount |
|------------|-------------|--------------|
| **None** | One-time only | Ignored |
| **Daily** | Every day at the same time | Optional: limit number of sends |
| **Weekly** | Every 7 days at the same time | Optional: limit number of sends |

- If `repeatCount` is **null** for Daily/Weekly → repeats indefinitely until cancelled.
- If `repeatCount` is set (e.g. 5) → stops after 5 sends.

---

## Data Models (DTOs)

**File:** `SouqAlHal.Application/DTOs/NotificationDtos.cs`

### AdminPushNotificationDto (Send Now)

```csharp
public record AdminPushNotificationDto(
    string Title,
    string Body,
    string? ImageUrl = null,
    string? ClickAction = null,
    Dictionary<string, string>? Data = null,
    string UserSegment = "All",
    int? NewUsersDays = null,
    string? RoleName = null,
    List<long>? UserIds = null
);
```

### ScheduleAdminPushNotificationDto (Schedule)

```csharp
public record ScheduleAdminPushNotificationDto(
    string Title,
    string Body,
    DateTime ScheduledAt,
    string? ImageUrl = null,
    string? ClickAction = null,
    Dictionary<string, string>? Data = null,
    string UserSegment = "All",
    int? NewUsersDays = null,
    string? RoleName = null,
    List<long>? UserIds = null,
    string RepeatType = "None",
    int? RepeatCount = null
);
```

### ScheduledPushNotificationResponseDto

```csharp
public record ScheduledPushNotificationResponseDto(
    long ScheduledPushNotificationId,
    string Title,
    string Body,
    DateTime ScheduledAt,
    string UserSegment,
    string RepeatType,
    int? RepeatCount,
    int ExecutedCount,
    string Status,
    DateTime CreatedAt,
    DateTime? LastSentAt
);
```

---

## Database Schema

**Table:** `ScheduledPushNotifications`

```sql
CREATE TABLE ScheduledPushNotifications (
    ScheduledPushNotificationId BIGINT NOT NULL AUTO_INCREMENT,
    Title VARCHAR(200) NOT NULL,
    Body VARCHAR(2000) NOT NULL,
    ImageUrl VARCHAR(500) NULL,
    ClickAction VARCHAR(200) NULL,
    DataJson JSON NULL,
    ScheduledAt DATETIME(6) NOT NULL,
    UserSegment VARCHAR(50) NOT NULL DEFAULT 'All',
    NewUsersDays INT NULL,
    RoleName VARCHAR(50) NULL,
    UserIdsJson VARCHAR(2000) NULL,
    RepeatType VARCHAR(20) NOT NULL DEFAULT 'None',
    RepeatCount INT NULL,
    ExecutedCount INT NOT NULL DEFAULT 0,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    CreatedByUserId BIGINT NULL,
    CreatedAt DATETIME(6) NOT NULL,
    LastSentAt DATETIME(6) NULL,
    PRIMARY KEY (ScheduledPushNotificationId),
    INDEX IX_ScheduledPushNotifications_ScheduledAt (ScheduledAt),
    INDEX IX_ScheduledPushNotifications_Status (Status)
);
```

**Status values:** `Pending`, `Completed`, `Cancelled`

---

## Background Service

**Service:** `SouqAlHal.Api/Services/ScheduledPushNotificationProcessor.cs`

- Runs every **1 minute**
- Finds scheduled notifications where `ScheduledAt <= Now` and `Status = Pending`
- Sends push notifications to the target user segment
- Updates `ExecutedCount` and `LastSentAt`
- For repeat types: advances `ScheduledAt` (Daily +1 day, Weekly +7 days) or sets `Status = Completed` when done

---

## Error Responses

| Status | Code | Title | When |
|--------|------|-------|------|
| 400 | `validation_error` | Validation Error | Missing title/body, invalid ScheduledAt, invalid RepeatType |
| 404 | `not_found` | Not Found | Cancel: notification not found or already processed |

**Example (400):**

```json
{
  "success": false,
  "data": null,
  "message": "Title and Body are required",
  "code": "validation_error",
  "title": "Validation Error",
  "detail": "Title and Body are required",
  "status": 400
}
```

---

## Examples

### Example 1: Send to All Users Immediately

```http
POST /api/admin/push-notifications/send
Content-Type: application/json
Authorization: Bearer <admin_jwt>

{
  "title": "إعلان هام",
  "body": "تحديث جديد على التطبيق متاح الآن",
  "userSegment": "All"
}
```

### Example 2: Send to New Users (Last 7 Days)

```http
POST /api/admin/push-notifications/send
Content-Type: application/json
Authorization: Bearer <admin_jwt>

{
  "title": "مرحباً بالمستخدمين الجدد",
  "body": "نرحب بكم في سوق الحل! اكتشف المزادات والعروض",
  "userSegment": "NewUsers",
  "newUsersDays": 7
}
```

### Example 3: Send to Farmers Only

```http
POST /api/admin/push-notifications/send
Content-Type: application/json
Authorization: Bearer <admin_jwt>

{
  "title": "عروض للمزارعين",
  "body": "عروض خاصة على البذور والمعدات الزراعية",
  "userSegment": "ByRole",
  "roleName": "farmer"
}
```

### Example 4: Schedule One-Time Notification

```http
POST /api/admin/push-notifications/schedule
Content-Type: application/json
Authorization: Bearer <admin_jwt>

{
  "title": "تذكير بالمزاد",
  "body": "مزاد القمح يبدأ غداً الساعة 10 صباحاً",
  "scheduledAt": "2025-02-02T10:00:00Z",
  "userSegment": "All",
  "repeatType": "None"
}
```

### Example 5: Schedule Daily Repeat (5 Times)

```http
POST /api/admin/push-notifications/schedule
Content-Type: application/json
Authorization: Bearer <admin_jwt>

{
  "title": "تذكير يومي",
  "body": "لا تنسَ تصفح المزادات الجديدة",
  "scheduledAt": "2025-02-02T09:00:00Z",
  "userSegment": "All",
  "repeatType": "Daily",
  "repeatCount": 5
}
```

### Example 6: List Pending Scheduled Notifications

```http
GET /api/admin/push-notifications/scheduled?status=Pending&page=1&pageSize=10
Authorization: Bearer <admin_jwt>
```

### Example 7: Cancel Scheduled Notification

```http
DELETE /api/admin/push-notifications/scheduled/1
Authorization: Bearer <admin_jwt>
```

---

## Service Interface

**File:** `SouqAlHal.Application/Services/Notifications/IAdminPushNotificationService.cs`

| Method | Description |
|--------|-------------|
| `SendNowAsync(dto, adminUserId, ct)` | Send immediately to segment |
| `ScheduleAsync(dto, adminUserId, ct)` | Create scheduled notification |
| `ListScheduledAsync(status, page, pageSize, ct)` | List with optional status filter |
| `CancelScheduledAsync(id, ct)` | Cancel pending notification |
| `ProcessDueScheduledAsync(ct)` | Process due notifications (background service) |

---

*Last updated: February 2025*
