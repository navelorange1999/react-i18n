// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { v4 } from "uuid";
import { upperCase, snakeCase } from "lodash";
import { posix } from "path";
import * as fs from "fs"; // In NodeJS: 'const fs = require('fs')'
import * as crypto from "crypto";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "oppI18n" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("oppI18n.opp", async () => {
    const generateCode = (text: string) => {
      const hash = crypto.createHash("md5").update(text).digest("hex");
      return text
        ? `${upperCase(snakeCase(text.slice(0, 10)))}_${hash.slice(
            0,
            5
          )}`.replace(/\s/g, "_")
        : text;
    };

    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World from oppI18n!');
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }
    let originText = "";
    let i18nText = "";
    let mode = 0;
    editor.edit((edit: vscode.TextEditorEdit) => {
      for (let selection of editor!.selections) {
        var text = editor!.document.getText(selection) || "";

        if (text.startsWith("'") || text.startsWith('"')) {
          text = text.replace(/['"]+/g, ""); // 去除两边的 ' 或者 "
          mode = 0;
        } else if (
          !text.startsWith("'") &&
          !text.startsWith('"') &&
          !text.startsWith("`")
        ) {
          mode = 2;
          text = text.replace(/{/g, "{{");
          text = text.replace(/}/g, "}}");
          text = text.replace(/\t/gm, "").trim();
        } else if (text.startsWith("`")) {
          console.log("sssss");
          mode = 1;
          text = text.replace(/`/g, ""); // 去除两边的 `
          text = text.replace(/\$/g, "");
          text = text.replace(/{/g, "{{");
          text = text.replace(/}/g, "}}");
        } else {
          // default
          text = text.replace(/['"]+/g, "");
          mode = 0;
        }

        // text = text.replace(/['"]+/g, "");
        // text = text.replace(/\t/gm, "");
        // text = text.replace(/\r?\n|\r/g, "");

        originText = text;
        i18nText = generateCode(text);
        if (mode === 2) {
          var str;
          var keyString = "";
          var regex = /{{(.+?)}}/g;
          const res = text.match(/{{(.+?)}}/);
          if (res?.length) {
            console.log("has");
            while ((str = regex.exec(text))) {
              const key = str[1];
              keyString += `${key},`;
            }
            keyString = keyString.substr(0, keyString.length - 1);
            console.log(keyString);
            edit.replace(selection, `t('${i18nText}',{${keyString}})`);
          } else {
            edit.replace(selection, `t('${i18nText}')`);
          }
        } else if (mode === 1) {
          var str;
          var keyString = "";
          var regex = /{{(.+?)}}/g;
          const res = text.match(/{{(.+?)}}/);
          if (res?.length) {
            console.log("has");
            while ((str = regex.exec(text))) {
              const key = str[1];
              keyString += `${key},`;
            }
            keyString = keyString.substr(0, keyString.length - 1);
            console.log(keyString);
            edit.replace(selection, `t('${i18nText}',{defaultValue: '${originText}', ${keyString}})`);
          } else {
            edit.replace(selection, `t('${i18nText}', '${originText}')`);
          }
        } else {
          console.log(111);
          edit.replace(selection, `t('${i18nText}', '${originText}')`);
        }
        vscode.window.showInformationMessage(`success replace${i18nText}`);
      }
    });
    // const writeStr = "1€ is 1.12$ is 0.9£";
    // const writeData = Buffer.from(writeStr, "utf8");

    const folderUri = vscode.workspace.workspaceFolders?.[0].uri;
    if (!folderUri) {return;}
    const fileName = `${
      vscode.workspace.workspaceFolders?.[0].name ?? "prj"
    }-translation.json`;
    const fileUri = folderUri.with({
      path: posix.join(folderUri.path, fileName),
    });

    // await vscode.workspace.fs.writeFile(fileUri, writeData);
    if (fs.existsSync(fileUri.path)) {
      const readData = await vscode.workspace.fs.readFile(fileUri);
      const readStr = Buffer.from(readData).toString("utf8");
      const oldObj = JSON.parse(readStr);
      oldObj[i18nText] = originText;

      const writeStr = JSON.stringify(oldObj, null, 4);
      const writeData = Buffer.from(writeStr, "utf8");
      await vscode.workspace.fs.writeFile(fileUri, writeData);
      vscode.window.showInformationMessage(`${i18nText}:${originText}`);
      // vscode.window.showTextDocument(fileUri);
    } else {
      const data: any = {};
      data[i18nText] = originText;
      const writeStr = JSON.stringify(data, null, 4);
      const writeData = Buffer.from(writeStr, "utf8");
      await vscode.workspace.fs.writeFile(fileUri, writeData);
      vscode.window.showInformationMessage(writeStr);
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
