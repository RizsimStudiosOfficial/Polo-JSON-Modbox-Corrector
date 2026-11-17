// everything in one file

const showKeepHeadToggle = false;

if (showKeepHeadToggle) {
    document.getElementById('keepHeadField').style.display = 'flex';
}

document.querySelectorAll('input.num').forEach(input => {
    input.addEventListener('input', () => {
        if (input.value === '') {
            input.classList.add('empty');
        } else {
            input.classList.remove('empty');
        }
    });
});

const inputArea = document.getElementById('input');
const correctBtn = document.getElementById('correctBtn');

function cleanNum(n) {
    return Number(n.toFixed(6)).toString();
}

function isValidPoloJSON(text) {
    try {
        const json = JSON.parse(text);

        const requiredKeys = ["animeName","percentageMax","totalFrame","width","height","headHeight","arrayFrame"];
        for (const key of requiredKeys) {
            if (!(key in json)) return false;
        }

        if (!Array.isArray(json.arrayFrame)) return false;

        for (const frame of json.arrayFrame) {
            if (typeof frame !== "object" || typeof frame.prop !== "string") return false;
        }

        return true; 
        } catch {
        return false;
    }
}

inputArea.addEventListener('input', () => {
    correctBtn.disabled = !isValidPoloJSON(inputArea.value);
});

const dropArea = document.getElementById('drop-area');

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        alert("Please drop a valid JSON file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        inputArea.value = event.target.result;
        correctBtn.disabled = inputArea.value.trim() === '';
    };
    reader.readAsText(file);
});

function safeInt(value, fallback = 0) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}

function safeFloat(value, fallback = 0) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
}

function correctJSON() {
	let notesArr = [];

    let text = document.getElementById("input").value;
	let baseHeight = safeInt(document.getElementById("height").value, null);

	if (baseHeight === null) {
    alert("Polo Height is required!");
    return;
	}

	let step = safeInt(document.getElementById("step").value, 300);
	let rawHeadAdd = document.getElementById("headAdd").value;

	let headAdd;
	if (rawHeadAdd === "") {
    headAdd = 0;
    notesArr.push(
        "⚠ Head Y value not provided. Results may be inaccurate. " +
        "For best alignment, ask someone with Adobe Animate to calculate it."
    );
	} else {
    headAdd = safeInt(rawHeadAdd, 0);
	}
	
    let keepHead = false;

    if (showKeepHeadToggle) {
        keepHead = document.getElementById("keepHead").checked;
    }

    let json = JSON.parse(text);
    let hasVersion = json.version !== undefined;
    let ys = json.arrayFrame
    .map(f => {
        if (!f.prop) return null;
        const parts = f.prop.split(",");
        return safeInt(parts[1], null);
    })
    .filter(v => v !== null);

if (ys.length === 0) {
    alert("Invalid frame data: no valid Y values found.");
    return;
}

	let minY = Math.min(...ys);

    json.arrayFrame = json.arrayFrame.map((f, index) => {
        let prop = f.prop.split(",");
        let x = prop[0];
		let y = parseInt(prop[1], 10);
		let z = parseFloat(prop[2]);
		let head = parseFloat(prop[3]);
        let rowIndex = step !== 0 ? Math.round((y - minY) / step) : 0;
        let newY = baseHeight + (rowIndex * step);
        let applyRMBLogic = document.getElementById('invertY').checked;
		let newHead = keepHead ? head : (applyRMBLogic ? head - headAdd : head + headAdd);

        if (y !== newY || head !== newHead) {
            notesArr.push(`Frame ${index}: Y ${y}→${newY}, Head ${head}→${cleanNum(newHead)}, Row ${rowIndex}`);
        }

    return {
    prop: `${x},${cleanNum(newY)},${cleanNum(z)},${cleanNum(newHead)}`
	};
    });

    document.getElementById("results").style.display = "block";
    document.getElementById("notes").value = notesArr.join("\n") || "No changes.";

    let output = '{\n';
    if (!hasVersion) output += '  "version": "3",\n';
    for (let key in json) {
        if (key !== "arrayFrame") output += `  "${key}": ${JSON.stringify(json[key])},\n`;
        else {
            output += `  "arrayFrame": [\n`;
            json.arrayFrame.forEach((f, i) => {
                output += `    {"prop":"${f.prop}"}`;
                if (i < json.arrayFrame.length - 1) output += ',';
                output += '\n';
            });
            output += `  ]\n`;
        }
    }
    output += '}';

    document.getElementById("output").value = output;
}

// BG PREVIEW THING

const exampleImg = document.querySelector(".example-img");
const modal = document.getElementById("imgModal");
const modalBg = document.getElementById("modalBg");
const closeBtn = document.querySelector(".img-modal-close");

let zoom = 100;

function getBgUrl(el) {
    const bg = getComputedStyle(el).backgroundImage;
    return bg.slice(5, -2);
}

exampleImg.addEventListener("click", () => {
    const imgUrl = getBgUrl(exampleImg);
    modalBg.style.backgroundImage = `url("${imgUrl}")`;
    zoom = 100;
    modalBg.style.backgroundSize = 100;
    modal.classList.add("open");
});

function closeModal() {
    modal.classList.remove("open");
}

closeBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

modalBg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom += e.deltaY * -0.2;
    zoom = Math.min(Math.max(100, zoom), 500);
    modalBg.style.backgroundSize = `${zoom}%`;
});