// script.js
document.getElementById('submissionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentAnswer = document.getElementById('studentAnswer').value;
  
    const response = await fetch('http://127.0.0.1:8000/api/evaluation/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enonce: "Énoncé du devoir (à adapter dynamiquement)",
        reponse: studentAnswer
      })
    });
  
    if (!response.ok) {
      alert("Erreur lors de la soumission.");
      return;
    }
  
    const data = await response.json();
    localStorage.setItem('note', data.note);
    localStorage.setItem('feedback', data.feedback);
    window.location.href = "result.html";
  });

document.addEventListener('DOMContentLoaded', function () {
    console.log("JavaScript chargé !");
  });
  