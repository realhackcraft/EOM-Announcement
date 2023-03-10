const announcements = new Announcements(prompt('Enter the key:'));

announcements.checkCache();

setInterval(() => {
  announcements.checkCache();
}, 5 * 60 * 1000);