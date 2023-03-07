class Announcements {
  constructor(key) {
    const savedKey = localStorage.getItem('key');
    const address = savedKey ? savedKey : key;

    const sheetDB = require('sheetdb-node');
    this.client = sheetDB({ address: address });

    this.announcementRegex = /^\w{3},\s\w{3}\s\d{1,2}$/;
    this.weeklyRegex = /^Weekly\s(on\s)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/;
  }

  update() {
    let data;

    this.client.read().then((sheet) => {
      data = JSON.parse(sheet);
      this.#processData(data);
    });
  }

  #processData(data) {
    const validAnnouncementsStart = [];
    const validAnnouncementsEnd = [];
    const validAnnouncements = [];

    let response;
    for (let i = 0; i < data.length; i++) {
      response = data[i];
      if (this.announcementRegex.test(response['Start Date (First day for announcement)'])) {
        const date = new Date(response['Start Date (First day for announcement)']);

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
      } else if (this.weeklyRegex.test(response['Start Date (First day for announcement)']) && response['Start Date' +
      ' (First day for announcement)'].includes(new Date().toLocaleString('en-us', { weekday: 'long' }))) {

        validAnnouncements.push(response['Announcement (As you wish to have it read by members of Student' +
        ' Council)']);
      } else {
        continue;
      }

      if (this.announcementRegex.test(response['End Date (Final day for announcement)'])) {
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

    this.#updateHTML();

    localStorage.setItem('announcements', JSON.stringify(validAnnouncements));
    localStorage.setItem('lastUpdated', Date.now().toString());
  }

  checkCache() {
    if (Date.now() - localStorage.getItem('lastUpdated') < 1000 * 60 * 60 * 24) {
      this.#updateHTML();
    } else {
      this.update();
    }
  }

  #updateHTML() {
    document.getElementById('announcement-wrapper').innerHTML = '';

    const announcements = JSON.parse(localStorage.getItem('announcements'));
    for (let announcement of announcements) {
      const announcementDiv = document.createElement('div');
      announcementDiv.classList.add('announcement');
      announcementDiv.innerHTML = announcement;
      document.getElementById('announcement-wrapper').appendChild(announcementDiv);
    }
  }
}