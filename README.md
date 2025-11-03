# Gentlemen Motorcycle Club - Management System

This is an internal management system built with [Next.js](https://nextjs.org/) v14, featuring a mobile-first responsive design.

🌐 **Live Demo:** [https://gentlemenmc.vercel.app/](https://gentlemenmc.vercel.app/)

## About

This project is an internal system designed for the Gentlemen Motorcycle Club, providing comprehensive management tools for member activities, bar operations, financial tracking, and administrative functions.

## Features

### For All Members

#### 🍺 Bar Booking System
- Book drinks and items from the bar menu
- View booking history with payment status
- Real-time stock consumption tracking
- Automatic credit deduction when available
- Support for partial payment with credit

#### 📊 Personal Dashboard
- View all personal bookings and orders
- Track pending payments and debts
- Check current credit balance
- Filter and search booking history

#### 📅 Events Calendar
- View upcoming club events
- Track event dates and details
- Calendar integration for event planning

#### 📋 Club Documents
- Access club statutes and rules
- View official club regulations
- Maintain compliance with club guidelines

#### 💰 Invoice Management
- View invoices for club events
- See divided amounts per participant
- Upload payment receipts
- Track payment status for each invoice
- Support for visitor registration

#### 🔐 Account Management
- Change password functionality
- Secure authentication system
- User profile management

### For Administrators

#### 📈 Financial Management
- View all member debts in a comprehensive table
- Generate payment links via WhatsApp integration
- Track payment status across all members
- Update payment records
- Financial reports and summaries

#### 🍻 Comanda System (Guest Orders)
- Create comandas for non-member guests
- Add items to open comandas
- Mark comandas as paid
- Direct sale functionality
- Print comanda receipts

#### 📦 Inventory Management
- Stock level tracking for all drinks
- Add and update inventory items
- Low stock alerts
- Inventory history and logs
- Export inventory reports (PDF/CSV)
- Filter and search inventory by date and item

#### 💳 Credit Management
- Add credits to member accounts
- Automatic debt payment with credits
- Track credit balance per member
- Credit history and transactions

#### ✅ Monthly Fee Management
- Record monthly fee payments
- View payment history
- Track membership status

#### 👥 Member Management
- View all club members
- Access member information
- Manage member profiles

#### 🔍 Advanced Features
- Real-time data synchronization
- Role-based access control (Admin, Manager, Bar User, Member)
- Mobile-responsive design
- PIX payment integration
- WhatsApp payment notifications

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **State Management:** Legend State v3
- **UI Components:** Radix UI, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Payment Integration:** InfinitePay
- **Form Handling:** React Hook Form + Zod validation

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── admin/       # Admin-only pages
│   ├── comandas/    # Main application page
│   └── nova-comanda/# Guest comanda creation
├── components/      # React components
│   ├── ui/          # Reusable UI components
│   └── ...          # Feature-specific components
├── stores/          # Legend State stores
├── services/        # API service functions
├── hooks/           # Custom React hooks
└── utils/           # Utility functions
```

## Key Technologies

- **Legend State:** Modern reactive state management with fine-grained reactivity
- **Supabase:** Backend-as-a-Service for database, auth, and storage
- **TypeScript:** Type-safe development
- **Tailwind CSS:** Utility-first CSS framework
- **React Hook Form:** Performant form handling
- **Zod:** Schema validation

## Development

### Prerequisites

- Node.js 18+ 
- npm, yarn, or bun

### Installation

```bash
npm install
# or
yarn install
# or
bun install
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## User Roles

- **Admin:** Full system access including financial management, inventory, and member management
- **Manager:** Limited administrative access to inventory and events
- **Bar User:** Access to bar operations, comandas, and inventory
- **Member:** Standard member features (bookings, invoices, calendar)

## Features in Detail

### State Management
The project uses **Legend State** for reactive state management, providing:
- Fine-grained reactivity
- Automatic re-renders on state changes
- Observable-based architecture
- Optimized performance

### Payment Integration
- **InfinitePay Integration:** Secure payment processing
- **WhatsApp Notifications:** Automated payment link sharing
- **PIX Support:** Brazilian instant payment method
- **Payment Tracking:** Real-time payment status updates

### Mobile-First Design
- Responsive layout optimized for mobile devices
- Touch-friendly interface
- Adaptive UI components
- Progressive Web App capabilities

## License

This is a private internal system for the Gentlemen Motorcycle Club.

---

**Built with ❤️ for the Gentlemen Motorcycle Club**
