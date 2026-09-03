import os
import json

import httpx
from dotenv import load_dotenv


# =============================================================
# ENVIRONMENT CONFIGURATION
# =============================================================

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# OpenRouter automatically selects an available free model
MODEL = "openrouter/free"


# =============================================================
# AI INSIGHT GENERATOR
# =============================================================

async def generate_ai_insight(payment_data: dict):

    # ---------------------------------------------------------
    # 1. Check API key
    # ---------------------------------------------------------

    if not OPENROUTER_API_KEY:

        print("⚠️ OPENROUTER_API_KEY not found.")
        print("🔄 Using local AI fallback.")

        return generate_local_insight(payment_data)

    print("🔑 OpenRouter API key detected.")
    print("🚀 Calling OpenRouter AI...")


    # ---------------------------------------------------------
    # 2. AI Prompt
    # ---------------------------------------------------------

    prompt = f"""
You are PayLens AI, a payment intelligence assistant.

Analyze the following payment analytics data:

{json.dumps(payment_data, indent=2)}

Your job is to identify important payment patterns,
potential revenue leakage, payment failures, and
actionable business opportunities.

You MUST return ONLY a valid JSON object.

Do not use markdown.
Do not use ``` characters.
Do not add any explanation before or after the JSON.

Your response MUST start with {{ and end with }}.

Use exactly this structure:

{{
    "title": "Short insight title",
    "insight": "Explain the important payment pattern",
    "recommendation": "Give one practical recommendation",
    "severity": "info"
}}

Severity must be exactly one of:

info
warning
critical

Focus on:

- payment failures
- payment success rate
- payment methods
- failure reasons
- possible revenue leakage
- actionable recommendations

Keep the response concise and business-oriented.
"""


    # ---------------------------------------------------------
    # 3. Request headers
    # ---------------------------------------------------------

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "PayLens AI"
    }


    # ---------------------------------------------------------
    # 4. Request payload
    # ---------------------------------------------------------

    payload = {
        "model": MODEL,

        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],

        "temperature": 0.2,

        "max_tokens": 400
    }


    # ---------------------------------------------------------
    # 5. Call OpenRouter
    # ---------------------------------------------------------

    try:

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload
            )


        print(
            f"📡 OpenRouter HTTP status: "
            f"{response.status_code}"
        )


        # -----------------------------------------------------
        # 6. Handle HTTP errors
        # -----------------------------------------------------

        response.raise_for_status()


        # -----------------------------------------------------
        # 7. Parse API response
        # -----------------------------------------------------

        result = response.json()

        print("✅ OpenRouter response received!")


        if "choices" not in result:

            print(
                "⚠️ Unexpected OpenRouter response."
            )

            print(
                "🔄 Using local AI fallback."
            )

            return generate_local_insight(
                payment_data
            )


        if not result["choices"]:

            print(
                "⚠️ OpenRouter returned no choices."
            )

            print(
                "🔄 Using local AI fallback."
            )

            return generate_local_insight(
                payment_data
            )


        content = result[
            "choices"
        ][0][
            "message"
        ][
            "content"
        ]


        # -----------------------------------------------------
        # 8. Clean AI response
        # -----------------------------------------------------

        if not content:

            print(
                "⚠️ Empty response from AI."
            )

            print(
                "🔄 Using local AI fallback."
            )

            return generate_local_insight(
                payment_data
            )


        content = content.strip()


        # Remove markdown code fences

        content = content.replace(
            "```json",
            ""
        )

        content = content.replace(
            "```",
            ""
        )

        content = content.strip()


        # -----------------------------------------------------
        # 9. Parse JSON
        # -----------------------------------------------------

        try:

            ai_result = json.loads(
                content
            )

            print(
                "✅ AI returned valid JSON."
            )

        except json.JSONDecodeError:

            print(
                "⚠️ AI returned non-standard JSON."
            )

            print(
                "🔍 Attempting to extract JSON..."
            )

            # Find first { and last }

            start = content.find("{")

            end = content.rfind("}")


            if (
                start != -1
                and end != -1
                and end > start
            ):

                json_text = content[
                    start:end + 1
                ]

                try:

                    ai_result = json.loads(
                        json_text
                    )

                    print(
                        "✅ JSON successfully extracted."
                    )

                except json.JSONDecodeError:

                    print(
                        "❌ Could not parse extracted JSON."
                    )

                    print(
                        "🔄 Using local AI fallback."
                    )

                    return generate_local_insight(
                        payment_data
                    )

            else:

                print(
                    "❌ No JSON object found."
                )

                print(
                    "🔄 Using local AI fallback."
                )

                return generate_local_insight(
                    payment_data
                )


        # -----------------------------------------------------
        # 10. Validate response type
        # -----------------------------------------------------

        if not isinstance(
            ai_result,
            dict
        ):

            print(
                "⚠️ AI response is not a JSON object."
            )

            print(
                "🔄 Using local AI fallback."
            )

            return generate_local_insight(
                payment_data
            )


        # -----------------------------------------------------
        # 11. Validate required fields
        # -----------------------------------------------------

        required_fields = [
            "title",
            "insight",
            "recommendation",
            "severity"
        ]


        missing_fields = [
            field
            for field in required_fields
            if field not in ai_result
        ]


        if missing_fields:

            print(
                "⚠️ AI response missing fields:",
                missing_fields
            )

            print(
                "🔄 Using local AI fallback."
            )

            return generate_local_insight(
                payment_data
            )


        # -----------------------------------------------------
        # 12. Validate severity
        # -----------------------------------------------------

        if ai_result["severity"] not in [
            "info",
            "warning",
            "critical"
        ]:

            print(
                "⚠️ Invalid severity returned."
            )

            ai_result["severity"] = "info"


        # -----------------------------------------------------
        # 13. Success
        # -----------------------------------------------------

        print(
            "🧠 AI insight generated successfully!"
        )

        return ai_result


    # ---------------------------------------------------------
    # 14. HTTP errors
    # ---------------------------------------------------------

    except httpx.HTTPStatusError as e:

        print(
            f"❌ OpenRouter HTTP error: "
            f"{e.response.status_code}"
        )

        try:

            print(
                "OpenRouter response:",
                e.response.text[:500]
            )

        except Exception:
            pass


        print(
            "🔄 Using local AI fallback."
        )

        return generate_local_insight(
            payment_data
        )


    # ---------------------------------------------------------
    # 15. Connection / unexpected errors
    # ---------------------------------------------------------

    except Exception as e:

        print(
            f"❌ OpenRouter error: {str(e)}"
        )

        print(
            "🔄 Using local AI fallback."
        )

        return generate_local_insight(
            payment_data
        )


# =============================================================
# LOCAL AI FALLBACK
# =============================================================

def generate_local_insight(
    payment_data: dict
):

    # ---------------------------------------------------------
    # Extract analytics
    # ---------------------------------------------------------

    total = payment_data.get(
        "total_transactions",
        0
    )

    failures = payment_data.get(
        "total_failures",
        0
    )

    failure_rate = payment_data.get(
        "failure_rate",
        0
    )

    failures_by_method = payment_data.get(
        "failures_by_method",
        {}
    )

    common_reason = payment_data.get(
        "most_common_failure_reason"
    )


    # ---------------------------------------------------------
    # No transaction data
    # ---------------------------------------------------------

    if total == 0:

        return {
            "title": "No Payment Data",

            "insight":
                "There are currently no transactions "
                "available for analysis.",

            "recommendation":
                "Add payment transactions to generate "
                "payment intelligence.",

            "severity": "info"
        }


    # ---------------------------------------------------------
    # Find payment method with highest failures
    # ---------------------------------------------------------

    top_method = None

    if failures_by_method:

        top_method = max(
            failures_by_method,
            key=failures_by_method.get
        )


    # ---------------------------------------------------------
    # Determine severity
    # ---------------------------------------------------------

    if failure_rate >= 10:

        severity = "critical"

    elif failure_rate >= 5:

        severity = "warning"

    else:

        severity = "info"


    # ---------------------------------------------------------
    # Payment method message
    # ---------------------------------------------------------

    if top_method:

        method_text = (
            f"{top_method} has the highest number "
            f"of payment failures."
        )

    else:

        method_text = (
            "No dominant payment method failure "
            "was detected."
        )


    # ---------------------------------------------------------
    # Failure reason message
    # ---------------------------------------------------------

    if common_reason:

        reason_text = (
            f"The most common failure reason is "
            f"'{common_reason}'."
        )

    else:

        reason_text = ""


    # ---------------------------------------------------------
    # Build insight
    # ---------------------------------------------------------

    insight = (
        f"{failures} out of {total} transactions failed, "
        f"resulting in a failure rate of "
        f"{failure_rate}%. "
        f"{method_text} "
        f"{reason_text}"
    )


    # ---------------------------------------------------------
    # Recommendation
    # ---------------------------------------------------------

    recommendation = (
        "Investigate the dominant failure category "
        "and prioritize retry or recovery strategies "
        "for eligible failed payments."
    )


    # ---------------------------------------------------------
    # Return fallback insight
    # ---------------------------------------------------------

    return {

        "title":
            "Payment Failure Analysis",

        "insight":
            insight,

        "recommendation":
            recommendation,

        "severity":
            severity
    }