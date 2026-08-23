# Product Requirements Document (PRD)
# GutShoes — Online Shoe Store

**Document Version:** 1.0  
**Status:** MVP Requirements Locked  
**Product:** GutShoes  
**Product Type:** E-commerce / Direct-to-Consumer Store  
**Frontend:** React JS  
**Backend:** Laravel  
**Payment Gateway:** Midtrans  

---

## 1. Product Overview

GutShoes is an e-commerce platform for selling original sports shoes and sneakers through its own website.

GutShoes operates as a reseller, purchasing authentic products from suppliers and selling them directly to customers through the GutShoes website.

The MVP focuses on a simple but production-ready shopping experience:

```text
Landing Page
    ↓
Product Catalog
    ↓
Product Detail
    ↓
Cart
    ↓
Checkout
    ↓
Midtrans Payment
    ↓
Order Processing
    ↓
Shipping
    ↓
Order Delivery
```

The platform consists of two primary interfaces:

1. **Customer Storefront**
2. **Admin Panel**

---

# 2. Product Goals

## 2.1 Primary Goals

GutShoes MVP must allow customers to:

- Discover products.
- Search and browse products.
- Filter products.
- View product details.
- Select shoe size.
- Add products to cart.
- Checkout as a guest or authenticated customer.
- Select shipping address.
- Select available shipping service.
- Apply discounts and vouchers.
- Pay using Midtrans.
- Track order status.
- Track shipment.
- Cancel eligible orders.
- Request refund according to applicable rules.

## 2.2 Business Goals

GutShoes should provide an internal system for administrators to:

- Manage products.
- Manage brands.
- Manage categories.
- Manage product sizes.
- Manage inventory.
- Manage prices.
- Manage discounts.
- Manage vouchers.
- Manage customers.
- Manage orders.
- Manage payments.
- Manage refunds.
- Manage shipments.
- Monitor sales performance.
- Maintain audit history.

---

# 3. Target Customers

GutShoes targets a broad customer segment.

## Positioning

The brand uses a mixed pricing position:

- Affordable products.
- Mid-range products.
- Premium products.

The initial market is not restricted to a specific gender or age group.

---

# 4. Business Model

GutShoes operates as a **reseller**.

The platform sells authentic/original products sourced from suppliers.

The GutShoes website only manages orders originating from the GutShoes website.

Marketplace orders such as Shopee or Tokopedia are outside the MVP scope.

---

# 5. Product Scope

GutShoes sells:

- Sports shoes.
- Sneakers.

Products may belong to multiple brands and categories.

Examples:

- Nike
- Adidas
- Puma
- New Balance
- Converse

---

# 6. Product Structure

A product represents the main product information.

Example:

```text
Nike Air Max 270
```

Each product may have multiple size variants.

```text
Nike Air Max 270
├── Size 39
├── Size 40
├── Size 41
└── Size 42
```

Each size variant is independently inventory-managed.

## 6.1 Variant Characteristics

Each size variant must support:

- SKU
- Size
- Price
- Weight
- Stock

Price may differ between sizes.

Example:

```text
Size 39 → Rp1.000.000
Size 40 → Rp1.000.000
Size 41 → Rp1.050.000
Size 42 → Rp1.100.000
```

There is currently no color variant requirement.

---

# 7. Product Information

Minimum product information:

- Product name
- Slug
- Brand
- Category
- Description
- Product images
- Size variants
- SKU
- Price
- Weight
- Stock
- Discount information
- Created timestamp
- Updated timestamp
- Deleted timestamp

## 7.1 Product Images

Each product may have a maximum of **5 images**.

The admin can define image ordering.

Example:

```text
1. Front
2. Side
3. Back
4. Top
5. Detail
```

---

# 8. Product Lifecycle

A product follows:

```text
DRAFT
   ↓
PUBLISHED
```

New products are created as `DRAFT`.

A product becomes visible on the storefront only after being published.

Products use soft deletion rather than hard deletion.

Soft-deleted products must not appear in the storefront.

Historical order data must remain available after product deletion.

---

# 9. Product Category

Categories support hierarchy.

Example:

```text
Shoes
├── Sneakers
├── Running
├── Basketball
├── Training
└── Lifestyle
```

Category data should support parent-child relationships.

The structure should remain flexible enough to support additional category levels in the future.

---

# 10. Brand

Each product belongs to a brand.

Minimum brand information:

- Name
- Slug
- Logo
- Created timestamp
- Updated timestamp
- Deleted timestamp

---

# 11. Catalog

The storefront provides:

- Product listing.
- Product detail.
- Category browsing.
- Brand browsing.
- Search.
- Filtering.
- Sorting.

## 11.1 Filters

MVP filters:

- Category
- Brand
- Price range
- Size

## 11.2 Search

Standard search is supported by:

- Product name
- Brand
- SKU

Fuzzy/approximate search is out of MVP scope.

## 11.3 Sorting

Customers can sort by:

- Newest
- Lowest price
- Highest price
- Popular/best selling

---

# 12. Product Availability

Products remain visible even when all variants are out of stock.

Example:

```text
Nike Air Max 270

39 → Out of Stock
40 → Out of Stock
41 → Out of Stock
42 → Out of Stock
```

The product remains accessible but is displayed as:

> Sold Out

A customer must not be able to purchase a variant whose available stock is zero.

---

# 13. Customer Authentication

GutShoes supports two shopping modes.

## 13.1 Authenticated Customer

Customers can authenticate using:

> Google Login

Google email is considered the primary identity email and cannot be edited from the GutShoes application.

## 13.2 Guest Customer

Customers may complete checkout without creating an account.

After successful checkout, the guest customer is offered the option to create an account.

---

# 14. Customer Profile

Customer profile information:

- Name
- Email
- Phone number
- Google profile photo
- Created timestamp
- Updated timestamp

Email cannot be manually changed.

---

# 15. Customer Addresses

Customers can have multiple shipping addresses.

Example:

```text
Ega
├── Rumah
├── Kantor
└── Apartemen
```

Customer can designate one address as the default address.

Address management must support:

- Create
- Update
- Delete
- Set default

---

# 16. Address Snapshot

When an order is created, shipping information must be copied into the order.

Changing the customer's saved address later must not change historical order information.

Order shipping data should therefore preserve a snapshot of:

- Recipient name
- Phone number
- Address
- Province
- City/regency
- District
- Postal code
- Any other required shipping metadata

---

# 17. Shopping Cart

GutShoes supports:

- Authenticated customer cart.
- Guest cart.

## 17.1 Cart Operations

Customer can:

- Add item.
- Increase quantity.
- Decrease quantity.
- Change size.
- Remove item.

There is no artificial quantity limit beyond available stock.

## 17.2 Cart Expiration

Cart items do not have automatic expiration.

However, stock availability must always be revalidated during checkout.

---

# 18. Checkout

Checkout flow:

```text
Cart
 ↓
Checkout
 ↓
Customer Information
 ↓
Shipping Address
 ↓
Shipping Service
 ↓
Promotion / Voucher
 ↓
Order Summary
 ↓
Create Order
 ↓
Midtrans
 ↓
Payment
```

The checkout calculation must be performed by the backend.

Frontend-submitted totals must never be trusted.

---

# 19. Checkout Calculation

The order total follows:

```text
Subtotal
+ Shipping Fee
- Product Discount
- Voucher Discount
= Grand Total
```

Tax/PPN is not included in MVP.

---

# 20. Shipping

GutShoes supports automatic shipping fee calculation.

Shipping fees are calculated based on:

- Origin
- Destination
- Product weight
- Quantity
- Courier
- Courier service

GutShoes supports multiple courier providers through a shipping abstraction/provider layer.

The exact shipping provider implementation can be changed without changing core order logic.

---

# 21. Warehouse

The MVP supports:

> 1 warehouse / fulfillment origin.

Warehouse configuration contains the origin used for shipping calculations.

Future multi-warehouse support should remain possible through proper data modeling.

---

# 22. Shipment

A shipment contains information such as:

- Courier/provider
- Courier service
- Shipping fee
- Tracking number
- Shipment status
- Shipped timestamp
- Delivered timestamp

Customers can see tracking information from the order detail page.

---

# 23. Payment

GutShoes uses:

> Midtrans

The available payment methods exposed by Midtrans are supported.

The application should not hard-code assumptions around one payment method.

---

# 24. Payment Expiration

Payment expiration is:

> 24 hours

A pending payment that is not completed within the expiration period becomes expired.

Inventory reservation must use the same 24-hour expiry period.

---

# 25. Payment Architecture

Payment status must be handled server-side.

The primary flow is:

```text
Midtrans
   ↓
Payment Notification / Webhook
   ↓
Laravel Backend
   ↓
Validate Notification
   ↓
Update Payment
   ↓
Update Order
   ↓
Update Inventory
```

The frontend redirect after payment is not considered the source of truth.

Midtrans server notification is the authoritative payment confirmation mechanism.

---

# 26. Payment Data

Payment should be modeled separately from the order.

Example relationship:

```text
Order
  └── Payment
```

A payment should be able to store information such as:

- Payment provider
- Provider transaction ID
- Payment method
- Amount
- Status
- Expiration timestamp
- Paid timestamp
- Provider metadata
- Created timestamp
- Updated timestamp

---

# 27. Payment Status

MVP payment statuses:

```text
PENDING
SUCCESS
FAILED
```

Provider-specific payment statuses may be mapped into these internal statuses.

---

# 28. Payment Webhook Log

Midtrans notifications must be stored for auditability and troubleshooting.

Webhook records should preserve:

- Notification payload
- Provider transaction identifier
- Notification type/status
- Received timestamp
- Processing result
- Error information where applicable

---

# 29. Order Lifecycle

Primary order lifecycle:

```text
PENDING_PAYMENT
      ↓
     PAID
      ↓
  PROCESSING
      ↓
   SHIPPED
      ↓
  DELIVERED
```

An order may also become:

```text
CANCELLED
```

Refund is not represented as an order status.

---

# 30. Order Status Rules

### PENDING_PAYMENT

Order has been created but payment has not completed.

Customer may cancel.

### PAID

Payment is successful.

Customer may still request cancellation according to the MVP rule.

If cancellation is approved, a refund process may be created.

### PROCESSING

Order preparation has started.

Customer cannot cancel.

### SHIPPED

Order has been handed to the shipping provider.

Customer cannot cancel.

### DELIVERED

Order has been delivered.

### CANCELLED

Order has been cancelled.

---

# 31. Order Cancellation

Cancellation can be initiated by:

- Customer
- Admin

Cancellation is allowed when:

- Order is `PENDING_PAYMENT`
- Order is `PAID`

Cancellation is not allowed when:

- `PROCESSING`
- `SHIPPED`

When a paid order is cancelled, a refund process is created.

---

# 32. Refund

Refund is handled separately from order status.

Example:

```text
Order
status = CANCELLED

Refund
status = PENDING
```

Refund flow:

```text
Cancellation
     ↓
Refund Request
     ↓
Admin Review
     ↓
Refund Processing
     ↓
Midtrans Refund
     ↓
Success / Failed
```

For MVP, refund status is:

```text
PENDING
SUCCESS
FAILED
```

Refund should be performed through the payment provider where supported.

---

# 33. Return / Exchange

Return and product exchange are outside the MVP.

MVP supports:

> Refund only.

Size exchange is explicitly excluded from MVP.

---

# 34. Order Number

Every order has a human-readable order number.

Example:

```text
GS-20260820-00001
```

The order number is separate from the database primary key.

---

# 35. Order Item Snapshot

Order items must preserve transaction-time information.

For example:

```text
Product Name
SKU
Size
Price
Discount
Quantity
Subtotal
```

These values must not depend on the current product record.

If the product later changes:

```text
Product Name
Price
SKU
```

historical orders must remain unchanged.

---

# 36. Inventory

Inventory is managed at the size variant level.

Example:

```text
Nike Air Max 270

Size 40
Stock = 5

Size 41
Stock = 2
```

Stock must never become negative.

---

# 37. Inventory Reservation

GutShoes uses inventory reservation to prevent overselling.

Flow:

```text
Available Stock
      ↓
Reserved
      ↓
Payment Success
      ↓
Sold
```

If payment expires:

```text
Reserved
   ↓
Released
   ↓
Available Stock
```

Reservation expiration:

> 24 hours

which matches payment expiration.

---

# 38. Checkout Stock Validation

Stock must be validated again on the backend during checkout.

Example:

```text
Customer A → Size 42 → Qty 1
Customer B → Size 42 → Qty 1
```

If only one unit is available, the system must prevent both orders from successfully reserving the same inventory.

Inventory reservation must therefore be atomic and concurrency-safe.

---

# 39. Inventory History

The system must maintain inventory movement/history.

Inventory movements may represent:

- Initial stock
- Stock addition
- Stock reduction
- Reservation
- Reservation release
- Sale
- Adjustment
- Return/refund-related stock changes where applicable

Inventory history is important for auditability.

---

# 40. Product Pricing

Price exists at the product-size variant level.

A product may contain variants with different prices.

Current product pricing does not replace historical order pricing.

Orders preserve their transaction-time price snapshot.

---

# 41. Product Discount

Discount supports:

- Percentage
- Fixed amount

Discounts can apply to:

- Product
- Category
- Brand
- Multiple applicable product targets

Discounts have:

- Start date
- End date

---

# 42. Discount Conflict Resolution

When multiple product discounts apply to the same product, only one product discount should be applied.

Recommended priority:

```text
Product
  >
Category
  >
Brand
  >
Global
```

Only the highest-priority applicable product discount is selected.

A voucher may then be applied on top of the resulting discounted amount.

---

# 43. Voucher

Voucher types:

```text
PERCENTAGE
FIXED_AMOUNT
FREE_SHIPPING
```

Voucher supports:

- Voucher code
- Discount value
- Minimum transaction amount
- Start date
- End date
- Global usage limit
- Product restriction

---

# 44. Voucher Usage

Voucher usage is tracked globally.

Example:

```text
GUTSHOES10
Global usage limit: 1,000
```

When the global limit is reached, the voucher can no longer be redeemed.

---

# 45. Voucher Product Restriction

MVP voucher applicability is restricted by product.

Example:

```text
GUTSHOES50

Applicable Products:
- Nike Air Max 270
- Adidas Ultraboost
```

Category-wide or brand-wide voucher targeting is not required for MVP unless later expanded.

---

# 46. Product Discount + Voucher

Both can be applied to the same order.

Example:

```text
Original Product Price
        ↓
Product Discount
        ↓
Discounted Product Price
        ↓
Voucher
        ↓
Final Product Price
```

The backend calculates all discount values.

---

# 47. Free Shipping Promotion

A voucher may provide free shipping.

Example:

```text
Voucher:
FREEONGKIR

Minimum Transaction:
Rp500.000

Shipping Discount:
100%
```

The shipping discount must be included in checkout calculation.

---

# 48. Order History

Authenticated customers can view their historical orders.

Order list should display:

- Order number
- Order date
- Order status
- Payment status
- Total amount

Customer can open each order for complete details.

---

# 49. Guest Order Tracking

Guest customers can track their order using:

- Order number
- Email

This allows guest customers to access basic order status without creating an account.

---

# 50. Guest Account Conversion

After guest checkout, the customer may create a GutShoes account.

If the email matches an existing guest order, the system should associate the eligible guest order with the newly created customer account.

---

# 51. Landing Page

The storefront landing page should follow a marketing-oriented structure.

Recommended MVP structure:

```text
Navbar
 ├── Logo
 ├── Home
 ├── Shop
 ├── Categories
 ├── Search
 ├── Cart
 └── Account

Hero Section

Featured Products

New Arrivals

Categories

Promotional Banner

Why GutShoes

Footer
```

The exact visual design is outside this PRD and can be defined separately in UI/UX specifications.

---

# 52. Customer Navigation

Primary navigation:

- Home
- Shop
- Categories
- Search
- Cart
- Account

Authenticated customers additionally have access to:

- Profile
- Addresses
- Orders

---

# 53. Admin Panel

The MVP includes an admin panel.

Admin has full access to all admin capabilities.

Only one role is required:

```text
ADMIN
```

---

# 54. Admin Product Management

Admin can:

- Create product
- Save draft
- Publish product
- Edit product
- Soft delete product
- Manage brand
- Manage category
- Manage images
- Manage sizes
- Manage SKU
- Manage weight
- Manage pricing

---

# 55. Admin Inventory Management

Admin can:

- View stock
- Add stock
- Adjust stock
- View inventory movement
- View reserved inventory
- View available inventory
- View sold inventory
- Monitor low stock

Low-stock threshold uses a global configuration value.

---

# 56. Admin Order Management

Admin can:

- View orders
- View order details
- Search orders
- Filter orders
- Update order status
- Process orders
- Add shipment data
- Cancel eligible orders
- View payment status
- Initiate/refine refund handling

---

# 57. Admin Customer Management

Admin can:

- View customers
- View customer profile
- View customer orders
- View customer addresses where operationally appropriate

---

# 58. Admin Promotion Management

Admin can manage:

- Product discounts
- Vouchers
- Discount validity periods
- Voucher limits
- Voucher applicability
- Free shipping promotions

---

# 59. Admin Dashboard

Admin dashboard should provide:

- Today's sales
- Today's orders
- Pending payment count
- Processing order count
- Shipping order count
- Completed order count
- Low stock products
- Top products
- Revenue summary

---

# 60. Audit Log

Admin activity must be logged.

Examples:

```text
Admin A
Updated Nike Air Max price.

Admin B
Changed Size 42 stock.

Admin C
Cancelled order GS-20260820-00001.
```

Audit logs should contain at minimum:

- Admin user
- Action
- Target entity
- Target ID
- Description
- Timestamp
- Relevant metadata where useful

---

# 61. Store Configuration

Basic store configuration is stored in the database.

Examples:

- Store name
- Store logo
- Store email
- Store phone
- Warehouse address
- Low-stock threshold
- Other basic store configuration

This prevents requiring a deployment for ordinary store configuration changes.

Sensitive credentials such as payment-provider credentials remain environment/server configuration rather than ordinary admin-managed settings.

---

# 62. Email Notification

Email notification is required for MVP.

Recommended notifications:

```text
Order Created
Payment Successful
Payment Expired
Order Shipped
Order Delivered
Order Cancelled
Refund Completed
```

WhatsApp notifications are outside the MVP.

---

# 63. Customer Notification Principles

Notifications should be triggered from backend business events rather than directly from frontend actions.

For example:

```text
Payment webhook
     ↓
Payment SUCCESS
     ↓
Order PAID
     ↓
Send payment confirmation email
```

---

# 64. Security Requirements

## 64.1 Authentication

Authentication must be validated server-side.

## 64.2 Authorization

Customer endpoints must only expose the authenticated customer's own data.

Admin endpoints must require admin authorization.

## 64.3 Price Protection

Client-submitted:

- price
- subtotal
- discount
- shipping fee
- grand total

must never be trusted.

Backend recalculates checkout totals.

## 64.4 Voucher Protection

Voucher eligibility and usage must be validated on the backend.

## 64.5 Stock Protection

Stock reservation must be concurrency-safe.

Negative stock must be prevented at database/application level.

---

# 65. Core Business Rules

The following rules are mandatory MVP requirements.

1. Product size is independently inventory-managed.
2. Each size variant has its own SKU.
3. Price may differ by size.
4. Stock cannot become negative.
5. Checkout must revalidate inventory.
6. Inventory uses reservation.
7. Reservation expires after 24 hours.
8. Payment expires after 24 hours.
9. Payment confirmation is determined by Midtrans server notifications.
10. Frontend redirects are not payment truth.
11. Order stores product transaction snapshots.
12. Order stores shipping address snapshot.
13. Historical orders must remain immutable in transactional information.
14. Customer may checkout as guest.
15. Guest orders can be tracked.
16. Guest orders can later be linked to an account.
17. Customer email from Google cannot be changed.
18. Customer may have multiple addresses.
19. One address may be marked as default.
20. Customer can cancel eligible orders.
21. Admin can cancel eligible orders.
22. Paid cancellation may create a refund.
23. Processing/shipped orders cannot be cancelled.
24. Refund is modeled separately from order status.
25. Refund statuses are pending, success, and failed.
26. Exchange is excluded from MVP.
27. Return/exchange workflows are excluded from MVP.
28. Tax is excluded from MVP.
29. Product discount and voucher can stack.
30. Only the highest-priority product discount applies.
31. Voucher may provide free shipping.
32. Cart does not expire automatically.
33. Checkout is the final stock validation point before reservation.
34. Product can exist as draft before publication.
35. Published products appear on the storefront.
36. Deleted products use soft deletion.
37. Sold-out products remain visible.
38. Search uses standard product name, brand, and SKU matching.
39. Admin actions are audited.
40. Basic store settings are database-driven.

---

# 66. MVP User Roles

## Customer

Capabilities:

- Browse catalog
- Search
- Filter
- View product
- Manage cart
- Checkout
- Pay
- Manage profile
- Manage addresses
- View orders
- Track orders
- Cancel eligible orders
- Track refund status

## Guest

Capabilities:

- Browse catalog
- Search
- Filter
- View product
- Manage cart
- Checkout
- Pay
- Track order

## Admin

Capabilities:

- Full product management
- Full inventory management
- Full order management
- Full payment visibility
- Refund management
- Customer management
- Discount management
- Voucher management
- Shipment management
- Store configuration
- Dashboard
- Audit logs

---

# 67. Main Customer Flows

## 67.1 Authenticated Shopping

```text
Google Login
   ↓
Browse Products
   ↓
Product Detail
   ↓
Select Size
   ↓
Add to Cart
   ↓
Checkout
   ↓
Select Address
   ↓
Select Courier
   ↓
Apply Promotion
   ↓
Review Order
   ↓
Midtrans
   ↓
Payment Success
   ↓
Order Paid
   ↓
Processing
   ↓
Shipping
   ↓
Delivered
```

## 67.2 Guest Shopping

```text
Browse Products
   ↓
Add to Cart
   ↓
Checkout
   ↓
Input Customer Information
   ↓
Shipping Information
   ↓
Payment
   ↓
Order Created
   ↓
Payment Success
   ↓
Order Tracking
   ↓
Offer Account Creation
```

## 67.3 Payment Expiration

```text
Checkout
   ↓
Order Created
   ↓
Stock Reserved
   ↓
Payment Pending
   ↓
24 Hours
   ↓
Payment Expired
   ↓
Order Cancelled/Expired according to implementation
   ↓
Inventory Reservation Released
```

For the implementation, payment expiration handling should be deterministic and idempotent.

## 67.4 Paid Cancellation

```text
Order PAID
   ↓
Customer/Admin Cancel Request
   ↓
Cancellation Accepted
   ↓
Order CANCELLED
   ↓
Refund PENDING
   ↓
Midtrans Refund
   ↓
Refund SUCCESS / FAILED
```

---

# 68. Main Admin Flow

## Product

```text
Create Product
   ↓
Save Draft
   ↓
Add Images
   ↓
Add Categories
   ↓
Add Sizes/SKUs
   ↓
Set Price
   ↓
Set Weight
   ↓
Publish
```

## Order

```text
Pending Payment
   ↓
Payment Confirmed
   ↓
Processing
   ↓
Add Shipping Data
   ↓
Shipped
   ↓
Delivered
```

---

# 69. MVP Scope

## Included

- Landing page
- Catalog
- Product detail
- Search
- Product filtering
- Sorting
- Google authentication
- Guest checkout
- Customer profile
- Multiple addresses
- Cart
- Checkout
- Shipping calculation
- Midtrans
- Payment webhook
- Product discount
- Voucher
- Free shipping voucher
- Order management
- Order cancellation
- Refund
- Shipment tracking
- Inventory
- Inventory reservation
- Admin panel
- Dashboard
- Product management
- Brand management
- Category management
- Customer management
- Audit log
- Email notification
- Store configuration

## Explicitly Out of Scope

- Wishlist
- Product reviews/rating
- WhatsApp notification
- Product exchange
- Return workflow
- Multi-warehouse
- Marketplace order synchronization
- Fuzzy search
- Tax/PPN engine
- Complex role/permission system

---

# 70. Non-Functional Requirements

## Performance

The application should provide responsive catalog and checkout experiences.

Pagination should be applied to potentially large datasets such as:

- Products
- Orders
- Customers
- Inventory movements
- Audit logs

## Reliability

Payment and inventory operations must be idempotent.

Repeated Midtrans webhook notifications must not create duplicate payment or inventory transactions.

## Data Integrity

Foreign key relationships and database constraints should protect transactional data.

Critical financial and inventory operations should be transactional.

## Security

- Authentication required for protected customer APIs.
- Admin authorization required for admin APIs.
- Sensitive credentials must not be stored as ordinary customer/admin data.
- Server-side validation for all financial calculations.
- Server-side validation for stock and voucher eligibility.

---

# 71. Recommended Core Domain Model

The ERD should be derived from the following domain areas.

```text
Identity / Customer
├── User
├── Customer Profile
└── Customer Address

Catalog
├── Product
├── Product Image
├── Brand
├── Category
└── Product Size Variant

Commerce
├── Cart
├── Cart Item
├── Order
├── Order Item
├── Order Status History
└── Order Cancellation

Payment
├── Payment
├── Payment Webhook / Notification
└── Refund

Inventory
├── Inventory
├── Inventory Reservation
└── Inventory Movement

Shipping
├── Warehouse
├── Shipment
├── Shipping Provider
├── Courier
└── Courier Service / Rate

Promotion
├── Discount
├── Discount Target
├── Voucher
└── Voucher Usage

Administration
├── Admin User
├── Audit Log
└── Store Configuration

Notification
└── Email Notification / Delivery Log
```

The exact table boundaries should be finalized during ERD design rather than copying this list directly into tables.

---

# 72. ERD Design Principles

The future ERD should follow these principles:

1. Use stable internal primary keys.
2. Use separate human-readable order numbers.
3. Keep product identity separate from product variants.
4. Store inventory at variant level.
5. Keep payment separate from order.
6. Keep refund separate from order.
7. Keep shipment separate from payment.
8. Store transaction snapshots inside order data.
9. Keep customer addresses separate from order address snapshots.
10. Track inventory movement rather than relying only on a stock number.
11. Support inventory reservation explicitly.
12. Store order status history.
13. Store payment provider transaction references.
14. Support idempotent external webhook processing.
15. Use soft deletion where historical references are required.
16. Keep promotion targeting extensible.
17. Maintain auditability for financial and administrative actions.
18. Keep the schema normalized while allowing intentional transaction snapshots where historical immutability requires them.

---

# 73. Success Criteria for MVP

GutShoes MVP is considered functionally complete when a customer can:

```text
Open GutShoes
    ↓
Browse Products
    ↓
Select Size
    ↓
Add to Cart
    ↓
Checkout
    ↓
Select Address
    ↓
Select Shipping
    ↓
Apply Discount/Voucher
    ↓
Pay via Midtrans
    ↓
Receive Payment Confirmation
    ↓
Order is Processed
    ↓
Shipment is Created
    ↓
Customer Tracks Order
    ↓
Order is Delivered
```

and an administrator can manage the complete lifecycle from:

```text
Product
→ Inventory
→ Order
→ Payment
→ Processing
→ Shipment
→ Delivery
→ Cancellation/Refund
```

without requiring manual database manipulation for normal business operations.

---

# 74. Future Expansion Opportunities

The architecture should remain extensible for future features such as:

- Shopee integration
- Tokopedia integration
- TikTok Shop integration
- Multiple warehouses
- Wishlist
- Product reviews
- Product exchange
- Return management
- WhatsApp notifications
- Customer loyalty
- Loyalty points
- Advanced promotion engine
- Flash sale
- Bundle products
- Membership tiers
- Advanced analytics
- Multi-role admin
- Multi-currency
- International shipping

These features are not part of MVP implementation.

---

# 75. Final MVP Product Definition

GutShoes MVP is a **D2C e-commerce platform for authentic sports shoes and sneakers**, providing:

```text
Customer Storefront
        +
Guest Checkout
        +
Google Authentication
        +
Cart
        +
Automatic Shipping
        +
Midtrans Payment
        +
Inventory Reservation
        +
Order Management
        +
Refund
        +
Admin Panel
```

The architecture should prioritize transactional correctness for:

- Inventory
- Payment
- Order
- Shipping
- Discount
- Voucher
- Refund

while keeping the customer experience simple.

---

# 76. PRD Status

**Status:** Ready for ERD Design

This PRD is considered the baseline product requirement for the GutShoes MVP.

The next design artifact should translate this PRD into:

1. Database ERD
2. Table definitions
3. Relationships and cardinalities
4. Primary/foreign keys
5. Index strategy
6. Unique constraints
7. Enum/status strategy
8. Soft-delete strategy
9. Inventory concurrency strategy
10. Payment/webhook idempotency strategy
11. API resource structure

**Important:** The ERD should not blindly create one table for every concept in this PRD. The final database model should apply relational database best practices and distinguish between core entities, transactional snapshots, histories, mappings, and external-provider integration records.