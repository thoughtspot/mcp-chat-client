import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./clients/supabase";
import { MCPServers } from "./mcp/mcp-servers";
import { decodeState, OauthProvider } from "./mcp/oauth-provider";
import { Attachment, MCPServerMetadata, MCPServerMetadataWithToken } from "./types";
import { OpenAIProvider } from "./clients/ai/openai";
import { getConnector } from "./mcp/connectors";
import { MCPServer } from "./mcp/mcp-server";
import { MCPAuthError } from "./util";
import { FileObject } from "openai/resources/files";

export class Context {
	public supabaseClient: SupabaseClient;
	public mcpServers: MCPServers;
	private redirectUrl: string;

	constructor(authorization: string, public readonly appUrl: string) {
		this.supabaseClient = createClient(authorization);
		this.redirectUrl = `${appUrl}/oauth/callback`;
		this.mcpServers = new MCPServers(this.supabaseClient, this.redirectUrl);
	}

	async addMCPServer(mcpServer: MCPServerMetadataWithToken) {
		return this.mcpServers.upsert(mcpServer);
	}

	async addMCPServerFromConnector(connectorId: string) {
		const connector = await getConnector(this.supabaseClient, connectorId);
		return this.mcpServers.upsert({
			name: connector.name,
			url: connector.url,
			logoUrl: connector.logo_url,
			oauthClientInfo: connector.oauth_client_info,
			oauthMetadata: connector.oauth_metadata,
			transportType: connector.transport_type
		});
	}

	async listMCPServers(): Promise<MCPServerMetadata[]> {
		return await this.mcpServers.list();
	}

	async getMCPServer(serverId: string) {
		return await this.mcpServers.get(serverId);
	}
	te
	async listMCPServerTools(serverId: string) {
		const server = await this.mcpServers.get(serverId);
		const tools = await server.listTools();
		return tools;
	}

	async listMCPServerResources(serverId: string) {
		const server = await this.mcpServers.get(serverId);
		const resources = await server.listResources();
		return resources;
	}

	async deleteMCPServer(serverId: string) {
		return await this.mcpServers.delete(serverId);
	}

	async readMCPServerResource(serverId: string, resourceURI: string) {
		const server = await this.mcpServers.get(serverId);
		const resource = await server.readResource(resourceURI);
		return resource;
	}

	async connectMCPServer(serverId: string, onRedirect: (url: string) => void) {
		try {
			const server = await this.mcpServers.get(serverId);
			await server.connect(onRedirect);
		} catch (error) {
			console.error(error);
			return { error };
		}

		return { error: null };
	}

	async finishMCPServerOAuth(code: string, state: string) {
		const { serverId } = decodeState(state);
		const server = await this.mcpServers.get(serverId);
		return server.finishOAuth(code);
	}

	async disconnectMCPServer(serverId: string) {
		const server = await this.mcpServers.get(serverId);
		await server.disconnect();
	}

	async sendMessage(message: string, attachments: Attachment[], mcpServers: MCPServerMetadata[], enabledDefaultTools: string[], referenceId?: string) {
		const aiProvider = new OpenAIProvider();
		const mcpServersWithToken: MCPServerMetadataWithToken[] = await Promise.all(
			mcpServers.map(async metadata => {
				const mcpServer = new MCPServer(metadata, this.redirectUrl);
				const authResult = await mcpServer.auth();
				if (authResult.authResult !== "AUTHORIZED") {
					throw new MCPAuthError('Authorization failed');
				}
				return {
					...metadata,
					authorizationToken: authResult.tokens?.access_token,
				};
			})
		);
		return await aiProvider.getStreamResponse(
			message, attachments, mcpServersWithToken, enabledDefaultTools, referenceId
		);
	}

	async getFileFromContainer(containerId: string, fileId: string) {
		const aiProvider = new OpenAIProvider();
		return await aiProvider.getFileFromContainer(containerId, fileId);
	}

	async uploadFile(file: File): Promise<FileObject> {
		const aiProvider = new OpenAIProvider();
		return await aiProvider.uploadFile(file);
	}
}
