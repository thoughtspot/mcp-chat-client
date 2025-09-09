import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { OauthProvider } from "./oauth-provider";
import type { MCPServerMetadata } from "../types";
import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth";
import { MCPAuthError } from "../util";
import { auth } from "./auth-flow";

export class MCPServer {
	private client: Client;
	private oauthProvider: OauthProvider;

	constructor(public readonly metadata: MCPServerMetadata, redirectUrl: string, private readonly onConnect?: () => void, private readonly onDisconnect?: () => void, private readonly saveClientInfo?: (clientInfo: OAuthClientInformationFull) => void) {
		this.client = new Client({
			name: this.metadata.name,
			version: '1.0.0',
		}, {
			capabilities: {},
		});
		this.oauthProvider = new OauthProvider(this.metadata, redirectUrl, this.saveClientInfo);
	}

	getTransportClass() {
		if (this.metadata.transportType === 'sse') {
			return SSEClientTransport;
		}
		return StreamableHTTPClientTransport;
	}

	async connect(onRedirect: (url: string) => void = () => {}) {
		try {
			console.log('Connecting to MCP server', this.metadata.name);

			const authResult = await this.auth(onRedirect);
			if (authResult.authResult !== "AUTHORIZED") {
				throw new MCPAuthError('Authorization failed');
			}

			const tokens = authResult.tokens;
			const Transport = this.getTransportClass();
			const transport = new Transport(new URL(this.metadata.url), {
				requestInit: {
					headers: {
						Authorization: `Bearer ${tokens.access_token}`,
					},
				}
			});

			await this.client.connect(transport);
			await this.onConnect?.();
		} catch (error) {
			console.error(error);
			this.onDisconnect?.();
			throw new MCPAuthError(error.message);
		}

		return this.client;
	}

	async auth(onRedirect: (url: string) => void = () => { }, isRetry: boolean = false) {
		this.oauthProvider.onRedirect = onRedirect;
		try {
			const authResult = await auth(this.oauthProvider, {
				serverUrl: new URL(this.metadata.url),
				metadata: this.metadata.oauthMetadata,
			})
			return authResult;
		} catch (error) {
			// If the error is an InvalidGrantError, and it's not a retry, try again.
			// This happens when there is a race condition on refreshing the token.
			if (error.name === 'InvalidGrantError' && !isRetry) {
				return this.auth(onRedirect, true);
			}
			throw new MCPAuthError(error.message);
		}
	}

	async finishOAuth(code: string) {
		const authResult = await auth(this.oauthProvider, {
			serverUrl: new URL(this.metadata.url),
			metadata: this.metadata.oauthMetadata,
			authorizationCode: code,
		})
		if (authResult.authResult !== "AUTHORIZED") {
			throw new MCPAuthError('Authorization failed');
		}
		return this.onConnect?.();
	}

	async disconnect() {
		await this.client.close();
		this.onDisconnect?.();
	}

	async listResources() {
		await this.connect();
		if (!this.client.getServerCapabilities()?.resources) {
			return {
				resources: [],
			};
		}
		const resources = await this.client.listResources();
		return resources;
	}

	async readResource(resourceURI: string) {
		await this.connect();
		const resource = await this.client.readResource({ uri: resourceURI });
		return resource;
	}

	async listTools() {
		await this.connect();
		const tools = await this.client.listTools();
		return tools;
	}
}
