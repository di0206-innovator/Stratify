import asyncio
import os
import socket

# Monkeypatch socket.getaddrinfo to force IPv4 and bypass broken IPv6 routing
orig_getaddrinfo = socket.getaddrinfo
def patched_getaddrinfo(*args, **kwargs):
    args = list(args)
    if len(args) >= 3:
        args[2] = socket.AF_INET
    else:
        kwargs['family'] = socket.AF_INET
    return orig_getaddrinfo(*args, **kwargs)
socket.getaddrinfo = patched_getaddrinfo

from dotenv import load_dotenv
from google.antigravity import Agent, LocalAgentConfig, types

# Locate and load the project .env file relative to this script's directory
env_path = os.path.join(os.path.dirname(__file__), '../.env')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Setup config to enable subagents
config = LocalAgentConfig(
    capabilities=types.CapabilitiesConfig(
        enable_subagents=True,
    ),
    system_instruction=(
        "You are the ArchitectAgent for the Stratify project. "
        "Your task is to coordinate a team of subagents (BackendEngineerAgent, FrontendEngineerAgent, QAAgent) "
        "to implement practical upgrades to the codebase, such as adding Sentry, global rate limiting, "
        "Vite bundle optimization, and Playwright E2E tests. "
        "Delegate tasks to your subagents, specifying their persona and exact duties."
    )
)

async def main():
    print("🚀 Initializing Stratify Multi-Agent Swarm (Architect + Subagents)...")
    
    # Ensure API key is set or remind the user
    if not os.environ.get("GEMINI_API_KEY"):
        print("⚠️ Warning: GEMINI_API_KEY environment variable is missing.")
        print("Please set it or the agents will not be able to authenticate with Gemini.")
    
    async with Agent(config) as architect:
        prompt = (
            "We have 4 tasks to implement in the Stratify codebase:\n"
            "1. Backend: Implement global rate limiting in Express and integrate Sentry for Node.js.\n"
            "2. Frontend: Optimize Vite with manualChunks and add React.memo to RealtimeTicker.\n"
            "3. Frontend: Integrate Sentry for React.\n"
            "4. QA: Setup a basic Playwright E2E test suite and GitHub Actions workflow.\n\n"
            "Spawn the necessary subagents to execute these tasks. Output your final coordination plan and the result of the execution."
        )
        
        print(f"\nArchitect Task:\n{prompt}\n")
        print("Swarm is thinking... (This might take a while as agents collaborate)\n")
        
        response = await architect.chat(prompt)
        print("\n===============================")
        print("🏆 SWARM EXECUTION REPORT:")
        print("===============================\n")
        print(await response.text())

if __name__ == "__main__":
    asyncio.run(main())
