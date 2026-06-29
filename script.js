// ========== ১. সেন্ট্রালাইজড লোকাল স্টোরেজ ডাটাবেজEngine ==========
let databaseDonors = JSON.parse(localStorage.getItem('mb_v5_donors')) || [
  { id: 1, name: "আবিদ হাসান রাহুল", blood: "A+", addr: "মাইজবাগ বাজার", phone: "01811371071", bio: "জরুরি রক্তদানে যেকোনো সময় প্রস্তুত।" },
  { id: 2, name: "রিয়াদ আহমেদ", blood: "B+", addr: "দক্ষিণ মাইজবাগ", phone: "01711000000", bio: "মাইজবাগের ভেতর যেকোনো হাসপাতালে রক্ত দিতে পারব।" },
  { id: 3, name: "কামরুল ইসলাম", blood: "O+", addr: "মাইজবাগ রেল স্টেশন", phone: "01912000000", bio: "৩ মাস পর পর নিয়মিত রক্ত দান করি।" }
];

let socialPosts = JSON.parse(localStorage.getItem('mb_v5_posts')) || [
  { id: 1001, author: "আবিদ হাসান রাহুল", text: "🩸 আস-সালামু আলাইকুম। রক্তদানে আমাদের মাইজবাগ অনলাইন প্ল্যাটফর্মে সবাইকে স্বাগতম! অ্যাপের নতুন স্ট্রাকচারটি কেমন লেগেছে কমেন্টে জানান।", likes: 6, likedByMe: false, time: "২ মিনিট আগে" }
];

let chatMessagesDatabase = JSON.parse(localStorage.getItem('mb_v5_chats')) || {};

let currentUser = null;
let activeChatPartner = null;

function commitDatabaseUpdates() {
  localStorage.setItem('mb_v5_donors', JSON.stringify(databaseDonors));
  localStorage.setItem('mb_v5_posts', JSON.stringify(socialPosts));
  localStorage.setItem('mb_v5_chats', JSON.stringify(chatMessagesDatabase));
}

// ========== ২. রাউটার কন্ট্রোলার (DYNAMIC VIEW ROUTER) ==========
function switchView(viewId) {
  // সমস্ত অ্যাক্টিভ স্ক্রিন হাইড করা
  const viewElements = ['viewDashboard', 'viewAboutApp', 'viewRequestForm', 'viewDonors', 'viewDonorDetails', 'viewChat', 'viewChatWindow', 'viewProfile'];
  viewElements.forEach(v => { 
    if(document.getElementById(v)) document.getElementById(v).style.display = 'none'; 
  });
  
  // টার্গেট ভিউ ভিজিবল করা
  let targetViewSelector = 'view' + viewId.charAt(0).toUpperCase() + viewId.slice(1);
  if (document.getElementById(targetViewSelector)) {
    document.getElementById(targetViewSelector).style.display = 'block';
  }

  // বটম নেভিগেশন হাইলাইটার রুলস
  document.querySelectorAll('.app-bottom-nav .nav-button-item').forEach(btn => btn.classList.remove('active'));
  if (viewId === 'aboutApp') document.getElementById('btnNavAbout').classList.add('active');
  if (viewId === 'requestForm') document.getElementById('btnNavReq').classList.add('active');
  if (viewId === 'dashboard') { document.getElementById('btnNavDash').classList.add('active'); renderSocialTimeline(); }
  if (viewId === 'donors') { document.getElementById('btnNavDonors').classList.add('active'); renderDonorDirectory(databaseDonors); }
  if (viewId === 'chat') { document.getElementById('btnNavChat').classList.add('active'); renderInboxUsers(); }
  if (viewId === 'profile') changeProfileTab('bio');
}

function toggleAuthView(targetLayer) {
  document.getElementById('authContainer').style.display = targetLayer === 'login' ? 'flex' : 'none';
  document.getElementById('signupContainer').style.display = targetLayer === 'signup' ? 'flex' : 'none';
}

// ========== ৩. অথেন্টিকেশন প্রসেসর (N, NU, P ভ্যালিডেশন) ==========
function handleLogin() {
  let nameInput = document.getElementById('loginName').value.trim();
  let phoneInput = document.getElementById('loginPhone').value.trim();
  let passwordInput = document.getElementById('loginPass').value;

  // আপনার দেওয়া ইনস্ট্রাকশন অনুযায়ী ডিফল্ট পাসওয়ার্ড চেক 234
  if (passwordInput === "234") {
    currentUser = databaseDonors.find(d => d.phone === phoneInput) || {
      id: Date.now(), name: nameInput, blood: "O+", addr: "মাইজবাগ", phone: phoneInput, bio: "নিবন্ধিত রক্তদাতা।"
    };
    if (!databaseDonors.some(d => d.phone === phoneInput)) {
      databaseDonors.push(currentUser);
      commitDatabaseUpdates();
    }
    initializeSession();
  } else {
    fireNotificationToast("❌ পাসওয়ার্ড ভুল! সঠিক পাসওয়ার্ড ব্যবহার করুন।");
  }
}

function handleSignup() {
  let name = document.getElementById('signupName').value.trim();
  let blood = document.getElementById('signupBlood').value;
  let phone = document.getElementById('signupPhone').value.trim();
  let addr = document.getElementById('signupAddr').value.trim();

  if (!name || !blood || !phone || !addr) {
    fireNotificationToast("⚠️ দয়া করে সব তথ্য পূরণ করুন!");
    return;
  }

  currentUser = { id: Date.now(), name, blood, addr, phone, bio: "রক্তদানে আমাদের মাইজবাগ অ্যাপের একজন নিয়মিত সদস্য।" };
  databaseDonors.push(currentUser);
  commitDatabaseUpdates();
  fireNotificationToast("🎉 অ্যাকাউন্ট তৈরি সফল হয়েছে!");
  initializeSession();
}

function initializeSession() {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('signupContainer').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  
  let avatarCharacter = currentUser.name.charAt(0);
  document.getElementById('appHeaderAvatar').innerText = avatarCharacter;
  document.getElementById('fbInputAvatar').innerText = avatarCharacter;
  
  switchView('dashboard');
  deployBloodRaindropAnimation(); // রক্তের ফোঁটা পড়ার মোশন স্টার্ট
}

function executeLogout() {
  currentUser = null;
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('authContainer').style.display = 'flex';
}

// ========== ৪. ফেসবুক স্টাইল টাইমলাইন ফিড ইঞ্জিন ==========
function openComposerModal() { document.getElementById('composerModalPopup').style.display = 'flex'; }
function closeComposerModal() { document.getElementById('composerModalPopup').style.display = 'none'; document.getElementById('composerInputTextArea').value = ""; }

function publishNewPost() {
  let text = document.getElementById('composerInputTextArea').value.trim();
  if (!text) return;

  let newPostObj = { id: Date.now(), author: currentUser.name, text: text, likes: 0, likedByMe: false, time: "এইমাত্র" };
  socialPosts.unshift(newPostObj);
  commitDatabaseUpdates();
  closeComposerModal();
  renderSocialTimeline();
  fireNotificationToast("🚀 পোস্ট সফলভাবে লাইভ হয়েছে!");
}

function renderSocialTimeline() {
  let feedContainer = document.getElementById('newsFeedStream');
  feedContainer.innerHTML = "";
  socialPosts.forEach(post => {
    let activeLikeState = post.likedByMe ? "fci-interact-btn liked" : "fci-interact-btn";
    let card = document.createElement('div');
    card.className = "feed-card-item";
    card.innerHTML = `
      <div class="fci-header">
        <div class="profile-avatar-circle">${post.author.charAt(0)}</div>
        <div class="fci-meta-data"><h4>${post.author}</h4><span>${post.time}</span></div>
      </div>
      <div class="fci-message-content">${post.text}</div>
      <div class="fci-actions-bar">
        <button class="${activeLikeState}" onclick="triggerLike(${post.id})">👍 লাইক (${post.likes})</button>
        <button class="fci-interact-btn" onclick="initiateDirectMessage('${post.author}')">💬 ইনবক্স</button>
      </div>
    `;
    feedContainer.appendChild(card);
  });
}

function triggerLike(id) {
  let matchedPost = socialPosts.find(p => p.id === id);
  if (matchedPost) {
    if (matchedPost.likedByMe) { matchedPost.likes--; matchedPost.likedByMe = false; }
    else { matchedPost.likes++; matchedPost.likedByMe = true; }
    commitDatabaseUpdates(); renderSocialTimeline();
  }
}

// ========== ৫. ডোনার ডিরেক্টরি ব্যবস্থাপনা ও ফিল্টার ==========
function renderDonorDirectory(list) {
  let container = document.getElementById('donorCardContainer');
  container.innerHTML = "";
  list.forEach(donor => {
    if (currentUser && donor.phone === currentUser.phone) return;
    let row = document.createElement('div');
    row.className = "donor-list-row";
    row.innerHTML = `
      <div class="dl-avatar-box">${donor.blood}</div>
      <div class="dl-details-box"><h4>${donor.name}</h4><p>📍 ${donor.addr}</p></div>
      <span class="dl-action-indicator">দেখুন →</span>
    `;
    row.onclick = () => showAdvancedDonorDetails(donor);
    container.appendChild(row);
  });
}

function executeLiveSearch() {
  let query = document.getElementById('globalSearchInput').value.toLowerCase().trim();
  let searchResult = databaseDonors.filter(d => d.name.toLowerCase().includes(query) || d.blood.toLowerCase().includes(query) || d.addr.toLowerCase().includes(query));
  renderDonorDirectory(searchResult);
}

function showAdvancedDonorDetails(donor) {
  switchView('donorDetails');
  document.getElementById('detailsDonorName').innerText = donor.name;
  document.getElementById('detailsBigAvatar').innerText = donor.name.charAt(0);
  document.getElementById('detailsBloodTag').innerText = donor.blood;
  document.getElementById('detailsFullInfoParagraph').innerHTML = `<b>পূর্ণ নাম:</b> ${donor.name}<br><b>রক্তের গ্রুপ:</b> ${donor.blood}<br><b>যোগাযোগের নম্বর:</b> ${donor.phone}<br><b>বর্তমান এলাকা:</b> ${donor.addr}<br><b>ডোনার বায়ো:</b> ${donor.bio || 'কোনো তথ্য যোগ করা হয়নি।'}`;
  document.getElementById('detailsCallAnchor').href = `tel:${donor.phone}`;
  document.getElementById('detailsChatButton').onclick = () => initiateDirectMessage(donor.name);
}

// ========== ৬. রিকোয়েস্ট ফর্ম হ্যান্ডলার (পোস্ট ইন্টারফেসিং) ==========
function handleRequestFormSubmit() {
  let patientProblem = document.getElementById('reqPatientProblem').value.trim();
  let bloodGroup = document.getElementById('reqBloodGroup').value;
  let hospitalLoc = document.getElementById('reqHospitalLoc').value.trim();
  let contactPhone = document.getElementById('reqContactPhone').value.trim();

  let formattedRequestString = `🆘 জরুরি রক্তের রিকোয়েস্ট ফর্ম 🆘\n\n🎯 ব্লাড গ্রুপ: ${bloodGroup}\n👤 রোগী/সমস্যা: ${patientProblem}\n📍 রক্তদানের স্থান: ${hospitalLoc}\n📱 যোগাযোগের নম্বর: ${contactPhone}`;
  
  let newRequestPost = { id: Date.now(), author: currentUser.name, text: formattedRequestString, likes: 0, likedByMe: false, time: "এইমাত্র" };
  socialPosts.unshift(newRequestPost);
  commitDatabaseUpdates();
  
  // ফর্ম ডাটা রিসেট
  document.getElementById('reqPatientProblem').value = "";
  document.getElementById('reqHospitalLoc').value = "";
  document.getElementById('reqContactPhone').value = "";
  
  fireNotificationToast("🆘 রক্তের রিকোয়েস্টটি সফলভাবে ফেসবুক ফিডে পোস্ট হয়েছে!");
  switchView('dashboard');
}

// ========== 7. চ্যাট ইনবক্স ও রিয়েল চ্যাট ইন্টারফেস ==========
function renderInboxUsers() {
  let container = document.getElementById('inboxUsersListContainer');
  container.innerHTML = "";
  databaseDonors.forEach(donor => {
    if (currentUser && donor.phone === currentUser.phone) return;
    let card = document.createElement('div');
    card.className = "donor-list-row";
    card.innerHTML = `
      <div class="profile-avatar-circle" style="background:#556b2f">${donor.name.charAt(0)}</div>
      <div class="dl-details-box"><strong>${donor.name}</strong><p>বার্তা আদান-প্রদান করতে এখানে ক্লিক করুন...</p></div>
      <span class="dl-action-indicator" style="color:#2e7d32">${donor.blood}</span>
    `;
    card.onclick = () => initiateDirectMessage(donor.name);
    container.appendChild(card);
  });
}

function initiateDirectMessage(partnerName) {
  activeChatPartner = partnerName;
  switchView('chatWindow');
  document.getElementById('chatRoomPartnerName').innerText = partnerName;
  document.getElementById('chatRoomAvatar').innerText = partnerName.charAt(0);
  refreshChatMessagesSpace();
}

function refreshChatMessagesSpace() {
  let box = document.getElementById('chatMessageStreamSpace');
  box.innerHTML = "";
  let sessionKey = [currentUser.name, activeChatPartner].sort().join("##");
  let msgList = chatMessagesDatabase[sessionKey] || [];
  msgList.forEach(msg => {
    let bubble = document.createElement('div');
    bubble.className = msg.sender === currentUser.name ? "chat-bubble my-msg" : "chat-bubble peer-msg";
    bubble.innerText = msg.text;
    box.appendChild(bubble);
  });
  box.scrollTop = box.scrollHeight;
}

function dispatchChatMessage() {
  let input = document.getElementById('chatTextInputField');
  let rawText = input.value.trim();
  if (!rawText) return;
  let sessionKey = [currentUser.name, activeChatPartner].sort().join("##");
  if (!chatMessagesDatabase[sessionKey]) chatMessagesDatabase[sessionKey] = [];
  chatMessagesDatabase[sessionKey].push({ sender: currentUser.name, text: rawText });
  commitDatabaseUpdates();
  input.value = "";
  refreshChatMessagesSpace();
}

// ========== ৮. প্রোফাইল ও সাব-ট্যাব কন্ট্রোলার ==========
function changeProfileTab(tabName) {
  document.getElementById('btnTabBio').className = tabName === 'bio' ? 'profile-tab-btn active' : 'profile-tab-btn';
  document.getElementById('btnTabPosts').className = tabName === 'posts' ? 'profile-tab-btn active' : 'profile-tab-btn';
  let dynamicSpace = document.getElementById('profileTabDynamicViewSpace');
  
  document.getElementById('myProfileName').innerText = currentUser.name;
  document.getElementById('myProfileHugeAvatar').innerText = currentUser.name.charAt(0);
  document.getElementById('myProfileBloodBadge').innerText = currentUser.blood;

  if (tabName === 'bio') {
    dynamicSpace.innerHTML = `<div class="details-description-box"><b>ব্যবহারকারীর নাম:</b> ${currentUser.name}<br><b>রক্তের গ্রুপ:</b> ${currentUser.blood}<br><b>মোবাইল নম্বর:</b> ${currentUser.phone}<br><b>এলাকা/ঠিকানা:</b> ${currentUser.addr}</div>`;
  } else {
    let myOwnFilteredPosts = socialPosts.filter(p => p.author === currentUser.name);
    if(myOwnFilteredPosts.length === 0) { dynamicSpace.innerHTML = "<p style='color:#777;font-size:12px;text-align:center;'>আপনার কোনো পোস্ট পাওয়া যায়নি।</p>"; }
    else {
      dynamicSpace.innerHTML = "";
      myOwnFilteredPosts.forEach(p => {
        dynamicSpace.innerHTML += `<div class="feed-card-item" style="padding:10px;margin-bottom:8px;"><p style="font-size:13px;color:#333;">${p.text}</p></div>`;
      });
    }
  }
}

// ========== ৯. অ্যানিমেটেড ব্লাড রেইন মেকার মেথড ==========
function deployBloodRaindropAnimation() {
  let container = document.getElementById('bloodRain');
  container.innerHTML = "";
  let maxDropsCount = 30; // স্ক্রিনে ড্রপ রেন্ডারিং সংখ্যা
  for (let i = 0; i < maxDropsCount; i++) {
    let dropElement = document.createElement('div');
    dropElement.className = 'single-blood-drop';
    dropElement.style.left = Math.random() * 100 + 'vw';
    dropElement.style.animationDuration = (Math.random() * 2 + 1.8) + 's';
    dropElement.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(dropElement);
  }
}

// ========== ১০. এআই অ্যাসিস্ট্যান্ট ও টোস্ট ইঞ্জিন ==========
function toggleAiAssistant() { let p = document.getElementById('aiPanel'); p.style.display = p.style.display === 'none' ? 'flex' : 'none'; }
function processAiQuestion() {
  let input = document.getElementById('aiQueryInput'); let queryText = input.value.trim(); if (!queryText) return;
  let chatSpace = document.getElementById('aiChatSpace');
  chatSpace.innerHTML += `<div class="ai-msg-user">আমি: ${queryText}</div>`;
  input.value = "";
  setTimeout(() => {
    chatSpace.innerHTML += `<div class="ai-msg-bot">🤖 মাইজবাগ AI গাইড: রক্তদাতার তালিকা দেখতে নিচে "ডোনারস" (📋) বাটনে চাপ দিন এবং লাইভ সার্চ বক্সে রক্তের গ্রুপ টাইপ করুন।</div>`;
    chatSpace.scrollTop = chatSpace.scrollHeight;
  }, 450);
}
function fireNotificationToast(msg) {
  let t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
