const fs = require('fs');

const path = 'components/settingpage.tsx';
let data = fs.readFileSync(path, 'utf8');

// Update useState initialization to rely on localStorage
data = data.replace(
  "const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true)",
  "const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true)"
);

if (!data.includes("localStorage.getItem('appNotifications')")) {
  data = data.replace(
    "const savedLang = localStorage.getItem('appLanguage') as LanguageCode",
    `const savedNotifications = localStorage.getItem('appNotifications');
    if (savedNotifications !== null) {
      setIsNotificationsEnabled(savedNotifications === 'true');
    }
    const savedLang = localStorage.getItem('appLanguage') as LanguageCode`
  );
}

if (!data.includes("localStorage.setItem('appNotifications'")) {
  data = data.replace(
    "const toggleSwitch = () => {\n    setIsNotificationsEnabled((prev) => !prev)\n  }",
    `const toggleSwitch = () => {
    setIsNotificationsEnabled((prev) => {
      const newVal = !prev;
      localStorage.setItem('appNotifications', String(newVal));
      return newVal;
    });
  }`
  );
}

fs.writeFileSync(path, data);
