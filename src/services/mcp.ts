import {  MCPServerMetadataWithToken, ResponseEvent, ResponseEventType } from "../../worker/backend/types";
import { apiCall, readNDJSONStream } from "./api-call";

export const listMCPServers = async (forceRefresh?: boolean) => {
	const resp = await apiCall('/mcp/list', { method: 'GET' }, undefined);
	return resp;
}

export const listConnectors = async () => {
	const resp = await apiCall('/mcp/connectors/list', { method: 'GET' });
	return resp;
}

export const addMCPServer = async (mcpServer: Partial<MCPServerMetadataWithToken>) => {
	const resp = await apiCall('/mcp/add', { body: mcpServer });
	return resp;
}

export const deleteMCPServer = async (serverId: string) => {
	const resp = await apiCall(`/mcp/${serverId}`, { method: 'DELETE' });
	return resp;
}

export const addMCPFromConnector = async (connectorId: string) => {
	const resp = await apiCall('/mcp/add/connector', { body: { connectorId } });
	return resp;
}

export const listMCPServerTools = async (serverId: string) => {
	const resp = await apiCall(`/mcp/${serverId}/tools/list`, { method: 'GET' });
	return resp;
}

export const listMCPServerResources = async (serverId: string) => {
	const resp = await apiCall(`/mcp/${serverId}/resources/list`, { method: 'GET' }, undefined);
	return resp.resources;
}

export const readMCPServerResource = async (serverId: string, resourceURI: string) => {
	const resp = await apiCall(`/mcp/${serverId}/resources/read?resourceURI=${resourceURI}`, { method: 'GET' });
	return resp.contents;
}

export const connectMCPServer = async (serverId: string) => {
	return apiCall(`/mcp/${serverId}/connect`);
}

export const finishMCPServerOAuth = async (code: string, state: string) => {
	return apiCall('/mcp/oauth/callback', { body: { code, state } });
}

export const getToolSummary = async (serverName: string, toolName: string, args: any, result: any, onMessage: (message: string) => void) => {
	const stream = await apiCall('/mcp/tools/call/summary', { body: { serverName, toolName, args, result } }, undefined, true);
	let responseString = '';
	for await (const event of readNDJSONStream(stream) as AsyncGenerator<ResponseEvent>) {
		if (event.type === ResponseEventType.OUTPUT_TEXT_DELTA) {
			responseString += event.data.delta;
			onMessage(responseString);
		}
	}
}
