  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
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

  const firebaseConfig = {
    apiKey: "AIzaSyCzAnKxMW-_B-h-EP9OVC74LBwHemf0LLM",
    authDomain: "sahayata-hackathon.firebaseapp.com",
    projectId: "sahayata-hackathon",
    storageBucket: "sahayata-hackathon.appspot.com",
    messagingSenderId: "137580379612",
    appId: "1:137580379612:web:6706fe3992c7d20ee7a319",
    measurementId: "G-8FH9NS7HCK"
  };


  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();


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


onAuthStateChanged(auth, user => {
    if (user) {
        loginSignupBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmailSpan.textContent = user.email;
        if (authPage.classList.contains('active')) {
            showPage('page-home');
        }
    } else {

        loginSignupBtn.style.display = 'block';
        userInfo.style.display = 'none';
        userEmailSpan.textContent = '';
    }
});

loginSignupBtn.addEventListener('click', () => {
    showPage('page-auth');
});

signOutBtn.addEventListener('click', () => {
    signOut(auth).catch(error => console.error("Sign out error", error));
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            authError.textContent = error.message;
        });
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .catch(error => {
            authError.textContent = error.message;
        });
});

googleSigninBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .catch(error => {
            authError.textContent = error.message;
        });
});

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
        authError.textContent = '';
    });
});

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
    }
    window.scrollTo(0, 0);
}

document.querySelectorAll('.category-card-food, .category-card-medical, .category-card-education, .category-card-house').forEach(card => {
    card.addEventListener('click', () => {
        const pageId = card.dataset.page;
        if (pageId) {
            showPage(pageId);
        }
    });
});

document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        showPage('page-home');
    });
});
document.getElementById('home-button').addEventListener('click', () => {
    showPage('page-home');
});

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

setupRealtimeListener('foodDonations', 'food-listing-grid', createFoodCard);
setupRealtimeListener('medicalDonations', 'medical-listing-grid', createMedicalCard);
setupRealtimeListener('educationDonations', 'education-listing-grid', createEducationCard);
setupRealtimeListener('homeDonations', 'home-listing-grid', createHomeCard);
// Function to convert a File to a base64 string
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}
const scanImageBtn = document.querySelector("#scan-image-btn");
// Add an event listener to the scan button
scanImageBtn.addEventListener('click', async () => {
    const file = itemImageUpload.files[0];

    if (!file) {
        alert("Please upload an image first.");
        return;
    }

    scanResultsContainer.style.display = 'block';
    loadingIndicator.style.display = 'block';
    identifiedItemsText.textContent = '';
    populateFormBtn.style.display = 'none';

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        const base64Image = await fileToBase64(file);
        
        const prompt = `
            You are SahayakAI, a kind and helpful assistant for a donation app.
            Analyze the following image and list the main items that can be donated.
            Categorize each item as 'Clothes', 'Furniture', 'Appliances', or 'Other'.
            For example:
            Clothes: Winter jackets, T-shirts
            Furniture: A small study table
            Appliances: An old microwave oven
            Other: A box of old toys

            Identify the items in this image:
        `;
        
        const result = await model.generateContent([
            prompt, 
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Image
                }
            }
        ]);
        
        const textResponse = result.response.text;
        
        loadingIndicator.style.display = 'none';
        identifiedItemsText.textContent = textResponse;
        populateFormBtn.style.display = 'block';

        // Event listener for the "Use these items" button
        populateFormBtn.addEventListener('click', () => {
            homeFormDescription.value = textResponse;
            // You can add more logic here to automatically fill other fields based on the response
        });
        
    } catch (error) {
        console.error("Error with AI scan:", error);
        loadingIndicator.style.display = 'none';
        identifiedItemsText.textContent = 'An error occurred. Please try again or fill the form manually.';
    }
});