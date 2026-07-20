import { config } from './ccc.js';

let currentUserProfile = null; // Store globally for this session
let globalUserData = null; // Store user DB data for populating the edit form
let currentEditingRelId = null; // Track which relative is being edited

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await liff.init({ liffId: config.LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        currentUserProfile = await liff.getProfile();
        await loadUserData(currentUserProfile.userId);

    } catch (err) {
        document.getElementById("statusText").innerText = "LIFF Initialization Failed.";
        console.error(err);
    }

    // --- USER PROFILE EVENTS ---

    // 1. Click "Edit Profile" from Dashboard
    document.getElementById("editProfileBtn").addEventListener("click", () => {
        document.getElementById("dashboardScreen").style.display = "none";
        document.getElementById("registrationScreen").style.display = "block";

        // Populate the form with current data
        if (globalUserData) {
            document.getElementById("regFullName").value = globalUserData.fullName || "";
            document.getElementById("regEmail").value = globalUserData.email || "";
            document.getElementById("regEmployeeId").value = globalUserData.empId || "";
            document.getElementById("regPosition").value = globalUserData.position || "";
            document.getElementById("regAssignedPost").value = globalUserData.assignedPost || "";
            document.getElementById("regDivision").value = globalUserData.division || "";
            document.getElementById("regSupervisor").value = globalUserData.supervisor || "";
            document.getElementById("regWorkPhone").value = globalUserData.workPhone || "";
            // Format date for input type="date" (YYYY-MM-DD)
            const d = new Date(globalUserData.dateOfHire);
            document.getElementById("regDateOfHire").value = !isNaN(d) ? d.toISOString().split('T')[0] : "";
            document.getElementById("regAliases").value = globalUserData.aliases || "";
        }

        // Change UI to Edit Mode
        document.getElementById("regFormTitle").innerText = "Edit Profile";
        document.getElementById("regFormDesc").innerText = "Update your information below.";
        document.getElementById("regForm").dataset.mode = "update";
        document.getElementById("regSubmitBtn").innerText = "Save Changes";
        document.getElementById("regCancelBtn").style.display = "block";
    });

    // 2. Cancel Profile Edit
    document.getElementById("regCancelBtn").addEventListener("click", () => {
        document.getElementById("registrationScreen").style.display = "none";
        document.getElementById("dashboardScreen").style.display = "block";
        resetRegFormUI();
    });

    // 3. Submit Profile Form
    document.getElementById("regForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const action = this.dataset.mode === "update" ? "updateUser" : "registerUser";
        
        const formData = {
            action: action,
            userId: currentUserProfile.userId,
            dispName: currentUserProfile.displayName,
            fullName: document.getElementById("regFullName").value,
            email: document.getElementById("regEmail").value,
            employeeId: document.getElementById("regEmployeeId").value,
            position: document.getElementById("regPosition").value,
            assignedPost: document.getElementById("regAssignedPost").value,
            division: document.getElementById("regDivision").value,
            department: document.getElementById("regDepartment").value,
            supervisor: document.getElementById("regSupervisor").value,
            workPhone: document.getElementById("regWorkPhone").value,
            dateOfHire: document.getElementById("regDateOfHire").value,
            aliases: document.getElementById("regAliases").value
        };

        const res = await apiCall(formData);
        alert(res.message);
        if (res.status === "success") {
            resetRegFormUI();
            await loadUserData(currentUserProfile.userId); 
        }
    });
    
    // --- RELATIVE EVENTS ---
    
    // 1. Submit Relative Form (Add or Update)
    document.getElementById("addRelativeForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const action = this.dataset.mode === "update" ? "updateRelative" : "addRelative";
        
        const formData = {
            action: action,
            userId: currentUserProfile.userId,
            relId: currentEditingRelId,
            relFullName: document.getElementById("relFullName").value,
            relRelation: document.getElementById("relRelation").value,
            relOccupation: document.getElementById("relOccupation").value,
            relWorkplace: document.getElementById("relWorkplace").value,
            relAliases: document.getElementById("relAliases").value
        };

        const res = await apiCall(formData);
        if (res.status === "success") {
            resetRelFormUI();
            await loadUserData(currentUserProfile.userId);
        }
    });

    // 2. Cancel Relative Edit
    document.getElementById("relCancelBtn").addEventListener("click", resetRelFormUI);

});

// Centralized GAS Fetcher
async function apiCall(payload) {
    const res = await fetch(config.GAS_URL, { method: "POST", body: JSON.stringify(payload) });
    return await res.json();
}

async function loadUserData(userId) {
    document.getElementById("loadingScreen").style.display = "block";
    const dbData = await apiCall({ action: 'getUserData', userId: userId });
    document.getElementById("loadingScreen").style.display = "none";

    globalUserData = dbData.user; // Save globally for form population

    if (!dbData.user.registered) {
        document.getElementById("registrationScreen").style.display = "block";
        document.getElementById("dashboardScreen").style.display = "none";
    } else {
        document.getElementById("welcomeText").innerText = `Welcome, ${dbData.user.fullName}!`;
        document.getElementById("registrationScreen").style.display = "none";
        document.getElementById("dashboardScreen").style.display = "block";
        renderRelatives(dbData.relatives);
    }
}

function renderRelatives(relatives) {
    const container = document.getElementById("relativesList");
    container.innerHTML = ""; 
    
    if (relatives.length === 0) {
        container.innerHTML = "<p>No relatives added yet.</p>";
        return;
    }

    relatives.forEach(rel => {
        const div = document.createElement('div');
        div.className = 'relative-card';
        div.innerHTML = `
            <div class="rel-info">
                <strong>${rel.fullName}</strong> (${rel.relation})<br>
                ${rel.occupation} at ${rel.workplace} <br>
                <em>Aliases: ${rel.aliases}</em>
            </div>
            <div class="rel-actions">
                <button class="edit-btn" data-id="${rel.id}">✏️</button>
                <button class="delete-btn" data-id="${rel.id}">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Attach Edit Events
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const relId = e.target.getAttribute('data-id');
            const rel = relatives.find(r => r.id.toString() === relId);
            
            if (rel) {
                // Populate Form
                document.getElementById("relFullName").value = rel.fullName;
                document.getElementById("relRelation").value = rel.relation;
                document.getElementById("relOccupation").value = rel.occupation;
                document.getElementById("relWorkplace").value = rel.workplace;
                document.getElementById("relAliases").value = rel.aliases;
                
                // Switch UI to Edit Mode
                currentEditingRelId = relId;
                document.getElementById("relFormTitle").innerText = "Edit Relative";
                document.getElementById("addRelativeForm").dataset.mode = "update";
                document.getElementById("relSubmitBtn").innerText = "Update Relative";
                document.getElementById("relCancelBtn").style.display = "inline-block";
                
                // Scroll up to form
                document.getElementById("addRelativeForm").scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Attach delete events
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Delete this relative?")) {
                const relId = e.target.getAttribute('data-id');
                const res = await apiCall({ action: 'deleteRelative', relId: relId });
                if(res.status === 'success') loadUserData(currentUserProfile.userId); // Reload list
            }
        });
    });
}

// UI Reset Helpers
function resetRegFormUI() {
    document.getElementById("regForm").reset();
    document.getElementById("regFormTitle").innerText = "Register";
    document.getElementById("regFormDesc").innerText = "Please complete your profile to continue.";
    document.getElementById("regForm").dataset.mode = "register";
    document.getElementById("regSubmitBtn").innerText = "Complete Registration";
    document.getElementById("regCancelBtn").style.display = "none";
}

function resetRelFormUI() {
    document.getElementById("addRelativeForm").reset();
    currentEditingRelId = null;
    document.getElementById("relFormTitle").innerText = "Add Relative";
    document.getElementById("addRelativeForm").dataset.mode = "add";
    document.getElementById("relSubmitBtn").innerText = "Add Relative";
    document.getElementById("relCancelBtn").style.display = "none";
}