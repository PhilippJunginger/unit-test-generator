import { commands, ExtensionContext, window } from "vscode";
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { SidebarProvider } from "./panels/SidebarPanel";


export function activate(context: ExtensionContext) {

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    window.registerWebviewViewProvider(
      "unitTestGenerator-sidebar",
      sidebarProvider
    )
  );

  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
    HelloWorldPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);
}
