import { Context } from "../context";

export const getToolSummary = async ({ serverName, toolName, args, result }: { serverName: string, toolName: string, args: any, result: any }, context: Context): Promise<ReadableStream> => {
	const prompt = `
		Summarize the output of a tool call which has already happened.

		You are given the following information:
		- The name of the server: ${serverName}
		- The name of the tool: ${toolName}
		- The arguments of the tool: ${JSON.stringify(args, null, 2)}
		- The result of the tool: ${JSON.stringify(result, null, 2)}

		Summarize the arguments and result of the tool call in markdown format in around 50 words, do not repeat the arguments and result in the summary.

		Do not ask about any follup questions, as the user is not able to answer them.
	`;
	return context.sendMessage(prompt, [], [], [], undefined);
}
