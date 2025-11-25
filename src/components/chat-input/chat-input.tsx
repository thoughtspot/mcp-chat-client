import { Button, Input, InputRef, Space, Dropdown, message, Tag, Flex, Spin } from "antd"
import { PlusOutlined, ArrowUpOutlined, XFilled, FileOutlined, FolderOutlined, LoadingOutlined } from "@ant-design/icons"
import { MCPResourcesDropdown } from "../mcp-resources-dropdown"
import type { MCPResource } from "../../hooks"
import { useRef, useState } from "react"
import { uploadFile } from "../../services/conversations"
import type { Attachment } from "../../../worker/backend/types"

interface ChatInputProps {
    onResourceSelect?: (serverId: string, resource: MCPResource) => void;
    onSendMessage?: (text: string, attachments: Attachment[]) => void;
    inProgress?: boolean;
}

export const ChatInput = ({ onResourceSelect, onSendMessage, inProgress }: ChatInputProps) => {
	const inputRef = useRef<InputRef>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState('');
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [isResourceDropdownOpen, setIsResourceDropdownOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const handleResourceSelect = (serverId: string, resource: MCPResource) => {
		console.log(`Selected resource: ${resource.name} from server: ${serverId}`);
		onResourceSelect?.(serverId, resource);
		setIsResourceDropdownOpen(false);
	};

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			message.loading({ content: 'Uploading PDF...', key: 'upload' });
			const fileMeta = await uploadFile(file);

			const attachment: Attachment = {
				file_id: fileMeta.id,
				filename: file.name,
				mimeType: file.type
			};

			setAttachments(prev => [...prev, attachment]);
			message.success({ content: `PDF ${file.name} uploaded successfully`, key: 'upload' });
		} catch (error) {
			console.error('Failed to upload PDF:', error);
			message.error({ content: 'Failed to upload PDF', key: 'upload' });
		} finally {
			setIsUploading(false);
		}

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleRemoveAttachment = (index: number) => {
		setAttachments(prev => prev.filter((_, i) => i !== index));
	};

	const handleSendMessage = () => {
		if (!inputValue.trim()) return;
		onSendMessage?.(inputValue, attachments);
		// Clear the input and attachments after sending
		setInputValue('');
		setAttachments([]);
	};

	const menuItems = [
		{
			key: 'upload',
			label: 'Upload PDF',
			icon: <FileOutlined />,
			onClick: () => {
				fileInputRef.current?.click();
			}
		},
		{
			key: 'resources',
			label: 'Add resources',
			icon: <FolderOutlined />,
			onClick: () => {
				setIsResourceDropdownOpen(true);
			}
		}
	];

	return (
		<Flex vertical gap={8} style={{ width: '100%', margin: 'auto 0 0 0' }}>
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: 'none' }}
				accept="application/pdf"
				onChange={handleFileUpload}
			/>

			{/* Show attached files */}
			{attachments.length > 0 && (
				<Flex wrap="wrap" gap={8}>
					{attachments.map((attachment, index) => (
						<Tag
							key={index}
							icon={<FileOutlined />}
							closable
							onClose={() => handleRemoveAttachment(index)}
							style={{
								margin: 0,
								padding: '4px 8px',
								fontSize: '13px',
								display: 'flex',
								alignItems: 'center'
							}}
						>
							{attachment.filename}
						</Tag>
					))}
				</Flex>
			)}

			<Space.Compact style={{ width: '100%' }}>
				<Input
					addonBefore={
						<div style={{ position: 'relative', display: 'inline-flex' }}>
							<Dropdown menu={{ items: menuItems }} trigger={['click']} placement="topLeft" disabled={isUploading}>
								{isUploading ? (
									<LoadingOutlined style={{ cursor: 'default' }} />
								) : (
									<PlusOutlined style={{ cursor: 'pointer' }} />
								)}
							</Dropdown>
							<MCPResourcesDropdown
								onResourceSelect={handleResourceSelect}
								open={isResourceDropdownOpen}
								onOpenChange={setIsResourceDropdownOpen}
							>
								<span style={{
									position: 'absolute',
									left: '50%',
									top: '50%',
									width: 1,
									height: 1,
									visibility: 'hidden',
									pointerEvents: 'none'
								}} />
							</MCPResourcesDropdown>
						</div>
					}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onPressEnter={handleSendMessage}
					size="large"
					placeholder="Ask anything"
					style={{ flex: 1 }}
					ref={inputRef}
					disabled={inProgress}
				/>
				<Button size="large" icon={(inProgress) ? <XFilled /> : <ArrowUpOutlined />} onClick={handleSendMessage}></Button>
			</Space.Compact>
		</Flex>
	)
}
