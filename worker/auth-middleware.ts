import { createClient } from "./backend/clients/supabase";

export default async function checkAuth(authorization: string): Promise<boolean> {
	const supabase = createClient(authorization);
	const { error } = await supabase.auth.getUser();
	if (error) {
		return false;
	}

	return true;
}
