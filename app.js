const workspace = document.getElementById('workspace');
const clearButton = document.getElementById('clearWorkspace');

clearButton?.addEventListener('click', () => {
  if (workspace) workspace.value = '';
});
