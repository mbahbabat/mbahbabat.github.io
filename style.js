function refreshPage(){
    window.location.reload();
}

function clear_all() {
	document.querySelector("#mail-progress-bar").style.cssText="width:0!important;transition:2s";
	document.querySelector("#rp-good").textContent = "";
	document.querySelector("#rp-ver").textContent = "";
	document.querySelector("#rp-unknown").textContent = "";
	document.querySelector("#rp-disabled").textContent = "";
	document.querySelector("#rp-not-exist").textContent = "";
} 
	
function darkmode(){
  document.querySelector("body").style.cssText="background:#0d0d0d";
  document.querySelector(".boxi").style.cssText="opacity:0.7;background:#404040;";
  document.querySelector(".mailinput .CodeMirror-scroll").style.background="#262626";
  document.querySelector(".mailoutput .CodeMirror-scroll").style.background="#262626";
  document.querySelector(".mailinput .CodeMirror-gutters").style.background="linear-gradient(to left, #333333 0%, #404040 100%)";
  document.querySelector(".mailoutput .CodeMirror-gutters").style.background="linear-gradient(to left, #333333 0%, #404040 100%)"; 
  document.querySelector(".mailinput .CodeMirror-scroll").style.color="#009933";
  document.querySelector(".mailoutput .CodeMirror-scroll").style.color="#cc9900";
  document.querySelector(".gchecker").style.background="#404040";
  document.querySelector(".result").style.background="#404040";
  document.querySelector(".download-result").style.background="#404040";  
	
}
function lightmode(){
  document.querySelector("body").style.cssText="background:none";
  document.querySelector(".boxi").style.cssText="opacity:1;background:#666666";
  document.querySelector(".mailinput .CodeMirror-scroll").style.background="linear-gradient(to top right, #f2f2f2 0%, #d9d9d9 100%)";
  document.querySelector(".mailoutput .CodeMirror-scroll").style.background="linear-gradient(to top right, #f2f2f2 0%, #d9d9d9 100%)";
  document.querySelector(".mailinput .CodeMirror-gutters").style.background="linear-gradient(to top, #f2f2f2 0%, #d9d9d9 100%)";
  document.querySelector(".mailoutput .CodeMirror-gutters").style.background="linear-gradient(to top, #f2f2f2 0%, #d9d9d9 100%)";  
  document.querySelector(".mailinput .CodeMirror-scroll").style.color="#000";
  document.querySelector(".mailoutput .CodeMirror-scroll").style.color="#000";
  document.querySelector(".gchecker").style.background="#666666";
  document.querySelector(".result").style.background="#666666"; 
  document.querySelector(".download-result").style.background="#666666";  
}

function showdown(){
document.querySelector(".download-result").style.position="fixed";
document.querySelector(".download-result").style.padding="25px";
document.querySelector(".download-result").style["boxShadow"] = "0 0 5px 5px rgba(0,0,0,0.5)";
document.querySelector(".download-result").style.animation="slideup 0.75s";
document.querySelector(".hidedown").style.display="flex";
document.querySelector(".solid2").style.display="none";
document.querySelector(".showdown").style.display="none";
}

function hidedown(){
document.querySelector(".download-result").style.position="relative";
document.querySelector(".download-result").style.padding="0px";
document.querySelector(".download-result").style["boxShadow"] = "none";
document.querySelector(".download-result").style.animation="none";
document.querySelector(".solid2").style.display="block";
document.querySelector(".hidedown").style.display="none";
document.querySelector(".showdown").style.display="flex";
}