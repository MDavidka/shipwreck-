# Order tracker

A small Next.js App Router product for looking up an order by a five-digit code, collecting its delivery address, and showing the final shipping state. The `/admin` page is intentionally quiet and hidden behind the barcode-style access code `admin3&`.

## Stack

| Area | Choice |
| --- | --- |
| App | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS with compact shadcn-style primitives |
| Font | Inter only |
| Data | MongoDB via the `mongodb` driver |
| Deployment | Vercel-ready Node runtime routes |

## Environment

Copy `.env.example` to `.env.local` and set `MONGO_API_KEY` to a MongoDB connection string. The application uses the default database selected by the connection string and creates an `orders` collection with a unique index on `code`.

```bash
cp .env.example .env.local
npm install
npm run dev
```

The local development server runs on port `9676`. The public tracker is available at `http://localhost:9676/`. The admin page is at `http://localhost:9676/admin/`; enter `admin3&` as a scan/code value to unlock it.

The interface includes Romanian (`Română`) as the default language, plus Magyar and English. The selected language is saved in the browser and shared by the public and admin pages.

## Vercel

Import the repository into Vercel, keep the default Next.js build settings, and add `MONGO_API_KEY` under Project Settings → Environment Variables for Preview and Production. The deployed server routes will use the same variable; no client-side MongoDB credential is required. Vercel normally assigns its own runtime port automatically; the local `dev` and `start` scripts use `9676`.

## Data and access behavior

A public lookup accepts only a five-digit code. A public address update can update only the matching order's address and moves it to the shipping step. Admin `GET`, `POST`, and `PATCH` operations all require the `x-admin-code: admin3&` header and independently reject unauthorized requests server-side. The admin interface can create codes and edit Cargus AWB, order price, shipping price, and shipping-paid state.

The MongoDB document fields are `code`, `status`, `address`, `awb`, `orderPrice`, `shippingPrice`, `shippingPaid`, `createdAt`, and `updatedAt`.
