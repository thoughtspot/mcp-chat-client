
const functionCallMap = {};

export async function enqueueFunctionCallResultsStream(functionCalls: any[], controller: ReadableStreamDefaultController, getResponseStream: (input: any) => Promise<ReadableStream>) {
	return new Promise(async (resolve, reject) => {
		const functionCallResults = await Promise.all(functionCalls.map(async functionCall => {
			const functionCallResult = await functionCallMap[functionCall.name](functionCall.args);
			return functionCallResult;
		}));
		const input = [];
		const stream = await getResponseStream(input);
		const reader = stream.getReader();

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			controller.enqueue(value);
		}

		resolve(true);
	});
}
