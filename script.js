// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzAnKxMW-_B-h-EP9OVC74LBwHemf0LLM",
    authDomain: "sahayata-hackathon.firebaseapp.com",
    projectId: "sahayata-hackathon",
    storageBucket: "sahayata-hackathon.appspot.com", // Corrected URL
    messagingSenderId: "137580379612",
    appId: "1:137580379612:web:6706fe3992c7d20ee7a319",
    measurementId: "G-8FH9NS7HCK"
};

// --- Initialize Firebase and its services ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- DOM Elements ---
const loginSignupBtn = document.getElementById('login-signup-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');
const authPage = document.getElementById('page-auth');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const googleSigninBtn = document.getElementById('google-signin-btn');
const authError = document.getElementById('auth-error');
const authTabs = document.querySelectorAll('.auth-tab');
const scanImageBtn = document.getElementById('scan-image-btn');
const imageUploadInput = document.getElementById('item-image-upload');
const scanResultsContainer = document.getElementById('scan-results-container');
const loadingIndicator = document.getElementById('loading-indicator');
const identifiedItemsText = document.getElementById('identified-items-text');
const populateFormBtn = document.getElementById('populate-form-btn');
const homeFormDescription = document.getElementById('home-form-description');

// --- 1. Core Authentication Listener ---
onAuthStateChanged(auth, user => {
    if (user) {
        loginSignupBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmailSpan.textContent = user.email;
        if (authPage && authPage.classList.contains('active')) {
            showPage('page-home');
        }
    } else {
        loginSignupBtn.style.display = 'block';
        userInfo.style.display = 'none';
        userEmailSpan.textContent = '';
    }
});

// --- 2. Page Navigation Logic ---
const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
    }
    window.scrollTo(0, 0);
};

// --- 3. Event Listeners for Navigation ---
loginSignupBtn.addEventListener('click', () => showPage('page-auth'));
signOutBtn.addEventListener('click', () => signOut(auth).catch(error => console.error("Sign out error", error)));
document.getElementById('home-button').addEventListener('click', () => showPage('page-home'));
document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', () => showPage('page-home')));
document.querySelectorAll('.category-card-food, .category-card-medical, .category-card-education, .category-card-house').forEach(card => {
    card.addEventListener('click', () => {
        const pageId = card.dataset.page;
        if (pageId) showPage(pageId);
    });
});

// --- 4. Event Listeners for Auth Forms ---
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        signInWithEmailAndPassword(auth, email, password)
            .catch(error => authError.textContent = error.message);
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        createUserWithEmailAndPassword(auth, email, password)
            .catch(error => authError.textContent = error.message);
    });
}

if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .catch(error => authError.textContent = error.message);
    });
}

if (authTabs) {
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
            if(authError) authError.textContent = '';
        });
    });
}

// --- 5. Firestore Data Handling ---
document.querySelectorAll('form[data-collection]').forEach(form => {
    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            if (!auth.currentUser) {
                alert('You must be logged in to make a donation.');
                showPage('page-auth');
                return;
            }
            const collectionName = form.dataset.collection;
            const formData = new FormData(form);
            const newData = {};
            formData.forEach((value, key) => newData[key] = value);
            newData.createdAt = new Date();
            newData.userEmail = auth.currentUser.email;

            try {
                await addDoc(collection(db, collectionName), newData);
                form.reset();
                alert('Thank you! Your donation is listed.');
                showPage('page-home');
            } catch (err) { 
                console.error("Error adding document: ", err); 
                alert('Submission failed. Please try again.'); 
            }
        });
    }
});

// --- 6. Real-Time Data Listeners ---
function setupRealtimeListener(collectionName, gridElementId, cardRenderer) { 
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc")); 
    const grid = document.getElementById(gridElementId); 
    if (grid) {
        onSnapshot(q, (snapshot) => { 
            grid.innerHTML = ''; 
            snapshot.forEach(doc => { 
                grid.appendChild(cardRenderer(doc.data())); 
            }); 
        }); 
    }
}

// --- 7. Card Creation Functions ---
const createFoodCard = data => { 
    const card = document.createElement('div'); 
    card.className = 'listing-card'; 
    const pickupDate = data.pickupBy ? new Date(data.pickupBy).toLocaleString() : 'ASAP'; 
    card.innerHTML = `<div class="listing-card-header"><div><h4 class="listing-card-title">${data.source} Surplus</h4><p class="listing-card-subtitle">Pickup by: ${pickupDate}</p></div><span class="listing-card-tag tag-food">${data.source}</span></div><p class="listing-card-body">${data.description}</p><div class="listing-card-footer"><span><i class="ph ph-map-pin"></i> ${data.location}</span><span>By: ${data.userEmail.split('@')[0]}</span></div>`; 
    return card; 
};

const createMedicalCard = data => { 
    const card = document.createElement('div'); 
    card.className = 'listing-card'; 
    card.innerHTML = `<div class="listing-card-header"><div><h4 class="listing-card-title">${data.type}</h4><p class="listing-card-subtitle">Condition: ${data.condition}</p></div><span class="listing-card-tag tag-medical">${data.type}</span></div><p class="listing-card-body">${data.description}</p><div class="listing-card-footer"><span><i class="ph ph-map-pin"></i> ${data.location}</span><span>Qty: ${data.quantity}</span></div>`; 
    return card; 
};

const createEducationCard = data => { 
    const card = document.createElement('div'); 
    card.className = 'listing-card'; 
    card.innerHTML = `<div class="listing-card-header"><div><h4 class="listing-card-title">${data.type}</h4><p class="listing-card-subtitle">For: ${data.ageGroup}</p></div><span class="listing-card-tag tag-education">${data.type}</span></div><p class="listing-card-body">${data.description}</p><div class="listing-card-footer"><span><i class="ph ph-map-pin"></i> ${data.location}</span><span>Qty: ${data.quantity}</span></div>`; 
    return card; 
};

const createHomeCard = data => { 
    const card = document.createElement('div'); 
    card.className = 'listing-card'; 
    card.innerHTML = `<div class="listing-card-header"><div><h4 class="listing-card-title">${data.category}</h4><p class="listing-card-subtitle">Condition: ${data.condition}</p></div><span class="listing-card-tag tag-home">${data.category}</span></div><p class="listing-card-body">${data.description}</p><div class="listing-card-footer"><span><i class="ph ph-map-pin"></i> ${data.location}</span><span>Qty: ${data.quantity}</span></div>`; 
    return card; 
};

// --- 8. Initialize all listeners ---
setupRealtimeListener('foodDonations', 'food-listing-grid', createFoodCard);
setupRealtimeListener('medicalDonations', 'medical-listing-grid', createMedicalCard);
setupRealtimeListener('educationDonations', 'education-listing-grid', createEducationCard);
setupRealtimeListener('homeDonations', 'home-listing-grid', createHomeCard);

// --- 9. AI Image Scanning ---
if (scanImageBtn) {
    scanImageBtn.addEventListener('click', async () => {
        const file = imageUploadInput.files[0];
        if (!file) {
            alert("Please upload an image first.");
            return;
        }

        scanResultsContainer.style.display = 'block';
        loadingIndicator.style.display = 'block';
        document.getElementById('scan-results').style.display = 'none';

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64ImageData = reader.result.split(',')[1];
            scanImageWithGemini(base64ImageData, file.type);
        };
        reader.readAsDataURL(file);
    });
}

async function scanImageWithGemini(base64ImageData, mimeType = "image/jpeg") {
    const apiKey = "AIzaSyAuD04hfA3dvBrjlIV2pvoKEKAaS9j2z-U"; // The environment will handle this if left blank
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: "Identify the donatable household items in this image. List them clearly as a comma-separated list. For example: 'a blue t-shirt, a pair of jeans, a wooden chair'." },
                { inlineData: { mimeType, data: base64ImageData } }
            ]
        }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No items detected.";
        
        loadingIndicator.style.display = 'none';
        document.getElementById('scan-results').style.display = 'block';
        identifiedItemsText.textContent = text;

    } catch (error) {
        console.error("Error scanning image:", error);
        loadingIndicator.style.display = 'none';
        document.getElementById('scan-results').style.display = 'block';
        identifiedItemsText.textContent = '❌ Scan failed. Please try again or fill in manually.';
    }
}

if (populateFormBtn) {
    populateFormBtn.addEventListener('click', () => {
        const items = identifiedItemsText.textContent;
        if (items) {
            homeFormDescription.value = items;
            alert('Description field has been filled. Please complete the rest of the form.');
        }
    });
}
