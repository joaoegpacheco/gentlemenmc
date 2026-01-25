# Gentlemen Motorcycle Club - Management System

This is an internal management system built with [Next.js](https://nextjs.org/) v16, featuring a mobile-first responsive design, internationalization support, and comprehensive club management tools.

🌐 **Visit our website:** [www.gentlemenmc.com.br](https://www.gentlemenmc.com.br)

## About

This project is an internal system designed for the Gentlemen Motorcycle Club, providing comprehensive management tools for member activities, bar operations, financial tracking, inventory management, and administrative functions. The system supports multiple languages (Portuguese and English) and includes advanced features like real-time analytics, payment processing, and role-based access control.

## Features

### For All Members

#### 🍺 Bar Booking System
- Book drinks and items from the bar menu
- View booking history with payment status
- Real-time stock consumption tracking
- Automatic credit deduction when available
- Support for partial payment with credit
- Category-based drink selection (beers, premium beers, soft drinks, non-alcoholic beverages, energy drinks, shots, wines, snacks, cigarettes)
- Stock availability indicators

#### 📊 Personal Dashboard
- View all personal bookings and orders
- Track pending payments and debts
- Check current credit balance
- Filter and search booking history
- Real-time order status updates

#### 📅 Events Calendar
- View upcoming club events
- Track event dates and details
- FullCalendar integration for event planning
- Interactive calendar interface

#### 📋 Club Documents
- Access club statutes and rules
- View official club regulations (PDF viewer)
- Maintain compliance with club guidelines

#### 💰 Invoice Management
- View invoices for club events
- See divided amounts per participant
- Upload payment receipts
- Track payment status for each invoice
- Support for visitor registration

#### 🔐 Account Management
- Secure authentication system
- User profile management
- Password change functionality (when enabled)

#### 👤 User Profile
- View and edit personal information
- Update profile photo
- Manage personal details
- View membership status
- Profile photo upload with Supabase Storage

#### 🎂 Birthday Tracking
- View monthly birthdays of club members
- Birthday reminders in the main interface

### For Administrators

#### 📈 Financial Management
- View all member debts in a comprehensive table
- Generate payment links via WhatsApp integration
- Track payment status across all members
- Update payment records
- Financial reports and summaries
- Payment confirmation with admin authentication

#### 🍻 Comanda System (Guest Orders)
- Create comandas for non-member guests
- Add items to open comandas
- Mark comandas as paid with admin authentication
- Direct sale functionality (immediate payment)
- Print comanda receipts
- Guest information management (name, phone, associated member)
- Real-time stock validation
- Category-based product selection
- Mobile-optimized interface

#### 📦 Inventory Management
- Stock level tracking for all drinks
- Add and update inventory items
- Low stock alerts (threshold: 5 units)
- Inventory history and logs with detailed tracking
- Export inventory reports (PDF/CSV)
- Filter and search inventory by date and item
- Sortable columns (drink name, quantity)
- Pagination support
- Stock movement tracking (entrada/saida)
- User attribution for stock changes
- Final balance calculation by drink

#### 📊 Stock History
- Complete audit trail of all stock movements
- Filter by date range (start/end date)
- Filter by drink name
- Export to PDF with formatted tables
- Export to CSV for spreadsheet analysis
- Final balance summary by drink
- User attribution for each movement

#### 💳 Credit Management
- Add credits to member accounts
- Automatic debt payment with credits
- Track credit balance per member
- Credit history and transactions

#### ✅ Monthly Fee Management
- Record monthly fee payments
- View payment history
- Track membership status
- Payment confirmation interface

#### 👥 Member Management
- View all club members in a comprehensive table
- Access member information
- Create and edit member profiles
- Upload member photos
- Manage member status (active/inactive/suspended)
- Track member registration dates
- View member contact information
- Search and filter members
- Member profile view with detailed information

#### 📊 Administrative Dashboard
- **Overview Cards:**
  - Total debts tracking
  - Monthly revenue monitoring
  - Open orders count
  - Low stock items alerts
  - Active/inactive members count
  - Upcoming birthdays (next 7 days)

- **Analytics & Charts:**
  - Monthly revenue trends (last 12 months) - Line chart
  - Top 5 best-selling drinks - Bar chart
  - Top 5 consumer members - Bar chart
  - Consumption trend analysis (last 6 months) - Area chart
  - Drinks investment analysis with period filters (week/month/year)
  - Interactive chart tooltips and legends

- **Quick Tables:**
  - Recent paid orders (last 10)
  - Members with highest debt (top 5)
  - Recent stock movements (last 10)

- **Investment Insights:**
  - Best investment drink by revenue
  - Best-selling drink by quantity
  - Highest unit value analysis
  - Potential rating (High/Medium/Low)

- **Dashboard Features:**
  - Manual refresh functionality
  - Real-time data updates
  - Loading states and error handling
  - Responsive chart layouts

#### 🔍 Open Comandas Management
- View all open (unpaid) comandas
- Add items to existing comandas
- Update item quantities
- Mark comandas as paid with admin authentication
- View comanda details and items
- Real-time stock validation
- Guest and member information display

#### 📋 Paid Comandas History
- View complete history of paid comandas
- Filter and search paid orders
- View detailed order information
- Track payment dates and amounts

#### 🛒 Point of Sale (PDV)
- Dedicated point of sale interface
- Quick access to comanda creation
- Streamlined checkout process

### For Bar Users

#### 🍻 Bar Operations
- Create member bookings
- View member booking history
- Create guest comandas
- Manage open comandas
- View and update stock levels
- Access club statutes

### For Managers

#### 📋 Manager Access
- Create member bookings
- View member booking history
- View events calendar
- Access club statutes
- Manage inventory and stock
- View stock history
- User profile management

### System-Wide Features

#### 🌐 Internationalization (i18n)
- **Supported Languages:**
  - Portuguese (pt) - Default
  - English (en)
- **Features:**
  - Automatic locale detection based on browser/system language
  - Manual language switching via language toggle
  - Locale persistence via cookies (1 year)
  - URL-based locale routing (`/pt/...` or `/en/...`)
  - Complete translation coverage for all UI elements
  - Date and number formatting per locale

#### 🎨 Theme & UI
- **Dark Mode Support:**
  - Light theme
  - Dark theme
  - System theme (follows OS preference)
  - Theme persistence
  - Smooth theme transitions
- **UI Components:**
  - Modern, accessible components built with Radix UI
  - Responsive design for all screen sizes
  - Mobile-first approach
  - Touch-friendly interfaces
  - Loading states and skeletons
  - Toast notifications
  - Confirmation dialogs
  - Modal dialogs
  - Dropdown menus
  - Popovers and tooltips

#### 🔍 Global Search
- Search functionality across the system
- Quick access to features and data

#### 📱 Mobile Responsiveness
- Fully responsive design
- Mobile-optimized layouts
- Touch-friendly controls
- Adaptive UI components
- Media query hooks for responsive behavior

#### 🔐 Authentication & Security
- Supabase Authentication
- Role-based access control (RBAC)
- Protected routes via middleware
- Session management
- Secure password handling
- Admin authentication for sensitive operations

#### 💳 Payment Integration
- **InfinitePay Integration:** Secure payment processing
- **WhatsApp Notifications:** Automated payment link sharing
- **PIX Support:** Brazilian instant payment method
- **Payment Tracking:** Real-time payment status updates
- **Payment Return Page:** Handle payment callbacks and confirmations

#### 📄 Export & Reporting
- PDF export for inventory history
- CSV export for data analysis
- Formatted reports with tables
- Date range filtering for exports
- Customizable export parameters

#### 🖨️ Printing
- Comanda receipt printing
- HTML-to-PDF conversion
- Print-optimized layouts

## Tech Stack

### Core Framework
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript 5
- **React:** 18.x

### State Management
- **Legend State:** v3.0.0-beta.41 - Modern reactive state management with fine-grained reactivity

### UI & Styling
- **UI Components:** Radix UI (Alert Dialog, Checkbox, Dialog, Dropdown Menu, Label, Popover, Select, Tabs, Toast)
- **Styling:** Tailwind CSS 3.4.1
- **Icons:** Lucide React
- **Animations:** tailwindcss-animate

### Internationalization
- **next-intl:** v4.7.0 - Complete i18n solution for Next.js
- **Locale Support:** Portuguese (pt), English (en)

### Database & Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (when applicable)

### Forms & Validation
- **Form Handling:** React Hook Form 7.66.0
- **Validation:** Zod 4.1.12
- **Resolvers:** @hookform/resolvers 5.2.2

### Data Visualization
- **Charts:** Recharts 3.4.1
- **Calendar:** FullCalendar 6.1.15 (@fullcalendar/core, daygrid, interaction)
- **Date Picker:** react-day-picker 9.11.1

### Utilities
- **Date Handling:** date-fns 4.1.0, dayjs 1.11.13
- **PDF Generation:** jsPDF 3.0.2, jspdf-autotable 5.0.2
- **Printing:** print-js 1.6.0
- **UUID:** uuid 11.1.0
- **Responsive:** react-responsive 10.0.1

### Payment & Notifications
- **Payment Gateway:** InfinitePay
- **Notifications:** react-toastify 10.0.5

### Performance & Analytics
- **Speed Insights:** @vercel/speed-insights 1.2.0

### Development Tools
- **Linting:** ESLint 9
- **Type Checking:** TypeScript
- **Build Tool:** Next.js built-in

## Project Structure

```
gentlemenmc/
├── src/
│   ├── app/                          # Next.js app router pages
│   │   ├── [locale]/                 # Internationalized routes
│   │   │   ├── admin/                # Admin pages
│   │   │   │   ├── dashboard/       # Administrative dashboard
│   │   │   │   ├── estoque/          # Inventory management
│   │   │   │   │   └── historico/   # Stock history
│   │   │   │   └── membros/         # Member management
│   │   │   ├── comandas/             # Main application (member bookings)
│   │   │   ├── nova-comanda/         # Guest comanda creation
│   │   │   ├── pdv/                  # Point of Sale interface
│   │   │   ├── payment-return/       # Payment callback handler
│   │   │   └── page.tsx              # Home/login page
│   │   ├── api/                      # API routes
│   │   │   └── members/             # Member-related endpoints
│   │   │       ├── create-user/     # Create member account
│   │   │       └── update-photo/    # Update profile photo
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/                   # React components
│   │   ├── AuthListener.tsx         # Authentication state listener
│   │   ├── ByLaw/                   # Club statutes viewer
│   │   ├── Calendar/                # Events calendar
│   │   ├── CardDrinks/              # Member booking cards
│   │   ├── CardDrinksAll/           # All debts view
│   │   ├── CardMonthlyFee/          # Monthly fee management
│   │   ├── ChangePasswordForm/      # Password change (when enabled)
│   │   ├── CreditManager/           # Credit management (when enabled)
│   │   ├── Dashboard/               # Dashboard components
│   │   │   ├── Charts.tsx           # Analytics charts
│   │   │   ├── DashboardTab.tsx    # Dashboard tab wrapper
│   │   │   ├── QuickTables.tsx     # Quick view tables
│   │   │   └── StatsCards.tsx      # Statistics cards
│   │   ├── ErrorBoundary.tsx        # Error boundary component
│   │   ├── Form/                    # Member booking form
│   │   ├── FormMonthlyFee/          # Monthly fee form
│   │   ├── GlobalSearch.tsx         # Global search functionality
│   │   ├── InvoiceForm/             # Invoice creation
│   │   ├── InvoiceTable/            # Invoice listing
│   │   ├── layouts/                 # Layout components
│   │   │   └── AdminLayout.tsx     # Admin layout wrapper
│   │   ├── LoginForm/               # Login form
│   │   ├── LogoutButton/            # Logout button
│   │   ├── MemberForm/              # Member registration/edit
│   │   ├── MemberProfile/           # Member profile display
│   │   ├── OpenComandasPageContent/ # Open comandas management
│   │   ├── PaidComandasPageContent/ # Paid comandas history
│   │   ├── Tabs/                    # Main tabs component
│   │   ├── UserProfileForm/         # User profile form
│   │   ├── UserProfileTab/          # User profile tab
│   │   ├── language-toggle.tsx      # Language switcher
│   │   ├── mode-toggle.tsx          # Theme switcher
│   │   ├── theme-provider.tsx        # Theme provider
│   │   └── ui/                      # Reusable UI components
│   │       ├── alert-dialog.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumbs.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── command.tsx
│   │       ├── confirmation-dialog.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input-number.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── loading-skeletons.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── select-multiple.tsx
│   │       ├── select.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── spinner.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── upload.tsx
│   ├── constants/                    # Constants and configurations
│   │   └── drinks.ts                # Drink prices and categories
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-media-query.js      # Media query hook
│   │   ├── use-supabase.js         # Supabase client hook
│   │   ├── use-toast.ts            # Toast notification hook
│   │   └── useAsync.ts             # Async operation hook
│   ├── i18n/                        # Internationalization
│   │   ├── request.ts              # i18n request config
│   │   └── routing.ts              # i18n routing config
│   ├── lib/                         # Library utilities
│   │   ├── export-utils.ts         # Export utilities
│   │   ├── message.ts              # Message/notification utility
│   │   ├── notification.ts         # Notification helpers
│   │   ├── rate-limit.ts           # Rate limiting
│   │   ├── utils.ts                # General utilities
│   │   └── validations.ts          # Validation schemas
│   ├── services/                    # API service functions
│   │   ├── comandaService.ts       # Comanda operations
│   │   ├── dashboardService.ts     # Dashboard data fetching
│   │   └── estoqueService.ts       # Inventory operations
│   ├── stores/                      # Legend State stores
│   │   └── appStore.ts             # Application state store
│   ├── types/                       # TypeScript type definitions
│   │   ├── auth.ts                 # Authentication types
│   │   ├── database.ts             # Database types
│   │   └── index.ts                # General types
│   ├── utils/                       # Utility functions
│   │   ├── formatCurrency.js       # Currency formatting
│   │   ├── formatDate.js           # Date formatting
│   │   ├── formatDateTime.js       # DateTime formatting
│   │   └── mediaQueries.js         # Media query utilities
│   └── utils-client/                # Client-side utilities
│       └── printComandaHTML.ts     # Comanda printing utility
├── messages/                        # Translation files
│   ├── en.json                     # English translations
│   └── pt.json                     # Portuguese translations
├── public/                          # Static assets
│   ├── estatuto.pdf               # Club statutes PDF
│   └── images/                     # Images
│       └── gentlemenmc.png         # Club logo
├── middleware.ts                   # Next.js middleware (auth + i18n)
├── next.config.mjs                 # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## Key Technologies

### State Management
- **Legend State:** Modern reactive state management with fine-grained reactivity
  - Observable-based architecture
  - Automatic re-renders on state changes
  - Optimized performance
  - Type-safe state management

### Backend Services
- **Supabase:** Backend-as-a-Service for database, auth, and storage
  - PostgreSQL database
  - Row Level Security (RLS) policies
  - Real-time subscriptions
  - File storage for images
  - Authentication with email/password

### Internationalization
- **next-intl:** Complete i18n solution
  - Server and client components support
  - Automatic locale detection
  - Cookie-based locale persistence
  - URL-based routing
  - Type-safe translations

### UI Framework
- **Radix UI:** Accessible component primitives
- **Tailwind CSS:** Utility-first CSS framework
- **next-themes:** Theme management with system preference support

### Data Visualization
- **Recharts:** Composable charting library
- **FullCalendar:** Full-featured calendar component

### Form Management
- **React Hook Form:** Performant form handling with minimal re-renders
- **Zod:** TypeScript-first schema validation

### Date Handling
- **date-fns:** Modern date utility library with locale support
- **dayjs:** Lightweight date library

### PDF & Export
- **jsPDF:** PDF generation
- **jspdf-autotable:** Table generation in PDFs
- **print-js:** Client-side printing

## Development

### Prerequisites

- **Node.js:** 18+ (recommended: 20.x)
- **Package Manager:** npm, yarn, or bun
- **Supabase Account:** For database and authentication
- **Environment Variables:** Required Supabase credentials

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gentlemenmc

# Install dependencies
npm install
# or
yarn install
# or
bun install
```

### Environment Setup

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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

The application will automatically detect your browser language and route to the appropriate locale (`/pt` or `/en`).

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## User Roles

The system supports four distinct user roles with different access levels:

### Admin
- **Full System Access:**
  - All member features
  - Financial management (debts, payments)
  - Complete inventory management
  - Member management (create, edit, view)
  - Administrative dashboard with analytics
  - Open and paid comandas management
  - Stock history and exports
  - Monthly fee management

### Manager
- **Limited Administrative Access:**
  - All member features
  - Inventory management
  - Stock history viewing
  - Events calendar
  - Club statutes access
  - User profile management

### Bar User
- **Bar Operations Access:**
  - Create member bookings
  - View member booking history
  - Create guest comandas
  - Manage open comandas
  - View and update stock levels
  - Access club statutes

### Member
- **Standard Member Features:**
  - Bar booking system
  - Personal booking history
  - Events calendar
  - Club statutes
  - User profile management
  - Invoice viewing (when applicable)

## Features in Detail

### State Management
The project uses **Legend State** for reactive state management, providing:
- Fine-grained reactivity (only affected components re-render)
- Automatic re-renders on state changes
- Observable-based architecture
- Optimized performance with minimal overhead
- Type-safe state with TypeScript

### Payment Integration
- **InfinitePay Integration:** Secure payment processing for Brazilian market
- **WhatsApp Notifications:** Automated payment link sharing via WhatsApp
- **PIX Support:** Brazilian instant payment method integration
- **Payment Tracking:** Real-time payment status updates
- **Payment Return Handler:** Dedicated page for payment callbacks

### Mobile-First Design
- Responsive layout optimized for mobile devices
- Touch-friendly interface with appropriate hit targets
- Adaptive UI components that adjust to screen size
- Progressive Web App capabilities
- Media query hooks for responsive behavior
- Mobile-optimized forms and inputs

### Internationalization
- **Multi-language Support:** Portuguese (default) and English
- **Automatic Detection:** Browser/system language detection
- **Manual Switching:** Language toggle in header
- **Persistence:** Locale preference saved in cookies (1 year)
- **URL Routing:** Locale-based routing (`/pt/...`, `/en/...`)
- **Complete Coverage:** All UI elements translated
- **Locale-aware Formatting:** Dates, numbers, and currency formatted per locale

### Theme System
- **Dark Mode:** Full dark theme support
- **Light Mode:** Clean light theme
- **System Theme:** Automatic theme based on OS preference
- **Persistence:** Theme preference saved in localStorage
- **Smooth Transitions:** Animated theme switching
- **CSS Variables:** Theme colors managed via CSS variables

### Code Standards
- **UI Text:** Brazilian Portuguese for user-facing content (default)
- **Code:** English for variables, functions, and types
- **Comments:** English for code documentation
- **Commits:** Conventional commits in English
- **TypeScript:** Strict type checking enabled
- **ESLint:** Code quality and consistency

### Security
- **Authentication:** Supabase Auth with email/password
- **Role-Based Access Control:** Middleware-based route protection
- **Session Management:** Secure session handling
- **Admin Verification:** Password verification for sensitive operations
- **Protected Routes:** Automatic redirect to login for unauthenticated users

### Performance
- **Server Components:** Next.js App Router with server components
- **Code Splitting:** Automatic code splitting by route
- **Image Optimization:** Next.js Image component
- **Lazy Loading:** Dynamic imports for heavy components
- **Speed Insights:** Vercel Speed Insights integration

## API Endpoints

### Member Management
- `POST /api/members/create-user` - Create new member account
  - Creates user in Supabase Auth
  - Creates member record in database
  - Handles profile photo upload
  
- `POST /api/members/update-photo` - Update member profile photo
  - Uploads photo to Supabase Storage
  - Updates member record with photo URL

### Dashboard (Server-side)
- Dashboard statistics aggregation
- Monthly revenue calculations
- Member analytics
- Drink consumption analysis
- Stock movement tracking
- All calculations performed server-side for performance

## Deployment

The application is designed to be deployed on Vercel or any Node.js-compatible hosting platform.

### Vercel Deployment
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

This is a private internal system for the Gentlemen Motorcycle Club.

---

**Built with 🎩 for the Gentlemen Motorcycle Club**

*Version 2.0.0*
