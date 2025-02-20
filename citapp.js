 function addCSSFile(cssFilePath) {
    // Membuat elemen <link>
    const linkElement = document.createElement('link');

    // Menetapkan atribut-atribut untuk elemen <link>
    linkElement.rel = 'stylesheet'; // Menetapkan rel sebagai "stylesheet"
    linkElement.href = cssFilePath; // Menetapkan path ke file CSS

    // Menambahkan elemen <link> ke dalam <head> dokumen
    document.head.appendChild(linkElement);
}

// Panggil fungsi untuk menambahkan file CSS
addCSSFile('https://mbahbabat.github.io/styleApp.css');
 
 // Fungsi untuk membuat elemen chat-wrapper
function createChatWrapper() {
    // Membuat elemen utama div dengan class 'chat-wrapper'
    const chatWrapper = document.createElement('div');
    chatWrapper.className = 'chat-wrapper';

    // Membuat elemen header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';

    // Menambahkan gambar/logo
    const logo = document.createElement('img');
    logo.src = 'gmailchecker.webp';
    logo.width = 30;
    logo.height = 30;
    chatHeader.appendChild(logo);

    // Membuat div untuk judul dan counter online
    const opxDiv = document.createElement('div');
    opxDiv.id = 'opx';

    const chatTitle = document.createElement('div');
    chatTitle.className = 'chat-title';
    chatTitle.textContent = '💬 WORLD CHAT';
    opxDiv.appendChild(chatTitle);

    const onlineCounter = document.createElement('span');
    onlineCounter.id = 'online-counter';
    onlineCounter.textContent = '0';
    opxDiv.appendChild(onlineCounter);

    chatHeader.appendChild(opxDiv);

    // Membuat tombol minimize
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'chat-btn';
    minimizeBtn.id = 'minimize-btn';
    minimizeBtn.innerHTML = '<i class="fas fa-times"></i>';
    chatHeader.appendChild(minimizeBtn);

    // Menambahkan badge unread
    const unreadBadge = document.createElement('div');
    unreadBadge.className = 'unread-badge';
    unreadBadge.textContent = '0';
    chatHeader.appendChild(unreadBadge);

    chatWrapper.appendChild(chatHeader);

    // Membuat container untuk pinned message
    const pinnedMessageContainer = document.createElement('div');
    pinnedMessageContainer.id = 'pinned-message-container';
    chatWrapper.appendChild(pinnedMessageContainer);

    // Membuat panel online
    const onlinePanel = document.createElement('div');
    onlinePanel.id = 'online-panel';

    const onlineList = document.createElement('div');
    onlineList.id = 'online-list';
    onlinePanel.appendChild(onlineList);

    const onlinePanelMin = document.createElement('button');
    onlinePanelMin.id = 'online-panel-min';
    onlinePanelMin.className = 'online-panel-btn';
    onlinePanelMin.innerHTML = '<i class="fa fa-chevron-up"></i>';
    onlinePanel.appendChild(onlinePanelMin);

    const onlinePanelMax = document.createElement('button');
    onlinePanelMax.id = 'online-panel-max';
    onlinePanelMax.className = 'online-panel-btn';
    onlinePanelMax.innerHTML = '<i class="fa fa-chevron-down"></i>';
    onlinePanel.appendChild(onlinePanelMax);

    chatWrapper.appendChild(onlinePanel);

    // Membuat chat body
    const chatBody = document.createElement('div');
    chatBody.className = 'chat-body';
    chatBody.id = 'chat-body';
    chatWrapper.appendChild(chatBody);

    // Membuat reply preview
    const replyPreview = document.createElement('div');
    replyPreview.id = 'reply-preview';

    const replyText = document.createElement('span');
    replyText.id = 'reply-text';
    replyPreview.appendChild(replyText);

    const cancelReply = document.createElement('button');
    cancelReply.id = 'cancel-reply';
    cancelReply.className = 'chat-btn';
    cancelReply.textContent = 'Cancel';
    replyPreview.appendChild(cancelReply);

    chatWrapper.appendChild(replyPreview);

    // Membuat form input pesan
    const messageForm = document.createElement('form');
    messageForm.className = 'chat-input';
    messageForm.id = 'message-form';

    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.className = 'message-input';
    messageInput.placeholder = 'Send a message...';
    messageInput.id = 'message-input';
    messageForm.appendChild(messageInput);

    const sendButton = document.createElement('button');
    sendButton.className = 'chat-btn send-btn';
    sendButton.type = 'submit';
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    messageForm.appendChild(sendButton);

    chatWrapper.appendChild(messageForm);

    // Membuat tombol scroll to bottom
    const scrollToBottom = document.createElement('button');
    scrollToBottom.id = 'scroll-to-bottom';
    scrollToBottom.innerHTML = '<i class="fas fa-arrow-down"></i>';
    chatWrapper.appendChild(scrollToBottom);

    // Membuat tampilan minimized
    const minimizedView = document.createElement('div');
    minimizedView.className = 'minimized-view';
    minimizedView.id = 'minimized-view';

    const commentIcon = document.createElement('i');
    commentIcon.className = 'fas fa-comment';
    minimizedView.appendChild(commentIcon);

    const unreadBadgeMinimized = document.createElement('div');
    unreadBadgeMinimized.className = 'unread-badge';
    unreadBadgeMinimized.textContent = '0';
    minimizedView.appendChild(unreadBadgeMinimized);

    // Menambahkan elemen ke body
    document.body.appendChild(chatWrapper);
    document.body.appendChild(minimizedView);
}

// Panggil fungsi untuk membuat elemen chat
createChatWrapper();

 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
    import { 
        getAuth, 
        signInAnonymously,
        onAuthStateChanged 
    } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
    import { 
        getDatabase, 
        ref, 
        push, 
        onValue, 
        serverTimestamp,
        query,
        limitToLast,
        set,
        get,
        remove,
		onDisconnect
    } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";



	const db = bstx(bstx(h3bs('65794a6863476c4c5a586b694f694a425358706855336c425531705261575935583356366330684d556a41324f54684a62334a3252466436554531744d6e46505a5545694c434a686458526f5247397459576c75496a6f695932686864476b744e575130596a55755a6d6c795a574a68633256686348417559323974496977695a47463059574a6863325656556b77694f694a6f64485277637a6f764c324e6f595852704c54566b4e4749314c57526c5a6d463162485174636e526b5969356863326c684c584e766458526f5a57467a644445755a6d6c795a574a686332566b59585268596d467a5a533568634841694c434a77636d39715a574e30535751694f694a6a61474630615330315a4452694e534973496e4e3062334a685a32564364574e725a5851694f694a6a61474630615330315a4452694e53356d61584a6c596d467a5a584e3062334a685a32557559584277496977696257567a6332466e6157356e553256755a475679535751694f69497a4d4455334d7a677a4e6a41354f5451694c434a686348424a5a434936496a45364d7a41314e7a4d344d7a59774f546b304f6e646c596a6f324d54566d4f474a6a59574d345a5468684e6a4d7a5a5441305a6d5a694969776962575668633356795a57316c626e524a5a434936496b637454564d79567a6c475330314756794a39')));
	
     const rdb = JSON.parse(db);
	const app = initializeApp(rdb);
    const auth = getAuth(app);
    const database = getDatabase(app);
    const pinnedMessageRef = ref(database, 'pinnedMessage');

    const generateUsernameFromUID = (uid) => {
        const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `User #${(hash % 9000 + 1000).toString().padStart(4, '0')} `;
    };


    const getUsername = async (uid) => {
        const validKey = getCookie('validKey');
        if (validKey) {
            const [storedKey, expiration] = validKey.split('|');
            if (new Date() <= new Date(expiration)) {
                return admintoken[storedKey] || freetoken[storedKey];
            }
        }
        return generateUsernameFromUID(uid);
    };


	const isAdmin = () => {
		const validKey = getCookie('validKey');
		if (!validKey) return false;
		const [storedKey, expiration] = validKey.split('|');
		return new Date() <= new Date(expiration) && !!admintoken[storedKey];
	};


    const uidToColor = (uid) => {
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${Math.abs(hash % 360)}, 70%, 60%)`;
    };
	

	function formatDate(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}


    let isMinimized = false;
    let unreadMessages = 0;
    let currentUser = null;
    let userIsAdmin = false;
    let replyingTo = null;
	let currentUserCountry = '';
	let hasShownWelcome = false;


    const chatWrapper = document.querySelector('.chat-wrapper');
    const minimizedView = document.getElementById('minimized-view');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatBody = document.getElementById('chat-body');
    const pinnedContainer = document.getElementById('pinned-message-container');


	window.unpinMessage = async () => {
		if (!userIsAdmin) return;
		
		try {
			await remove(pinnedMessageRef);
		} catch (error) {
			console.error('Gagal unpin pesan:', error);
			alert('Gagal unpin pesan! Pastikan Anda admin.');
		}
	};	


    const toggleChat = () => {
        isMinimized = !isMinimized;
        chatWrapper.style.display = isMinimized ? 'none' : 'flex';
        minimizedView.style.display = isMinimized ? 'flex' : 'none';
        
        if(!isMinimized) {
            unreadMessages = 0;
            updateBadge();
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    };
	


    const updateBadge = () => {
        document.querySelectorAll('.unread-badge').forEach(badge => {
            badge.textContent = unreadMessages;
            badge.style.display = unreadMessages > 0 ? 'flex' : 'none';
        });
    };

	
function updateOnlineList(onlineData) {
  const onlineList = document.getElementById('online-list');
  onlineList.innerHTML = '';
  const users = onlineData ? Object.entries(onlineData) : [];
  
  // Urutkan pengguna
  users.sort(([uid1], [uid2]) => {
    if (uid1 === currentUser?.uid) return -1;
    if (uid2 === currentUser?.uid) return 1;
    return 0;
  });

  users.forEach(([uid, user]) => {
    const username = user.username || 'Anonymous';
    const country = user.country || '';
    const isAdmin = user.isAdmin || false; // Pastikan properti isAdmin ada
    const isYou = uid === currentUser?.uid;

    console.log(`User: ${username}, isAdmin: ${isAdmin}`); // Debugging

    const listItem = document.createElement('div');
    listItem.className = 'online-user';

    // Tambahkan class khusus untuk styling
    if (isYou) listItem.classList.add('you-user');
    if (isAdmin) listItem.classList.add('admin-user');

    listItem.innerHTML = `
      <i class="fas fa-circle online-indicator ${isAdmin ? 'admin-indicator' : ''}"></i>
      <span class="user-info">
        ${country ? countryCodeToFlagEmoji(country) : ''}
        ${username}
        ${isYou ? '<span class="you-badge">Me</span>' : ''}
        ${isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
      </span>
    `;
    
    onlineList.appendChild(listItem);
  });
}

	const countryCodeToFlagEmoji = (countryCode) => {
		if (!countryCode || countryCode.length !== 2) return '';
		const lowerCaseCode = countryCode.toLowerCase();
		return `<img src="https://flagcdn.com/${lowerCaseCode}.svg" 
				 alt="${lowerCaseCode}" 
				 class="country-flag" 
				 width="20" 
				 height="20">`;
	};

	
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	function linkify(text) {
		const escapedText = escapeHtml(text);
		const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]|www\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return escapedText.replace(urlRegex, (url) => {
			let fullUrl = url;
			if (!url.startsWith('http')) {
				fullUrl = `http://${url}`;
			}
			return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
		});
	}	



    const createMessageElement = (message, isSelf) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSelf ? 'self' : ''}`;
        messageEl.dataset.messageId = message.id;

        const replyContent = message.replyTo ? `
            <div class="reply-indicator">
                <div> ${message.country ? countryCodeToFlagEmoji(message.country) : ''} <span style="color: ${uidToColor(message.replyTo.uid)}">${message.replyTo.username}</span> </div>
            
				<div class="reply-content">
					${message.replyTo.text.substring(0, 30)}${message.replyTo.text.length > 30 ? '...' : ''}
				</div>
			</div>
        ` : '';

			messageEl.innerHTML = `
			<div style="display: flex;align-items: flex-end;gap: 10px">
				<div>${message.country ? countryCodeToFlagEmoji(message.country) : ''}</div>
				<div class="msg-content">
						<div class="message-header">
							<span class="username" style="color: ${uidToColor(message.uid)}">
								${message.username}
							</span>
						<div class="message-actions">
							${userIsAdmin ? `
								<i class="fas fa-thumbtack action-btn pin-btn"></i>
								<i class="fas fa-trash action-btn delete-btn"></i>
							` : ''}
							<span class="action-btn reply-btn">Reply</span>
						</div>
					</div>
					${replyContent}
					<div>${linkify(message.text)}</div>
					<div class="time-stamp">
						${new Date(message.timestamp).toLocaleTimeString()}
					</div>
					<div class="msg-content-radius"></div>
				</div>
			</div>
        `;

        if (userIsAdmin) {
            messageEl.querySelector('.pin-btn').addEventListener('click', () => pinMessage(message.id));
            messageEl.querySelector('.delete-btn').addEventListener('click', () => deleteMessage(message.id));
        }

        messageEl.querySelector('.reply-btn').addEventListener('click', () => {
            replyingTo = {
                id: message.id,
                uid: message.uid,
                username: message.username,
                text: message.text
            };
            document.getElementById('reply-preview').style.display = 'flex';
            document.getElementById('reply-text').innerHTML = `
                Replying to <span style="color: ${uidToColor(message.uid)}">${message.username}</span>: 
                ${message.text.substring(0, 20)}${message.text.length > 20 ? '...' : ''}
            `;
        });

		if (message.replyTo) {
				const replyContentEl = messageEl.querySelector('.reply-content');
				
	
				replyContentEl.style.cursor = 'pointer';
				replyContentEl.title = "Click to jump to original message";
				
				replyContentEl.addEventListener('click', () => {
					const originalMessage = document.querySelector(`[data-message-id="${message.replyTo.id}"] .msg-content`);
					if (originalMessage) {
	
						originalMessage.scrollIntoView({
							behavior: 'smooth',
							block: 'center'
						});
						

						originalMessage.style.transition = 'background-color 0.5s';
						originalMessage.style.backgroundColor = 'rgba(255,235,59,0.3)';
						

						setTimeout(() => {
							originalMessage.style.backgroundColor = '';
						}, 2000);
					}
				});
			}

			return messageEl;
		};


    const pinMessage = async (messageId) => {
        if (!userIsAdmin) return;
        
        try {
            const messageRef = ref(database, `messages/${messageId}`);
            const snapshot = await get(messageRef);
            
            if (snapshot.exists()) {
                await set(pinnedMessageRef, {
                    messageId: messageId,
                    pinnedAt: serverTimestamp(),
                    pinnedBy: await getUsername(currentUser.uid)
                });
            }
        } catch (error) {
            console.error('Gagal mem-pin pesan:', error);
            alert('Gagal mem-pin pesan! Pastikan Anda admin.');
        }
    };


    const deleteMessage = async (messageId) => {
        if (!userIsAdmin) return;
        
        try {
            await remove(ref(database, `messages/${messageId}`));
        } catch (error) {
            console.error('Gagal menghapus pesan:', error);
            alert('Gagal menghapus pesan! Pastikan Anda admin.');
        }
    };


    const unpinMessage = async () => {
        if (!userIsAdmin) return;
        
        try {
            await remove(pinnedMessageRef);
        } catch (error) {
            console.error('Gagal unpin pesan:', error);
            alert('Gagal unpin pesan! Pastikan Anda admin.');
        }
    };


    const initializeChat = () => {
		const messagesRef = query(ref(database, 'messages'), limitToLast(100));
		
		onValue(messagesRef, (snapshot) => {
			chatBody.innerHTML = '';
			const messages = [];
			let lastDate = null;
			
			snapshot.forEach(childSnapshot => {
				messages.push({
					id: childSnapshot.key,
					...childSnapshot.val()
				});
			});

			messages.sort((a, b) => a.timestamp - b.timestamp);

			messages.forEach(message => {
            const currentDate = formatDate(message.timestamp);
            if(currentDate !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.className = 'date-separator';
                dateSeparator.innerHTML = `
                    <div class="date-line"></div>
                    <span>${currentDate}</span>
                    <div class="date-line"></div>
                `;
                chatBody.appendChild(dateSeparator);
                lastDate = currentDate;
            }
            
            const isSelf = message.uid === currentUser?.uid;
            chatBody.appendChild(createMessageElement(message, isSelf));
            });

            if(!isMinimized) {
                setTimeout(() => chatBody.scrollTop = chatBody.scrollHeight, 300);
				document.querySelector('#chat_audio').play();
            } else {
				document.querySelector('#chat_audio').play();
                unreadMessages++;
                updateBadge();
            }
        });

    
        onValue(pinnedMessageRef, (snapshot) => {
            const pinnedMessage = snapshot.val();
            
            if (pinnedMessage) {
                get(ref(database, `messages/${pinnedMessage.messageId}`)).then(snap => {
                    if (snap.exists()) {
                        const message = snap.val();
                        pinnedContainer.innerHTML = `
						<div class="pinned-message" data-pinned-id="${pinnedMessage.messageId}" style="cursor: pointer;">
                                ${userIsAdmin ? `
								<div id="unpin-message">
									<button class="chat-btn" id="unpin-message-btn" onclick="unpinMessage()">&times;</button>
								</div>` : ''
								}						
                                <div id="pin-msh-title"><strong>📌 Pinned Message</strong><span id="pin-by">by:<span style="color: ${uidToColor(message.uid)}">${pinnedMessage.pinnedBy}</span></span></div>
                                <div class="msg-text">${message.text}</div>
						</div>
                        `;
                    }
                });
            } else {
                pinnedContainer.innerHTML = '';
            }
        });
    };
	
	eval(bstx(h3tx(h3tx(bstx('  MzU2MTM0MzczMzM5MzY2MTM2MzQzNTM3MzMzMTM2NjMzNjMyMzY2NTM1MzEzNzM1MzUzOTM1MzczNTMyMzY2MjM1MzIzNTM4MzU2MTM2NjMzNjMyMzY2NTM1MzIzNDY0MzYzMTM1MzgzNDY1MzMzMDM1NjEzNTM3MzMzNTM2NjMzNjMzMzYzOTM2MzczNjM5MzUzMjM0MzUzMzM5MzQ2NTM1MzEzMzMyMzMzOTM3MzUzNjM0MzQzNzM1MzYzNzM1MzYzNDM0MzUzNzM4MzczNjM1MzkzNTM3MzUzMjM2NjMzNTYxMzQzMzM0MzkzNzMzMzQzOTM0MzczNTYxMzMzMTM2MzIzNjY0MzQ2NTMzMzAzNjMxMzUzNzMzMzkzNzM1MzQ2MjM0MzMzNjYyMzYzNzM2MzUzNzM3MzY2NjM2MzczNDM5MzQzMzM0MzEzNjM3MzYzMTM1MzczNTM5MzYzNzM0NjIzNDM4MzYzNDM3MzAzNjMyMzY2NDM1MzIzNzM2MzYzNDM3MzkzMzM1MzczMzM2MzIzMzMyMzQ2NTM2MzgzNjM0MzQzNzM2NjMzNzM2MzYzMjM2MzkzMzM1MzY2NjM2MzMzNjY0MzUzNjM2NjQzNDYzMzY2NDM2NjMzNzM1MzU2MTM0MzczNTM2MzMzNDM1MzQzMzMyMzUzOTM2NjYzNDM5MzY2NDMzMzEzNjM5MzUzOTM1MzczNjM4MzYzOTM1MzkzNTM3MzQ2MTM2MzgzNjM0MzQzMzMzMzUzNjY1MzYzMTM1MzgzNTMyMzY2NjM2MzQzNTM3MzQzOTM3MzUzNjMxMzUzNzMzMzgzNjM5MzQ2MjM1MzMzNDMxMzI2MjM0MzkzNDMzMzMzMDM3MzgzNDM5MzQzODM3MzgzMzM4MzQzOTM0MzEzNjY2MzYzNzM0MzkzNDMzMzQzMTM2MzczNDM5MzQzMzM0MzEzNjM3MzQzOTM0MzgzNjM0MzczMDM2MzIzNjY0MzUzMjM3MzYzNjM0MzczOTMzMzUzNzMzMzYzMjMzMzIzNDY1MzYzODM2MzQzNDM3MzY2MzM3MzYzNjMyMzYzOTMzMzUzNjY2MzYzMzM2NjQzNTM2MzY2NDM0NjMzNjY0MzY2MzM3MzUzNTYxMzQzNzM1MzYzMzM0MzUzNDMzMzIzNTM5MzY2NjM0MzkzNjY0MzYzNDM3MzQzNTM5MzUzNzM2NjMzNzMzMzUzOTMzMzIzNjM4MzY2MzM1MzkzMzMyMzczNDM2NjMzNjMzMzYzOTMzMzUzNjY1MzYzMTM1MzgzNTMyMzY2NjM2MzQzNTM3MzQzOTM3MzUzNjMxMzUzNzMzMzgzNjM5MzQ2MjM1MzMzNDMxMzI2MjM0MzkzNDMzMzMzMDM3MzgzNDYyMzUzMzM0MzIzMzM3MzQzMzM2MzkzNDMxMzYzNzM0MzkzNDMzMzQzMjMzMzkzNDM5MzQzNzM1MzYzNzMzMzYzMzMzMzIzNTM1MzYzNzM2MzUzNzM3MzY2NjM2MzczNDM5MzQzMzM0MzEzNjM3MzQzOTM0MzMzNDMxMzYzNzM0MzkzNDM4MzYzNDM3MzAzNjMyMzY2NDM1MzIzNzM2MzYzNDM3MzkzMzM1MzczMzM2MzIzMzMyMzQ2NTM2MzgzNjM0MzQzNzM2NjMzNzM2MzYzMjM2MzkzMzM1MzY2NjM2MzMzNjY0MzUzNjM2NjQzNDM5MzQzNDMzMzAzNjM3MzQzOTM2NjQzMzMxMzYzOTM1MzkzNTM3MzYzODM2MzkzNTM5MzUzNzM0NjEzNjM4MzYzNDM0MzMzMzM1MzY2NTM2MzEzNTM4MzUzMjM2NjYzNjM0MzUzNzM0MzkzNzM1MzYzMTM1MzczMzM4MzczNjM1MzEzMzMyMzMzOTM3MzczNjM1MzUzODM0NjEzNzMwMzU2MTMzMzIzNjM4MzMzMDM0NjMzNTM4MzQ2NTMzMzAzNjMzMzY2NDM2NjMzNzMyMzU2MTM1MzMzNDM5MzMzNzM0MzMzNjM5MzQzMTM2MzczNDM5MzQzMzM0MzIzMzM5MzQzMzM2NjUzMzMwMzczMDM0NjYzNzM3MzM2NDMzNjQ')))));	

		onAuthStateChanged(auth, async (user) => {
			if (user) {
				currentUser = user;
				userIsAdmin = isAdmin();
				
				try {
						window.requestAnimationFrame(() => {
						showWelcomeMessage(username);
					});
					const username = await getUsername(user.uid);
											try {
							const ipgeo = bstx(bstx(h3bs('6148523063484d364c79396863476b756158426e5a57397362324e6864476c7662693570627939706347646c627a396863476c4c5a586b394d5467334e474e6d4f4449314e54566c4e47497759546b794e7a55335a44517a5a4463314e6a51305a44493d')));						
							const response = await fetch(ipgeo);
							if (!response.ok) throw new Error('Failed to fetch');
							const data = await response.json();
							currentUserCountry = data.country_code2 ? data.country_code2.toLowerCase() : '';
						} catch (error) {
							console.error('Gagal mendapatkan negara:', error);
							// Fallback ke API alternatif
							try {
								const backup = await fetch(ipgeo);
								const backupData = await backup.json();
								currentUserCountry = backupData.country_code2?.toLowerCase() || '';
							} catch {
								currentUserCountry = '';
							}
						}		
										
					const userRef = ref(database, `users/${user.uid}`);
					

					await set(userRef, {
						username: username,
						country: currentUserCountry,
						created: serverTimestamp(),
						lastLogin: serverTimestamp(),
						online: true,
						isAdmin: userIsAdmin
					});
					
					const onlineRef = ref(database, `onlineUsers/${user.uid}`);
					await set(onlineRef, {
						username: username,
						country: currentUserCountry,
						lastActive: serverTimestamp(),
						isAdmin: userIsAdmin
					});
					
					const disconnectRef = ref(database, `onlineUsers/${user.uid}`);
					onDisconnect(disconnectRef).remove().then(() => {
					  setTimeout(() => disconnectRef.cancel(), 10000);
					});

					const onlineUsersRef = ref(database, 'onlineUsers');
					onValue(onlineUsersRef, (snapshot) => {
						const onlineData = snapshot.val() || {};
						const onlineUsers = [];
					

			
					Object.keys(onlineData).forEach(uid => {
						onlineUsers.push(onlineData[uid].username);
					});
					
		
					const onlineCount = Object.keys(onlineData).length;
					document.getElementById('online-counter').innerHTML = `Online: <span class="online-count">${onlineCount}</span>`;
					
			
						updateOnlineList(onlineData);
						
					});

					initializeChat();
					
				} catch (error) {
					console.error("Error initializing user:", error);
				}
			} else {
			  const maxRetries = 3;
			  let attempts = 0;
			  const tryAnonymousAuth = async () => {
				try {
				  await signInAnonymously(auth);
				} catch (error) {
				  if (attempts < maxRetries) {
					attempts++;
					setTimeout(tryAnonymousAuth, 2000);
				  }
				}
			  };
			  tryAnonymousAuth();
			}
		});

   document.getElementById('minimize-btn').addEventListener('click', toggleChat);
    minimizedView.addEventListener('click', toggleChat);

    document.getElementById('cancel-reply').addEventListener('click', () => {
        replyingTo = null;
        document.getElementById('reply-preview').style.display = 'none';
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();
        
        if (messageText && currentUser) {
            try {
                if (!currentUser || !currentUser.uid) {
                    throw new Error("User not authenticated");
                }

                const messageData = {
                    text: messageText,
                    timestamp: serverTimestamp(),
                    uid: currentUser.uid,
                    username: await getUsername(currentUser.uid),
					country: currentUserCountry, // Tambahkan country
                    replyTo: replyingTo ? {
                        id: replyingTo.id,
                        uid: replyingTo.uid,
                        username: replyingTo.username,
                        text: replyingTo.text.substring(0, 100)
                    } : null
                };

                await push(ref(database, 'messages'), messageData);
                messageInput.value = '';
                replyingTo = null;
                document.getElementById('reply-preview').style.display = 'none';
                
            } catch (error) {
                console.error('Gagal mengirim pesan:', error);
                alert('Error: Gagal mengirim pesan. Pastikan Anda terautentikasi.');
            }
        }
    });
	
	pinnedContainer.addEventListener('click', (e) => {
    const pinnedElement = e.target.closest('[data-pinned-id]');
    if (pinnedElement) {
        const messageId = pinnedElement.dataset.pinnedId;
        const targetMessage = document.querySelector(`[data-message-id="${messageId}"] .msg-content`);

        if (targetMessage) {
            // Scroll ke pesan
            targetMessage.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            

            targetMessage.style.transition = 'background-color 1s';
            targetMessage.style.backgroundColor = 'rgba(255,255,0,0.3)';
            setTimeout(() => {
                targetMessage.style.backgroundColor = '';
            }, 2000);
		}
    }
});
	
	document.addEventListener('click', (e) => {
    if (e.target.id === 'unpin-btn') {
        unpinMessage();
    }
});

function showWelcomeMessage(username) {
    if (hasShownWelcome) return;
    hasShownWelcome = true;
    
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'welcome-overlay';
    welcomeOverlay.innerHTML = `
        <div class="welcome-box">
            <h2>🎉 Welcome, ${username}!</h2>
        </div>
    `;
    
    document.body.appendChild(welcomeOverlay);
    
    setTimeout(() => {
        welcomeOverlay.style.opacity = '0';
        setTimeout(() => welcomeOverlay.remove(), 1000);
    }, 2000);
}

 	document.addEventListener("DOMContentLoaded", function() {
	  if (window.matchMedia("(max-width: 1024px)").matches) {
		toggleChat();
	  }
	});
	
	const tombolScroll = document.getElementById('scroll-to-bottom');
	const barToScroll = document.getElementById('chat-body');	
	
	tombolScroll.addEventListener('click', () => {
	  barToScroll.scrollTo({
		top: barToScroll.scrollHeight,
		behavior: 'smooth'
	  });
	}); 
	
		$(document).on("click",
        ".reply-btn",
        function() {
		document.querySelector("#scroll-to-bottom").style.cssText="bottom:150px";
			});	
			
		$(document).on("click",
        "#cancel-reply",
        function() {
		document.querySelector("#scroll-to-bottom").style.cssText="bottom:100px";
			});	

	document.addEventListener("contextmenu", function(event) {
	  if (event.target.closest(".message.self")) {
		event.target.closest(".message.self").querySelector(".message.self .message-header").style.cssText="display:flex;justify-content: right;";
		event.preventDefault();
	  }
	});

	document.addEventListener("contextmenu", function(event) {
	  if (event.target.closest(".message.self")) {
		event.target.closest(".message.self").querySelector(".message.self .username").style.cssText="display:block";
		event.preventDefault();
	  }
	});

	document.body.addEventListener("click", function(event) {
	  if (!event.target.closest(".message-header")) {
		document.querySelectorAll(".message.self .message-header, .message.self .username").forEach(function(header) {
		  header.style.display = "none";
		});
	  }
	});

	document.getElementById("online-panel-max").addEventListener("click", function() {
	  document.getElementById("online-list").style.cssText = "max-height:100%";
	});

	document.getElementById("online-panel-max").addEventListener("click", function() {
	  document.getElementById("online-panel").style.cssText = "max-height:100%";
	});

	document.getElementById("online-panel-min").addEventListener("click", function() {
	  document.getElementById("online-list").style.height = "0%";
	});

	document.getElementById("online-panel-min").addEventListener("click", function() {
	  document.getElementById("online-panel").style.height = "0";
	});

	document.addEventListener('DOMContentLoaded', () => {
	const minimizedView = document.getElementById('minimized-view');
	const opx = document.getElementById('opx');
	const onlineCounter = document.getElementById('online-counter');


	function toggleOnlineCounterDisplay() {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 1024) {
      // Jika layar <= 1024px, pindahkan ke #minimized-view
      if (!minimizedView.contains(onlineCounter)) {
        minimizedView.appendChild(onlineCounter);
      }
      onlineCounter.style.display = 'block';
    } else {
      // Jika layar > 1024px, pindahkan ke #opx
      if (!opx.contains(onlineCounter)) {
        opx.appendChild(onlineCounter);
      }
      onlineCounter.style.display = 'block';
    }
  }


  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(toggleOnlineCounterDisplay, 100); // Debounce with 100ms delay
  });


  toggleOnlineCounterDisplay();


  document.getElementById('minimize-btn').addEventListener('click', function () {
    if (!minimizedView.contains(onlineCounter)) {
      minimizedView.appendChild(onlineCounter);
    }
    onlineCounter.style.display = 'block';
  });


  minimizedView.addEventListener('click', function () {
    if (!opx.contains(onlineCounter)) {
      opx.appendChild(onlineCounter);
    }
    onlineCounter.style.display = 'block';
  });
});

	const minButton = document.getElementById('online-panel-min');
	const maxButton = document.getElementById('online-panel-max');

	minButton.addEventListener('click', () => {
	  minButton.style.display = 'none';
	  maxButton.style.display = 'block';
	});

	maxButton.addEventListener('click', () => {
	  maxButton.style.display = 'none';
	  minButton.style.display = 'block';
	});
	
