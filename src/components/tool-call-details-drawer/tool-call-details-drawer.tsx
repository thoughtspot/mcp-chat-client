import { Drawer, Descriptions, Tag, Typography, Tabs, Spin, Flex } from "antd";
import { ToolCallEventData } from "../../../worker/backend/types";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { getToolSummary } from "../../services/mcp";
import "./tool-call-details-drawer.scss";
import rehypeRaw from "rehype-raw";

interface ToolCallDetailsDrawerProps {
    visible: boolean;
    onClose: () => void;
    selectedToolCall: ToolCallEventData | null;
    selectedToolCallDetails: any;
}

// Helper function to safely format result data
const formatResult = (result: any): string => {
	if (result === null || result === undefined) {
		return "null";
	}

	if (typeof result === "string") {
		// Try to parse as JSON first, if it fails, return as plain text
		try {
			const parsed = JSON.parse(result);
			return JSON.stringify(parsed, null, 2);
		} catch {
			// If it's not valid JSON, return as formatted text
			return result;
		}
	}

	if (typeof result === "object") {
		try {
			return JSON.stringify(result, null, 2);
		} catch {
			// If JSON.stringify fails, try to convert to string
			return String(result);
		}
	}

	// For primitive types, return as string
	return String(result);
};

const getFrameUrl = (result: any) => {
	if (!result) return null;
	try {
		const parsed = JSON.parse(result);
		return parsed.frame_url;
	} catch {
		return null;
	}
};

// Raw tab content component - memoized to prevent recreation
const RawTabContent = React.memo(({ selectedToolCall, selectedToolCallDetails }: { selectedToolCall: ToolCallEventData | null; selectedToolCallDetails: any }) => (
	<div>
		<Descriptions column={1} bordered size="small">
			<Descriptions.Item label="Server">
				<Tag color="blue">{selectedToolCall?.server}</Tag>
			</Descriptions.Item>
			<Descriptions.Item label="Tool Name">
				<Tag color="green">{selectedToolCall?.toolName}</Tag>
			</Descriptions.Item>
		</Descriptions>

		{selectedToolCallDetails && (
			<div style={{ marginTop: 24 }}>
				<Typography.Title level={5}>Arguments</Typography.Title>
				<pre style={{
					background: '#f5f5f5',
					padding: 16,
					borderRadius: 8,
					overflow: 'auto',
					fontSize: 12,
					color: '#000'
				}}>
					{formatResult(selectedToolCallDetails.args)}
				</pre>
				<Typography.Title level={5}>Result</Typography.Title>
				<pre style={{
					background: '#f5f5f5',
					padding: 16,
					borderRadius: 8,
					overflow: 'auto',
					fontSize: 12,
					color: '#000'
				}}>
					{formatResult(selectedToolCallDetails.result)}
				</pre>
			</div>
		)}
	</div>
));

RawTabContent.displayName = 'RawTabContent';

export const ToolCallDetailsDrawer = ({
	visible,
	onClose,
	selectedToolCall,
	selectedToolCallDetails
}: ToolCallDetailsDrawerProps) => {
	// Cache for tool summaries to avoid redundant API calls
	const [summaryCache, setSummaryCache] = useState<Record<string, { summary: string; isLoading: boolean; error: string | null }>>({});

	// Track ongoing requests to prevent duplicates
	const ongoingRequests = useRef<Set<string>>(new Set());

	// Generate a unique key for caching based on tool call details
	const getCacheKey = (toolCall: ToolCallEventData | null, details: any) => {
		if (!toolCall || !details) return null;
		return `${toolCall.itemId}-${toolCall.server}-${toolCall.toolName}`;
	};

	const cacheKey = getCacheKey(selectedToolCall, selectedToolCallDetails);
	const cachedSummary = cacheKey ? summaryCache[cacheKey] : null;

	// Function to fetch tool summary and cache it - memoized to prevent recreation
	const fetchToolSummary = useCallback(async (toolCall: ToolCallEventData, details: any) => {
		const key = getCacheKey(toolCall, details);
		if (!key) return;

		// Check if request is already ongoing
		if (ongoingRequests.current.has(key)) {
			return;
		}

		// Check if already cached and not loading using functional update to avoid dependency
		setSummaryCache(prev => {
			// If already cached and not loading, return current state
			if (prev[key] && !prev[key].isLoading) {
				return prev;
			}

			// Set loading state
			return {
				...prev,
				[key]: { summary: "", isLoading: true, error: null }
			};
		});

		// Mark request as ongoing
		ongoingRequests.current.add(key);

		try {
			await getToolSummary(
				toolCall.server || "",
				toolCall.toolName,
				details.args,
				details.result,
				(message: string) => {
					// Update cache with streaming content
					setSummaryCache(prev => ({
						...prev,
						[key]: { summary: message, isLoading: false, error: null }
					}));
				}
			);
		} catch (err: any) {
			setSummaryCache(prev => ({
				...prev,
				[key]: {
					summary: "",
					isLoading: false,
					error: err.message || "Failed to load tool summary"
				}
			}));
		} finally {
			// Remove from ongoing requests
			ongoingRequests.current.delete(key);
		}
	}, []); // Remove summaryCache dependency to prevent infinite loop

	// Fetch summary when tool call changes
	useEffect(() => {
		if (selectedToolCall && selectedToolCallDetails && selectedToolCallDetails.result !== undefined) {
			fetchToolSummary(selectedToolCall, selectedToolCallDetails);
		}
	}, [selectedToolCall?.itemId, fetchToolSummary, selectedToolCall, selectedToolCallDetails]);

	// Enhanced Overview tab content with caching - memoized to prevent recreation
	const OverviewTabContentWithCache = useCallback(() => {
		if (selectedToolCallDetails?.result === undefined) {
			return (
				<div style={{ textAlign: 'center', padding: '40px 20px' }}>
					<Spin size="large" />
					<div style={{ marginTop: 16, color: '#666' }}>
						Tool call in progress
					</div>
				</div>
			);
		}

		const getSummary = () => {
			if (!cachedSummary) {
				return (
					<div style={{ textAlign: 'center', padding: '40px 20px' }}>
						<Spin size="large" />
						<div style={{ marginTop: 16, color: '#666' }}>
						Loading...
						</div>
					</div>
				);
			}

			if (cachedSummary.isLoading && !cachedSummary.summary) {
				return (
					<div style={{ textAlign: 'center', padding: '40px 20px' }}>
						<Spin size="large" />
						<div style={{ marginTop: 16, color: '#666' }}>
						Generating tool summary...
						</div>
					</div>
				);
			}

			if (cachedSummary.error) {
				return (
					<div style={{ textAlign: 'center', padding: '40px 20px', color: '#ff4d4f' }}>
						<Typography.Text type="danger">{cachedSummary.error}</Typography.Text>
					</div>
				);
			}

			return cachedSummary.summary ? (
				<ReactMarkdown rehypePlugins={[rehypeRaw]}>{cachedSummary.summary}</ReactMarkdown>
			) : (
				<div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
						No summary available
				</div>
			)
		}

		return (
			<Flex vertical gap={12}>
				<Flex>
					{getSummary()}
				</Flex>
			</Flex>
		);
	}, [selectedToolCallDetails, cachedSummary]);

	const tabItems = useMemo(() => [
		{
			key: 'overview',
			label: 'Overview',
			children: <OverviewTabContentWithCache />
		}, {
			key: 'raw',
			label: 'Raw',
			children: <RawTabContent selectedToolCall={selectedToolCall} selectedToolCallDetails={selectedToolCallDetails} />
		}
	], [OverviewTabContentWithCache, selectedToolCall, selectedToolCallDetails]);

	return (
		<Drawer
			title="Tool Call Details"
			placement="right"
			className="tool-call-details-drawer"
			width={600}
			open={visible}
			onClose={onClose}
			maskClosable={false}
			mask={false}
		>
			{selectedToolCall && (
				<Tabs
					defaultActiveKey="overview"
					items={tabItems}
				/>
			)}
		</Drawer>
	);
};
