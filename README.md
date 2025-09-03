# MCP Chat Client

A modern, feature-rich chat client built with React, TypeScript, and Vite that integrates with Model Context Protocol (MCP) servers to provide intelligent AI-powered conversations with access to various tools and resources.

## Demo

[Chat app](https://chat.thoughtspot.app)

## Features

- 🤖 **AI-Powered Chat**: Seamless integration with AI models through MCP servers
- 🛠️ **Tool Integration**: Access to various MCP tools and resources
- 🔐 **Authentication**: Secure user authentication and session management
- 💬 **Real-time Chat**: Interactive chat interface with typing indicators
- 📚 **Conversation History**: Persistent chat history and conversation management
- 🎨 **Modern UI**: Beautiful, responsive interface built with modern design principles
- 🔧 **MCP Server Management**: Add, configure, and manage multiple MCP servers

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: SCSS with modern CSS features
- **Backend**: Cloudflare Workers
- **Caching**: Cloudflare Workers KV
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context + Custom Hooks
- **Build Tool**: Vite with SWC for fast refresh

## Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Supabase account (for database and auth)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mcp-chat-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Configure Supabase**
   - Set up a new Supabase project
   - Configure authentication providers
   - Set up the required database tables

5. **Configure Cloudflare Workers**
   - Update `wrangler.json` with your Cloudflare account details
   - Configure environment variables in Cloudflare dashboard

## Development

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Cloudflare Workers
```bash
npm run deploy
```

## Project Structure

```
src/
├── components/          # React components
│   ├── chat/          # Chat interface components
│   ├── mcp/           # MCP server management
│   ├── tools-wrapper/  # Tool integration components
│   └── ...            # Other UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
└── util/               # Utility functions

worker/                 # Cloudflare Workers backend
├── backend/            # Backend logic
│   ├── mcp/           # MCP server implementations
│   ├── conversations/  # Chat conversation handling
│   └── clients/       # External service clients
└── index.ts           # Worker entry point
```

## MCP Integration

This client supports the Model Context Protocol, allowing you to:

- Connect to multiple MCP servers
- Access various tools and resources
- Extend functionality through MCP tool definitions
- Manage server configurations and authentication

### Adding MCP Servers

1. Navigate to the MCP section in the application
2. Click "Add MCP Server"
3. Configure the server details (URL, authentication, etc.)
4. Test the connection
5. Start using the available tools

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code formatting
- Write meaningful commit messages
- Test your changes thoroughly

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run deploy` - Deploy to Cloudflare Workers

## License

[Add your license information here]

## Support

For support and questions:
- Create an issue in the repository
- Join the ThoughtSpot [Developer Discord](https://developers.thoughtspot.com/join-discord)

---

Copyright 2025, ThoughtSpot Inc.
