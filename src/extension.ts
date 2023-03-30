// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as https from 'https';

const projectName = 'chatgpt-coding-with-you';
const command = {
	settingNewApiKey: `${projectName}.settingNewApiKey`,
	writeCommentForMe: `${projectName}.writeCommentForMe`,
	writeDescriptionForMe: `${projectName}.writeDescriptionForMe`,
	improveCodeForMe: `${projectName}.improveCodeForMe`,
	customQuestion: `${projectName}.customQuestion`,
};
const openAIKeyId = `${projectName}.openAIKey`;

async function getOpenAIKey(secrets: vscode.SecretStorage, isReset: boolean): Promise<string> {
	const secretsOpenAIKey = openAIKeyId;
	const openAIKey = await secrets.get(secretsOpenAIKey);
	if (openAIKey && !isReset) {
		return openAIKey;
	}

	const inputKey = await vscode.window.showInputBox({
		title: "Setting OpenAI API Key",
		prompt: "Please Enter your OpenAI API key. You can find this at beta.openai.com/account/api-keys",
		ignoreFocusOut: true,
		placeHolder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	});

	if (!inputKey) {
		return '';
	}

	secrets.store(secretsOpenAIKey, inputKey);
	return inputKey;
}

function getSelectedCode(): string {
	return vscode.window.activeTextEditor?.document.getText(
		vscode.window.activeTextEditor?.selection
	) || '';
}

async function getEditor(askedQuestion: string) {
	
	return await vscode.window.showTextDocument(
		await vscode.workspace.openTextDocument({
			content: `${askedQuestion} \n\n =========================== \n\n Querying...`,
			language: 'markdown',
		}),
		{
			viewColumn: vscode.ViewColumn.Beside,
			preserveFocus: true,
			preview: true,
		},
	);
}

async function sendQueryToOpenAIAndShowOnNewEditor(queryText: string, openAIKey: string) {
	try {
		let responseText = '';
		const request = https.request({
			hostname: 'api.openai.com',
			path: '/v1/chat/completions',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${openAIKey}`,
			},
		}, (response) => {
			response.on('data', data => {
				const result = JSON.parse(data.toString());
				if (result.error) {
					responseText += result.error.message;
					return;
				}
				responseText += result.choices[0].message.content;
			});
		});

		request.write(
			JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [{
					role: 'user',
					content: queryText,
				}],
			})
		);
		request.end();

		const editor = await getEditor(queryText);
		const setOpenAIResponse = (msg: string) => (editBuilder: vscode.TextEditorEdit) => {
			editBuilder.replace(
				new vscode.Range(
					new vscode.Position(
						editor.document.lineCount - 1, 
						0
					),
					new vscode.Position(
						editor.document.lineCount, 
						0
					)
				),
				msg
			);
		};

		request.on('close', () => {
			editor.edit(setOpenAIResponse(
				responseText || 'Some unexpected things happened.'
			));
		});

	} catch (error) {
		vscode.window.showErrorMessage(`錯誤：${error}`);
	}
} 

function commandsRegistration(context: vscode.ExtensionContext): Array<vscode.Disposable> {
	const registrationList: Array<vscode.Disposable> = [];
	const addToRegistrationList = (registeredCommand: vscode.Disposable): void => {
		registrationList.push(registeredCommand);
	};
	const registerCommand = vscode.commands.registerCommand;

	// 設定 openAIKey
	addToRegistrationList(
		registerCommand(command.settingNewApiKey, async () => {
			await getOpenAIKey(context.secrets, true);
		})
	);

	// 幫已選取的程式區塊寫註解
	addToRegistrationList(
		registerCommand(command.writeCommentForMe, async () => {

			const selectedCode = getSelectedCode();
			if (selectedCode === '') {
				vscode.window.showErrorMessage('Please Select Code Block First!');
				return;
			}

			const queryText = `請幫我在以下程式碼內用繁體中文撰寫註解。\n ${selectedCode}`;
			const openAIKey = await getOpenAIKey(context.secrets, false);
			await sendQueryToOpenAIAndShowOnNewEditor(queryText, openAIKey);
		}
	));

	// 幫已選取的程式區塊寫說明
	addToRegistrationList(
		registerCommand(command.writeDescriptionForMe, async () => {

			const selectedCode = getSelectedCode();
			if (selectedCode === '') {
				vscode.window.showErrorMessage('Please Select Code Block First!');
				return;
			}

			const queryText = `請用繁體中文回答我。請告訴我以下的程式碼在做什麼。\n ${selectedCode}`;
			const openAIKey = await getOpenAIKey(context.secrets, false);
			await sendQueryToOpenAIAndShowOnNewEditor(queryText, openAIKey);
		}
	));

	// 改善已選取的程式區塊
	addToRegistrationList(
		registerCommand(command.improveCodeForMe, async () => {

			const selectedCode = getSelectedCode();
			if (selectedCode === '') {
				vscode.window.showErrorMessage('Please Select Code Block First!');
				return;
			}

			const queryText = `請用繁體中文回答我，不用解釋，給我程式碼就好。請告訴我以下的程式碼用相同的程式語言你會怎麼寫?\n ${selectedCode}`;
			const openAIKey = await getOpenAIKey(context.secrets, false);
			await sendQueryToOpenAIAndShowOnNewEditor(queryText, openAIKey);
		}
	));

	// 自訂問題
	addToRegistrationList(
		registerCommand(command.customQuestion, async () => {

			const selectedCode = getSelectedCode();
			if (selectedCode === '') {
				vscode.window.showErrorMessage('Please Select Code Block First!');
				return;
			}

			const queryText = `${selectedCode}`;
			const openAIKey = await getOpenAIKey(context.secrets, false);
			await sendQueryToOpenAIAndShowOnNewEditor(queryText, openAIKey);
		}
	));

	return registrationList;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		...commandsRegistration(context),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
