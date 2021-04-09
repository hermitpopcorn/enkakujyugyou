/* Settings */
var classTimes = null;
var classes = null;
var refreshColorTimeout = null;

var ready = (callback) => {
	if (document.readyState != "loading") callback();
	else document.addEventListener("DOMContentLoaded", callback);
}

ready(() => {
	document.querySelector("#settings-toggle").addEventListener("click", () => {
		let form = document.querySelector("#settings-form");
		if (form.style.display == "none") { form.style.display = "block"; } else { form.style.display = "none"; }
	});

	loadSettings();
	assembleTable();
	colorTable();
});

var loadSettings = () => {
	classTimes = window.localStorage.getItem("classTimes");
	if (classTimes == null) {
		classTimes = {
			1: { start: "08:45", end: "10:15" },
			2: { start: "10:30", end: "12:00" },
			3: { start: "13:00", end: "14:30" },
			4: { start: "14:45", end: "16:15" },
			5: { start: "16:30", end: "18:00" },
		};
	} else {
		classTimes = JSON.parse(classTimes);
	}

	classes = window.localStorage.getItem("classes");
	if (classes == null) {
		classes = [
			{
				"name": "朝礼",
				"teacher": "校長先生",
				"day": "mon",
				"time": 1,
				"link": null
			},
			{
				"name": "数学",
				"teacher": "なんちゃら先生",
				"day": "tue",
				"time": 2,
				"link": { "info": "Google Meet Link", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
			}
		];
	} else {
		classes = JSON.parse(classes);
	}
};

var saveSettings = () => {
	var json = null;
	let str = document.querySelector("#settings form textarea").value;
	try {
        json = JSON.parse(str);
		console.log(json);
    } catch(e) {
        alert(e);
    }

	console.log(json);
	if (typeof json.classTimes === "undefined" || typeof json.classes === "undefined") {
		alert("'classTimes'と'classes'は必須です。");
		return false;
	}
	window.localStorage.setItem("classTimes", JSON.stringify(json.classTimes));
	window.localStorage.setItem("classes", JSON.stringify(json.classes));

	document.querySelector("#settings-form").style.display = "none";

	loadSettings();
	assembleTable();
	colorTable();
};

var assembleTable = () => {
	/* Clear tbody */
	document.querySelector("#classes-container").innerHTML = "";

	/* Split into iterable array */
	var classesByTime = {};
	for(let i = 1; i <= 5; i++) {
		classesByTime[i] = { "mon": [], "tue": [], "wed": [], "thu": [], "fri": [] };
	}

	classes.forEach(element => {
		classesByTime[element.time][element.day].push(element);
	});

	/* Construct table */
	Object.keys(classTimes).forEach(time => {
		let row = document.createElement("tr");
		row.classList.add("class-time");
		row.id = "class-time-" + time;

		let numbering = document.createElement("td");
		numbering.classList.add("numbering");
		let numberingIndex = document.createElement("p");
		numberingIndex.textContent = time;
		let numberingTime = document.createElement("p");
		numberingTime.textContent = classTimes[time]["start"] + " ~ " + classTimes[time]["end"];

		numbering.appendChild(numberingIndex);
		numbering.appendChild(numberingTime);
		row.appendChild(numbering);

		["mon", "tue", "wed", "thu", "fri"].forEach((day, index) => {
			let cell = document.createElement("td");
			cell.classList.add("class-day-" + (index + 1));

			let c = classesByTime[time][day];
			if (c.length > 0) {
				c.forEach(i => {
					let classContainer = document.createElement("article");

					let className = document.createElement("h3");
					className.textContent = i.name;
					classContainer.appendChild(className);

					let classTeacher = document.createElement("p");
					classTeacher.textContent = i.teacher;
					classTeacher.classList.add("teacher-name");
					classContainer.appendChild(classTeacher);

					if (i.link) {
						let classLink = document.createElement("a");
						if (typeof i.link == "string") {
							classLink.textContent = i.link;
							classLink.setAttribute("href", i.link);
						} else if (typeof i.link == "object") {
							classLink.textContent = i.link.info;
							classLink.setAttribute("href", i.link.url);
						}
						classContainer.appendChild(classLink);
					}

					cell.appendChild(classContainer);
				});
			}

			row.appendChild(cell);
		});

		document.querySelector("#classes-container").appendChild(row);
	});
};

var colorTable = () => {
	/* Reset refreshColorTimeout */
	window.clearTimeout(refreshColorTimeout);
	refreshColorTimeout = null;

	/* Get starting times */
	let today = new Date();

	let day = String(today.getDate()).padStart(2, '0');
	let month = String(today.getMonth() + 1).padStart(2, '0');
	let year = today.getFullYear();
	let date = year + '-' + month + '-' + day;

	let hour = today.getHours();
	let min = today.getMinutes();

	let classStartTimes = {};
	let classEndTimes = {};
	Object.keys(classTimes).forEach(i => {
		classStartTimes[i] = new Date(date + "T" + classTimes[i].start + ":00");
		classEndTimes[i] = new Date(date + "T" + classTimes[i].end + ":00");
	});

	/* Color the heads */
	document.querySelectorAll(".head-day").forEach(element => { element.classList.remove("upcoming") });
	document.querySelector("#head-day-" + today.getDay()).classList.add("upcoming");

	/* Color the rows */
	document.querySelectorAll("tbody td").forEach(element => {
		element.classList.remove("ongoing");
		element.classList.remove("upcoming");
		element.classList.remove("passed");
	});

	var upcomingMarked = false;
	Object.keys(classTimes).forEach(i => {
		if (today.getTime() < classStartTimes[i].getTime()) {
			if (!upcomingMarked) {
				document.querySelector("#class-time-" + i + " .class-day-" + today.getDay()).classList.add("upcoming");
				upcomingMarked = true;
			}
		}
		else if (today.getTime() >= classStartTimes[i].getTime() && today.getTime() < classEndTimes[i].getTime()) {
			document.querySelector("#class-time-" + i + " .class-day-" + today.getDay()).classList.add("ongoing");
		}
		else {
			document.querySelector("#class-time-" + i + " .class-day-" + today.getDay()).classList.add("passed");
		}
	});

	refreshColorTimeout = window.setTimeout(colorTable, 60000);
};