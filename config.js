	$( ".header" ).append( $( "<div class='topbar'><div class='downres_item' id='turbo_indi' style='display:none;background:red;height:20px;padding:5px;border-radius:3px;'><svg t='1733635622782' class='icon' style='width:10px' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' p-id='9132' id='mx_n_1733635622783' width='200' height='200'><path d='M771.3 465.8L256 1024l150.1-450.3c1.7-5.2-2.1-10.5-7.6-10.5H253c-46.5 0-77.5-48.1-58.3-90.5L392.5 37.5C402.9 14.7 425.7 0 450.8 0h419.6L672.5 346.4c-3 5.3 0.8 12 6.9 12h44.8c55.8 0 84.9 66.4 47.1 107.4z' p-id='9133' fill='#fff'></path></svg>FAST MODE</div><p class='server_info1'>SERVER : 1</><p class='server_info2'>SERVER : 2</></div>" ) );
	$(".server_info2").hide();
	$(".turbo_on").hide();
	$("#bad_download").hide();
	$("#good_download").hide();
	$("#live_download").show();
	$("#disable_download").show();
	var model = 1;
	var nums = 100;	
	$(document).on("click",
        "#turbo-btn",
        function() {
			$(".turbo_off").toggle();
			$(".turbo_on").toggle();
			$("#bad_download").toggle();
			$("#good_download").toggle();
			$("#live_download").toggle();
			$("#disable_download").toggle();
			$("#mailoutput2").toggle();
			$("#mailoutput4").toggle();
			$(".h3_adv").toggle();
			$(".h3_speed").toggle();
			$("#downres_ver").toggle();			
			$("#downres_notfound").toggle();
			$(".downres_good").toggle();
			$(".downres_disabled").toggle();
			$(".downres_speed").toggle();
			$(".turbo_active").toggle();
			$(".turbo_nonactive").toggle();
			$("#turbo_indi").toggle();
			$(".snow_image").toggle();
			$(".lightning").toggle();
			$(".lightning1").toggle();
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

        });
		
	$(document).on("click",
        "#server1",
        function() {
			document.querySelector(".turbo_btn").style.cssText="pointer-events:visible;filter: grayscale(0);z-index:999";
			$(".turbo_off").show();
			$(".turbo_on").hide();
			$("#bad_download").hide();
			$("#good_download").hide();
			$("#live_download").show();
			$("#disable_download").show();
			$("#active_server1").show();	
			$("#active_server2").hide();
			$(".server_info1").show();
			$(".server_info2").hide();			
			$("#mailoutput2").show();
			$("#mailoutput4").show();
			$(".h3_adv").show();
			$(".h3_speed").hide();
			$("#downres_ver").show();
			$("#downres_notfound").show();
			$(".downres_good").show();
			$(".downres_disabled").show();
			$(".downres_speed").hide();
			$(".turbo_active").hide();
			$(".turbo_nonactive").show();
			$("#turbo_indi").hide();
			$(".snow_image").hide();
			$(".lightning").show();
			$(".lightning1").show();
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
        });

	$(document).on("click",
        "#server2",
        function() {
			document.querySelector(".turbo_btn").style.cssText="pointer-events:none;filter: grayscale(1);z-index:999";
			$(".turbo_off").show();
			$(".turbo_on").hide();
			$("#bad_download").hide();
			$("#good_download").hide();
			$("#live_download").show();
			$("#disable_download").show();			
			$("#active_server1").hide();
			$("#active_server2").show();
			$(".server_info1").hide();
			$(".server_info2").show();				
			$("#mailoutput2").show();
			$("#mailoutput4").show();
			$(".h3_adv").show();
			$(".h3_speed").hide();
			$("#downres_ver").show();
			$("#downres_notfound").show();
			$(".downres_good").show();
			$(".downres_disabled").show();
			$(".downres_speed").hide();
			$(".turbo_active").hide();
			$(".turbo_nonactive").show();
			$("#turbo_indi").hide();
			$(".snow_image").hide();
			$(".lightning").show();
			$(".lightning1").show();			
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
        });	


		$(".verify_on").hide();	
		$(".reset_on").hide();
		$(".reset_hover").hide();
		
	var btnhoverscreen = window.matchMedia("(min-width: 1025px)");
		if (btnhoverscreen.matches){

		$("#check-btn").hover(function(){
			$(".verify_on").toggle();
			$(".verify_off").toggle();
		});
		
		$("#clear-editor").hover(function(){
			$(".reset_hover").toggle();
			$(".reset_off").toggle();
		});
		}	


