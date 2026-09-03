from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, Text

from database import Base


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# TRANSACTION MODEL
# ============================================================

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    payment_id = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    currency = Column(
        String(10),
        nullable=False,
        default="INR"
    )

    status = Column(
        String(30),
        nullable=False
    )

    payment_method = Column(
        String(50),
        nullable=True
    )

    customer_email = Column(
        String(150),
        nullable=True
    )

    failure_reason = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# AI INSIGHT MODEL
# ============================================================

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    insight = Column(
        Text,
        nullable=False
    )

    recommendation = Column(
        Text,
        nullable=True
    )

    severity = Column(
        String(30),
        nullable=False,
        default="info"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )