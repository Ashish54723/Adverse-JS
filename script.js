// Search string sets for different categories
const searchStringSets = {
  1: [
    'AND ~arrest OR ~lawsuit OR ~terrorist OR ~money +launder OR BSA OR AML OR OFAC OR ~criminal OR ~violation OR ~conviction OR ~smuggling OR ~trafficking OR ~drugs OR ~corruption OR ~scheme OR ~consul OR ~bankruptcy OR ~fraud',
    'AND ~ponzi OR ~bitcoin+scam OR ~Reddit OR ~Crypto OR ~Tor OR ~Darknet OR ~Exploitation OR ~Gambling OR ~gun OR ~weapon OR ~Murder OR ~embezzling OR ~Counterfeit',
    'AND ~distributor OR ~token OR ~broker OR ~reseller OR ~payout OR ~prizes OR ~sign+up+bonus OR ~money OR ~rewards',
    ''
  ],
  2: [
    '"lawsuit" OR "fined" OR "arrested"',
    '"criminal charges" OR "investigation" OR "indicted"',
    '"regulatory violation" OR "legal dispute" OR "court case"'
  ],
  3: [
    '"scandal" OR "controversy" OR "misconduct"',
    '"sanctions" OR "blacklist" OR "watchlist"',
    '"tax evasion" OR "shell company" OR "offshore account"'
  ]
};

// Language options
const languages = {
  "en-US": "English (US)", "en-GB": "English (UK)", "hi": "Hindi", "es": "Spanish", "fr": "French", "de": "German", "zh": "Chinese",
  "ja": "Japanese", "ru": "Russian", "pt": "Portuguese", "ar": "Arabic", "bn": "Bengali", "it": "Italian",
  "ko": "Korean", "tr": "Turkish", "vi": "Vietnamese", "pl": "Polish", "nl": "Dutch", "ta": "Tamil",
  "te": "Telugu", "ms": "Malay", "th": "Thai", "gu": "Gujarati", "ur": "Urdu", "pa": "Punjabi", "fa": "Persian",
  "ro": "Romanian", "uk": "Ukrainian", "sv": "Swedish", "cs": "Czech", "fi": "Finnish", "el": "Greek",
  "sr": "Serbian", "hu": "Hungarian", "no": "Norwegian", "da": "Danish", "he": "Hebrew", "ml": "Malayalam",
  "id": "Indonesian", "mr": "Marathi", "am": "Amharic", "ne": "Nepali", "az": "Azerbaijani", "bg": "Bulgarian",
  "sk": "Slovak", "kk": "Kazakh", "my": "Burmese", "sw": "Swahili", "km": "Khmer", "lo": "Lao"
};

// Initialize the application when the window loads
window.onload = () => {
  const datalist = document.getElementById("languages");
  Object.entries(languages).forEach(([code, name]) => {
    const opt = document.createElement("option");
    opt.value = name;
    datalist.appendChild(opt);
  });

  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Set up theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });
};

// Translation cache manager
const translationCache = {
  get: (langCode, text) => {
    const cacheKey = `${langCode}:${text}`;
    return localStorage.getItem(cacheKey);
  },
  set: (langCode, text, translation) => {
    const cacheKey = `${langCode}:${text}`;
    localStorage.setItem(cacheKey, translation);
  }
};

// Main function to handle different actions (search, copy, csv)
async function handleAction(set, actionType) {
  const names = document.getElementById("nameInput").value.trim();
  if (!names) {
    alert("Please enter at least one name or entity");
    return;
  }

  const cleanedNames = names.replace(/[\[\](){}<>]/g, "").trim();
  const stringList = document.querySelectorAll('.string-list');
  stringList.forEach((item) => {
    item.innerHTML = item.innerHTML.replace(/[\[\](){}]/g, "").trim();
  });

  const langName = document.getElementById("languageSelect").value.trim();
  let langCode = Object.entries(languages).find(([code, name]) => name.toLowerCase() === langName.toLowerCase())?.[0] || "en-US";

  // Get the search strings for the selected set
  let searchStrings = searchStringSets[set];

  // For non-English languages, we'd typically translate, but in this browser version
  // we'll skip actual translation since we don't have access to Google's LanguageApp
  // In a real implementation, you'd use a translation API service here
  
  // Process the names and search strings to generate URLs or CSV
  const result = await processSearch(cleanedNames, searchStrings, set, langCode, actionType);
  
  // Handle the result based on action type
  if (actionType === "search") {
    result.forEach(url => window.open(url, "_blank"));
  } else if (actionType === "copy") {
    navigator.clipboard.writeText(result.join("\n")).then(() => {
      alert("URLs copied to clipboard!");
    }).catch(err => {
      console.error('Could not copy text: ', err);
      alert("Failed to copy to clipboard. Please check console for details.");
    });
  } else if (actionType === "csv") {
    downloadCSV(result, `adverse_media_set_${set}.csv`);
  }
}

// Process the search based on names, search strings and action type
async function processSearch(names, searchStrings, set, langCode, actionType) {
  const lines = names.trim().split(/\n+/);
  
  if (actionType === "csv") {
    let csv = "Name,Search String,URL\n";
    lines.forEach(name => {
      searchStrings.forEach(s => {
        if (s.trim()) { // Skip empty search strings
          const query = `${name} ${s}`;
          const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          csv += `"${name.replace(/"/g, '""')}","${s.replace(/"/g, '""')}","${url}"\n`;
        }
      });
    });
    return csv;
  } else {
    let urls = [];
    lines.forEach(name => {
      searchStrings.forEach(s => {
        if (s.trim()) { // Skip empty search strings
          const query = `${name} ${s}`;
          urls.push(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
        }
      });
    });
    return urls;
  }
}

// Helper function to download CSV data
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
