(function () {
	const userInput = document.getElementById("user-input");
	/*    DEPRECATED ---------------------------------------------------------
	const inputTypeSelect = document.getElementById("input-type");

	function updatePlaceholder() {
		switch (inputTypeSelect.value) {
			case "description":
				userInput.placeholder = "Enter a function description...";
				break;
			case "test":
				userInput.placeholder = "Enter an existing function...";
				break;
			default:
				throw new Error("Invalid input type");
		}
	}

	updatePlaceholder();
	inputTypeSelect.addEventListener("change", updatePlaceholder);
	*/

	document.getElementById("submit-button").addEventListener("click", () => {
		const input = document.getElementById("user-input").value;
		const inputType = document.getElementById("input-type").value;

		vscode.postMessage({ command: "submit", input, inputType });
	});
})();
