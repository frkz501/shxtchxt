document.addEventListener("DOMContentLoaded", function () {
    // Initialize your LIFF ID from your config
    liff.init({ liffId: "2010715696-y1Wcpltm" }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            document.getElementById("loadingScreen").style.display = "none";
        }
    }).catch((err) => {
        document.getElementById("statusText").innerText = "LIFF Initialization Failed.";
        console.error(err);
        return false;
    });

    // check if user is registered
    liff.getProfile().then(profile => {
        getUser(profile.userId).then(gotUser => {
            if (!gotUser.registered) {
                document.getElementById("registrationScreen").style.display = "block";
            } else {
                document.getElementById("dashboardScreen").style.display = "block";
            }
        })
    });

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
            fetch("https://script.google.com/macros/s/AKfycby9VEvS-xMwieDqf57Udh1IJmLpoXdE2oNoowCdF1048Fi3qZnHx4f8z1TGPeW5Ps3kVg/exec", {
                method: "POST",
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message)
                if (data.status === "success") {
                    document.getElementById("registrationScreen").style.display = "none";
                    document.getElementById("welcomText").innerText = `Welcome, ${profile.displayName}!`
                    document.getElementById("dashboardScreen").style.display = "block";
                }
            })
            .then(result => {
                alert("Registration successful!");
                liff.closeWindow();
            })
            .catch(err => console.error("Error submitting form", err));
        });
    });
});

async function getUser(userId) {
    fetch("https://script.google.com/macros/s/AKfycby9VEvS-xMwieDqf57Udh1IJmLpoXdE2oNoowCdF1048Fi3qZnHx4f8z1TGPeW5Ps3kVg/exec", {
        method: "POST",
        body: JSON.stringify({
            userId: userId
        })
    })
}