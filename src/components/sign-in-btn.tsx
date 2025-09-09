import { useEffect } from "react";

export const SignInBtn = () => {
	useEffect(() => {
		const script = document.createElement('script');

		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;

		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, []);
	return (<>
		<div id="g_id_onload"
			data-client_id="206101208365-4c43tsi3hj6r92792uhs4tbns06bui9m.apps.googleusercontent.com"
			data-context="signin"
			data-ux_mode="popup"
			data-callback="handleSignInWithGoogle"
			data-use_fedcm_for_prompt="true"
			data-auto_prompt="false">
		</div>

		<div className="g_id_signin"
			data-type="standard"
			data-shape="rectangular"
			data-theme="outline"
			data-text="signin_with"
			data-size="large"
			data-logo_alignment="left">
		</div>
	</>);
};
