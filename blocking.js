
function makeDiv(){
//if(typeof newDiv === 'undefined' || newDiv === null){
	let newDiv = document.createElement("div");
	newDiv.id = "interference"; 
	newDiv.style.position = "fixed"; 
	newDiv.style.top = "0px"; 
	newDiv.style.left = "0px"; 
	newDiv.style.width = "90%"; 
	newDiv.style.height = "100%"; 
	newDiv.style.backgroundColor = "black"; 
	newDiv.style.color = "white"; 
	newDiv.style.textAlign = "center"; 
	newDiv.style.fontSize = "13vmin"; 
	newDiv.style.padding = "5%"; 
	newDiv.style.zIndex = "9999";
	newDiv.innerHTML = "ER DU SIKKER PÅ AT DU VIL PÅ FACEBOOK?!?"; 

	let noDiv = document.createElement("div");
	noDiv.id = "pleaseno";
	noDiv.setAttribute("class", "distractionbtn");
	noDiv.innerHTML = "Nej! Jeg var lige i gang med noget andet og vil gerne væk igen..."

	noDiv.addEventListener("click", () => {
		window.location.href = "http://google.com";
	})

	newDiv.appendChild(noDiv);

	let yesDiv = document.createElement("div");
	yesDiv.id = "iwanttobedistracted";
	yesDiv.setAttribute("class", "distractionbtn");
	yesDiv.innerHTML = "Ja. Jeg har brug for lidt bevidst distraktion..."

	yesDiv.addEventListener("click", () => {
		document.body.removeChild(newDiv);
	})

	newDiv.appendChild(yesDiv);

	document.body.appendChild(newDiv);
}

makeDiv();