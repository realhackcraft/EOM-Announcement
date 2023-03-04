for (let announcement of announcements) {
  const announcementDiv = document.createElement('div');
  announcementDiv.classList.add('announcement');
  announcementDiv.innerHTML = announcement
  document.getElementById('announcement-wrapper').appendChild(announcementDiv);
}