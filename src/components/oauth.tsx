import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { finishMCPServerOAuth } from '../services/mcp';
import { useMCPContext } from '../contexts/mcp-context';

export const OAuthCallback = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { fetchMCPServers } = useMCPContext();

	useEffect(() => {
		const code = searchParams.get('code');
		const state = searchParams.get('state');

		if (code && state) {
			finishMCPServerOAuth(code, state).then(async () => {
				await fetchMCPServers();
				navigate('/', { replace: true });
			});
		}
	}, []);

	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh',
			width: '100vw',
			margin: 'auto',
			flexDirection: 'column',
			gap: '1rem'
		}}>
			<h2>Processing OAuth Callback...</h2>
			<p>Redirecting to home page...</p>
		</div>
	);
};
