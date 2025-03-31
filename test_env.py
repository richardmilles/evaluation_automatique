# test_env.py
import os
from dotenv import load_dotenv

load_dotenv()  # charge .env si présent au même niveau

uca = os.getenv("USE_CLOUD_AI")
provider = os.getenv("AI_PROVIDER")

print(">>> USE_CLOUD_AI =", uca)
print(">>> AI_PROVIDER =", provider)
