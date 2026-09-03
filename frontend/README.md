````markdown
# PayLens AI

> AI-powered payment intelligence and revenue recovery platform for analyzing payment performance, identifying failure patterns, and discovering revenue recovery opportunities.

## Overview

PayLens AI is a full-stack payment intelligence platform designed to help businesses understand their payment performance through a single, actionable dashboard.

It transforms transaction data into useful business insights through payment analytics, failure analysis, AI-generated insights, and revenue recovery opportunities.

## Problem

Businesses generate large amounts of payment transaction data, but raw transaction records do not clearly answer:

- How is payment performance changing?
- Which payment methods perform best?
- Why are payments failing?
- Which failure reasons occur most frequently?
- Which failed transactions may represent recovery opportunities?
- What areas should receive immediate attention?

PayLens AI addresses these challenges by combining payment analytics with AI-powered insights and recovery analysis.

## Solution

PayLens AI provides a centralized dashboard that enables users to:

1. Monitor payment performance
2. Track revenue and transactions
3. Analyze payment methods
4. Identify payment failure patterns
5. Generate AI-powered payment insights
6. Search and filter transactions
7. Inspect transaction details
8. Identify potential revenue recovery opportunities

## Key Features

### 📊 Payment Dashboard

- Total transactions
- Total successful revenue
- Successful payments
- Failed payments
- Success rate
- Revenue trends
- Payment-method distribution
- Payment health

### 💳 Transaction Management

A centralized transaction ledger containing:

- Transaction ID
- Payment ID
- Amount
- Payment method
- Status
- Customer information
- Failure reason
- Transaction timestamp

Transactions can be searched and filtered for faster analysis.

### 📈 Analytics

Visual analytics provide insights into:

- Revenue trends
- Payment-method distribution
- Successful vs failed transactions
- Overall payment performance

### ⚠️ Failure Analysis

PayLens AI analyzes failed transactions to identify:

- Failure rate
- Failure count
- Failure reasons
- Failure distribution
- Common failure patterns

This helps businesses understand recurring payment issues.

### 🤖 AI Insights

The AI layer analyzes payment performance and generates concise business-oriented insights.

It can highlight:

- Important payment trends
- Potential payment issues
- Areas requiring attention
- Revenue-impacting patterns

A fallback mechanism is implemented so the application can continue functioning when an AI response is unavailable or not returned in the expected format.

### 💰 Revenue Recovery

Failed payments are treated as potential recovery opportunities.

The Revenue Recovery section provides:

- Failed-payment queue
- Recovery opportunity indicators
- Transaction information
- Potential recovery-focused insights

### 🔎 Search & Filtering

Users can quickly locate transactions using:

- Payment ID
- Customer email
- Payment status
- Payment method

### 👁️ Transaction Details

Users can open individual transactions to inspect detailed payment information and determine whether a transaction represents a potential recovery opportunity.

### 🔐 Authentication

The application provides:

- User registration
- User login
- JWT-based authentication
- Logout

### 📱 Responsive Interface

The dashboard provides a responsive interface with mobile-friendly navigation.

## System Architecture

```text
                    ┌─────────────────────┐
                    │      User/Admin     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite UI   │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │       Python        │
                    └───────┬───────┬─────┘
                            │       │
                ┌───────────┘       └────────────┐
                ▼                                ▼
       ┌─────────────────┐              ┌─────────────────┐
       │ Neon PostgreSQL │              │   AI Service    │
       │  Transaction    │              │   OpenRouter    │
       │      Data       │              │      LLM        │
       └─────────────────┘              └─────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │    Razorpay      │
                   │ Payment Platform │
                   └──────────────────┘
````

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* Axios
* Recharts
* Lucide React
* CSS

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* HTTPX

### Database

* PostgreSQL
* Neon

### AI

* OpenRouter
* Large Language Model (LLM)

### Payments

* Razorpay

### Deployment

* Vercel — Frontend
* Render — Backend
* Neon — Database

## Project Structure

```text
paylens-ai/
│
├── backend/
│   ├── analytics.py
│   ├── auth.py
│   ├── database.py
│   ├── init_db.py
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   ├── seed_data.py
│   │
│   └── services/
│       └── ai_service.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/shaurya-1980/paylens-ai.git
cd paylens-ai
```

### 2. Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=your_postgresql_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SECRET_KEY=your_jwt_secret
```

Run the backend:

```bash
uvicorn main:app --reload
```

API:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Environment Variables

| Variable              | Purpose                             |
| --------------------- | ----------------------------------- |
| `DATABASE_URL`        | PostgreSQL/Neon database connection |
| `OPENROUTER_API_KEY`  | AI service access                   |
| `RAZORPAY_KEY_ID`     | Razorpay integration                |
| `RAZORPAY_KEY_SECRET` | Razorpay authentication             |
| `SECRET_KEY`          | JWT authentication                  |
| `FRONTEND_URL`        | Production frontend URL             |

> **Never commit `.env` files or API credentials to source control.**

## API Overview

| Endpoint         | Purpose             |
| ---------------- | ------------------- |
| `/`              | API status          |
| `/health`        | Health check        |
| `/auth/register` | User registration   |
| `/auth/login`    | User authentication |
| `/transactions`  | Transaction data    |
| `/analytics`     | Payment analytics   |

Interactive API documentation is available at:

```text
/docs
```

## Analytics

PayLens AI calculates important payment metrics from transaction data.

### Success Rate

```text
Success Rate =
Successful Payments / Total Transactions × 100
```

### Failure Rate

```text
Failure Rate =
Failed Payments / Total Transactions × 100
```

### Revenue

Revenue is calculated from successful payment transactions.

Transaction data is also analyzed by:

* Payment method
* Failure reason
* Transaction date
* Payment status

## AI Insight Pipeline

```text
Transaction Data
       │
       ▼
Analytics Engine
       │
       ▼
Payment Metrics
       │
       ▼
AI Service
       │
       ▼
LLM Analysis
       │
       ▼
Business Insight
```

The AI layer converts payment information into concise, business-oriented insights.

A fallback mechanism is included to maintain application functionality when the AI service does not return a usable response.

## Revenue Recovery

PayLens AI treats failed payments as potential recovery opportunities.

```text
Failed Transaction
        │
        ▼
Failure Analysis
        │
        ▼
Recovery Opportunity
        │
        ▼
Prioritize Action
```

This approach helps businesses focus on failed transactions that may have potential revenue recovery value.

## Security

The application uses:

* JWT-based authentication
* Password hashing
* Environment-based secret management
* API authentication
* CORS configuration
* Secure environment variables

Production secrets should always be stored through the deployment platform's environment-variable configuration.

## Buildathon Relevance

PayLens AI focuses on the intersection of:

* Payments
* Artificial Intelligence
* Payment intelligence
* Failure analysis
* Revenue recovery
* Actionable business insights

The objective is to move beyond simply displaying transaction data and provide businesses with actionable intelligence that can help them understand payment performance and identify opportunities to recover potentially lost revenue.

## Future Improvements

Potential enhancements include:

* Real-time Razorpay webhook processing
* Automated payment recovery workflows
* Intelligent retry recommendations
* Failure prediction
* Customer-level payment behavior analysis
* Recovery success tracking
* AI-powered payment optimization
* Advanced anomaly detection
* Automated recovery notifications
* Role-based access control

## Author

**Shaurya Pratap Singh**

GitHub:
[https://github.com/shaurya-1980/paylens-ai](https://github.com/shaurya-1980/paylens-ai)

## License

This project was developed as a buildathon/project submission and is intended for demonstration and educational purposes.

```
```
