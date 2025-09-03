import { SupabaseClient } from "@supabase/supabase-js";

export class Conversations {
	constructor(private readonly supabaseClient: SupabaseClient) {
	}

	async createConversation(conversation: any) {
		const { data, error } = await this.supabaseClient.from('conversations').insert(conversation).select().single();
		console.log(data, error);
	}
}
