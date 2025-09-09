import React, { useRef, useEffect, memo } from "react";

interface FrameProps {
	src: string;
	title?: string;
	width?: string | number;
	height?: string | number;
	allowFullScreen?: boolean;
	loading?: "eager" | "lazy";
	referrerPolicy?: React.HTMLAttributeReferrerPolicy;
	className?: string;
	style?: React.CSSProperties;
}

export const Frame = memo(({ src, title, width, height, allowFullScreen, loading, referrerPolicy, className, style }: FrameProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		if (!src || !iframeRef.current) return;

		// Only update src if it has actually changed
		if (iframeRef.current.src !== src) {
			iframeRef.current.src = src;
		}
	}, [src]);

	return (
		<iframe
			ref={iframeRef}
			src={src}
			title={title}
			width={width}
			height={height}
			allowFullScreen={allowFullScreen}
			loading={loading}
			referrerPolicy={referrerPolicy}
			className={className}
			style={{ width: '100%', height: '100%', border: 'none', ...style }}
		/>
	);
});
