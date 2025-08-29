const tabHandler = {
    tabs: {
        "chat": document.getElementById("chatContainer"),
        "install": document.getElementById("installContainer"),
        
        "tools": document.getElementById("toolsContainer"),
        "memory": document.getElementById("memoryContainer"),
        "sketch": document.getElementById("sketchContainer"),
        "settings": document.getElementById("settingsContainer")
    },
    buttonList: document.querySelectorAll(".sidebar > .button"),
    switchTo(name) {
        for (const key in this.tabs) {
            this.tabs[key].style.display = "none";
        }
        this.tabs[name.toLowerCase()].style.display = "flex";
    },
    removeAllActiveButtons() {
        for (const button of this.buttonList) {
            button.classList.remove("buttonActive");
        }
    },
    init() {
        for (const key in this.tabs) {
            this.tabs[key].style.display = "none";
        }
        this.tabs["chat"].style.display = "flex";

        // add listeners
        for (const button of this.buttonList) {
            button.addEventListener("click", () => {
                this.switchTo(button.textContent);
                this.removeAllActiveButtons();
                button.classList.add("buttonActive");
            });
        }
        
    }
}

tabHandler.init();

export default tabHandler;