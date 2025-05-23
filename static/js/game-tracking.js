// Function to refresh task status
function refreshTasksLive() {
  fetch('/api/tasks/status')
    .then(response => response.json())
    .then(data => {
      data.forEach(taskStatus => {
        const taskId = taskStatus.task_id;
        const completedElement = document.getElementById(`task-completed-${taskId}`);
        const progressElement = document.getElementById(`task-progress-${taskId}`);
        const requiredElement = document.getElementById(`task-required-${taskId}`);
        const taskItem = document.getElementById(`task-${taskId}`);

        if (completedElement) {
          completedElement.textContent = taskStatus.completed ? 'Completed' : 'In Progress';
          if (taskStatus.completed) {
            taskItem.classList.add('completed');
          }
        }

        if (progressElement && requiredElement) {
          progressElement.textContent = taskStatus.progress_count;
          requiredElement.textContent = taskStatus.required_count;
        }
      });
    })
    .catch(error => {
      console.error('Error fetching task status:', error);
    });
}
