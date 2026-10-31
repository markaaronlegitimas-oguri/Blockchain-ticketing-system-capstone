# Progressive Music Philippines — Blockchain-based Digital Ticketing and Event Management System

Capstone Project 2 · Group 18 (Legitimas, Celestial, Ramos)

A web platform for selling and checking music-event tickets. Each ticket is issued by a smart contract on the
Ethereum **Sepolia** test network, so it cannot be duplicated or faked. Attendees buy with MetaMask and receive a
one-time QR code; staff scan it at the gate; organizers follow sales and entry live.

## What it does

| Objective | Feature in the system |
|---|---|
| 1a Registration, login, roles | Supabase Auth with attendee, staff, organizer and admin roles enforced by the API |
| 1b Blockchain ticket issuance | `EventTicket.sol` issues tickets on Sepolia; every purchase is verified on-chain before it is recorded |
| 1c QR authentication | Unique QR per ticket; staff scanner approves once and denies duplicates; check-in is mirrored on-chain |
| 1d Smart contract rules | Purchase, transfer, cancellation, refund and validation rules live in the contract |
| 1e Real-time dashboard | Sales, check-ins, revenue and tier availability, refreshed every 2 seconds |
| 1f Report generation | Sales and attendance reports as CSV |
| 1g Online ticket purchase | Reserve a ticket tier for 10 minutes, then pay with MetaMask |
| 1h Automated notifications | In-app alerts for confirmation, check-in, transfer, event reminders (24 h before) and organizer announcements |

Also included: ticket tiers per session and ticket transfer between accounts.

## Architecture

```
React + TypeScript (Vite, MUI)  ──/api──▶  Node.js / Express  ──▶  Supabase (PostgreSQL + Auth)
        │                                          │
        └──── MetaMask / ethers ─────────────────▶ EventTicket.sol on Sepolia ◀── ethers (server wallet)
```

* The **blockchain** is the source of truth for ticket ownership and status.
* **Supabase** stores users, events, sessions, ticket tiers, bookings, QR codes and notifications.
* The **backend** verifies each transaction on-chain before it records a ticket.

## Repository layout

```
backend/     Express API: auth, events, slots and bookings, tickets, dashboard, reports, notifications
contracts/   Hardhat project with EventTicket.sol
database/    SQL for tables that are not created from the Supabase dashboard
frontend/    React app
  src/app        theme and color mode
  src/layout     app shell, top bar, navigation
  src/features   auth, wallet, events, tickets, dashboard, scanner, notifications
  src/lib        API client, formatting, role rules, contract helpers and ABI
```

## Roles

| Role | Can do |
|---|---|
| attendee | Browse events, buy and transfer tickets, show the entry QR |
| staff | Scan tickets at the gate, view the dashboard |
| organizer | View the dashboard and reports, send announcements, issue tickets |
| admin | Everything above, and promote users |

## Running it locally

Requires Node.js 20+, a MetaMask wallet on Sepolia with some test ETH, a Supabase project and a deployed
`EventTicket` contract.

1. **Backend**
   ```bash
   cd backend
   cp .env.example .env      # fill in the values
   npm install
   node index.js             # http://localhost:3000
   ```
2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env      # set VITE_CONTRACT_ADDRESS to the same address as the backend
   npm install
   npm run dev               # http://localhost:5173 (the dev server proxies /api to the backend)
   ```
3. **Tests and build**
   ```bash
   cd frontend
   npm test                  # unit and component tests
   npm run build             # type-check and production build
   ```

## Known limitations

* Runs on the Sepolia **test** network only; payment is in test ETH through MetaMask, not a local payment gateway.
* The QR payload is a unique string stored in the database. It is not cryptographically signed.
* Ticket-tier prices are stored in the database; the contract charges one on-chain price per event.
* Booking holds are checked before insert; a database constraint would be safer under heavy concurrent load.
* The dashboard refreshes by polling every 2 seconds rather than by push.

## Acknowledgements

The first version of the frontend started from a scaffold in the open-source project
[adelitoo/Blockchain-ticketing-system](https://github.com/adelitoo/Blockchain-ticketing-system). That scaffold has since
been replaced with a new implementation. The smart contract, backend, authentication, slot booking, purchase
verification, dashboard, reports, scanner and notifications were developed for this capstone.
