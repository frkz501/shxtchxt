document.addEventListener("DOMContentLoaded", function () {
    // Initialize your LIFF ID from your config
    liff.init({ liffId: "2010715696-y1Wcpltm" }).then(() => {
        if (!liff.isLoggedIn()) {
        liff.login();
        } else {
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("registrationScreen").style.display = "block";
        }
    }).catch((err) => {
        document.getElementById("statusText").innerText = "LIFF Initialization Failed.";
        console.error(err);
    });

    // Handle form submission to send data back to your GAS Web App endpoint
    document.getElementById("regForm").addEventListener("submit", function (e) {
        e.preventDefault();
        liff.getProfile().then(profile => {
        const formData = {
            userId: profile.userId,
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
        .then(res => res.text())
        .then(result => {
            alert("Registration successful!");
            liff.closeWindow();
        })
        .catch(err => console.error("Error submitting form", err));
        });
    });
});