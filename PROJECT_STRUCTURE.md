# Project Structure

```
grocery-pos/
├── README.md                     # Comprehensive documentation
├── package.json                  # Backend dependencies and scripts
├── server.js                     # Main server entry point
├── .env                          # Environment configuration
├── PROJECT_STRUCTURE.md          # This file
│
├── models/                       # MongoDB data models
│   ├── User.js                   # Employee/user management
│   ├── Product.js                # Product catalog
│   ├── Transaction.js            # Sales transactions
│   ├── Customer.js               # Customer data and loyalty
│   └── Coupon.js                 # Coupon and discount management
│
├── routes/                       # API endpoints
│   ├── auth.js                   # Authentication routes
│   ├── products.js               # Product management
│   ├── transactions.js           # Transaction processing
│   ├── customers.js              # Customer management
│   ├── inventory.js              # Inventory operations
│   ├── coupons.js                # Coupon management
│   ├── scales.js                 # Scale integration
│   └── reports.js                # Reporting and analytics
│
├── middleware/                   # Express middleware
│   └── auth.js                   # Authentication middleware
│
├── scripts/                      # Utility scripts
│   └── seedData.js               # Database seeding
│
└── client/                       # React frontend
    ├── package.json              # Frontend dependencies
    ├── tsconfig.json             # TypeScript configuration
    ├── public/
    │   └── index.html
    │
    └── src/
        ├── index.tsx             # App entry point
        ├── App.tsx               # Main app component
        │
        ├── types/                # TypeScript type definitions
        │   └── index.ts
        │
        ├── store/                # Zustand state management
        │   ├── authStore.ts      # Authentication state
        │   └── cartStore.ts      # Shopping cart state
        │
        ├── services/             # API integration
        │   └── api.ts            # API client and endpoints
        │
        ├── components/           # Reusable UI components
        │   ├── Layout.tsx        # Main layout wrapper
        │   ├── BarcodeScanner.tsx # Barcode scanning
        │   ├── PLULookup.tsx     # PLU code lookup
        │   ├── CustomerSelector.tsx # Customer selection
        │   ├── PaymentDialog.tsx # Payment processing
        │   └── ScaleIntegration.tsx # Scale functionality
        │
        ├── pages/                # Main application pages
        │   ├── Login.tsx         # Authentication page
        │   ├── POS.tsx           # Point of sale terminal
        │   ├── Inventory.tsx     # Inventory management
        │   ├── Customers.tsx     # Customer management
        │   ├── Reports.tsx       # Reports and analytics
        │   └── Settings.tsx      # System settings
        │
        ├── hooks/                # Custom React hooks
        │
        └── utils/                # Utility functions
            └── formatters.ts     # Data formatting utilities
```

## Key Features by File

### Backend Core (`server.js`)
- Express server setup
- MongoDB connection
- Socket.io integration for real-time updates
- Route mounting and middleware

### Models
- **User.js**: Employee management, roles, permissions, time tracking
- **Product.js**: Product catalog, pricing, inventory, categories
- **Transaction.js**: Sales processing, payments, tax calculation
- **Customer.js**: Customer profiles, loyalty program, purchase history
- **Coupon.js**: Discount management, validation rules

### Routes (API Endpoints)
- **auth.js**: Login/logout, clock in/out, employee management
- **products.js**: Product CRUD, barcode/PLU lookup, stock management
- **transactions.js**: Transaction processing, refunds, void operations
- **customers.js**: Customer CRUD, loyalty operations, search
- **inventory.js**: Stock management, reorder alerts, valuation
- **coupons.js**: Coupon CRUD, validation, redemption
- **scales.js**: Weight reading, scale integration
- **reports.js**: Sales analytics, performance metrics

### Frontend Core
- **App.tsx**: Main application routing and layout
- **Layout.tsx**: Navigation, user authentication status
- **POS.tsx**: Main point-of-sale interface

### State Management (Zustand)
- **authStore.ts**: User authentication, session management
- **cartStore.ts**: Shopping cart, scale integration, calculations

### Key Components
- **BarcodeScanner.tsx**: Barcode input, hardware integration
- **PLULookup.tsx**: Produce code lookup with common PLUs
- **CustomerSelector.tsx**: Customer search and selection
- **PaymentDialog.tsx**: Multi-payment processing
- **ScaleIntegration.tsx**: Weight-based pricing, scale control

## Development Workflow

1. **Backend Development**: Start with models → routes → middleware
2. **Frontend Development**: Types → services → store → components → pages
3. **Integration**: API connections → real-time updates → hardware integration
4. **Testing**: Unit tests → integration tests → user acceptance testing

## Deployment Checklist

1. Set production environment variables
2. Build React frontend (`npm run build`)
3. Configure MongoDB connection
4. Set up hardware integrations (scales, printers, scanners)
5. Create initial admin user
6. Seed product catalog
7. Configure SSL certificates
8. Set up monitoring and logging
9. Test all payment methods
10. Train staff on system usage

## Security Features

- JWT authentication with role-based access
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Session management
- Permission-based route protection

## Performance Optimizations

- Database indexing on frequently queried fields
- Real-time updates via WebSocket
- Efficient state management
- Lazy loading of components
- Image optimization
- Caching strategies
- Query optimization

## Hardware Integration Points

- **Barcode Scanners**: USB HID input detection
- **Scales**: Serial communication for weight reading
- **Receipt Printers**: Network/USB thermal printer support
- **Cash Drawers**: Automatic opening on cash transactions
- **Customer Displays**: Real-time transaction information