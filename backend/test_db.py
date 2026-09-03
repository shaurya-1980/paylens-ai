from sqlalchemy import text

from database import engine


try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

        print("✅ Neon PostgreSQL connected successfully!")
        print("Database test result:", result.scalar())

except Exception as e:
    print("❌ Database connection failed")
    print(e)