(function () {
	const inputTypeSelect = document.getElementById("input-type");
	const userInput = document.getElementById("user-input");

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

	document
		.getElementById("submit-button")
		.addEventListener("click", async () => {
			const input = document.getElementById("user-input").value;
			const inputType = document.getElementById("input-type").value;
			await iterativeGeneration(input, inputType);
		});
})();
