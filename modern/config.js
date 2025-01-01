	$( ".header" ).append( $( "<p class='server_info1'>SERVER : 1</>" ) );
	$( ".header" ).append( $( "<p class='server_info2'>SERVER : 2</>" ) );
	$(".server_info2").hide();
	var model = 1;
	var nums = 50;	
	$(document).on("click",
        "#turbo-btn1",
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
			$(".announcement").toggle();
			document.querySelector('#turbo_audio').play();	
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

	$(document).on("click",
        "#turbo-btn2",
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
			$(".announcement").toggle();
			document.querySelector('#turbo_audio').play();	
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
			  model = "2";
			} else {
			  model = "3";
			}
			if (nums === "100") {
			  nums = "200";
			} else {
			  nums = "100";
			}	
        });		
		
	$(document).on("click",
        "#server1",
        function() {
			$("#turbo-btn1").show();
			$("#turbo-btn2").hide();
			$("#active_server1").show();	
			$("#active_server2").hide();
			$(".server_info1").show();
			$(".server_info2").hide();			
			$("#mailoutput2").show();
			$("#mailoutput4").show();
			$(".h3_disabled").show();
			$(".h3_trash").hide();
			$("#mailoutput3 .download_item").show();
			$("#downres_ver").show();
			$("#downres_notfound").show();
			$(".downres_disabled").show();
			$(".downres_trash").hide();
			$(".turbo_active").hide();
			$(".turbo_nonactive").show();
			$("#turbo_indi").hide();
			$(".snow_image").hide();
			$(".lightning").show();
			$(".lightning2").hide();
			$(".announcement").show();
			document.querySelector('#mode_audio').play();	
			document.querySelector(".turbo_btn").classList.remove("turbo_btn_active");
			document.querySelector("#server1").style.cssText="color:#00cc99";
			document.querySelector("#server2").style.cssText="color:#fff";
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
			model = 1;
			nums = 50;				
        });

	$(document).on("click",
        "#server2",
        function() {
			$("#turbo-btn2").show();
			$("#turbo-btn1").hide();
			$("#active_server1").hide();
			$("#active_server2").show();
			$(".server_info1").hide();
			$(".server_info2").show();				
			$("#mailoutput2").show();
			$("#mailoutput4").show();
			$(".h3_disabled").show();
			$(".h3_trash").hide();
			$("#mailoutput3 .download_item").show();
			$("#downres_ver").show();
			$("#downres_notfound").show();
			$(".downres_disabled").show();
			$(".downres_trash").hide();
			$(".turbo_active").hide();
			$(".turbo_nonactive").show();
			$("#turbo_indi").hide();
			$(".snow_image").hide();
			$(".lightning").show();
			$(".lightning2").hide();
			$(".announcement").show();
			document.querySelector('#mode_audio').play();	
			document.querySelector(".turbo_btn").classList.remove("turbo_btn_active");
			document.querySelector("#server1").style.cssText="color:#fff";
			document.querySelector("#server2").style.cssText="color:#00cc99";			
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
			model = 2;
			nums = 200;				
        });			