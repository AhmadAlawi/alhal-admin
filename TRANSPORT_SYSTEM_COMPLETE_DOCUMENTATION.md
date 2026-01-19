# 🚚 Complete Transport System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Domain Entities](#domain-entities)
4. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Service Layer](#service-layer)
7. [Business Logic Flow](#business-logic-flow)
8. [Complete Request/Response Examples](#complete-requestresponse-examples)
9. [Integration Examples](#integration-examples)
10. [Error Handling](#error-handling)
11. [System Architecture](#system-architecture)

---

## System Overview

The Transport System in SouqAlHal is a comprehensive solution for managing agricultural product transportation. It connects buyers (farmers/traders), transport providers, and vehicles through a multi-layered system supporting:

- **Transport Provider Management**: Registration, verification, and profile management
- **Vehicle Management**: Multiple vehicles per provider with detailed specifications
- **Price Line Management**: Fixed prices for specific routes (area-to-area)
- **Transport Request System**: Buyers create transport requests from auctions, tenders, or direct sales
- **Negotiation System**: Transport providers submit competitive offers
- **Chat Integration**: Automatic chat creation after offer acceptance
- **Notification System**: Real-time notifications to transport providers
- **Price Validation**: Government price limit enforcement

---

## Database Schema

### Table: `TransportProviders`
Primary entity for transport service providers.

| Column | Type | Description |
|--------|------|-------------|
| `TransportProviderId` | bigint (PK) | Primary key, auto-increment |
| `UserId` | bigint (FK) | References `Users.UserId` |
| `AccountType` | varchar | "individual" or "company" |
| `WalletAccount` | varchar | Wallet or bank account identifier |
| `BusinessLicensePath` | varchar (nullable) | Business license file path (for companies) |
| `DrivingLicensePath` | varchar (nullable) | Driving license file path (for individuals) |
| `BankAccountNumber` | varchar (nullable) | Bank account number |
| `IBAN` | varchar (nullable) | International Bank Account Number |
| `CardNumber` | varchar (nullable) | Card number |
| `CoveredAreas` | text (nullable) | Comma-separated list of covered areas |
| `WorkersAvailable` | int | Number of available workers |
| `AvailabilityHours` | varchar | Service hours (e.g., "08:00-18:00") |
| `PreferredPaymentMethod` | varchar (nullable) | Payment preference (نقدي/إلكتروني) |
| `VehicleImages` | json (nullable) | Array of vehicle image URLs |
| `EstimatedPricePerKm` | decimal(18,2) (nullable) | Estimated price per kilometer |
| `IsVerified` | bool | Verification status |
| `VerificationDate` | datetime (nullable) | Date of verification |

**Relationships:**
- One-to-many with `TransportVehicles`
- One-to-many with `TransportProviderPriceLines`
- Many-to-one with `Users`

### Table: `TransportVehicles`
Vehicle information for transport providers.

| Column | Type | Description |
|--------|------|-------------|
| `TransportVehicleId` | bigint (PK) | Primary key |
| `ProviderId` | bigint (FK) | References `TransportProviders.TransportProviderId` |
| `VehicleType` | varchar | Type (شاحنة مبردة, شاحنة جافة, etc.) |
| `Capacity` | varchar | Capacity range (e.g., "5 إلى 10 طن") |
| `Model` | varchar | Vehicle model |
| `VehicleLicensePath` | varchar (nullable) | Vehicle license file path |
| `VehicleOwnershipProofPath` | varchar (nullable) | Ownership proof file path |
| `DriverLicensesPaths` | json (nullable) | Array of driver license file paths |
| `StorageType` | varchar | Storage type (رفوف, براميل, etc.) |
| `HasTools` | bool | Has crane, scale, etc. |
| `WorkersAvailable` | int | Number of workers for this vehicle |
| `PricePerKm` | decimal(18,2) (nullable) | Price per kilometer |
| `AvailabilityHours` | varchar (nullable) | Vehicle availability hours |
| `CanProvideLoadingWorkers` | bool | Can provide loading/unloading workers |

**Relationships:**
- Many-to-one with `TransportProviders`

### Table: `TransportProviderPriceLines`
Fixed prices for specific routes.

| Column | Type | Description |
|--------|------|-------------|
| `PriceLineId` | bigint (PK) | Primary key |
| `TransportProviderId` | bigint (FK) | References `TransportProviders.TransportProviderId` |
| `FromArea` | bigint | Origin governorate ID |
| `ToArea` | varchar(200) | Destination area/region |
| `Price` | decimal(18,2) | Transport price for this route |
| `GovernmentMaxPrice` | decimal(18,2) (nullable) | Maximum allowed government price |
| `IsActive` | bool | Active status |
| `CreatedAt` | datetime(6) | Creation timestamp |
| `UpdatedAt` | datetime(6) (nullable) | Last update timestamp |

**Relationships:**
- Many-to-one with `TransportProviders`
- Validated against `TransportPrices` table (government prices)

### Table: `TransportRequests`
Transport requests created by buyers.

| Column | Type | Description |
|--------|------|-------------|
| `TransportRequestId` | bigint (PK) | Primary key |
| `ContextId` | bigint | ID of related entity (auction/tender/direct listing) |
| `ContextType` | varchar | Type: "auction", "tender", or "direct" |
| `BuyerUserId` | bigint (nullable) | User ID of the buyer |
| `FromRegion` | bigint (nullable) | Origin governorate ID (from farm) |
| `ToRegion` | varchar | Destination region |
| `DistanceKm` | decimal (nullable) | Distance in kilometers |
| `WeightKg` | decimal (nullable) | Weight in kilograms |
| `CreatedAt` | datetime | Creation timestamp |
| `Status` | varchar | Status: "open", "pending", "negotiating", "completed", "cancelled" |

**Relationships:**
- One-to-many with `TransportOffers`

### Table: `TransportOffers`
Offers submitted by transport providers for requests.

| Column | Type | Description |
|--------|------|-------------|
| `OfferId` | bigint (PK) | Primary key |
| `TransportRequestId` | bigint (FK) | References `TransportRequests.TransportRequestId` |
| `TransporterId` | bigint (FK) | References `TransportProviders.TransportProviderId` |
| `OfferedPrice` | decimal(18,2) | Offered transport price |
| `EstimatedPickupDate` | datetime | Estimated pickup date/time |
| `EstimatedDeliveryDate` | datetime | Estimated delivery date/time |
| `Notes` | text (nullable) | Additional notes |
| `Status` | varchar | Status: "pending", "accepted", "rejected" |
| `CreatedAt` | datetime | Creation timestamp |

**Relationships:**
- Many-to-one with `TransportRequests`
- Many-to-one with `TransportProviders`

### Table: `TransportPrices`
Government/official transport prices (reference table).

| Column | Type | Description |
|--------|------|-------------|
| `PriceId` | bigint (PK) | Primary key |
| `FromRegion` | varchar | Origin region |
| `ToRegion` | varchar | Destination region |
| `DistanceKm` | decimal(18,2) | Distance in kilometers |
| `PricePerKm` | decimal(18,2) | Government price per kilometer |
| `TotalPrice` | decimal(18,2) | Total government price |
| `PricingType` | varchar | "government", "fixed", "negotiation" |
| `EffectiveFrom` | datetime | Effective from date |
| `EffectiveTo` | datetime (nullable) | Effective to date (null = indefinite) |

---

## Domain Entities

### TransportProvider Entity
**Location:** `SouqAlHal.Domain/Entities/Transport/TransportProvider.cs`

```csharp
public class TransportProvider
{
    public long TransportProviderId { get; set; }
    public long UserId { get; set; }
    public User User { get; set; } = default!;
    
    public string AccountType { get; set; } = "individual"; // "individual" or "company"
    public string WalletAccount { get; set; } = default!;
    
    // Verification documents
    public string? BusinessLicensePath { get; set; }
    public string? DrivingLicensePath { get; set; }
    
    // Financial information
    public string? BankAccountNumber { get; set; }
    public string? IBAN { get; set; }
    public string? CardNumber { get; set; }
    
    // Operational details
    public string? CoveredAreas { get; set; }
    public int WorkersAvailable { get; set; } = 0;
    public string AvailabilityHours { get; set; } = "08:00-18:00";
    public string? PreferredPaymentMethod { get; set; }
    
    // Vehicle images
    public List<string>? VehicleImages { get; set; }
    
    // Pricing
    public decimal? EstimatedPricePerKm { get; set; }
    
    // Verification
    public bool IsVerified { get; set; } = false;
    public DateTime? VerificationDate { get; set; }
    
    // Navigation properties
    public List<TransportVehicle> Vehicles { get; set; } = new();
    public List<TransportProviderPriceLine> PriceLines { get; set; } = new();
}
```

### TransportRequest Entity
**Location:** `SouqAlHal.Domain/Entities/Transport/TransportRequest.cs`

```csharp
public class TransportRequest
{
    public long TransportRequestId { get; set; }
    
    public long ContextId { get; set; }  // AuctionId, TenderId, or ListingId
    public string ContextType { get; set; }  // "auction", "tender", or "direct"
    public long? BuyerUserId { get; set; }
    
    public long? FromRegion { get; set; }  // GovernorateId from farm
    public string ToRegion { get; set; } = default!;
    public decimal? DistanceKm { get; set; }
    public decimal? WeightKg { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public string Status { get; set; } = "open"; // open, pending, negotiating, completed, cancelled
    
    public List<TransportOffer> Offers { get; set; } = new();
}
```

### TransportOffer Entity
**Location:** `SouqAlHal.Domain/Entities/Transport/TransportOffer.cs`

```csharp
public class TransportOffer
{
    public long OfferId { get; set; }
    public long TransportRequestId { get; set; }
    public TransportRequest Request { get; set; } = default!;
    
    public long TransporterId { get; set; }  // TransportProviderId
    
    public decimal OfferedPrice { get; set; }
    public DateTime EstimatedPickupDate { get; set; }
    public DateTime EstimatedDeliveryDate { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "pending"; // pending, accepted, rejected
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
```

### TransportProviderPriceLine Entity
**Location:** `SouqAlHal.Domain/Entities/Transport/TransportProviderPriceLine.cs`

```csharp
public class TransportProviderPriceLine
{
    [Key]
    public long PriceLineId { get; set; }
    
    [Required]
    [ForeignKey(nameof(Provider))]
    public long TransportProviderId { get; set; }
    public TransportProvider Provider { get; set; } = default!;
    
    [Required]
    [MaxLength(200)]
    public long FromArea { get; set; } = default!;  // GovernorateId
    
    [Required]
    [MaxLength(200)]
    public string ToArea { get; set; } = default!;
    
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? GovernmentMaxPrice { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

---

## Data Transfer Objects (DTOs)

### CreateProviderDto
**Location:** `SouqAlHal.Application/DTOs/Transport/CreateProviderDto.cs`

```csharp
public class CreateProviderDto
{
    public long UserId { get; set; }
    public string AccountType { get; set; } = "individual"; // "individual" or "company"
    public string WalletAccount { get; set; } = default!;
    
    // Verification documents
    public string? BusinessLicensePath { get; set; }  // For companies
    public string? DrivingLicensePath { get; set; }   // For individuals
    public string? BankAccountNumber { get; set; }
    public string? IBAN { get; set; }
    public string? CardNumber { get; set; }
    
    // Additional information
    public string? CoveredAreas { get; set; }  // Comma-separated areas
    public int WorkersAvailable { get; set; } = 0;
    public string AvailabilityHours { get; set; } = "08:00-18:00";
    public string? PreferredPaymentMethod { get; set; }
    
    // Vehicle images
    public List<string>? VehicleImages { get; set; }
    
    // Pricing information
    public decimal? EstimatedPricePerKm { get; set; }
}
```

### CreateVehicleDto
**Location:** `SouqAlHal.Application/DTOs/Transport/CreateVehicleDto.cs`

```csharp
public class CreateVehicleDto
{
    public long ProviderId { get; set; }
    public string VehicleType { get; set; } = default!;  // شاحنة مبردة، شاحنة جافة، etc.
    public string Capacity { get; set; } = default!;  // "5 إلى 10 طن"
    public string Model { get; set; } = default!;
    
    // Vehicle documents
    public string? VehicleLicensePath { get; set; }
    public string? VehicleOwnershipProofPath { get; set; }
    public List<string>? DriverLicensesPaths { get; set; }
    
    // Vehicle specifications
    public string StorageType { get; set; } = default!;  // رفوف، براميل، صناديق، etc.
    public bool HasTools { get; set; } = false;  // crane, scale, etc.
    public int WorkersAvailable { get; set; } = 0;
    
    // Pricing
    public decimal? PricePerKm { get; set; }
    
    // Additional information
    public string? AvailabilityHours { get; set; } = "08:00-18:00";
    public bool CanProvideLoadingWorkers { get; set; } = false;
}
```

### CreatePriceLineDto
**Location:** `SouqAlHal.Application/DTOs/Transport/CreatePriceLineDto.cs`

```csharp
public class CreatePriceLineDto
{
    [Required]
    public long TransportProviderId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public long FromArea { get; set; } = default!;  // GovernorateId
    
    [Required]
    [MaxLength(200)]
    public string ToArea { get; set; } = default!;
    
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }
}
```

### UpdatePriceLineDto
**Location:** `SouqAlHal.Application/DTOs/Transport/UpdatePriceLineDto.cs`

```csharp
public class UpdatePriceLineDto
{
    [Required]
    [MaxLength(200)]
    public string FromArea { get; set; } = default!;
    
    [Required]
    [MaxLength(200)]
    public string ToArea { get; set; } = default!;
    
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }
    
    public bool IsActive { get; set; } = true;
}
```

### TransportNegotiationRequestDto
**Location:** `SouqAlHal.Application/DTOs/ChatDtos.cs`

```csharp
public record TransportNegotiationRequestDto
{
    [JsonRequired]
    public long ContextId { get; set; }  // AuctionId, TenderId, or ListingId
    
    [JsonRequired]
    public string ContextType { get; set; }  // "auction", "tender", or "direct"
    
    [JsonRequired]
    public long BuyerUserId { get; set; }
    
    // Auto-populated from farm location
    [JsonIgnore]
    public string FromRegion { get; set; } = default!;
    
    public string ToRegion { get; set; } = default!;
    
    // Auto-calculated
    [JsonIgnore]
    public decimal DistanceKm { get; set; }
    
    // Auto-calculated from product weight
    [JsonIgnore]
    public decimal WeightKg { get; set; }
    
    public DateTime PreferredPickupDate { get; set; }
    public DateTime PreferredDeliveryDate { get; set; }
    public string? SpecialRequirements { get; set; }
}
```

### TransportOfferDto
**Location:** `SouqAlHal.Application/DTOs/ChatDtos.cs`

```csharp
public record TransportOfferDto
{
    public long OfferId { get; set; }
    public long TransportRequestId { get; set; }
    public long TransporterId { get; set; }
    public decimal OfferedPrice { get; set; }
    public DateTime EstimatedPickupDate { get; set; }
    public DateTime EstimatedDeliveryDate { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "pending"; // pending, accepted, rejected
}
```

### TransportRequestViewDto
**Location:** `SouqAlHal.Application/DTOs/ChatDtos.cs`

```csharp
public record TransportRequestViewDto
{
    public long TransportRequestId { get; set; }
    public long OrderId { get; set; }  // ContextId
    public long BuyerUserId { get; set; }
    public string FromRegion { get; set; } = default!;
    public string ToRegion { get; set; } = default!;
    public decimal DistanceKm { get; set; }
    public string ProductType { get; set; } = default!;  // Product name
    public decimal WeightKg { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "open";
    public List<TransportOfferDto> Offers { get; set; } = new();
}
```

### TransportPriceRequestDto
**Location:** `SouqAlHal.Application/DTOs/Transport/TransportPriceRequestDto.cs`

```csharp
public class TransportPriceRequestDto
{
    public string FromRegion { get; set; } = default!;
    public string ToRegion { get; set; } = default!;
    public decimal DistanceKm { get; set; }
    public string PricingType { get; set; } = "government"; // government / fixed / negotiation
}
```

### TransportPriceResponseDto
**Location:** `SouqAlHal.Application/DTOs/Transport/TransportPriceResponseDto.cs`

```csharp
public class TransportPriceResponseDto
{
    public decimal DistanceKm { get; set; }
    public decimal PricePerKm { get; set; }
    public decimal TotalPrice { get; set; }
    public string PricingType { get; set; } = default!;
}
```

### TransportProviderWithPriceLinesDto
**Location:** `SouqAlHal.Application/DTOs/Transport/TransportProviderWithPriceLinesDto.cs`

```csharp
public class TransportProviderWithPriceLinesDto
{
    public long TransportProviderId { get; set; }
    public long UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? UserPhone { get; set; }
    public string AccountType { get; set; } = default!;
    public string? CoveredAreas { get; set; }
    public bool IsVerified { get; set; }
    public List<PriceLineDto> PriceLines { get; set; } = new();
}

public class PriceLineDto
{
    public long PriceLineId { get; set; }
    public long FromArea { get; set; } = default!;
    public string ToArea { get; set; } = default!;
    public decimal Price { get; set; }
    public decimal? GovernmentMaxPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

## API Endpoints Reference

### Base URL
All transport endpoints are under: `/api/transport` or `/api/transport-prices`

---

### 1. Transport Provider Management

#### Create Transport Provider
**Endpoint:** `POST /api/transport`  
**Description:** Register a new transport provider

**Request Body:**
```json
{
  "userId": 123,
  "accountType": "individual",
  "walletAccount": "wallet123456",
  "drivingLicensePath": "path/to/driving-license.pdf",
  "bankAccountNumber": "1234567890",
  "IBAN": "SY123456789012345678901234",
  "coveredAreas": "دمشق, ريف دمشق, حمص",
  "workersAvailable": 5,
  "availabilityHours": "08:00-18:00",
  "preferredPaymentMethod": "نقدي",
  "vehicleImages": ["path/to/vehicle1.jpg"],
  "estimatedPricePerKm": 2.5
}
```

**Response:** `200 OK`
```json
{
  "transportProviderId": 1,
  "userId": 123,
  "accountType": "individual",
  "isVerified": false,
  "createdAt": "2025-11-15T10:00:00Z"
}
```

---

#### List All Transport Providers
**Endpoint:** `GET /api/transport`  
**Description:** Get all registered transport providers

**Response:** `200 OK`
```json
[
  {
    "transportProviderId": 1,
    "userId": 123,
    "accountType": "individual",
    "coveredAreas": "دمشق, ريف دمشق",
    "isVerified": true,
    "vehicles": [...]
  }
]
```

---

#### Get Transport Provider by ID
**Endpoint:** `GET /api/transport/{id}`  
**Description:** Get detailed information about a specific transport provider

**Response:** `200 OK`
```json
{
  "transportProviderId": 1,
  "userId": 123,
  "accountType": "individual",
  "walletAccount": "wallet123456",
  "coveredAreas": "دمشق, ريف دمشق",
  "workersAvailable": 5,
  "availabilityHours": "08:00-18:00",
  "isVerified": true,
  "vehicles": [...],
  "priceLines": [...]
}
```

**Error Response:** `404 Not Found`
```json
{
  "message": "مزود النقل غير موجود"
}
```

---

#### Search Transport Providers by Area
**Endpoint:** `GET /api/transport/area/{area}`  
**Description:** Find transport providers covering a specific area

**Example:** `GET /api/transport/area/دمشق`

**Response:** `200 OK`
```json
[
  {
    "transportProviderId": 1,
    "userId": 123,
    "coveredAreas": "دمشق, ريف دمشق",
    "isVerified": true
  }
]
```

---

#### Verify Transport Provider (Admin Only)
**Endpoint:** `PUT /api/transport/{id}/verify`  
**Description:** Verify or unverify a transport provider

**Request Body:**
```json
true
```

**Response:** `200 OK`
```json
{
  "transportProviderId": 1,
  "isVerified": true,
  "verificationDate": "2025-11-15T10:00:00Z"
}
```

---

### 2. Vehicle Management

#### Add Vehicle to Provider
**Endpoint:** `POST /api/transport/{providerId}/vehicles`  
**Description:** Add a vehicle to a transport provider

**Request Body:**
```json
{
  "vehicleType": "شاحنة مبردة",
  "capacity": "5 إلى 10 طن",
  "model": "2020 Mercedes Actros",
  "vehicleLicensePath": "path/to/vehicle-license.pdf",
  "vehicleOwnershipProofPath": "path/to/ownership-proof.pdf",
  "driverLicensesPaths": ["path/to/driver1-license.pdf"],
  "storageType": "تبريد بالغاز",
  "hasTools": true,
  "workersAvailable": 2,
  "pricePerKm": 2.0,
  "availabilityHours": "08:00-20:00",
  "canProvideLoadingWorkers": true
}
```

**Response:** `200 OK`
```json
{
  "transportVehicleId": 1,
  "providerId": 1,
  "vehicleType": "شاحنة مبردة",
  "capacity": "5 إلى 10 طن",
  "isVerified": false
}
```

---

#### Get Provider Vehicles
**Endpoint:** `GET /api/transport/{providerId}/vehicles`  
**Description:** Get all vehicles for a transport provider

**Response:** `200 OK`
```json
[
  {
    "transportVehicleId": 1,
    "vehicleType": "شاحنة مبردة",
    "capacity": "5 إلى 10 طن",
    "model": "2020 Mercedes Actros",
    "pricePerKm": 2.0,
    "canProvideLoadingWorkers": true
  }
]
```

---

#### Delete Vehicle
**Endpoint:** `DELETE /api/transport/{providerId}/vehicle/{vehicleId}`  
**Description:** Remove a vehicle from a transport provider

**Response:** `200 OK`

---

### 3. Price Lines Management

#### Create Price Line
**Endpoint:** `POST /api/transport/price-lines`  
**Description:** Add a fixed price for a specific route

**Request Body:**
```json
{
  "transportProviderId": 1,
  "fromArea": 1,
  "toArea": "حلب",
  "price": 200.00
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "priceLineId": 1,
    "transportProviderId": 1,
    "fromArea": 1,
    "toArea": "حلب",
    "price": 200.00,
    "governmentMaxPrice": 250.00,
    "isActive": true,
    "createdAt": "2025-11-15T10:30:00Z"
  },
  "message": "Price line created successfully"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "status": "fail",
  "code": "400",
  "message": "Price 300.00 exceeds government maximum price 250.00 for route 1 to حلب"
}
```

---

#### Update Price Line
**Endpoint:** `PUT /api/transport/price-lines/{priceLineId}`  
**Description:** Update an existing price line

**Request Body:**
```json
{
  "fromArea": "دمشق",
  "toArea": "حلب",
  "price": 190.00,
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "priceLineId": 1,
    "fromArea": 1,
    "toArea": "حلب",
    "price": 190.00,
    "governmentMaxPrice": 250.00,
    "isActive": true,
    "updatedAt": "2025-11-15T11:00:00Z"
  },
  "message": "Price line updated successfully"
}
```

---

#### Delete Price Line
**Endpoint:** `DELETE /api/transport/price-lines/{priceLineId}`  
**Description:** Delete a price line

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": null,
  "message": "Price line deleted successfully"
}
```

---

#### List All Transporters with Price Lines
**Endpoint:** `GET /api/transport/with-price-lines`  
**Description:** Get all transport providers with their active price lines

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "transportProviderId": 1,
      "userId": 123,
      "userName": "أحمد الناقل",
      "accountType": "individual",
      "coveredAreas": "دمشق, ريف دمشق",
      "isVerified": true,
      "priceLines": [
        {
          "priceLineId": 1,
          "fromArea": 1,
          "toArea": "حلب",
          "price": 200.00,
          "governmentMaxPrice": 250.00,
          "isActive": true,
          "createdAt": "2025-11-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

---

#### Get Transport Provider with Price Lines
**Endpoint:** `GET /api/transport/{providerId}/price-lines`  
**Description:** Get a specific transport provider with all price lines

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "transportProviderId": 1,
    "userId": 123,
    "userName": "أحمد الناقل",
    "priceLines": [...]
  }
}
```

---

#### Get Price Lines by Provider
**Endpoint:** `GET /api/transport/{providerId}/price-lines/list`  
**Description:** Get only the price lines for a specific provider

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "priceLineId": 1,
      "fromArea": 1,
      "toArea": "حلب",
      "price": 200.00,
      "governmentMaxPrice": 250.00,
      "isActive": true
    }
  ]
}
```

---

### 4. Transport Request & Negotiation System

#### Create Transport Request
**Endpoint:** `POST /api/transport/requests`  
**Description:** Create a transport request from an auction, tender, or direct sale

**Request Body:**
```json
{
  "contextId": 456,
  "contextType": "tender",
  "buyerUserId": 789,
  "toRegion": "حلب",
  "preferredPickupDate": "2025-11-20T08:00:00Z",
  "preferredDeliveryDate": "2025-11-20T14:00:00Z",
  "specialRequirements": "يحتاج تبريد"
}
```

**Note:** `fromRegion`, `distanceKm`, and `weightKg` are automatically calculated from the farm location and product information.

**Response:** `200 OK`
```json
{
  "message": "تم إنشاء طلب النقل وإرساله إلى الناقلين المتاحين",
  "requestId": 1,
  "estimatedOffers": 5
}
```

**Business Logic:**
- System automatically determines `FromRegion` from the farm location
- Extracts `ProductId` based on `contextType`:
  - For "auction": Gets `ProductId` from `Auctions` table
  - For "tender": Gets `ProductId` from `Tenders` table
  - For "direct": Gets `ProductId` from `DirectListings` table
- Finds the `Farm` from `Crop.FarmId` to get `GovernorateId`
- Sends notifications to all transport providers covering the `FromRegion`

---

#### List Transport Requests
**Endpoint:** `GET /api/transport/requests?page=1&pageSize=20`  
**Description:** Get paginated list of all transport requests

**Response:** `200 OK`
```json
{
  "items": [
    {
      "transportRequestId": 1,
      "orderId": 456,
      "buyerUserId": 789,
      "fromRegion": "1",
      "toRegion": "حلب",
      "distanceKm": 350.5,
      "productType": "خضار",
      "weightKg": 5000,
      "createdAt": "2025-11-15T10:00:00Z",
      "status": "open",
      "offers": []
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

---

#### Get Transport Request Details
**Endpoint:** `GET /api/transport/requests/{requestId}`  
**Description:** Get detailed information about a specific transport request

**Response:** `200 OK`
```json
{
  "transportRequestId": 1,
  "orderId": 456,
  "buyerUserId": 789,
  "fromRegion": "1",
  "toRegion": "حلب",
  "distanceKm": 350.5,
  "productType": "خضار",
  "weightKg": 5000,
  "createdAt": "2025-11-15T10:00:00Z",
  "status": "pending",
  "offers": [
    {
      "offerId": 1,
      "transportRequestId": 1,
      "transporterId": 1,
      "offeredPrice": 180.00,
      "estimatedPickupDate": "2025-11-20T08:00:00Z",
      "estimatedDeliveryDate": "2025-11-20T14:00:00Z",
      "notes": "يمكن توفير عمال تحميل وتنزيل",
      "status": "pending"
    }
  ]
}
```

**Error Response:** `404 Not Found`
```json
{
  "message": "طلب النقل غير موجود"
}
```

---

#### Get Offers for a Request
**Endpoint:** `GET /api/transport/requests/{requestId}/offers`  
**Description:** Get all offers submitted for a transport request

**Response:** `200 OK`
```json
[
  {
    "offerId": 1,
    "transportRequestId": 1,
    "transporterId": 1,
    "offeredPrice": 180.00,
    "estimatedPickupDate": "2025-11-20T08:00:00Z",
    "estimatedDeliveryDate": "2025-11-20T14:00:00Z",
    "notes": "يمكن توفير عمال تحميل وتنزيل",
    "status": "pending"
  },
  {
    "offerId": 2,
    "transportRequestId": 1,
    "transporterId": 2,
    "offeredPrice": 195.00,
    "estimatedPickupDate": "2025-11-20T09:00:00Z",
    "estimatedDeliveryDate": "2025-11-20T15:00:00Z",
    "status": "pending"
  }
]
```

---

#### Submit Transport Offer
**Endpoint:** `POST /api/transport/offers`  
**Description:** Submit an offer for a transport request

**Request Body:**
```json
{
  "transportRequestId": 1,
  "transporterId": 1,
  "offeredPrice": 180.00,
  "estimatedPickupDate": "2025-11-20T08:00:00Z",
  "estimatedDeliveryDate": "2025-11-20T14:00:00Z",
  "notes": "يمكن توفير عمال تحميل وتنزيل"
}
```

**Response:** `200 OK`
```json
{
  "message": "تم تقديم عرض النقل",
  "offerId": 1,
  "status": "pending"
}
```

---

#### Accept Transport Offer
**Endpoint:** `POST /api/transport/offers/{offerId}/accept`  
**Description:** Accept a transport offer and create a chat conversation

**Response:** `200 OK`
```json
{
  "message": "تم قبول عرض النقل",
  "offerId": 1,
  "nextStep": "فتح قناة اتصال مع الناقل"
}
```

**Business Logic:**
- Updates the accepted offer status to "accepted"
- Rejects all other offers for the same request
- Changes the request status to "pending"
- Gets the `transporterUserId` from `TransportProviders` table
- Creates a chat conversation between buyer and transporter:
  - `contextType`: "transport_offer"
  - `contextId`: `offerId`
  - Opens conversation for buyer and transporter to communicate

---

#### Notify Transporters
**Endpoint:** `POST /api/transport/requests/{requestId}/notify`  
**Description:** Manually trigger notifications to available transporters

**Response:** `200 OK`
```json
{
  "message": "تم إرسال الإشعارات إلى الناقلين المتاحين",
  "requestId": 1,
  "notifiedTransporters": 5
}
```

---

#### Delete Transport Request
**Endpoint:** `DELETE /api/transport/requests/{requestId}`  
**Description:** Delete a transport request

**Response:** `200 OK`

---

### 5. Transport Pricing System

#### Get Official Government Price
**Endpoint:** `POST /api/transport-prices/official`  
**Description:** Get the official government price for a route

**Request Body:**
```json
{
  "fromRegion": "دمشق",
  "toRegion": "حلب",
  "distanceKm": 350.5,
  "pricingType": "government"
}
```

**Response:** `200 OK`
```json
{
  "distanceKm": 350.5,
  "pricePerKm": 0.5,
  "totalPrice": 175.25,
  "pricingType": "government"
}
```

**Error Response:** `404 Not Found`
```json
{
  "message": "لا يوجد سعر رسمي لهذا المسار"
}
```

---

#### Get Cheapest Available Price
**Endpoint:** `POST /api/transport-prices/cheapest`  
**Description:** Get the cheapest available price from transport providers

**Request Body:**
```json
{
  "fromRegion": "دمشق",
  "toRegion": "حلب"
}
```

**Response:** `200 OK`
```json
{
  "distanceKm": 350.5,
  "pricePerKm": 0.45,
  "totalPrice": 157.73,
  "pricingType": "fixed"
}
```

**Error Response:** `404 Not Found`
```json
{
  "message": "لا يوجد أسعار متاحة لهذا المسار"
}
```

---

#### Get Negotiation Price
**Endpoint:** `POST /api/transport-prices/negotiation`  
**Description:** Trigger negotiation request and get estimated price

**Request Body:**
```json
{
  "requestId": 1,
  "fromRegion": "دمشق",
  "toRegion": "حلب",
  "distanceKm": 350.5,
  "weightKg": 5000
}
```

**Response:** `200 OK`
```json
{
  "requestId": 1,
  "estimatedPrice": 180.00,
  "message": "تم إرسال طلب التفاوض إلى الناقلين المتاحين"
}
```

---

#### Get Available Regions
**Endpoint:** `GET /api/transport-prices/regions`  
**Description:** Get list of all available transport regions

**Response:** `200 OK`
```json
[
  "دمشق",
  "ريف دمشق",
  "حمص",
  "حماة",
  "حلب",
  "اللاذقية",
  "طرطوس",
  "درعا",
  "السويداء",
  "القنيطرة",
  "دمشق - الزبلطاني",
  "ريف دمشق - رنكوس",
  "ريف دمشق - قطنا",
  "درعا - سوق الهال"
]
```

---

## Service Layer

### ITransportProviderService
**Location:** `SouqAlHal.Application/Services/Transport/ITransportProviderService.cs`

**Methods:**
- `Task<TransportProvider> CreateProviderAsync(CreateProviderDto dto, CancellationToken ct)`
- `Task<TransportVehicle> AddVehicleAsync(CreateVehicleDto dto, CancellationToken ct)`
- `Task DeleteVehicleAsync(long id, long vId, CancellationToken ct)`
- `Task<List<TransportProvider>> ListProvidersAsync(CancellationToken ct)`
- `Task<TransportProvider?> GetProviderByIdAsync(long id, CancellationToken ct)`
- `void UpdateProvider(TransportProvider provider)`
- `Task<int> SaveChangesAsync(CancellationToken ct)`

### ITransportNegotiationService
**Location:** `SouqAlHal.Application/Services/Transport/ITransportNegotiationService.cs`

**Methods:**
- `Task<long> CreateTransportRequestAsync(TransportNegotiationRequestDto dto, CancellationToken ct)`
- `Task<List<TransportOfferDto>> GetTransportOffersAsync(long requestId, CancellationToken ct)`
- `Task<TransportOfferDto> SubmitTransportOfferAsync(TransportOfferDto dto, CancellationToken ct)`
- `Task<bool> AcceptTransportOfferAsync(long offerId, CancellationToken ct)`
- `Task<int> NotifyAvailableTransportersAsync(long requestId, CancellationToken ct)`
- `Task DeleteTransportRequestAsync(long id, CancellationToken ct)`
- `Task<PaginatedResult<TransportRequestViewDto>> GetAllTransportRequestsAsync(int page, int pageSize, CancellationToken ct)`
- `Task<TransportRequestViewDto> GetTransportRequestAsync(long requestId, CancellationToken ct)`

### ITransportProviderPriceLineService
**Location:** `SouqAlHal.Application/Services/Transport/ITransportProviderPriceLineService.cs`

**Methods:**
- `Task<TransportProviderPriceLine> CreatePriceLineAsync(CreatePriceLineDto dto, CancellationToken ct)`
- `Task<TransportProviderPriceLine?> UpdatePriceLineAsync(long priceLineId, UpdatePriceLineDto dto, CancellationToken ct)`
- `Task<bool> DeletePriceLineAsync(long priceLineId, CancellationToken ct)`
- `Task<List<TransportProviderWithPriceLinesDto>> ListTransportersWithPriceLinesAsync(CancellationToken ct)`
- `Task<TransportProviderWithPriceLinesDto?> GetTransportProviderWithPriceLinesAsync(long transportProviderId, CancellationToken ct)`
- `Task<List<PriceLineDto>> GetPriceLinesByProviderAsync(long transportProviderId, CancellationToken ct)`

### ITransportPriceService
**Location:** `SouqAlHal.Application/Services/Transport/ITransportPriceService.cs`

**Methods:**
- `Task<TransportPriceResponseDto?> GetOfficialPriceAsync(TransportPriceRequestDto dto, CancellationToken ct)`
- `Task<TransportPriceResponseDto?> GetCheapestPriceAsync(string fromRegion, string toRegion, CancellationToken ct)`
- `Task<decimal?> GetNegotiationPriceAsync(long requestId, CancellationToken ct)`

---

## Business Logic Flow

### Flow 1: Transport Provider Registration

```
1. User registers as transport provider
   POST /api/transport
   ↓
2. System creates TransportProvider entity
   ↓
3. Admin verifies provider (optional)
   PUT /api/transport/{id}/verify
   ↓
4. Provider adds vehicles
   POST /api/transport/{id}/vehicles
   ↓
5. Provider adds price lines for routes
   POST /api/transport/price-lines
   ↓
6. Provider is ready to receive requests
```

### Flow 2: Transport Request Creation

```
1. Buyer completes purchase (auction/tender/direct)
   ↓
2. Buyer creates transport request
   POST /api/transport/requests
   {
     contextId: auctionId/tenderId/listingId,
     contextType: "auction"/"tender"/"direct",
     buyerUserId: ...,
     toRegion: "..."
   }
   ↓
3. System automatically:
   - Extracts ProductId from context
   - Finds Farm from Crop
   - Gets FromRegion (GovernorateId) from Farm
   - Gets WeightKg from product quantity
   - Calculates DistanceKm (if available)
   ↓
4. System sends notifications to transport providers
   - Filters providers by CoveredAreas matching FromRegion
   - Sends bulk notification via INotificationService
   ↓
5. Transport providers see request and submit offers
   POST /api/transport/offers
```

### Flow 3: Offer Acceptance & Chat Creation

```
1. Buyer reviews offers
   GET /api/transport/requests/{requestId}/offers
   ↓
2. Buyer accepts an offer
   POST /api/transport/offers/{offerId}/accept
   ↓
3. System automatically:
   - Updates offer status to "accepted"
   - Rejects other offers for same request
   - Updates request status to "pending"
   - Gets transporterUserId from TransportProviders
   - Creates chat conversation via IChatService.OpenAsync:
     {
       contextType: "transport_offer",
       contextId: offerId,
       buyerUserId: ...,
       sellerUserId: transporterUserId
     }
   ↓
4. Buyer and transporter can now chat
   (Chat system handles conversation)
```

### Flow 4: Price Line Validation

```
1. Provider creates price line
   POST /api/transport/price-lines
   {
     transportProviderId: ...,
     fromArea: ...,
     toArea: ...,
     price: 200.00
   }
   ↓
2. System validates price:
   - Queries TransportPrices table for government price
   - Filters by FromRegion, ToRegion, PricingType="government"
   - Checks if EffectiveFrom <= Now and (EffectiveTo is null or EffectiveTo > Now)
   ↓
3. If government price exists:
   - If provider price > government price: REJECT (400 Bad Request)
   - If provider price <= government price: ACCEPT
   - Store GovernmentMaxPrice in price line
   ↓
4. Price line is created/updated
```

---

## Complete Request/Response Examples

### Example 1: Complete Transport Provider Registration

```bash
# Step 1: Create transport provider
curl -X POST https://api.souqalhal.com/api/transport \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "userId": 123,
    "accountType": "individual",
    "walletAccount": "wallet123456",
    "drivingLicensePath": "uploads/driving-license-123.pdf",
    "bankAccountNumber": "1234567890",
    "IBAN": "SY123456789012345678901234",
    "coveredAreas": "دمشق, ريف دمشق, حمص",
    "workersAvailable": 5,
    "availabilityHours": "08:00-18:00",
    "preferredPaymentMethod": "نقدي",
    "vehicleImages": ["uploads/vehicle1.jpg"],
    "estimatedPricePerKm": 2.5
  }'

# Response:
# {
#   "transportProviderId": 1,
#   "userId": 123,
#   "accountType": "individual",
#   "isVerified": false
# }

# Step 2: Add vehicle
curl -X POST https://api.souqalhal.com/api/transport/1/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "vehicleType": "شاحنة مبردة",
    "capacity": "5 إلى 10 طن",
    "model": "2020 Mercedes Actros",
    "vehicleLicensePath": "uploads/vehicle-license-1.pdf",
    "vehicleOwnershipProofPath": "uploads/ownership-1.pdf",
    "driverLicensesPaths": ["uploads/driver1-license.pdf"],
    "storageType": "تبريد بالغاز",
    "hasTools": true,
    "workersAvailable": 2,
    "pricePerKm": 2.0,
    "availabilityHours": "08:00-20:00",
    "canProvideLoadingWorkers": true
  }'

# Step 3: Add price lines
curl -X POST https://api.souqalhal.com/api/transport/price-lines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "transportProviderId": 1,
    "fromArea": 1,
    "toArea": "حلب",
    "price": 200.00
  }'

curl -X POST https://api.souqalhal.com/api/transport/price-lines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "transportProviderId": 1,
    "fromArea": 1,
    "toArea": "حمص",
    "price": 150.00
  }'
```

### Example 2: Buyer Creates Transport Request from Tender

```bash
# Buyer wins a tender with TenderId = 456
# Now creates transport request

curl -X POST https://api.souqalhal.com/api/transport/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {buyer_token}" \
  -d '{
    "contextId": 456,
    "contextType": "tender",
    "buyerUserId": 789,
    "toRegion": "حلب",
    "preferredPickupDate": "2025-11-20T08:00:00Z",
    "preferredDeliveryDate": "2025-11-20T14:00:00Z",
    "specialRequirements": "يحتاج تبريد"
  }'

# Response:
# {
#   "message": "تم إنشاء طلب النقل وإرساله إلى الناقلين المتاحين",
#   "requestId": 1,
#   "estimatedOffers": 5
# }

# System automatically:
# - Extracts ProductId from Tender (TenderId=456)
# - Finds Crop from Tender.ProductId
# - Gets Farm from Crop.FarmId
# - Gets FromRegion from Farm.GovernorateId
# - Sends notifications to transport providers in FromRegion
```

### Example 3: Transport Provider Submits Offer

```bash
# Provider receives notification and views request
curl -X GET https://api.souqalhal.com/api/transport/requests/1 \
  -H "Authorization: Bearer {provider_token}"

# Provider submits offer
curl -X POST https://api.souqalhal.com/api/transport/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {provider_token}" \
  -d '{
    "transportRequestId": 1,
    "transporterId": 1,
    "offeredPrice": 180.00,
    "estimatedPickupDate": "2025-11-20T08:00:00Z",
    "estimatedDeliveryDate": "2025-11-20T14:00:00Z",
    "notes": "يمكن توفير عمال تحميل وتنزيل"
  }'

# Response:
# {
#   "message": "تم تقديم عرض النقل",
#   "offerId": 1,
#   "status": "pending"
# }
```

### Example 4: Buyer Accepts Offer and Chat is Created

```bash
# Buyer reviews all offers
curl -X GET https://api.souqalhal.com/api/transport/requests/1/offers \
  -H "Authorization: Bearer {buyer_token}"

# Buyer accepts offer
curl -X POST https://api.souqalhal.com/api/transport/offers/1/accept \
  -H "Authorization: Bearer {buyer_token}"

# Response:
# {
#   "message": "تم قبول عرض النقل",
#   "offerId": 1,
#   "nextStep": "فتح قناة اتصال مع الناقل"
# }

# System automatically:
# - Updates offer status to "accepted"
# - Rejects other offers
# - Updates request status to "pending"
# - Gets transporterUserId from TransportProviders (TransporterId=1)
# - Creates chat conversation with:
#   - contextType: "transport_offer"
#   - contextId: 1 (offerId)
#   - buyerUserId: 789
#   - sellerUserId: transporterUserId
```

### Example 5: Query Transport Providers by Area

```bash
# Find transporters in Damascus
curl -X GET "https://api.souqalhal.com/api/transport/area/دمشق" \
  -H "Authorization: Bearer {token}"

# Get transporters with price lines
curl -X GET https://api.souqalhal.com/api/transport/with-price-lines \
  -H "Authorization: Bearer {token}"

# Get cheapest price for route
curl -X POST https://api.souqalhal.com/api/transport-prices/cheapest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "fromRegion": "دمشق",
    "toRegion": "حلب"
  }'
```

---

## Integration Examples

### Integration with Auction System

```csharp
// After auction is won, buyer creates transport request
var transportRequest = new TransportNegotiationRequestDto
{
    ContextId = auctionId,  // The won auction ID
    ContextType = "auction",
    BuyerUserId = buyerId,
    ToRegion = "حلب",
    PreferredPickupDate = DateTime.Now.AddDays(1),
    PreferredDeliveryDate = DateTime.Now.AddDays(2)
};

// System automatically extracts:
// - ProductId from Auction.ProductId
// - Farm from Crop.FarmId
// - FromRegion from Farm.GovernorateId
// - Weight from auction quantity
```

### Integration with Tender System

```csharp
// After tender offer is awarded, buyer creates transport request
var transportRequest = new TransportNegotiationRequestDto
{
    ContextId = tenderId,  // The tender ID
    ContextType = "tender",
    BuyerUserId = buyerId,
    ToRegion = "حلب",
    PreferredPickupDate = DateTime.Now.AddDays(1),
    PreferredDeliveryDate = DateTime.Now.AddDays(2)
};

// System automatically extracts ProductId from Tender.ProductId
```

### Integration with Direct Sales System

```csharp
// After direct sale order is placed, buyer creates transport request
var transportRequest = new TransportNegotiationRequestDto
{
    ContextId = listingId,  // The direct listing ID
    ContextType = "direct",
    BuyerUserId = buyerId,
    ToRegion = "حلب",
    PreferredPickupDate = DateTime.Now.AddDays(1),
    PreferredDeliveryDate = DateTime.Now.AddDays(2)
};

// System automatically extracts ProductId from DirectListing.ProductId
```

### Integration with Chat System

```csharp
// After offer acceptance, chat is automatically created
var conversation = await _chatService.OpenAsync(
    contextType: "transport_offer",
    contextId: offerId,  // The accepted offer ID
    buyerUserId: buyerId,
    sellerUserId: transporterUserId,  // Retrieved from TransportProviders
    cancellationToken
);

// Buyer and transporter can now chat about delivery details
```

### Integration with Notification System

```csharp
// When transport request is created, notifications are sent
var providers = await _db.TransportProviders
    .Where(p => p.CoveredAreas.Contains(fromRegionStr))
    .Select(p => p.UserId)
    .ToListAsync();

var notificationDto = new SendBulkNotificationDto(
    UserIds: providers,
    Title: "طلب نقل جديد",
    Body: $"تم إنشاء طلب نقل جديد من {fromRegion} إلى {toRegion}",
    Data: new Dictionary<string, string>
    {
        { "type", "transport_request" },
        { "category", "transport" },
        { "requestId", requestId.ToString() },
        { "clickAction", "view_transport_request" }
    },
    ClickAction: "view_transport_request"
);

await _notificationService.SendBulkNotificationAsync(notificationDto, ct);
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request - Price Exceeds Government Limit

```json
{
  "status": "fail",
  "code": "400",
  "message": "Price 300.00 exceeds government maximum price 250.00 for route 1 to حلب"
}
```

**When it occurs:**
- Creating or updating a price line with price higher than government maximum

**Solution:**
- Check government prices first: `POST /api/transport-prices/official`
- Reduce the price to be within government limits

---

#### 404 Not Found - Transport Provider Not Found

```json
{
  "message": "مزود النقل غير موجود"
}
```

**When it occurs:**
- Accessing a non-existent transport provider ID
- Accessing provider vehicles for non-existent provider

**Solution:**
- Verify the transport provider ID exists: `GET /api/transport/{id}`

---

#### 404 Not Found - Transport Request Not Found

```json
{
  "message": "طلب النقل غير موجود"
}
```

**When it occurs:**
- Accessing a non-existent transport request ID
- Getting offers for non-existent request

**Solution:**
- Verify the request ID exists: `GET /api/transport/requests/{id}`

---

#### 400 Bad Request - Invalid Context Type

```
ArgumentException: Invalid context type
```

**When it occurs:**
- Creating transport request with invalid `contextType`
- Must be: "auction", "tender", or "direct"

**Solution:**
- Use valid context type values only

---

#### 404 Not Found - Crop/Farm Not Found

```
KeyNotFoundException: Crop not found for the given context
KeyNotFoundException: Farm not found for the given crop
```

**When it occurs:**
- Creating transport request for auction/tender/direct sale without valid product/farm relationship

**Solution:**
- Ensure the context (auction/tender/direct) has valid ProductId
- Ensure the product (crop) has valid FarmId
- Ensure the farm has valid GovernorateId

---

## System Architecture

### Layer Structure

```
SouqAlHal.Api (Controllers)
    ↓
SouqAlHal.Application (Services & DTOs)
    ↓
SouqAlHal.Infrastructure (Repositories & Implementations)
    ↓
SouqAlHal.Domain (Entities)
    ↓
Database (MySQL)
```

### Key Services

1. **TransportController** (`/api/transport`)
   - Manages transport providers, vehicles, requests, offers, and price lines
   - Delegates to service layer for business logic

2. **TransportPricesController** (`/api/transport-prices`)
   - Handles price queries (official, cheapest, negotiation)
   - Returns price information from TransportPrices table

3. **TransportProviderService**
   - Manages transport provider CRUD operations
   - Handles vehicle management
   - Updates provider verification status

4. **TransportNegotiationService**
   - Creates transport requests
   - Manages offer submission and acceptance
   - Handles notifications to transport providers
   - Creates chat conversations after offer acceptance

5. **TransportProviderPriceLineService**
   - Manages price lines (CRUD)
   - Validates prices against government limits
   - Queries transport providers with price lines

6. **TransportPriceService**
   - Queries official government prices
   - Finds cheapest available prices
   - Estimates negotiation prices

### Database Relationships

```
Users
  └─ TransportProviders (1:1 via UserId)
       ├─ TransportVehicles (1:many)
       └─ TransportProviderPriceLines (1:many)

Auctions/Tenders/DirectListings
  └─ TransportRequests (1:many via ContextId + ContextType)
       └─ TransportOffers (1:many)
            └─ TransportProviders (many:1 via TransporterId)

TransportPrices (Reference table for government prices)
  └─ Used to validate TransportProviderPriceLines
```

### Notification Flow

```
Transport Request Created
  ↓
System finds providers in FromRegion
  ↓
Creates notification data:
  - type: "transport_request"
  - category: "transport"
  - requestId: ...
  - clickAction: "view_transport_request"
  ↓
Sends bulk notification via INotificationService
  ↓
Providers receive push notifications
  ↓
Providers open app and view transport request
  ↓
Providers submit offers
```

### Chat Integration Flow

```
Offer Accepted
  ↓
System gets transporterUserId from TransportProviders
  ↓
Calls IChatService.OpenAsync:
  - contextType: "transport_offer"
  - contextId: offerId
  - buyerUserId: ...
  - sellerUserId: transporterUserId
  ↓
Chat conversation created
  ↓
Buyer and transporter can communicate
```

---

## Summary for AI/LLM Understanding

This transport system is a comprehensive logistics management platform for agricultural products. Key points:

1. **Multi-Context Support**: Transport requests can be created from auctions, tenders, or direct sales. The system automatically extracts location and product information.

2. **Automatic Location Extraction**: The `FromRegion` is automatically determined from the farm's governorate, not manually entered by the buyer.

3. **Price Validation**: All price lines are validated against government maximum prices stored in the `TransportPrices` table.

4. **Notification System**: When a transport request is created, notifications are automatically sent to all transport providers covering the origin region.

5. **Chat Integration**: When an offer is accepted, a chat conversation is automatically created between the buyer and transporter.

6. **Status Management**: Requests and offers have status workflows:
   - Request: "open" → "pending" → "completed"/"cancelled"
   - Offer: "pending" → "accepted"/"rejected"

7. **Provider Verification**: Transport providers can be verified by administrators, building trust in the marketplace.

8. **Price Lines vs. Negotiation**: Providers can either set fixed prices for routes (price lines) or negotiate through the offer system.

---

**Document Version:** 1.0  
**Last Updated:** November 15, 2025  
**System:** SouqAlHal Transport Management System
