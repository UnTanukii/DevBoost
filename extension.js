const vscode = require('vscode');
const path = require('path');
const sound = require('sound-play');

const statusBarsItems = [];
let extensionContext;

function playSound(){
	const playSound = vscode.workspace.getConfiguration('devboost').get('playSound');
	const soundVolume = (vscode.workspace.getConfiguration('devboost').get('soundVolume') || 100) / 100;
	if(playSound){
		const soundPath = vscode.Uri.file(path.join(extensionContext.extensionPath, 'media', 'motivation_sound.mp3')).fsPath;
		sound.play(soundPath, soundVolume).catch(err => console.error('Error playing sound:', err));
	}
}

function updateQuote() {
	let quotes = [
		'test test'
	];
	const configQuotes = vscode.workspace.getConfiguration('devboost').get('customQuotes') || [];
	if(configQuotes.length > 0) {
		quotes = quotes.concat(configQuotes);
	}

	const quote = quotes[Math.floor(Math.random() * quotes.length)];
	displayQuote(quote);
	playSound();
}

function format(quote){return quote.replace(/%quote%/g, quote);}

function displayQuote(quote) {
	const quotePosition = vscode.workspace.getConfiguration('devboost').get('displayPosition');
	if(quotePosition === 'statusBar (left)') {
		statusBarsItems['left'].text = format(quote);
		statusBarsItems['left'].show();
	}else if(quotePosition === 'statusBar (right)') {
		statusBarsItems['right'].text = format(quote);
		statusBarsItems['right'].show();
	}else if(quotePosition === 'notification') {
		vscode.window.showInformationMessage(format(quote), {modal: false}, 'Dismiss').then((value) => {
			if(value === 'Dismiss') {
				return;
			}
		});
	}
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	extensionContext = context;
	////////////////////////////
	// CONFIGURATION
	////////////////////////////
	const showOnStartup = vscode.workspace.getConfiguration('devboost').get('showOnStartup');
	const notificationInterval = vscode.workspace.getConfiguration('devboost').get('notificationInterval');
	////////////////////////////
	// STATUS BAR ITEMS
	////////////////////////////
	statusBarsItems['left'] = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarsItems['left'].tooltip = "Click to toggle visibility";
	statusBarsItems['left'].command = "devboost.toggleStatusBarItem";
	statusBarsItems['right'] = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	statusBarsItems['right'].tooltip = "Click to toggle visibility";
	statusBarsItems['right'].command = "devboost.toggleStatusBarItem";
	context.subscriptions.push(statusBarsItems['left'], statusBarsItems['right']);

	////////////////////////////
	// UPDATE QUOTE
	////////////////////////////
	if(showOnStartup){updateQuote()};
	setInterval(() =>{updateQuote()}, notificationInterval * 1000 * 60);
	const updateQuoteCommand = vscode.commands.registerCommand('devboost.shuffleQuote',function(){updateQuote()});
	// TOGGLE STATUS BAR ITEM COMMAND
	const toggleStatusBarItemCommand = vscode.commands.registerCommand('devboost.toggleStatusBarItem', function () {
		const quotePosition = vscode.workspace.getConfiguration('devboost').get('displayPosition');
		if(quotePosition === 'statusBar (left)') {
			statusBarsItems['left'].hide();
		}else if(quotePosition === 'statusBar (right)') {
			statusBarsItems['right'].hide();
		}
	});

	// PUSH INTO CONTEXT SUBSCRIPTIONS
	context.subscriptions.push(toggleStatusBarItemCommand, updateQuoteCommand);
}

function deactivate() {
	if(statusBarsItems['left']){statusBarsItems['left'].dispose()};
	if(statusBarsItems['right']){statusBarsItems['right'].dispose()};
}

module.exports = {
	activate,
	deactivate
}
