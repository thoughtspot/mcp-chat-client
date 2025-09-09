import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { FetchLike } from "@modelcontextprotocol/sdk/shared/transport.js";
import { AuthResult } from "@modelcontextprotocol/sdk/client/auth.js";
import { InvalidClientError, UnauthorizedClientError, InvalidGrantError, OAuthError, ServerError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import {  OAuthMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { selectResourceURL } from "@modelcontextprotocol/sdk/client/auth.js";
import { discoverAuthorizationServerMetadata } from "@modelcontextprotocol/sdk/client/auth.js";
import { registerClient } from "@modelcontextprotocol/sdk/client/auth.js";
import { exchangeAuthorization } from "@modelcontextprotocol/sdk/client/auth.js";
import { refreshAuthorization } from "@modelcontextprotocol/sdk/client/auth.js";
import { startAuthorization } from "@modelcontextprotocol/sdk/client/auth.js";
import { OauthTokensWithExpiresAt } from "../types.js";

export async function auth(
	provider: OAuthClientProvider,
	options: {
		metadata?: OAuthMetadata;
		serverUrl: string | URL;
		authorizationCode?: string;
		scope?: string;
		resourceMetadataUrl?: URL;
		fetchFn?: FetchLike;
}): Promise<{authResult: AuthResult, tokens?: OauthTokensWithExpiresAt }> {
	try {
		return await authInternal(provider, options);
	} catch (error) {
		// Handle recoverable error types by invalidating credentials and retrying
		if (error instanceof InvalidClientError || error instanceof UnauthorizedClientError) {
			await provider.invalidateCredentials?.('all');
			return await authInternal(provider, options);
		} else if (error instanceof InvalidGrantError) {
			await provider.invalidateCredentials?.('tokens');
			return await authInternal(provider, options);
		}

		// Throw otherwise
		throw error
	}
}

async function authInternal(
	provider: OAuthClientProvider,
	{ serverUrl,
		metadata,
		authorizationCode,
		scope,
		fetchFn,
	}: {
    serverUrl: string | URL;
	metadata?: OAuthMetadata;
    authorizationCode?: string;
    scope?: string;
    resourceMetadataUrl?: URL;
    fetchFn?: FetchLike;
  },
): Promise<{authResult: AuthResult, tokens?: OauthTokensWithExpiresAt }> {

	let authorizationServerUrl: string | URL | undefined;

	/**
   * If we don't get a valid authorization server metadata from protected resource metadata,
   * fallback to the legacy MCP spec's implementation (version 2025-03-26): MCP server acts as the Authorization server.
   */
	if (!authorizationServerUrl) {
		authorizationServerUrl = serverUrl;
	}

	const resource: URL | undefined = await selectResourceURL(serverUrl, provider);

	if (!metadata) {
		metadata = await discoverAuthorizationServerMetadata(authorizationServerUrl, {
			fetchFn,
		});
	}


	// Handle client registration if needed
	let clientInformation = await Promise.resolve(provider.clientInformation());
	if (!clientInformation) {
		if (authorizationCode !== undefined) {
			throw new Error("Existing OAuth client information is required when exchanging an authorization code");
		}

		if (!provider.saveClientInformation) {
			throw new Error("OAuth client information must be saveable for dynamic registration");
		}

		const fullInformation = await registerClient(authorizationServerUrl, {
			metadata,
			clientMetadata: provider.clientMetadata,
			fetchFn,
		});

		await provider.saveClientInformation(fullInformation);
		clientInformation = fullInformation;
	}

	// Exchange authorization code for tokens
	if (authorizationCode !== undefined) {
		const codeVerifier = await provider.codeVerifier();
		const tokens = await exchangeAuthorization(authorizationServerUrl, {
			metadata,
			clientInformation,
			authorizationCode,
			codeVerifier,
			redirectUri: provider.redirectUrl,
			resource,
			addClientAuthentication: provider.addClientAuthentication,
			fetchFn: fetchFn,
		});

		await provider.saveTokens(tokens);
		return { authResult: "AUTHORIZED", tokens };
	}

	const tokens = await provider.tokens() as OauthTokensWithExpiresAt;

	if (tokens.expires_at && tokens.expires_at > Date.now()) {
		return { authResult: "AUTHORIZED", tokens };
	}

	// Handle token refresh or new authorization
	if (tokens?.refresh_token) {
		try {
			// Attempt to refresh the token
			const newTokens = await refreshAuthorization(authorizationServerUrl, {
				metadata,
				clientInformation,
				refreshToken: tokens.refresh_token,
				resource,
				addClientAuthentication: provider.addClientAuthentication,
				fetchFn,
			});

			await provider.saveTokens(newTokens);
			return { authResult: "AUTHORIZED", tokens: newTokens };
		} catch (error) {
			// If this is a ServerError, or an unknown type, log it out and try to continue. Otherwise, escalate so we can fix things and retry.
			if (!(error instanceof OAuthError) || error instanceof ServerError) {
				// Could not refresh OAuth tokens
			} else {
				// Refresh failed for another reason, re-throw
				throw error;
			}
		}
	}

	const state = provider.state ? await provider.state() : undefined;

	// Start new authorization flow
	const { authorizationUrl, codeVerifier } = await startAuthorization(authorizationServerUrl, {
		metadata,
		clientInformation,
		state,
		redirectUrl: provider.redirectUrl,
		scope: scope || provider.clientMetadata.scope,
		resource,
	});

	await provider.saveCodeVerifier(codeVerifier);
	await provider.redirectToAuthorization(authorizationUrl);
	return { authResult: "REDIRECT" };
}
