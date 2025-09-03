let kvStore: KVNamespace;

export function initKV(env: Env) {
	kvStore = env.MCP_CHAT_KV;
}

export function getFromKV(key: string) {
	if(!kvStore) {
		throw new Error('KV store not initialized');
	}
	return kvStore.get(key);
}

export function setToKV(key: string, value: string, expiryTTL?: number) {
	if(!kvStore) {
		throw new Error('KV store not initialized');
	}
	const options: KVNamespacePutOptions = {};
	if(expiryTTL) {
		options.expirationTtl = expiryTTL;
	}
	return kvStore.put(key, value, options);
}

export function deleteFromKV(key: string) {
	return kvStore.delete(key);
}
