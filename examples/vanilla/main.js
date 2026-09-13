import { morphatar } from '@morphatar/core';

const input = document.getElementById('seed');
const avatars = document.getElementById('avatars');

function render() {
  // Same seed, same avatar: type a value, clear it, retype it.
  avatars.innerHTML = ['organic', 'geometric', 'pixel']
    .map((variant) => morphatar({ seed: input.value, variant, background: '#ffffff', size: 96, animation: 'blink' }))
    .join('');
}

input.addEventListener('input', render);
render();
