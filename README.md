# Dihadi.com

## Overview
Dihadi.com is a secure, hyper-local errand-running marketplace designed to connect local clients with verified taskers (runners) in their vicinity. The platform features interactive mapping, live GPS location tracking, secure escrow payments, real-time chat rooms with media attachments, emoji reactions, voice recording messages, and an interactive FAQ assistant chatbot.

Basically, if you need a quick errand done (like delivery, cleaning, or tech help), you can post it here. Taskers nearby can bid, you select the best offer, hire them securely, and track their progress live on map.

## Features
**Secure Escrow Payments & Wallet Ledger:**
Client deposit task budgets directly into a secure wallet escrow upon hiring. Once the job is done, the client confirms completion to release funds. To maintain the marketplace, the platform automatically deducts a 5% commission fee from the takser's payout, directing it ot the system treasury. Users can access transaction history classifications (Deposits, Withdrawals, Escrow) and print digital invoice receipts.

**Verification Queue & Dispute Resolution:**
Taskers can upload ID verification documents to earn a verified status badge. If a tasker completes a job, they upload photo proof of completion. If the client is unsatisfied, they can freeze funds in escrow by raising a dispute. Admins review disputes and verification documents via dedicated queues in the dashboard.

**Interactive Leaflet Maps & Live GPS Tracking:**
Leaflet maps display task locations dynamically. Hired taskers can activate "Live Location Sharing" form their console, allowing the client to watch a green earner pin move across their map in real-time.

**Advanced Explorer Filters & Sorting:**
A sliding glassmorphic sidebar console lets users search for errands. It includes an HTML5 GPS radius slider (1km to 100km), budget sliders, and options to sort listings instantly by newest, highest budget, or nearest distance. Promoted errands (clients pay ₹50 to promote) are pinned to the top of list feeds with glowing neon borders.

**Live Chat with Media, Reactions & Indicators:**
Connected chat feeds support real-time communication. Taskers and clients can send text messages, upload image attachments, record/send voice audio clips (using browser MediaRecorder), search message history keywords, see live typing status indicators, and react to individual messages with emojis that display aggregated count tags.

**Dihadi AI Assistant Chatbot:**
A floating conversational drawer widget sits globally in the bottom-right corner of the layout. Users can type questions or click quick-help chips to get answers from the AI Chatbot about payment escrows, system fees, verification, and errand promotions.

## Known Bugs & Limitations
**Mobile Layout Shifts:**
The application layout is optimized primarily for desktop and tablet screens. Minor container overflows and responsiveness issues may occur on small mobile viewports.

**Leaflet Marker Anchor Offsets:**
Leaflet map pins may occasionally shift slightly during fast viewport resets in developer mode before snapping back to their correct coordinates.

**Audio Recorder Permissions:**
If microphone access is denied by browser settings, clicking the record trigger fails silently without prompting (mitigated by reloading the page and allowing mic access).

## Tech Stack
#### Frontend:
* React (Vite) with TypeScript
* Tailwind CSS (Theme toggling & layout design)
* Leaflet API (Map rendering & market placements)
* Socket.io-client (Real-time tracking, chat message events, and status updates)
* React Router DOM (Navigation and private routes)

#### Backend:
* Node.js & Express (API Routing & REST endpoints)
* MongoDB Atlas (Cloud Database cluster)
* Mongoose (Data modeling & schemas)
* Socket.io (Socket channels & status relays)
* JWT (Security tokens and authorization guards)

## How to use?
1. **Sign Up / Log In:** Create an account on the homepage. Secure credentials will be validated and uou will be routed to your dashboard.
2. **Post and Errand:** Click "Post Task". Enter a title, description, budget, address location coordinates, and category.
3. **Hire a Tasker:** If you are the client, review bids placed on your errand. You can click to counter-offer task budgets or accept bids to hire. Once accepted, the budget is moved to escrow.
4. **Chat & Track Live:** Open the active chat pane to converse with the hired runner. Watch their GPS marker update live on the map as they complete the errand.
5. **Verify & Release:** Once the runner uploads photo proof, verify the work. Release the locked escrow funds or raise a dispute if there are issues.
6. **Rate & Review:** Submit feedback comments using the interactive golden stars rating selector. Category skill badges (e.g. "Tech Guru") are automatically awarded toi taksers who hit milestones.

## How to run locally
1. **Clone the repository:**
   git clone https://github.com/Supriya-Kumari/Dihadi.com.git
2. **Install dependencies:**
* In the frontend directory: npm install
* In the backend directory: npm install
3. **Environment Configuration: Create a .env file in the backend directory:**
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
4. **Run the Application:** 
* Terminal 1 (Backend): npm run dev
* Terminal 2 (Frontend): npm run dev

## AI Usage 
* Scaffolding: Utilized AI code generators during early setup to initialize Express endpoints and structure mongoose schemas.
* Filters & Map Synced Logic: Assisted in writing client-side geospatial distance math equations (Haversine formula) to sort tasks relative to live GPS points.
* Docs & Deployment: Took some help in writing readme and in deployment.

## Future Plans 
* Direct Bank Payouts: Integrate stripe connect to automate tasker withdrawals from platform wallets directly to bank accounts.
* Notifications Emails: Connect Nodemailer to dispatch confirmation receipts and dispute updates automatically to user mailboxes.
* Mobile Port: Port the React frontend into React Native to release native iOS and Android apps.

## Screenshots of the Project