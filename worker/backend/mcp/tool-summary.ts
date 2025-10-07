import { Context } from "../context";

export const getToolSummary = async ({ serverName, toolName, args, result }: { serverName: string, toolName: string, args: any, result: any }, context: Context): Promise<ReadableStream> => {
	const prompt = `

		This is the result of a tool call:
		${JSON.stringify(result, null, 2)}

		Extract all images and frames from the result and put them as a collection in the below format:

		<img src="image_url1" width="200" />
		<iframe src="frame_url1" width="500" height="600" />
		<img src="image_url2" width="200" />
		<iframe src="frame_url2" width="500" height="600"/>
		...

		Do not include any other text in the response.
	`;
	return context.sendMessage(prompt, [], [], [], undefined);
}
