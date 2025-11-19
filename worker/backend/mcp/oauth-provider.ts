import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js"
import type { MCPServerMetadata, OauthTokensWithExpiresAt } from '../types'
import { OAuthClientInformation, OAuthClientInformationFull, OAuthClientMetadata, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { setToKV, getFromKV, deleteFromKV } from '../clients/kv-store';
import { auth } from "./auth-flow";

export class OauthProvider implements OAuthClientProvider {

	private _clientMetadata: OAuthClientMetadata;
	public onRedirect: (url: string) => void;

	constructor(private readonly mcpServer: MCPServerMetadata,
        private readonly _redirectUrl?: string,
        private readonly saveClientInfo?: (clientInfo: OAuthClientInformationFull) => void) {
		//
		this._clientMetadata = {
			redirect_uris: [
				this._redirectUrl
			],
			token_endpoint_auth_method: 'client_secret_post',
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			client_name: this.mcpServer.name,
			scope: this.mcpServer.oauthClientInfo?.scope
		};
	}

	get redirectUrl(): string {
		return this._redirectUrl;
	}

	get clientMetadata(): OAuthClientMetadata {
		return this._clientMetadata;
	}

	async state(): Promise<string> {
		return encodeState(this.mcpServer.id);
	}

	async tokens(): Promise<OauthTokensWithExpiresAt> {
		const tokens = JSON.parse(await getFromKV(this.mcpServer.id) as string || '{}');
		return tokens;
	}

	async deleteTokens(): Promise<void> {
		await deleteFromKV(this.mcpServer.id);
	}

	async codeVerifier(): Promise<string> {
		console.log('codeVerifier', this.mcpServer.id + ':codeVerifier');
		return await getFromKV(this.mcpServer.id + ':codeVerifier') as string;
	}

	clientInformation(): OAuthClientInformationFull | undefined {
		return this.mcpServer.oauthClientInfo as OAuthClientInformationFull;
	}

	async saveClientInformation(clientInformation: OAuthClientInformationFull): Promise<void> {
		if (this.saveClientInfo) {
			return this.saveClientInfo(clientInformation);
		}
	}

	async saveTokens(tokens: OauthTokensWithExpiresAt): Promise<void> {
		if (tokens.expires_in) {
			const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
			tokens.expires_at = expiresAt.valueOf();
		}
		await setToKV(this.mcpServer.id, JSON.stringify(tokens));
	}

	async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
		this.onRedirect(authorizationUrl.href);
	}

	async saveCodeVerifier(codeVerifier: string): Promise<void> {
		return setToKV(this.mcpServer.id + ':codeVerifier', codeVerifier, 60 * 5); // 5 minutes
	}
}

export const decodeState = (state: string) => {
	const decoded = atob(state);
	return JSON.parse(decoded) as { serverId: string };
}

export const encodeState = (serverId: string) => {
	const encoded = btoa(JSON.stringify({ serverId }));
	return encoded;
}
