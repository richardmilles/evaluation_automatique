// register.js
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
  
    const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
        role,  // Assure-toi que le backend accepte ce champ
      }),
    });
  
    if (response.ok) {
      alert('Inscription réussie ! Redirection vers la page de connexion...');
      window.location.href = '/login/';
    } else {
      const error = await response.json();
      alert("Erreur : " + (error.detail || "Impossible de s'inscrire"));
    }
  });
  