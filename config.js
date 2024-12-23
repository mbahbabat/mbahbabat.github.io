	$( ".header" ).append( $( "<p class='server_info'>SERVER : 1</>" ) );
	var model = 1;
	var nums = 50;	
	$(document).on("click",
        "#turbo-btn",
        function() {
			$("#mailoutput2").toggle();
			$("#mailoutput4").toggle();
			$(".h3_disabled").toggle();
			$(".h3_trash").toggle();
			$("#mailoutput3 .download_item").toggle();
			$("#downres_ver").toggle();
			$("#downres_notfound").toggle();
			$(".downres_disabled").toggle();
			$(".downres_trash").toggle();
			$(".turbo_active").toggle();
			$(".turbo_nonactive").toggle();
			$("#turbo_indi").toggle();
			$(".snow_image").toggle();
			$(".lightning").toggle();
			$(".lightning2").toggle();
			document.querySelector(".turbo_btn").classList.toggle("turbo_btn_active");
			document.querySelector("#mail-progress-bar").style.cssText="width:0!important;transition:2s";
			$("#rp-good").text(" - ");
			$("#rp-ver").text(" - ");
			$("#rp-disabled").text(" - ");
			$("#rp-notfound").text(" - ");
			$("#good_res").text("");
			$("#ver_res").text("");
			$("#dis_res").text("");
			$("#notfound_res").text("");
			$(".res_bad").css("opacity", "0");			
			goodEditor.setValue("");
			verEditor.setValue("");
			notExistEditor.setValue("");
			disableEditor.setValue("");
			allResult = {
				ver: [],
				good: [],
				notExist: [],
				disable: [],
			};
			mails2 = [];
			if (model === "3") {
			  model = "1";
			} else {
			  model = "3";
			}
			if (nums === "100") {
			  nums = "50";
			} else {
			  nums = "100";
			}	
        });	