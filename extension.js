const vscode = require('vscode');
const path = require('path');
const sound = require('sound-play');

const statusBarsItems = [];
let extensionContext;

function getSoundName(){
	const soundName = vscode.workspace.getConfiguration('inspiredev').get('soundName');
	const soundNames = {
		'Never Back Down Never What?': 'never_back_down',
		'Giga Chad Music': 'giga_chad_music',
		'Sigma Music': 'sigma_music',
		'Oh oh oh Gotaga': 'gotaga',
		'Dark Souls 3 - Boss Theme': 'boss_theme',
		'Never Give Up Your Waaaaaay': 'never_give_up_japanese',
		'Just Do It (Shia LaBeouf)': 'just_do_it',
	};
	if (soundName == 'Random') return soundNames[Object.keys(soundNames)[Math.floor(Math.random() * Object.keys(soundNames).length)]] + '.mp3';
	return soundNames[soundName] + '.mp3';
}

function playSound(){
	const playSound = vscode.workspace.getConfiguration('inspiredev').get('playSound');
	const soundVolume = (vscode.workspace.getConfiguration('inspiredev').get('soundVolume') || 100) / 100;
	if(playSound){
		const soundPath = vscode.Uri.file(path.join(extensionContext.extensionPath, 'media', getSoundName())).fsPath;
		sound.play(soundPath, soundVolume).catch(err => console.error('Error playing sound:', err));
	}
}

function updateQuote() {
	const userLang = vscode.workspace.getConfiguration('inspiredev').get('language');
	let quotes = require(`./quotes/${userLang}.json`);
	const configQuotes = vscode.workspace.getConfiguration('inspiredev').get('customQuotes') || [];
	if(configQuotes.length > 0) {
		quotes = quotes.concat(configQuotes);
	}

	const quote = quotes[Math.floor(Math.random() * quotes.length)];
	displayQuote(quote);
	playSound();
}

function format(quote){
	const quoteFormat = vscode.workspace.getConfiguration('inspiredev').get('quoteFormat');
	return quoteFormat.replace(/%quote%/g, quote);
}

function actionStatusBarItem(type) {
	if(type === 'hide') {
		statusBarsItems['left'].hide();
		statusBarsItems['right'].hide();
	}else if(type === 'dispose') {
		statusBarsItems['left'].dispose();
		statusBarsItems['right'].dispose();
	}else if(type === 'set'){
		statusBarsItems['left'].tooltip='Click to hide'; 
		statusBarsItems['left'].command='inspiredev.toggleStatusBarItem';
		statusBarsItems['right'].tooltip='Click to hide'; 
		statusBarsItems['right'].command='inspiredev.toggleStatusBarItem';
	}
}

function displayQuote(quote) {
	const quotePosition = vscode.workspace.getConfiguration('inspiredev').get('displayPosition');
	actionStatusBarItem('hide');
	if(quotePosition === 'statusBar (left)') {
		statusBarsItems['left'].text = format(quote);
		statusBarsItems['left'].show();
	}else if(quotePosition === 'statusBar (right)') {
		statusBarsItems['right'].text = format(quote);
		statusBarsItems['right'].show();
	}else if(quotePosition === 'notification') {
		vscode.window.showInformationMessage(format(quote), {modal: false }, 'Dismiss').then((value) => {
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
	const showOnStartup = vscode.workspace.getConfiguration('inspiredev').get('showOnStartup');
	const notificationInterval = vscode.workspace.getConfiguration('inspiredev').get('notificationInterval');
	////////////////////////////
	// STATUS BAR ITEMS
	////////////////////////////
	statusBarsItems['left'] = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarsItems['right'] = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	actionStatusBarItem('set');
	context.subscriptions.push(statusBarsItems['left'], statusBarsItems['right']);

	////////////////////////////
	// UPDATE QUOTE
	////////////////////////////
	if(showOnStartup){setTimeout(()=>{updateQuote()},1000)};
	setInterval(() =>{updateQuote()}, notificationInterval * 1000 * 60);
	const updateQuoteCommand = vscode.commands.registerCommand('inspiredev.randomQuote',function(){updateQuote()});
	// TOGGLE STATUS BAR ITEM COMMAND
	const toggleStatusBarItemCommand = vscode.commands.registerCommand('inspiredev.toggleStatusBarItem', function () {
		const quotePosition = vscode.workspace.getConfiguration('inspiredev').get('displayPosition');
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
	actionStatusBarItem('dispose');
}

module.exports = {
	activate,
	deactivate
}
