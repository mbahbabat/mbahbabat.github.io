import {
	initializeApp
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	GoogleAuthProvider,
	getRedirectResult,
	signInWithPopup,
	signInWithRedirect,
	signOut
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import {
	captchaSolver
} from '../assets/js/init/captcha.js';
import {
	syncUser
} from '../assets/js/init/syncUser.js';