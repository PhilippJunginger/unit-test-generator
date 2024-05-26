import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import { ChangeEvent, useState } from "react";
import "./App.css";
import { vscode } from "./utilities/vscode";

enum KI_TYPE {
  CHAT_GPT = 'ChatGPT',
  CLAUDE = 'Claude',
  GEMINI = 'Gemini'
}

function App() {

  const [prompt, setPrompt] = useState<string>('');
  const [selectedKI, setSelectedKI] = useState<KI_TYPE>(KI_TYPE.CHAT_GPT);

  const handleHowdyClick = () => {
    vscode.postMessage({
      kiType: selectedKI,
      text: prompt,
    });
  }

  const handleAddShot = (value: string) => {
    setPrompt(value)
  }

  const handleKiSelection = (selectedKi: KI_TYPE) => {
    setSelectedKI(selectedKI);
  }

  return (
    <main style={{width: '100%'}}>
      <h1>Generate Unit-Test</h1>


      <div className="dropdown-container">
        <label htmlFor='dropdown'>KI-Modell</label>
        <VSCodeDropdown id="dropdown" value={selectedKI}>
          {
            Object.values(KI_TYPE).map((ki) => <VSCodeOption value={ki} onClick={() => handleKiSelection(ki)}>{ki}</VSCodeOption>)
          }
        </VSCodeDropdown>
      </div>    


      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px', width: '100%' }}>
        <h4>Prompt</h4>

          <VSCodeTextArea rows={15} style={{width: '100%'}} value={prompt} onChange={(e) => handleAddShot((e as ChangeEvent<HTMLInputElement>).target.value)} />
      </div>

      <p>Dateininhalte des aktuell aktiven Editors werden dem Prompt automatisch angehängt.</p>

      <VSCodeButton onClick={handleHowdyClick}>Generate!</VSCodeButton>
    </main>
  );
}

export default App;
