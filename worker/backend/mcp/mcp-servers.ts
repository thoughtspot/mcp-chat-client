import { SupabaseClient } from "@supabase/supabase-js";
import { MCPServer } from "./mcp-server";
import type { MCPServerMetadata, MCPServerMetadataWithToken } from "../types";
import { convertToCamelCaseObjectKeys, convertToSnakeCaseObjectKeys } from "../util";
import { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth";
import { OauthProvider } from "./oauth-provider";

export class MCPServers {
	private supabaseClient: SupabaseClient;

	constructor(supabaseClient: SupabaseClient, private redirectUrl: string) {
		this.supabaseClient = supabaseClient;
	}

	async list() {
		const { data, error } = await this.supabaseClient.from('mcp_servers').select('*');
		if (error) {
			throw error;
		}
		return data.map(convertToCamelCaseObjectKeys) as unknown as MCPServerMetadata[];
	}

	async get(id: string) {
		const { data, error } = await this.supabaseClient.from('mcp_servers').select('*').eq('id', id);
		if (error) {
			throw error;
		}
		return new MCPServer(
            convertToCamelCaseObjectKeys(data[0]) as unknown as MCPServerMetadata,
            this.redirectUrl,
            () => this.setIsConnected(id, true),
            () => this.setIsConnected(id, false),
            (clientInfo: OAuthClientInformationFull) => this.saveClientInfo(id, clientInfo)
		);
	}

	async upsert(mcpServer: Partial<MCPServerMetadataWithToken>) {
		const { authorizationToken, ...mcpServerMetadataInput } = mcpServer;
		const mcpServerSnakeCase = convertToSnakeCaseObjectKeys(mcpServerMetadataInput);
		const { data, error } = await this.supabaseClient.from('mcp_servers').upsert(mcpServerSnakeCase).select();
		if (error) {
			console.error(error);
			throw error;
		}

		if (mcpServer.authType === 'authorizationToken') {
			if (!authorizationToken) {
				throw new Error('Authorization token is required');
			}
			const mcpServerMetadata = convertToCamelCaseObjectKeys(data[0]) as unknown as MCPServerMetadata;
			const oauthProvider = new OauthProvider(mcpServerMetadata, this.redirectUrl);
			await oauthProvider.saveTokens({
				access_token: authorizationToken,
				expires_in: 3600 * 24 * 30 * 6, // 6 months
				token_type: 'Bearer',
			});
			await this.setIsConnected(mcpServerMetadata.id, true);
		}
		return data;
	}

	async delete(id: string) {
		const { error } = await this.supabaseClient.from('mcp_servers').delete().eq('id', id);
		if (error) {
			throw error;
		}
	}

	async setIsConnected(id: string, isConnected: boolean) {
		const { data, error } = await this.supabaseClient.from('mcp_servers').update({ "is_connected": isConnected }).eq('id', id);
		if (error) {
			throw error;
		}
		return data;
	}

	async saveClientInfo(id: string, clientInfo: OAuthClientInformationFull) {
		const { data, error } = await this.supabaseClient.from('mcp_servers').update({ "oauth_client_info": clientInfo }).eq('id', id).select();
		if (error) {
			throw error;
		}
	}
}
