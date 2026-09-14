const modeButtons = [...document.querySelectorAll('[data-mode]')];
const request = document.getElementById('request');
const output = document.getElementById('output');
const clearAll = document.getElementById('clearAll');

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    modeButtons.forEach((item) => item.classList.toggle('active', item === button));
  });
});

clearAll?.addEventListener('click', () => {
  if (request) request.value = '';
  if (output) output.value = '';
});
