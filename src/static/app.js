document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
// …existing code…

  function renderActivities(list) {
      const container = document.getElementById("activities");
      container.innerHTML = "";               // clear any previous cards
      list.forEach(activity => {
          const card = document.createElement("div");
          card.className = "card";

          card.innerHTML = `
              <h3>${activity.name}</h3>
              <p>${activity.description}</p>
              <button onclick="showSignupForm('${activity.name}')">Sign up</button>
          `;

          // participants bullet‑list with remove icons
          if (activity.participants && activity.participants.length) {
              const ul = document.createElement("ul");
              activity.participants.forEach(email => {
                  const li = document.createElement("li");
                  li.innerHTML = `${email} <span class=\"remove\" data-email=\"${email}\">&times;</span>`;
                  ul.appendChild(li);
              });
              const partSection = document.createElement("div");
              partSection.className = "participants";
              partSection.innerHTML = `<strong>Participants:</strong>`;
              partSection.appendChild(ul);
              card.appendChild(partSection);
          }

          container.appendChild(card);
      });
  }

// …existing code…

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // show any signed‑up students as a tidy bullet list (with remove icon)
        if (details.participants && details.participants.length > 0) {
          const partsHtml = details.participants
            .map(p => `<li>${p} <span class="remove" data-email="${p}">&times;</span></li>`)
            .join("");

          activityCard.innerHTML += `
            <div class="participants">
              <p><strong>Participants:</strong></p>
              <ul>${partsHtml}</ul>
            </div>
          `;
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // allow clicking the remove icon to unregister participants
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("remove")) {
      const email = event.target.dataset.email;
      const card = event.target.closest(".activity-card");
      const activity = card.querySelector("h4").textContent;
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await response.json();
        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          fetchActivities();
        } else {
          messageDiv.textContent = result.detail || "Unable to unregister";
          messageDiv.className = "error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } catch (err) {
        console.error("Error removing participant:", err);
      }
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh cards so new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
