import { generateOneTimeScript } from './script-generators';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.command) {
    return false;
  }

  switch (message.command) {
    case 'get-var':
      getWindowVariables(message.variables).then(data => {
        console.log('send response:');
        console.log(data);
        sendResponse({
          variables: data
        });
      });
      return true;
    case 'set-var':
      // setWindowVariable(message.variable, message.value);
      return false;
    case 'call-function':
      callFunction(message.functionName, message.parameters, result => sendResponse(result));
      return true;
    default:
      return false;
  }
});

function gatherVariables(variableNames: string[]): { [key: string]: any } {
  const result = {};
  variableNames.forEach(name => {
    // Removes unserializable stuff like canvases or functions
    result[name] = JSON.parse(JSON.stringify(window[name]));
  });
  return result;
}

function callFunction(functionName: string, parameters: any[], callback: (result: any) => void) {
  const result = window[functionName].apply(undefined, parameters);
  callback(result);
}

function getWindowVariables(variableNames: string[]) {
  return generateOneTimeScript(gatherVariables, variableNames);
}
