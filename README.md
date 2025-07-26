# Grocery Store POS System

A comprehensive Point of Sale system optimized for grocery stores, built with React, Node.js, Express, and MongoDB.

## Features

### Core Transaction Features
- ✅ **Barcode Scanning** - Fast, accurate scanning with manual entry backup
- ✅ **Inventory Management** - Real-time stock tracking with low-stock alerts
- ✅ **Multiple Payment Methods** - Cash, credit/debit cards, EBT/SNAP, mobile payments
- ✅ **Tax Calculations** - Automated tax computation with tax-exempt support
- ✅ **Receipt Processing** - Digital and printed receipts

### Grocery-Specific Optimizations
- ✅ **Weight-based Pricing** - Scale integration for produce and deli items
- ✅ **PLU (Price Look-Up) Codes** - Quick entry system for produce items
- ✅ **Age Verification** - Automatic prompts for alcohol and tobacco
- ✅ **Coupon Management** - Digital and paper coupon processing
- ✅ **Loyalty Program** - Points-based customer rewards system

### Performance & Efficiency Features
- ✅ **Fast Transaction Processing** - Optimized UI with keyboard shortcuts
- ✅ **Multi-user Support** - Role-based access control
- ✅ **Real-time Updates** - WebSocket integration for live inventory updates
- ✅ **Offline Capability** - Continue operations during outages

### Backend Management
- ✅ **Sales Reporting** - Daily sales, product performance, trends
- ✅ **Employee Management** - Time tracking and performance metrics
- ✅ **Customer Database** - Purchase history and targeted promotions
- ✅ **Inventory Tracking** - Stock levels, reorder points, expiration dates

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd grocery-pos
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

5. **Seed initial data (optional)**
   ```bash
   npm run seed
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start the React development server**
   ```bash
   npm start
   ```

### Production Deployment

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/grocery-pos

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Application
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Hardware Integration
SCALE_PORT=COM3
RECEIPT_PRINTER_IP=192.168.1.100
```

### Database Setup

The system will automatically create the necessary collections. For initial setup with sample data, you can run:

```bash
node scripts/seedData.js
```

## Usage

### Default Login Credentials
- **Employee ID**: EMP001
- **Password**: password123
- **Role**: Manager (full permissions)

### Main Features

1. **POS Terminal**
   - Scan or manually enter product barcodes
   - Use PLU lookup for produce items
   - Add customers to transactions
   - Process multiple payment methods
   - Handle age-restricted items

2. **Inventory Management**
   - Track stock levels in real-time
   - Set reorder points and low-stock alerts
   - Manage product information
   - Handle weight-based pricing

3. **Customer Management**
   - Create and manage customer profiles
   - Loyalty program enrollment
   - Purchase history tracking
   - Points redemption

4. **Reporting**
   - Daily sales reports
   - Product performance analytics
   - Employee performance tracking
   - Inventory valuation

## Hardware Integration

### Barcode Scanners
- Supports USB HID barcode scanners
- Automatic barcode detection
- Manual entry fallback

### Scale Integration
- Weight-based pricing for produce
- Real-time weight readings
- Tare functionality
- Manual weight entry option

### Receipt Printers
- Thermal receipt printers supported
- Customizable receipt templates
- Digital receipt options

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/clock-in` - Clock in
- `POST /api/auth/clock-out` - Clock out

### Product Endpoints
- `GET /api/products/search` - Search products
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `GET /api/products/plu/:plu` - Get product by PLU
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `PUT /api/products/:id/stock` - Update stock

### Transaction Endpoints
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get transactions
- `PUT /api/transactions/:id/void` - Void transaction
- `POST /api/transactions/:id/refund` - Process refund

### Customer Endpoints
- `GET /api/customers/search` - Search customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `POST /api/customers/:id/loyalty/redeem` - Redeem points

## Development

### Running Tests
```bash
npm test
```

### Code Formatting
```bash
npm run format
```

### Type Checking
```bash
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## Roadmap

### Upcoming Features
- Mobile app for inventory management
- Advanced analytics dashboard
- Multi-store support
- Cloud deployment options
- Integration with accounting systems
- Voice commands for hands-free operation
- Advanced security features
- Supplier management system

### Performance Optimizations
- Database indexing improvements
- Caching layer implementation
- Load balancing support
- Background job processing

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Role-based access control
- Input validation and sanitization
- HTTPS recommended for production
- Regular security updates

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network connectivity

2. **Scale Not Connecting**
   - Check COM port configuration
   - Verify hardware connections
   - Test with scale diagnostic tools

3. **Barcode Scanner Not Working**
   - Ensure USB HID mode is enabled
   - Check scanner configuration
   - Try manual barcode entry

4. **Performance Issues**
   - Check database indexes
   - Monitor memory usage
   - Optimize query patterns

### Getting Help

- Check the logs in `logs/` directory
- Enable debug mode with `DEBUG=*`
- Review error messages in browser console
- Contact technical support