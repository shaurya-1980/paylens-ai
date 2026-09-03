from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Transaction


def get_failure_analysis(db: Session):
    # =========================================================
    # BASIC TRANSACTION STATISTICS
    # =========================================================

    total_transactions = (
        db.query(func.count(Transaction.id))
        .scalar()
        or 0
    )

    total_failures = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.status == "failed")
        .scalar()
        or 0
    )

    total_successful = (
        db.query(func.count(Transaction.id))
        .filter(Transaction.status == "success")
        .scalar()
        or 0
    )

    failure_rate = (
        (total_failures / total_transactions) * 100
        if total_transactions > 0
        else 0
    )

    success_rate = (
        (total_successful / total_transactions) * 100
        if total_transactions > 0
        else 0
    )

    # =========================================================
    # FAILURES GROUPED BY PAYMENT METHOD
    # =========================================================

    method_results = (
        db.query(
            Transaction.payment_method,
            func.count(Transaction.id)
        )
        .filter(Transaction.status == "failed")
        .group_by(Transaction.payment_method)
        .all()
    )

    failures_by_method = {
        method: count
        for method, count in method_results
        if method
    }

    # =========================================================
    # ALL PAYMENTS GROUPED BY PAYMENT METHOD
    # Used by Analytics / Dashboard charts
    # =========================================================

    payment_method_results = (
        db.query(
            Transaction.payment_method,
            func.count(Transaction.id)
        )
        .group_by(Transaction.payment_method)
        .all()
    )

    payments_by_method = {
        method: count
        for method, count in payment_method_results
        if method
    }

    # =========================================================
    # FAILURES GROUPED BY FAILURE REASON
    # Used by Failure Analysis page
    # =========================================================

    failure_reason_results = (
        db.query(
            Transaction.failure_reason,
            func.count(Transaction.id)
        )
        .filter(
            Transaction.status == "failed",
            Transaction.failure_reason.isnot(None)
        )
        .group_by(Transaction.failure_reason)
        .order_by(
            func.count(Transaction.id).desc()
        )
        .all()
    )

    failures_by_reason = {
        reason: count
        for reason, count in failure_reason_results
        if reason
    }

    # =========================================================
    # MOST COMMON FAILURE REASON
    # =========================================================

    reason_result = (
        db.query(
            Transaction.failure_reason,
            func.count(Transaction.id)
        )
        .filter(
            Transaction.status == "failed",
            Transaction.failure_reason.isnot(None)
        )
        .group_by(Transaction.failure_reason)
        .order_by(
            func.count(Transaction.id).desc()
        )
        .first()
    )

    most_common_reason = (
        reason_result[0]
        if reason_result
        else None
    )

    # =========================================================
    # REVENUE BY DAY
    # Used by Revenue Trend / Revenue Overview chart
    #
    # Only successful payments are counted as revenue.
    # =========================================================

    revenue_results = (
        db.query(
            func.date(Transaction.created_at),
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.status == "success"
        )
        .group_by(
            func.date(Transaction.created_at)
        )
        .order_by(
            func.date(Transaction.created_at)
        )
        .all()
    )

    revenue_by_day = {
        str(date): float(revenue or 0)
        for date, revenue in revenue_results
        if date
    }

    # =========================================================
    # TOTAL REVENUE
    # =========================================================

    total_revenue = (
        db.query(
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.status == "success"
        )
        .scalar()
        or 0
    )

    # =========================================================
    # RETURN COMPLETE ANALYTICS DATA
    # =========================================================

    return {
        # Basic statistics
        "total_transactions": total_transactions,
        "total_revenue": float(total_revenue),
        "successful_payments": total_successful,
        "failed_payments": total_failures,
        "success_rate": round(success_rate, 2),

        # Failure statistics
        "total_failures": total_failures,
        "failure_rate": round(failure_rate, 2),
        "failures_by_method": failures_by_method,
        "failures_by_reason": failures_by_reason,
        "most_common_failure_reason": most_common_reason,

        # Analytics chart data
        "payments_by_method": payments_by_method,
        "revenue_by_day": revenue_by_day,
    }