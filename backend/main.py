import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv

from auth import router as auth_router
from analytics import get_failure_analysis
from services.ai_service import generate_ai_insight

from database import Base, engine, get_db
from models import Transaction


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="PayLens AI",
    description="AI-powered payment intelligence platform",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTHENTICATION ROUTES
# ============================================================

app.include_router(auth_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "PayLens AI API is running",
        "status": "success"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ============================================================
# CREATE TRANSACTION
# ============================================================

@app.post("/transactions")
def create_transaction(
    payment_id: str,
    amount: float,
    status: str,
    payment_method: str,
    customer_email: str | None = None,
    failure_reason: str | None = None,
    db: Session = Depends(get_db)
):

    transaction = Transaction(
        payment_id=payment_id,
        amount=amount,
        currency="INR",
        status=status,
        payment_method=payment_method,
        customer_email=customer_email,
        failure_reason=failure_reason
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "message": "Transaction created successfully",
        "transaction": {
            "id": transaction.id,
            "payment_id": transaction.payment_id,
            "amount": transaction.amount,
            "status": transaction.status,
            "payment_method": transaction.payment_method
        }
    }


# ============================================================
# GET TRANSACTIONS
# ============================================================

@app.get("/transactions")
def get_transactions(
    status: str | None = None,
    payment_method: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(Transaction)

    # --------------------------------------------------------
    # Filter by payment status
    # --------------------------------------------------------

    if status:
        query = query.filter(
            Transaction.status == status
        )

    # --------------------------------------------------------
    # Filter by payment method
    # --------------------------------------------------------

    if payment_method:
        query = query.filter(
            Transaction.payment_method == payment_method
        )

    # --------------------------------------------------------
    # Search by payment ID or customer email
    # --------------------------------------------------------

    if search:
        search_pattern = f"%{search}%"

        query = query.filter(
            (Transaction.payment_id.ilike(search_pattern))
            |
            (Transaction.customer_email.ilike(search_pattern))
        )

    # --------------------------------------------------------
    # Get transactions
    # --------------------------------------------------------

    transactions = (
        query
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return transactions


# ============================================================
# ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db)
):

    # ========================================================
    # BASIC STATISTICS
    # ========================================================

    total_transactions = (
        db.query(func.count(Transaction.id))
        .scalar()
        or 0
    )

    total_revenue = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.status == "success"
        )
        .scalar()
        or 0
    )

    successful_payments = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.status == "success"
        )
        .scalar()
        or 0
    )

    failed_payments = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.status == "failed"
        )
        .scalar()
        or 0
    )

    success_rate = (
        (successful_payments / total_transactions) * 100
        if total_transactions > 0
        else 0
    )

    # ========================================================
    # ADVANCED ANALYTICS
    # ========================================================

    failure_analysis_data = get_failure_analysis(db)

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "total_transactions": total_transactions,

        "total_revenue": round(
            float(total_revenue),
            2
        ),

        "successful_payments": successful_payments,

        "failed_payments": failed_payments,

        "success_rate": round(
            success_rate,
            2
        ),

        "payments_by_method":
            failure_analysis_data.get(
                "payments_by_method",
                {}
            ),

        "failures_by_reason":
            failure_analysis_data.get(
                "failures_by_reason",
                {}
            ),

        "revenue_by_day":
            failure_analysis_data.get(
                "revenue_by_day",
                {}
            ),

        "failures_by_method":
            failure_analysis_data.get(
                "failures_by_method",
                {}
            ),

        "total_failures":
            failure_analysis_data.get(
                "total_failures",
                failed_payments
            ),

        "failure_rate":
            failure_analysis_data.get(
                "failure_rate",
                round(
                    (
                        failed_payments /
                        total_transactions
                    ) * 100,
                    2
                )
                if total_transactions > 0
                else 0
            ),

        "most_common_failure_reason":
            failure_analysis_data.get(
                "most_common_failure_reason"
            ),
    }


# ============================================================
# FAILURE ANALYSIS
# ============================================================

@app.get("/failure-analysis")
def failure_analysis(
    db: Session = Depends(get_db)
):

    return get_failure_analysis(db)


# ============================================================
# AI INSIGHT
# ============================================================

@app.get("/ai-insight")
async def ai_insight(
    db: Session = Depends(get_db)
):

    payment_data = get_failure_analysis(db)

    insight = await generate_ai_insight(
        payment_data
    )

    return insight