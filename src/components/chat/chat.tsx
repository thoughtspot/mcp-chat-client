import { Card, Flex, message, Button, Spin, Typography } from "antd"
import { ChatInput } from "../chat-input/chat-input"
import type { MCPResource } from "../../hooks"
import { readMCPServerResource } from "../../services/mcp"
import { useState } from "react";
import { SelectedResources } from "../selected-resources/selected-resources";
import { ConversationResponseState, sendMessage } from "../../services/conversations";
import { abortRequest } from "../../services/api-call";
import { v7 as uuid } from 'uuid';
import { ConversationResponseMessage } from "../conversation-response-message/conversation-response-message";
import { TypingIndicator } from "../typing-indicator/typing-indicator";
import { useSmartScroll } from "../../hooks/use-smart-scroll";
import { ArrowDownOutlined, DownOutlined, PlusOutlined } from "@ant-design/icons";
import { useMCPContext } from "../../contexts/mcp-context";
import { AddMCPModal } from "../mcp/add-mcp-modal";

interface Message {
    role: 'user' | 'assistant';
    content: string | ConversationResponseState;
    id?: string;
}

interface ChatState {
    messages: Message[];
    selectedResources: MCPResource[];
    referenceId?: string;
}

export const Chat = ({ style }: { style?: React.CSSProperties }) => {
	const { mcpServers, enabledDefaultTools, fetchMCPServers } = useMCPContext();
	const [chatState, setChatState] = useState<ChatState>({
		messages: [],
		selectedResources: [],
	});
	const [pendingResources, setPendingResources] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [isReadResourceLoading, setIsReadResourceLoading] = useState(false);
	const [isAddMCPModalOpen, setIsAddMCPModalOpen] = useState(false);

	// Use the smart scroll hook
	const { containerRef, handleScroll, shouldAutoScroll, scrollToBottom } = useSmartScroll({
		dependencies: [chatState.messages]
	});

	const handleResourceSelect = async (serverId: string, resource: MCPResource) => {
		message.success(`Selected resource: ${resource.name || resource.uri} from ${serverId}`);
		// read the resource
		setIsReadResourceLoading(true);
		const resourceData = await readMCPServerResource(serverId, resource.uri);
		setPendingResources([
			...pendingResources,
			...resourceData
		]);
		setChatState({
			...chatState,
			selectedResources: [...chatState.selectedResources, {
				...resource,
				content: resourceData,
			}],
		});
		setIsReadResourceLoading(false);
	};

	const handleRemoveResource = (resource: MCPResource) => {
		setChatState({
			...chatState,
			selectedResources: chatState.selectedResources.filter(r => r.uri !== resource.uri),
		});
		setPendingResources(pendingResources.filter(r => r.uri !== resource.uri));
	};

	const handleSendMessage = async (text: string, fileAttachments: any[] = []) => {
		if (loading) {
			abortRequest('sendMessage');
		}
		setLoading(true);
		setChatState({
			...chatState,
			messages: [
				...chatState.messages,
				{ role: 'user', content: text, id: uuid() }
			],
		});
		try {
			// filter out the servers that are not connected
			const availableMcpServers = mcpServers
				.filter(server => server.isConnected)

			// Combine pending resources and file attachments
			const allAttachments = [...pendingResources, ...fileAttachments];

			await sendMessage(text, allAttachments, availableMcpServers, enabledDefaultTools, chatState.referenceId, (state: ConversationResponseState, isStart: boolean) => {
				if (isStart) {
					setChatState(prevState => ({
						...prevState,
						messages: [
							...prevState.messages,
							{ role: 'assistant', content: state, id: state.responseId },
						],
						referenceId: state.responseId,
					}));
				} else {
					// update message content with the new state with the same id
					setChatState(prevState => ({
						...prevState,
						messages: prevState.messages.map(m => m.id === state.responseId ? { ...m, content: state } : m),
					}));
				}
			});
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return <Flex vertical className="chat-container" gap={12} style={{ ...style }}>
		<Flex
			ref={containerRef}
			className="chat-messages"
			vertical
			gap={24}
			style={{ flex: 1, height: '100%', overflow: 'auto', scrollBehavior: 'smooth' }}
			onScroll={handleScroll}
		>
			<Flex className="chat-messages-content" vertical gap={36} style={{ flex: "1 1 auto", minWidth: 600, maxWidth: 800, }}>
				{chatState.messages.length === 0 ? (
					// Welcome message when no messages
					<Flex vertical align="center" justify="center" style={{ flex: 1, minHeight: 400 }}>
						<Card
							variant="borderless"
							style={{
								textAlign: 'center',
								maxWidth: 500,
								background: 'transparent',
								border: 'none'
							}}
						>
							<Typography.Title level={2} style={{ marginBottom: 16, }}>
								Welcome to MCP Chat
							</Typography.Title>
							<Typography.Paragraph style={{ fontSize: 16, marginBottom: 24, color: '#666' }}>
								I am the most generic and neutral AI agent on the internet! Connect with apps to expand my capabilities.
							</Typography.Paragraph>
							<Button
								type={mcpServers.length === 0 ? "primary" : "default"}
								size="large"
								icon={<PlusOutlined />}
								onClick={() => setIsAddMCPModalOpen(true)}
								style={{ marginBottom: 16 }}
							>
								Add Connection
							</Button>
							<Typography.Text type="secondary" style={{ display: 'block' }}>
								Connect with external tools and services to expand my capabilities. Or use one of the built-in tools.
							</Typography.Text>
						</Card>
					</Flex>
				) : (
					// Regular messages
					<>
						{chatState.messages.map((message) => (
							message.role === 'user'
								? <Card
									size="small"
									variant="borderless"
									key={message.id}
									style={{ whiteSpace: 'pre-wrap', textAlign: 'right', width: 'fit-content', alignSelf: 'flex-end' }}
								>{message.content as string}</Card>
								: <ConversationResponseMessage
									key={message.id}
									state={message.content as ConversationResponseState}
								/>
						))}

						{/* Show typing indicator when waiting for response */}
						{loading && chatState.messages.length > 0 && (
							<TypingIndicator />
						)}
					</>
				)}
			</Flex>
		</Flex>

		{/* Floating scroll-to-bottom button */}


		<Flex vertical className="chat-input-container" gap={12} style={{ maxWidth: 800 }}>
			{!shouldAutoScroll && (
				<Button
					shape="circle"
					type="primary"
					icon={<ArrowDownOutlined />}
					onClick={scrollToBottom}
					style={{
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
						zIndex: 1000,
						alignSelf: 'center',
						margin: 12
					}}
					title="Scroll to bottom"
				/>
			)}
			<Spin spinning={isReadResourceLoading}>
				<SelectedResources resources={chatState.selectedResources} onRemoveResource={handleRemoveResource} />
			</Spin>
			<ChatInput onResourceSelect={handleResourceSelect} onSendMessage={handleSendMessage} inProgress={loading} />
		</Flex>

		{/* Add MCP Modal */}
		<AddMCPModal
			open={isAddMCPModalOpen}
			onCancel={() => setIsAddMCPModalOpen(false)}
			onAdd={() => {
				setIsAddMCPModalOpen(false);
				fetchMCPServers(); // Refresh the MCP servers list
			}}
		/>
	</Flex>
};
