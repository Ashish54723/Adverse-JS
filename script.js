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

// Function to translate text using LibreTranslate API
async function translateText(text, targetLang) {
  // Skip translation if the target language is English
  if (targetLang === "en-US" || targetLang === "en-GB") {
    return text;
  }
  
  // Use simplified language code (e.g., 'en-US' -> 'en')
  const simpleLangCode = targetLang.split('-')[0];
  
  // Check cache first
  const cachedTranslation = translationCache.get(simpleLangCode, text);
  if (cachedTranslation) {
    return cachedTranslation;
  }
  
  try {
    // Using LibreTranslate API - this is a free and open-source translation API
    // You may need to use a different endpoint depending on availability
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: simpleLangCode,
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && data.translatedText) {
      // Store in cache for future use
      translationCache.set(simpleLangCode, text, data.translatedText);
      return data.translatedText;
    } else {
      console.error('Translation response format error:', data);
      return text; // Fall back to original text
    }
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback to Google Translate URL
    // This doesn't actually translate but will redirect the user to Google Translate
    alert(`Translation service unavailable. Using original text for search.`);
    return text;
  }
}

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

  try {
    // Show loading indicator
    document.body.style.cursor = 'wait';
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loading-message';
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.padding = '20px';
    loadingMessage.style.background = 'var(--box-bg)';
    loadingMessage.style.borderRadius = '10px';
    loadingMessage.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    loadingMessage.style.zIndex = '9999';
    loadingMessage.textContent = 'Processing...';
    document.body.appendChild(loadingMessage);

    // Split names into lines
    const nameLines = cleanedNames.split(/\n+/);
    
    // Get the search strings for the selected set
    let searchStrings = [...searchStringSets[set]];
    
    // Translate names and search strings if not English
    if (langCode !== "en-US" && langCode !== "en-GB") {
      // Translate search strings
      const translatedStrings = await Promise.all(
        searchStrings.map(async (s) => {
          if (!s.trim()) return s; // Skip empty strings
          return await translateText(s, langCode);
        })
      );
      searchStrings = translatedStrings;
    }
    
    // Process the search based on the action type requested
    const result = await processSearch(nameLines, searchStrings, set, langCode, actionType);
    
    // Remove loading indicator
    document.body.removeChild(loadingMessage);
    document.body.style.cursor = 'default';
    
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
  } catch (error) {
    console.error('Error in handleAction:', error);
    alert(`An error occurred: ${error.message}`);
    // Remove loading indicator in case of error
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      document.body.removeChild(loadingMessage);
    }
    document.body.style.cursor = 'default';
  }
}

// Process the search based on names, search strings and action type
async function processSearch(nameLines, searchStrings, set, langCode, actionType) {
  if (actionType === "csv") {
    let csv = "Name,Search String,URL\n";
    nameLines.forEach(name => {
      searchStrings.forEach(s => {
        if (s.trim()) { // Skip empty search strings
          const query = `${name} ${s}`;
          const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=${langCode}`;
          csv += `"${name.replace(/"/g, '""')}","${s.replace(/"/g, '""')}","${url}"\n`;
        }
      });
    });
    return csv;
  } else {
    let urls = [];
    nameLines.forEach(name => {
      searchStrings.forEach(s => {
        if (s.trim()) { // Skip empty search strings
          const query = `${name} ${s}`;
          urls.push(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=${langCode}`);
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
