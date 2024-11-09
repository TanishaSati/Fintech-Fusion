// Show the modal
function showMore() {
    document.getElementById("modal").style.display = "flex"; // Display modal
  }
  
  // Close the modal
  function closeModal() {
    document.getElementById("modal").style.display = "none"; // Hide modal
  }
  
  // Event listener to close modal when clicking outside the modal content
  window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
      closeModal(); // Close modal if the click is outside the modal content
    }
  }
  // Redirect to Crypto Assets Exchange page
function redirectToExchange() {
  window.location.href = 'crypto-assets-exchange.html';
}

// Redirect to DeFi Investment page
function redirectToDeFiInvest() {
  window.location.href = 'defi-investment.html';
}

// Redirect to SME Funding page
function redirectToSMEFunding() {
  window.location.href = 'sme-funding.html';
}
function openTab(tabName) {
  // Hide all tab content
  let tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(function(content) {
    content.style.display = 'none';
  });

  // Show the selected tab content
  document.getElementById(tabName).style.display = 'block';
}

// Default open tab (when the page loads)
document.getElementById('exchange').style.display = 'block';

setTimeout(() => {
  fetch('http://139.84.164.132:5000/api/chat', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userInput })
  })
  .then(response => response.json())
  .then(data => {
      const botMessage = document.createElement('p');
      botMessage.textContent = "Support: " + data.reply; // Adjust according to your API response
      chatContainer.appendChild(botMessage);
      chatContainer.scrollTop = chatContainer.scrollHeight;
  })
  .catch(error => console.error('Error:', error));
}, 1000);

