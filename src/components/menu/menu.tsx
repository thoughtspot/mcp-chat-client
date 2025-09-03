import { Flex, Menu, Avatar, Dropdown, Button } from "antd";
import { AppstoreOutlined, MessageOutlined, LogoutOutlined } from "@ant-design/icons";
import { useState } from "react";
import { ToolsWrapper } from "../tools-wrapper/tools-wrapper";
import { History } from "../history/history";
import { useAuth } from "../../hooks/use-auth";
import "./menu.scss";

export const MenuComponent = () => {
	const [selectedKey, setSelectedKey] = useState('mcp-servers');
	const { user, logout } = useAuth();

	const handleMenuClick = ({ key }: { key: string }) => {
		setSelectedKey(key);
	};

	const handleLogout = () => {
		logout();
	};

	const getUserInitials = () => {
		if (!user) return '?';
		const { user_metadata } = user;
		if (user_metadata?.full_name) {
			return user_metadata.full_name.split(' ').map((name: string) => name[0]).join('').toUpperCase();
		}
		if (user_metadata?.name) {
			return user_metadata.name[0].toUpperCase();
		}
		return user.email?.[0].toUpperCase() || '?';
	};

	const renderContent = () => {
		switch (selectedKey) {
		case 'mcp-servers':
			return <ToolsWrapper />;
		case 'history':
			return <History />;
		default:
			return <ToolsWrapper />;
		}
	};

	const avatarMenuItems = [
		{
			key: 'logout',
			label: 'Logout',
			icon: <LogoutOutlined />,
			onClick: handleLogout,
		},
	];

	return (
		<Flex className="sider">
			<div className="menu-container">
				<Menu
					className="menu"
					mode="inline"
					selectedKeys={[selectedKey]}
					onClick={handleMenuClick}
					items={[ {
						key: 'history',
						label: null,
						icon: <MessageOutlined style={{ fontSize: 24 }}/>,
					}, {
						key: 'mcp-servers',
						label: null,
						icon: <AppstoreOutlined style={{ fontSize: 24 }} />,
					}]}
				/>
				<div className="avatar-container">
					<Dropdown
						menu={{ items: avatarMenuItems }}
						placement="topRight"
						trigger={['click']}
					>
						<Button type="text" className="avatar-button">
							<Avatar size={40} className="user-avatar">
								{getUserInitials()}
							</Avatar>
						</Button>
					</Dropdown>
				</div>
			</div>
			<div className="menu-content">
				{renderContent()}
			</div>
		</Flex>
	);
};
