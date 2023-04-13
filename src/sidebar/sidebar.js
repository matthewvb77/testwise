(function () {
	const inputTypeSelect = document.getElementById("input-type");
	const questionTab = document.getElementById("question-tab");
	const taskTab = document.getElementById("task-tab");
	const userTaskInputBox = document.getElementById("task-user-input");
	const userQuestionInputBox = document.getElementById("question-user-input");
	const taskSubmitButton = document.getElementById("task-submit-button");
	const questionSubmitButton = document.getElementById(
		"question-submit-button"
	);
	const progressText = document.getElementById("progress-text");

	function updatePlaceholderAndResponse() {
		switch (inputTypeSelect.value) {
			case "task":
				questionTab.classList.remove("show-component");
				taskTab.classList.add("show-component");
				break;
			case "question":
				taskTab.classList.remove("show-component");
				questionTab.classList.add("show-component");
				break;
			default:
				throw new Error("Invalid input type");
		}
	}

	updatePlaceholderAndResponse();
	inputTypeSelect.addEventListener("change", updatePlaceholderAndResponse);
	window.addEventListener("load", () => {
		document.body.classList.add("body-loaded");
	});

	userTaskInputBox.addEventListener("keydown", function (event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			taskSubmitButton.click();
		}
	});

	userQuestionInputBox.addEventListener("keydown", function (event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			questionSubmitButton.click();
		}
	});

	taskSubmitButton.addEventListener("click", () => {
		const input = userTaskInputBox.value;

		vscode.postMessage({ command: "submit-task", input });
	});

	questionSubmitButton.addEventListener("click", () => {
		const input = userQuestionInputBox.value;

		vscode.postMessage({ command: "submit-question", input });
	});

	document
		.getElementById("confirm-button")
		.addEventListener("click", () => userAction("confirm"));
	document
		.getElementById("cancel-button")
		.addEventListener("click", () => userAction("cancel"));
	document
		.getElementById("regenerate-button")
		.addEventListener("click", () => userAction("regenerate"));

	function userAction(action) {
		loader.classList.remove("loader-waiting");

		if (action === "regenerate") {
			progressText.textContent = "Regenerating subtasks...";
		}

		vscode.postMessage({
			command: "userAction",
			action: action,
		});
	}

	window.addEventListener("message", (event) => {
		const message = event.data;
		const loader = document.getElementById("loader");

		switch (message.command) {
			case "response":
				const responseArea = document.getElementById("response-area");
				responseArea.value = message.text;
				break;

			case "onStartSubtask":
				const { index, type, parameters } = message.subtask;

				// Update subtask loader states
				if (index !== 0) {
					const previousLoader = document.getElementById(
						`subtask-loader-${index - 1}`
					);
					previousLoader.classList.add("loader-completed");
				}
				const currentLoader = document.getElementById(
					`subtask-loader-${index}`
				);
				currentLoader.classList.remove("loader-initial");

				// Update progress text
				switch (type) {
					case "executeTerminalCommand":
						progressText.textContent = `Executing terminal command...`;
					case "generateFile":
						progressText.textContent = `Generating file: ${parameters.fileName}`;
					case "recurse":
						progressText.textContent = `Recursing with new prompt...`;
					case "askUser":
						progressText.textContent = `Asking user for input...`;
					default:
						progressText.textContent = `Unknown subtask type "${type}"`;
				}
				break;

			case "showSubtasks":
				const subtasksContainer = document.getElementById("subtasks-container");
				subtasksContainer.innerHTML = ""; // Clear the container
				progressText.textContent = "Please review the subtasks below:";
				loader.classList.add("loader-waiting");

				message.subtasks.forEach((subtask) => {
					const listItem = document.createElement("li");
					listItem.classList.add("subtask-container");

					const subtaskLoader = document.createElement("div");
					subtaskLoader.setAttribute("id", `subtask-loader-${subtask.index}`);
					subtaskLoader.classList.add("loader");
					subtaskLoader.classList.add("loader-initial");
					listItem.appendChild(subtaskLoader);

					const subtaskText = document.createElement("span");
					subtaskText.classList.add("subtask-text");
					subtaskText.textContent = subtask.type;
					listItem.appendChild(subtaskText);

					listItem.addEventListener("click", () => {
						listItem.classList.toggle("expanded");
					});
					subtasksContainer.appendChild(listItem);
				});
				break;

			case "showTaskStarted":
				const progressContainer = document.getElementById("progress-container");
				loader.classList.remove("loader-completed");
				loader.classList.remove("loader-cancelled");
				loader.classList.remove("loader-waiting");
				progressContainer.classList.add("show-component");
				break;

			case "showTaskCompleted":
				progressText.textContent = "Task Completed";
				loader.classList.add("loader-completed");
				break;

			case "showTaskCancelled":
				progressText.textContent = "Task Cancelled";
				loader.classList.add("loader-cancelled");
				break;

			case "showTaskError":
				progressText.textContent = "Error Occurred";
				loader.classList.add("loader-cancelled");
				break;

			default:
				console.warn("Unknown message received:", message);
		}
	});
})();
