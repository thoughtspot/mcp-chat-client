import { Button, Flex, Layout } from "antd";
import { useState } from "react";
import { FormOutlined } from "@ant-design/icons";
import "./home.scss";
import { Chat } from "../chat/chat";
import { MenuComponent } from "../menu/menu";

export const Home = () => {
	const [chatKey, setChatKey] = useState('0');
	return <Layout className="home">
		<Layout.Sider width={300}>
			<MenuComponent />
		</Layout.Sider>
		<Layout>
			<Layout.Header style={{ padding: 0 }}>
				<Flex style={{ height: '100%', width: '100%' }} align="center" justify="space-between">
					<Flex style={{ width: 64, height: 64, paddingTop: '5px' }}>
						<img src="/flask-2.png" style={{ width: '28px', transform: 'rotate(120deg)', margin: 'auto' }}  />
					</Flex>
					<Flex style={{ marginRight: 48 }} gap={12}>
						<Button type="text" icon={<FormOutlined />}  onClick={() => setChatKey(Math.random() + '')}>New Chat</Button>
						<Button icon={<img src="https://cdn.brandfetch.io/idZAyF9rlg/theme/light/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1719469980826" width={24} height={24} />} shape="circle" type="link" onClick={() => window.open('https://github.com/thoughtspot/mcp-chat-client', '_blank')} />
						<Button icon={<img src="https://cdn.brandfetch.io/idM8Hlme1a/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668075051777" width={24} height={24} />} shape="circle" type="link" onClick={() => window.open('https://developers.thoughtspot.com/join-discord', '_blank')} />
					</Flex>
				</Flex>
			</Layout.Header>
			<Layout.Content>
				<Chat style={{ height: '100%', width: '100%', padding: '24px 0 24px 24px' }} key={chatKey}/>
			</Layout.Content>
		</Layout>
	</Layout>
}
