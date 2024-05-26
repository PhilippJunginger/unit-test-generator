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

  const [shots, setShots] = useState<string[]>(['']);
  const [selectedKI, setSelectedKI] = useState<KI_TYPE>(KI_TYPE.CHAT_GPT);

  const handleHowdyClick = () => {
    console.log(shots[0])
    vscode.postMessage({
      kiType: selectedKI,
      text: shots[0],
    });
  }

  const handleAddShot = () => {
    setShots([...shots, ''])
  }

  const handleKiSelection = (selectedKi: KI_TYPE) => {
    setSelectedKI(selectedKI);
  }

  const handleRemoveShot = () => {
    const shotsToUpdate = [...shots];

    if (shotsToUpdate.length === 1) {
      setShots(['']);
      return;
    }

    shotsToUpdate.pop();
    setShots(shotsToUpdate);
  }

  const handleShotInputChange = (event: ChangeEvent<HTMLTextAreaElement>, shotIndex: number) => {
    const value = event.target.value;
    const shotsToUpdate = [...shots];

    shotsToUpdate[shotIndex] = value;
    setShots(shotsToUpdate)
  }

  return (
    <main>
      <h1>Generate Unit-Test</h1>


      <div className="dropdown-container">
        <label htmlFor='dropdown'>KI-Modell</label>
        <VSCodeDropdown id="dropdown" value={selectedKI}>
          {
            Object.values(KI_TYPE).map((ki) => <VSCodeOption value={ki} onClick={() => handleKiSelection(ki)}>{ki}</VSCodeOption>)
          }
        </VSCodeDropdown>
      </div>    


      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
        <h4>Prompt Shots</h4>

        {
          shots.map((shot, index) => <VSCodeTextArea onChange={(e) => handleShotInputChange(e as ChangeEvent<HTMLTextAreaElement>, index)} value={shot} key={index}>Shot Nr. {index}</VSCodeTextArea>)
        }

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', marginTop: '16px' }}>
          <VSCodeButton onClick={handleAddShot}>+</VSCodeButton>
          <VSCodeButton onClick={handleRemoveShot}>-</VSCodeButton>
        </div>
      </div>

      <VSCodeButton onClick={handleHowdyClick}>Generate!</VSCodeButton>
    </main>
  );
}

export default App;
