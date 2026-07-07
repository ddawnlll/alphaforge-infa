#!/usr/bin/env python3
"""Start Hindsight Embedded daemon with env vars from .env file."""
import asyncio, os, sys

# Find hermes home
hermes_home = os.path.expanduser("~/.hermes")
env_path = os.path.join(hermes_home, ".env")

# Read .env file
llm_provider = "openai"
llm_base_url = "https://opencode.ai/zen/go/v1"
llm_model = "deepseek-v4-flash"
llm_api_key = ""

if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("OPENCODE_GO_API_KEY=") and "REPLACE" not in line:
                llm_api_key = line.split("=", 1)[1]
            elif line.startswith("HINDSIGHT_API_LLM_API_KEY=") and "REPLACE" not in line:
                llm_api_key = line.split("=", 1)[1]
            elif line.startswith("HINDSIGHT_API_LLM_PROVIDER="):
                llm_provider = line.split("=", 1)[1]
            elif line.startswith("HINDSIGHT_API_LLM_BASE_URL="):
                llm_base_url = line.split("=", 1)[1].strip() or None
            elif line.startswith("HINDSIGHT_API_LLM_MODEL="):
                llm_model = line.split("=", 1)[1]

if not llm_api_key:
    print("ERROR: No LLM API key found in .env")
    sys.exit(1)

print(f"Starting Hindsight daemon...")
print(f"  Provider: {llm_provider}")
print(f"  Base URL: {llm_base_url}")
print(f"  Model: {llm_model}")
print(f"  Key length: {len(llm_api_key)}")

os.environ["HINDSIGHT_API_LLM_PROVIDER"] = llm_provider
os.environ["HINDSIGHT_API_LLM_API_KEY"] = llm_api_key
os.environ["HINDSIGHT_API_LLM_MODEL"] = llm_model
os.environ["HINDSIGHT_API_LOG_LEVEL"] = "info"
if llm_base_url:
    os.environ["HINDSIGHT_API_LLM_BASE_URL"] = llm_base_url

from hindsight.embedded import HindsightEmbedded

async def main():
    hs = HindsightEmbedded(
        profile="af-orchestrator",
        llm_provider=llm_provider,
        llm_api_key=llm_api_key,
        llm_model=llm_model,
        llm_base_url=llm_base_url or None,
        idle_timeout=0,
        log_level="info",
    )
    await hs.start()
    await asyncio.Event().wait()

asyncio.run(main())
