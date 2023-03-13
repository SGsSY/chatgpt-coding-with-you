// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const projectName = 'chatgpt-coding-with-you';
const command = {
	helloWorld: `${projectName}.helloWorld`,
};

function commandsRegistration(): Array<vscode.Disposable> {
	const registrationList: Array<vscode.Disposable> = [];
	const addToRegistrationList = (registeredCommand: vscode.Disposable): void => {
		registrationList.push(registeredCommand);
	};
	const registerCommand = vscode.commands.registerCommand;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	addToRegistrationList(
		registerCommand(command.helloWorld, () => {
			// The code you place here will be executed every time your command is executed
			// Display a message box to the user
			vscode.window.showInformationMessage('Hello World from ChatGPT Coding With You!');
		}
	));

	return registrationList;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "chatgpt-coding-with-you" is now active!');

	const registrationList = commandsRegistration();
	context.subscriptions.push(...registrationList);
}

// This method is called when your extension is deactivated
export function deactivate() {}
