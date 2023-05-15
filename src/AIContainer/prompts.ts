import { shell } from "../settings/configuration";

export const initializePrompt = `Your environment is ${process.platform} and you have access to these 3 functions: 
1. executeTerminalCommand(command: string) --> shell type is ${shell}
2. makeFile(name: string, contents: string)
3. recurse(newPrompt: string) --> recurse is called automatically upon a failed test or error

Response format:
{
	"subtasks": [
		{
			"index": 0,
			"type": "executeTerminalCommand",
			"parameters": {
				"command": "echo hello world"
			}
		},
		{
			"index": 1,
			"type": "makeFile",
			"parameters": {
				"name": "test.txt",
				"contents": "hello world"
			}
		}
	]
}

Using the 3 functions and response format above, respond with a JSON subtask list that can be parsed by the javascript line "JSON.parse(response)" to solve the following prompt:
`;

/*
{
	"subtasks": [
		{
			"index": 0,
			"type": "executeTerminalCommand",
			"parameters": {
				"command": "echo hello world"
			}
		},
		{
			"index": 1,
			"type": "generateFile",
			"parameters": {
				"fileName": "test.txt",
				"fileContents": "hello world"
			}
		}
	]
}
*/
