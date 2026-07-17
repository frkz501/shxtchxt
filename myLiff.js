import { config } from './ccc.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Initialize your LIFF ID from your config
    try {
        await liff.init({
            liffId: config.LIFF_ID
        });

        console.log("LIFF initialized");

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        document.getElementById("loadingScreen").style.display = "none";

        // check if user is registered
        const profile = await liff.getProfile();
        const gotUser = await getUser(profile.userId);
    
        // show registration if not registered, else dashboard
        if (!gotUser.registered) {
            document.getElementById("registrationScreen").style.display = "block";
        } else {
            document.getElementById("dashboardScreen").style.display = "block";
        }

    } catch (err) {
        document.getElementById("statusText").innerText = "LIFF Initialization Failed.";
        console.error(err);
    }

    // Handle form submission to send data back to your GAS Web App endpoint
    document.getElementById("regForm").addEventListener("submit", function (e) {
        e.preventDefault();
        liff.getProfile().then(profile => {
            const formData = {
                userId: profile.userId,
                dispName: profile.displayName,
                fullName: document.getElementById("regFullName").value,
                email: document.getElementById("regEmail").value,
                employeeId: document.getElementById("regEmployeeId").value,
                position: document.getElementById("regPosition").value,
                assignedPost: document.getElementById("regAssignedPost").value,
                division: document.getElementById("regDivision").value,
                supervisor: document.getElementById("regSupervisor").value,
                workPhone: document.getElementById("regWorkPhone").value,
                dateOfHire: document.getElementById("regDateOfHire").value
            };

            // Send this payload via fetch() to your Google Apps Script Web App URL (doPost)
            fetch(config.GAS_URL, {
                method: "POST",
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.status === "success") {
                    document.getElementById("registrationScreen").style.display = "none";
                    document.getElementById("welcomeText").innerText = `Welcome, ${profile.displayName}!`
                    document.getElementById("dashboardScreen").style.display = "block";
                }
            })
            .catch(err => console.error("Error submitting form", err));
        });
    });
});

async function getUser(userId) {
    const res = await fetch(config.GAS_URL, {
        method: "POST",
        body: JSON.stringify({
            userId
        })
    });

    return await res.json();
}