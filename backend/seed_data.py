import random
from datetime import datetime, timedelta

from database import SessionLocal
from models import Transaction


PAYMENT_METHODS = [
    "upi",
    "card",
    "netbanking",
    "wallet"
]

SUCCESS_REASONS = [
    None
]

FAILURE_REASONS = [
    "Insufficient funds",
    "Payment declined",
    "Bank server unavailable",
    "Transaction timeout",
    "Incorrect card details",
    "Daily transaction limit exceeded"
]


def generate_transactions(count=150):
    db = SessionLocal()

    try:
        for i in range(count):

            payment_method = random.choice(PAYMENT_METHODS)

            # Slightly different failure probabilities
            if payment_method == "upi":
                success_probability = 0.93
            elif payment_method == "card":
                success_probability = 0.91
            elif payment_method == "netbanking":
                success_probability = 0.88
            else:
                success_probability = 0.95

            is_success = random.random() < success_probability

            status = "success" if is_success else "failed"

            failure_reason = (
                None
                if is_success
                else random.choice(FAILURE_REASONS)
            )

            transaction = Transaction(
                payment_id=f"pay_demo_{i + 1:04d}",
                amount=round(random.uniform(100, 25000), 2),
                currency="INR",
                status=status,
                payment_method=payment_method,
                customer_email=f"customer{i + 1}@example.com",
                failure_reason=failure_reason,
                created_at=datetime.utcnow()
                - timedelta(
                    days=random.randint(0, 30),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
            )

            db.add(transaction)

        db.commit()

        print(f"✅ Successfully added {count} demo transactions!")

    except Exception as e:
        db.rollback()
        print("❌ Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    generate_transactions(150)