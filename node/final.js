const savedKey = localStorage.getItem('key');

const key = savedKey ? savedKey : prompt('Enter the super secret password:');

const sheetDB = require('sheetdb-node');
const client = sheetDB({ address: key });

function update() {
  let data;

  let announcementRegex = /^\w{3},\s\w{3}\s\d{1,2}$/;
  // format: "Weekly on Monday, Tuesday, Wednesday, Thursday, Friday"
  let weeklyRegex = /^Weekly\s(on\s)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/;

  let validAnnouncementsStart = [];
  let validAnnouncementsEnd = [];
  let validAnnouncements = [];

  client.read().then((sheet) => {
    data = JSON.parse(sheet);
    processData(data);
  });

  function processData(data) {
    let response;
    for (let i = 0; i < data.length; i++) {
      response = data[i];
      if (announcementRegex.test(response['Start Date (First day for announcement)'])) {
        let date = new Date(response['Start Date (First day for announcement)']);

        if (date.getMonth() >= 6) {
          date.setFullYear(new Date().getFullYear() - 1);
        } else {
          date.setFullYear(new Date().getFullYear());
        }

        validAnnouncementsStart.push({
          i,
          date,
          announcement: response['Announcement (As you wish to have it read by members of Student Council)'],
        });
      } else if (weeklyRegex.test(response['Start Date (First day for announcement)']) && response['Start Date (First day for announcement)'].includes(new Date().toLocaleString('en-us', { weekday: 'long' }))) {

        validAnnouncements.push(response['Announcement (As you wish to have it read by members of Student Council)']);
      } else {
        continue;
      }

      if (announcementRegex.test(response['End Date (Final day for announcement)'])) {
        const date = new Date(response['End Date (Final day for announcement)']);

        if (date.getMonth() >= 6) {
          date.setFullYear(new Date().getFullYear() - 1);
        } else {
          date.setFullYear(new Date().getFullYear());
        }

        validAnnouncementsEnd.push({ i, date });
      } else if (validAnnouncementsStart.find(begin => begin.i === i)) {
        validAnnouncementsEnd.push({ i, date: validAnnouncementsStart.find(begin => begin.i === i).date });
      }
    }

    validAnnouncementsStart.forEach(begin => {
      const end = validAnnouncementsEnd.find(obj => obj.i === begin.i);
      if (end) {
        //   check if the current date is between the start and end dates
        if (begin.date <= new Date() && end.date >= new Date().setDate(new Date().getDate() - 1)) {
          validAnnouncements.push(begin.announcement);
        }
      }
    });

    document.getElementById('announcement-wrapper').innerHTML = ''; // remove everything before adding new announcements

    for (let announcement of validAnnouncements) {
      const announcementDiv = document.createElement('div');
      announcementDiv.classList.add('announcement');
      announcementDiv.innerHTML = announcement;
      document.getElementById('announcement-wrapper').appendChild(announcementDiv);
    }

    localStorage.setItem('announcements', JSON.stringify(validAnnouncements));
    localStorage.setItem('lastUpdated', Date.now().toString());
  }
}

//  if updated less than 24 hours ago, use the cached announcements
if (Date.now() - localStorage.getItem('lastUpdated') < 1000 * 60 * 60 * 24) {
  document.getElementById('announcement-wrapper').innerHTML = ''; // remove everything before adding new announcements
  const announcements = JSON.parse(localStorage.getItem('announcements'));
  for (let announcement of announcements) {
    const announcementDiv = document.createElement('div');
    announcementDiv.classList.add('announcement');
    announcementDiv.innerHTML = announcement;
    document.getElementById('announcement-wrapper').appendChild(announcementDiv);
  }
} else {
  update();
}

setInterval(() => {
  if (Date.now() - localStorage.getItem('lastUpdated') > 1000 * 60 * 60 * 24) {
    update();
    console.log('Updated announcements');
  } else {
    console.log('Announcements are up-to-date');
  }
}, 5 * 60 * 1000); // check for updates every 5 minutes
localStorage.setItem('key', key);


// password reset button handler
document.getElementById('password-reset').addEventListener('click', () => {
  localStorage.removeItem('key');
  location.reload();
});

document.getElementById('force-update').addEventListener('click', () => {
  if (confirm('Are you sure you want to force an update?')) {
    update();
    alert('Updated announcements!');
  } else {
    alert('Update cancelled.');
  }
});
