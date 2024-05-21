import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { ChangeEvent, useState } from "react";

function App() {

  const [shots, setShots] = useState<string[]>([]);

  const handleHowdyClick = () => {
    console.log(shots[0])
    vscode.postMessage({
      command: "sendPrompt",
      text: shots[0],
    });
  }

  const handleAddShot = () => {
    setShots([...shots, ''])
  }

  const handleRemoveShot = () => {
    const shotsToUpdate = [...shots];

    shotsToUpdate.pop();

    setShots([...shotsToUpdate])
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

      <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton>
    </main>
  );
}

export default App;
