# GutShoes Product Context

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- React JS frontend.
- Laravel backend and REST API.
- MySQL 8 with InnoDB.
- Midtrans for payments and refunds; server-to-server webhooks are the payment source of truth.
- Deployment target is not yet decided.

## Users

The primary users are Indonesian buyers shopping online for sports shoes and sneakers. They want confidence that products are original while still getting affordable, competitive prices.

Secondary users are GutShoes administrators who manage the catalog, variants, inventory, orders, customers, promotions, refunds, store settings, and operational audit history.

Guest shoppers are a supported audience. They may browse, check out, track an order, and later link eligible orders to an account.

## Product Purpose

GutShoes is a direct-to-consumer e-commerce store for authentic sports shoes and sneakers. It lets customers discover products, select a size, purchase securely, and follow fulfillment from checkout through delivery. Success means customers can confidently buy original shoes at affordable prices while the GutShoes team can operate catalog, stock, payment, fulfillment, and after-sales workflows reliably from one system.

## Positioning

GutShoes combines guaranteed-original sports shoes and sneakers with affordable pricing for Indonesian buyers. The product must make authenticity and price value credible without inventing guarantees, supplier relationships, comparisons, or promotional claims that the business has not substantiated.

## Operating Context

- Customers browse and search a product catalog, filter and sort results, choose size-based variants, manage a cart, calculate shipping, apply eligible discounts or vouchers, and pay through Midtrans.
- Customers may authenticate with Google or complete checkout as guests.
- Orders preserve product, price, address, shipping, discount, and voucher snapshots so later catalog changes do not rewrite transaction history.
- Inventory is reserved during checkout and released or converted according to payment outcomes.
- Administrators operate products, brands, categories, variants, images, warehouses, inventory, orders, cancellations, refunds, promotions, customers, and store settings.
- Email notifications and other external side effects run after committed transactions through queues.

## Capabilities and Constraints

- MVP scope and business rules are defined by `Product Requirements Document (PRD).md`.
- The relational data model, invariants, and implementation sequence are defined by `Entity Relationship Diagram & Database Design.md`.
- Products are authentic/original goods sourced from suppliers and resold directly by GutShoes; the website manages only orders placed through GutShoes.
- Product prices live on sellable variants, which combine size, SKU, price, and inventory.
- Guest checkout, Google authentication, multiple addresses, order tracking, cancellation, refunds, discounts, vouchers, and automatic shipping calculation are required MVP capabilities.
- All financial, stock, voucher, and authorization decisions require server-side validation.
- Payment and inventory operations must be idempotent. Frontend redirects are never authoritative payment confirmation.
- Sensitive credentials remain in protected environment or server configuration, not ordinary admin-managed data.
- Deployment target, shipping aggregator, and any requirements not fixed by the two baseline specifications remain open decisions.

## Brand Commitments

- Product name: GutShoes.
- The brand promise centers on original products and affordable pricing for Indonesian buyers.
- Authenticity guarantees, supplier relationships, customer claims, price comparisons, and promotional claims must not be invented or changed without explicit approval and supporting evidence.
- Existing or future logo and brand assets must not be replaced or materially changed without explicit approval.
- No additional voice, personality, or visual identity constraints have been confirmed yet.

## Evidence on Hand

- `Product Requirements Document (PRD).md`: approved product and MVP baseline.
- `Entity Relationship Diagram & Database Design.md`: database and transactional architecture baseline.
- No logo files, product photography, supplier certificates, customer testimonials, customer logos, sales metrics, price-comparison evidence, or accessibility audit evidence are currently present in the repository. Future work must not fabricate them.

## Product Principles

1. Make authenticity trustworthy through substantiated product information and evidence, never unsupported claims.
2. Deliver affordable value without misleading pricing, comparisons, or promotions.
3. Keep shopping simple for both authenticated and guest customers.
4. Protect every order with authoritative server-side calculations, inventory integrity, immutable snapshots, and idempotent payment handling.
5. Give administrators clear operational control and auditable history without compromising transactional truth.

## Accessibility & Inclusion

The storefront serves a broad Indonesian customer base across mobile and desktop web contexts. A specific conformance standard and product-specific accessibility needs have not yet been confirmed; they must be decided before accessibility claims are made.
