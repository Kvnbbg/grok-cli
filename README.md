# Grok CLI

A conversational AI CLI tool powered by Grok with intelligent text editor capabilities and tool usage.

<img width="980" height="435" alt="Screenshot 2025-07-21 at 13 35 41" src="https://github.com/user-attachments/assets/192402e3-30a8-47df-9fc8-a084c5696e78" />

## Features

- **🤖 Conversational AI**: Natural language interface powered by Grok-3
- **📝 Smart File Operations**: AI automatically uses tools to view, create, and edit files
- **⚡ Bash Integration**: Execute shell commands through natural conversation
- **🔧 Automatic Tool Selection**: AI intelligently chooses the right tools for your requests
- **💬 Interactive UI**: Beautiful terminal interface built with Ink
- **🌍 Global Installation**: Install and use anywhere with `npm i -g @vibe-kit/grok-cli`

## Installation

### Prerequisites
- Node.js 16+ 
- Grok API key from X.AI

### Global Installation (Recommended)
```bash
npm install -g @vibe-kit/grok-cli
```

### Local Development
```bash
git clone <repository>
cd grok-cli
npm install
npm run build
npm link
```

## Setup

1. Get your Grok API key from [X.AI](https://x.ai)

2. Set up your API key (choose one method):

**Method 1: Environment Variable**
```bash
export GROK_API_KEY=your_api_key_here
```

**Method 2: .env File**
```bash
cp .env.example .env
# Edit .env and add your API key
```

**Method 3: Command Line Flag**
```bash
grok --api-key your_api_key_here
```

**Method 4: User Settings File**
Create `~/.grok/user-settings.json`:
```json
{
  "apiKey": "your_api_key_here"
}
```

### Custom Base URL (Optional)

You can configure a custom Grok API endpoint (choose one method):

**Method 1: Environment Variable**
```bash
export GROK_BASE_URL=https://your-custom-endpoint.com/v1
```

**Method 2: Command Line Flag**
```bash
grok --api-key your_api_key_here --baseurl https://your-custom-endpoint.com/v1
```

**Method 3: User Settings File**
Add to `~/.grok/user-settings.json`:
```json
{
  "apiKey": "your_api_key_here",
  "baseURL": "https://your-custom-endpoint.com/v1"
}
```

## Usage

### Interactive Mode

Start the conversational AI assistant:
```bash
grok
```

Or specify a working directory:
```bash
grok -d /path/to/project
```

### Headless Mode

Process a single prompt and exit (useful for scripting and automation):
```bash
grok --prompt "show me the package.json file"
grok -p "create a new file called example.js with a hello world function" --allow-unsafe-tools
grok --prompt "run npm test and show me the results" --directory /path/to/project --allow-unsafe-tools
```

This mode is particularly useful for:
- **CI/CD pipelines**: Automate code analysis and file operations
- **Scripting**: Integrate AI assistance into shell scripts
- **Terminal benchmarks**: Perfect for tools like Terminal Bench that need non-interactive execution
- **Batch processing**: Process multiple prompts programmatically

### Model Selection

You can specify which AI model to use with the `--model` parameter:

```bash
# Use Grok models
grok --model grok-4-latest
grok --model grok-3-latest
grok --model grok-3-fast

# Use other models (with appropriate API endpoint)
grok --model gemini-2.5-pro --base-url https://api-endpoint.com/v1
grok --model claude-sonnet-4-20250514 --base-url https://api-endpoint.com/v1
```

### Command Line Options

```bash
grok [options]

Options:
  -V, --version          output the version number
  -d, --directory <dir>  set working directory
  -k, --api-key <key>    Grok API key (or set GROK_API_KEY env var)
  -u, --base-url <url>   Grok API base URL (or set GROK_BASE_URL env var)
  -m, --model <model>    AI model to use (e.g., grok-4-latest, grok-3-latest)
  -p, --prompt <prompt>  process a single prompt and exit (headless mode)
      --allow-unsafe-tools explicitly approve shell and write actions in headless mode
  -h, --help             display help for command
```

### Custom Instructions

You can provide custom instructions to tailor Grok's behavior to your project by creating a `.grok/GROK.md` file in your project directory:

```bash
mkdir .grok
```

Create `.grok/GROK.md` with your custom instructions:
```markdown
# Custom Instructions for Grok CLI

Always use TypeScript for any new code files.
When creating React components, use functional components with hooks.
Prefer const assertions and explicit typing over inference where it improves clarity.
Always add JSDoc comments for public functions and interfaces.
Follow the existing code style and patterns in this project.
```

Grok will automatically load and follow these instructions when working in your project directory. The custom instructions are added to Grok's system prompt and take priority over default behavior.

## Example Conversations

Instead of typing commands, just tell Grok what you want to do:

```
💬 "Show me the contents of package.json"
💬 "Create a new file called hello.js with a simple console.log"
💬 "Find all TypeScript files in the src directory"
💬 "Replace 'oldFunction' with 'newFunction' in all JS files"
💬 "Run the tests and show me the results"
💬 "What's the current directory structure?"
```

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build project
npm run build

# Run linter
npm run lint

# Type check
npm run typecheck
```

## Architecture

- **Agent**: Core command processing and execution logic
- **Tools**: Text editor and bash tool implementations
- **UI**: Ink-based terminal interface components
- **Types**: TypeScript definitions for the entire system

## License

MIT


## Security and Okta System Log audit

**Headless mode is read-only by default for tools that require approval.** Tools that
execute shell commands or modify files are rejected in \`--prompt\` mode unless
\`--allow-unsafe-tools\` is explicitly supplied. Never use that flag with untrusted
prompts, web content, or CI-generated instructions. Interactive mode continues to
request per-operation confirmation. Prefer \`GROK_API_KEY\` through the environment
instead of \`--api-key\`, which can expose a secret in process arguments.

Analyze a **locally exported System Log from an Okta tenant you are authorized to administer**:

\`\`\`bash
npm run security:okta -- ./okta-system-log.json
npm run test:security
\`\`\`

The offline auditor accepts a JSON array, a single event, an \`{"events":[...]}\`
wrapper, or NDJSON. It flags repeated failed sign-ins (at least five per actor
per UTC hour), administrator privilege grants, MFA resets/deactivations, blocked
requests, and user-reported suspicious activity. Outputs contain hashed actor
identifiers rather than email addresses or IPs. No network request is sent and
no Okta credential is needed. Exit codes: **0** (no alerts), **1** (alerts), **2**
(input/processing error). Findings are triage indicators, not evidence of an
Okta infrastructure breach. Do not commit actual logs, user data, or tokens.
