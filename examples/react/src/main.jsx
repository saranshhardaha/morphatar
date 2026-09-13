import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Morphatar } from '@morphatar/react';

function App() {
  const [seed, setSeed] = useState('ada@lovelace.dev');

  return (
    <>
      <label>
        Seed <input value={seed} onChange={(event) => setSeed(event.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Morphatar seed={seed} variant="organic" background="#ffffff" size={96} animation="blink" />
        <Morphatar seed={seed} variant="geometric" size={96} />
        <Morphatar seed={seed} variant="pixel" size={96} />
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
