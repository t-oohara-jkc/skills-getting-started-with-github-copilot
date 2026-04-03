document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    // Function to fetch activities from API
    async function fetchActivities() {
      try {
        const response = await fetch("/activities");
        const activities = await response.json();
        activitiesList.innerHTML = "";
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

        Object.entries(activities).forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";
          const spotsLeft = details.max_participants - details.participants.length;

          let participantsHTML = "<ul class='participants-list'>";
          if (details.participants.length === 0) {
            participantsHTML += "<li class='no-participants'>No participants yet</li>";
          } else {
            details.participants.forEach(email => {
              participantsHTML += `<li class="participant-item" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}">
                <span class="participant-email">${email}</span>
                <span class="delete-participant" title="Unregister">&#128465;</span>
              </li>`;
            });
          }
          participantsHTML += "</ul>";

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-section">
              <strong>Participants:</strong>
              ${participantsHTML}
            </div>
          `;

          activitiesList.appendChild(activityCard);

          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);

          const deleteIcons = activityCard.querySelectorAll('.delete-participant');
          deleteIcons.forEach(icon => {
            icon.addEventListener('click', async (e) => {
              const li = e.target.closest('.participant-item');
              const activity = decodeURIComponent(li.getAttribute('data-activity'));
              const email = decodeURIComponent(li.getAttribute('data-email'));

              if (!confirm(`Unregister ${email} from ${activity}?`)) return;

              try {
                const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });
                if (response.ok) {
                  fetchActivities();
                } else {
                  alert('Failed to unregister participant.');
                }
              } catch (err) {
                alert('Failed to unregister participant.');
              }
            });
          });
        });
      } catch (err) {
        console.error("Error fetching activities:", err);
      }
    }

    fetchActivities();
  }

  fetchActivities();

  // サインアップフォームのsubmitイベント
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const activity = activitySelect.value;
    messageDiv.classList.add('hidden');
    messageDiv.textContent = '';
    if (!email || !activity) {
      messageDiv.textContent = 'メールとアクティビティを入力してください。';
      messageDiv.classList.remove('hidden');
      return;
    }
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      if (response.ok) {
        messageDiv.textContent = 'サインアップが完了しました。';
        messageDiv.classList.remove('hidden');
        signupForm.reset();
        fetchActivities();
      } else {
        const data = await response.json().catch(() => ({}));
        messageDiv.textContent = data.detail || data.message || 'サインアップに失敗しました。';
        messageDiv.classList.remove('hidden');
      }
    } catch (err) {
      messageDiv.textContent = 'サインアップに失敗しました。';
      messageDiv.classList.remove('hidden');
    }
  });
});
