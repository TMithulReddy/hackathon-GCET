import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'bn' | 'gu' | 'mr' | 'or' | 'pa' | 'ur';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App
    'app.title': 'TideWise 2.0',
    'app.subtitle': 'Maritime Safety & Forecast Dashboard for Fishermen and Coastal Authorities',
    'app.footer': 'Built for coastal safety • Real-time monitoring • Voice-enabled alerts',
    
    // Navigation
    'nav.fisherman': 'Fisherman',
    'nav.authority': 'Authority',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    
    // Roles
    'role.select': 'Select Your Role',
    'role.fisherman': 'Fisherman',
    'role.authority': 'Authority',
    'role.fisherman.desc': 'Access real-time alerts, safe routes, and emergency SOS',
    'role.authority.desc': 'Monitor boats, manage alerts, and coordinate responses',
    
    // Features
    'feature.navigation': 'Real-time Navigation',
    'feature.navigation.desc': 'Live weather and tide updates',
    'feature.sos': 'Emergency SOS',
    'feature.sos.desc': 'Instant alert system',
    'feature.forecasts': 'Marine Forecasts',
    'feature.forecasts.desc': 'Accurate tide predictions',
    
    // Login
    'login.title': 'Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.role': 'Role',
    'login.submit': 'Login',
    'login.error': 'Invalid credentials. Please try again.',
    'login.loading': 'Logging in...',
    'login.demo': 'Demo Credentials',
    'login.fisherman': 'Fisherman: fisherman@tidewise.com / fisherman123',
    'login.authority': 'Authority: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'Access Dashboard',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    
    // Language
    'language.select': 'Select Language',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  hi: {
    // App
    'app.title': 'टाइडवाइज़ 2.0',
    'app.subtitle': 'मछुआरों और तटीय अधिकारियों के लिए समुद्री सुरक्षा और पूर्वानुमान डैशबोर्ड',
    'app.footer': 'तटीय सुरक्षा के लिए निर्मित • रियल-टाइम निगरानी • आवाज-सक्षम अलर्ट',
    
    // Navigation
    'nav.fisherman': 'मछुआरा',
    'nav.authority': 'अधिकारी',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.dashboard': 'डैशबोर्ड',
    
    // Roles
    'role.select': 'अपनी भूमिका चुनें',
    'role.fisherman': 'मछुआरा',
    'role.authority': 'अधिकारी',
    'role.fisherman.desc': 'रियल-टाइम अलर्ट, सुरक्षित मार्ग और आपातकालीन SOS तक पहुंचें',
    'role.authority.desc': 'नावों की निगरानी, अलर्ट प्रबंधन और प्रतिक्रिया समन्वय',
    
    // Features
    'feature.navigation': 'रियल-टाइम नेविगेशन',
    'feature.navigation.desc': 'लाइव मौसम और ज्वार अपडेट',
    'feature.sos': 'आपातकालीन SOS',
    'feature.sos.desc': 'तत्काल अलर्ट सिस्टम',
    'feature.forecasts': 'समुद्री पूर्वानुमान',
    'feature.forecasts.desc': 'सटीक ज्वार भविष्यवाणी',
    
    // Login
    'login.title': 'लॉगिन',
    'login.email': 'ईमेल',
    'login.password': 'पासवर्ड',
    'login.role': 'भूमिका',
    'login.submit': 'लॉगिन',
    'login.error': 'अमान्य क्रेडेंशियल। कृपया फिर से कोशिश करें।',
    'login.loading': 'लॉगिन हो रहा है...',
    'login.demo': 'डेमो क्रेडेंशियल',
    'login.fisherman': 'मछुआरा: fisherman@tidewise.com / fisherman123',
    'login.authority': 'अधिकारी: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'डैशबोर्ड तक पहुंचें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.close': 'बंद करें',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.previous': 'पिछला',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',
    'common.ok': 'ठीक है',
    
    // Language
    'language.select': 'भाषा चुनें',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  te: {
    // App
    'app.title': 'టైడ్‌వైజ్ 2.0',
    'app.subtitle': 'మత్స్యకారులు మరియు తీర ప్రాంత అధికారుల కోసం సముద్ర భద్రత & వేగం డ్యాష్‌బోర్డ్',
    'app.footer': 'తీర భద్రత కోసం నిర్మించబడింది • రియల్-టైమ్ మానిటరింగ్ • వాయిస్-ఎనేబుల్ అలర్ట్‌లు',
    
    // Navigation
    'nav.fisherman': 'మత్స్యకారుడు',
    'nav.authority': 'అధికారి',
    'nav.login': 'లాగిన్',
    'nav.logout': 'లాగ్‌అవుట్',
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    
    // Roles
    'role.select': 'మీ పాత్రను ఎంచుకోండి',
    'role.fisherman': 'మత్స్యకారుడు',
    'role.authority': 'అధికారి',
    'role.fisherman.desc': 'రియల్-టైమ్ అలర్ట్‌లు, సురక్షిత మార్గాలు మరియు అత్యవసర SOS ప్రాప్యత',
    'role.authority.desc': 'పడవలను పర్యవేక్షించండి, అలర్ట్‌లను నిర్వహించండి మరియు ప్రతిస్పందనలను సమన్వయం చేయండి',
    
    // Features
    'feature.navigation': 'రియల్-టైమ్ నావిగేషన్',
    'feature.navigation.desc': 'లైవ్ వాతావరణం మరియు టైడ్ అప్‌డేట్‌లు',
    'feature.sos': 'అత్యవసర SOS',
    'feature.sos.desc': 'తక్షణ అలర్ట్ సిస్టమ్',
    'feature.forecasts': 'సముద్ర పూర్వానుమానాలు',
    'feature.forecasts.desc': 'ఖచ్చితమైన టైడ్ అంచనాలు',
    
    // Login
    'login.title': 'లాగిన్',
    'login.email': 'ఇమెయిల్',
    'login.password': 'పాస్‌వర్డ్',
    'login.role': 'పాత్ర',
    'login.submit': 'లాగిన్',
    'login.error': 'చెల్లని క్రెడెన్షియల్స్. దయచేసి మళ్లీ ప్రయత్నించండి.',
    'login.loading': 'లాగిన్ అవుతోంది...',
    'login.demo': 'డెమో క్రెడెన్షియల్స్',
    'login.fisherman': 'మత్స్యకారుడు: fisherman@tidewise.com / fisherman123',
    'login.authority': 'అధికారి: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'డ్యాష్‌బోర్డ్‌కు ప్రాప్యత',
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'లోపం',
    'common.success': 'విజయం',
    'common.cancel': 'రద్దు చేయండి',
    'common.save': 'సేవ్ చేయండి',
    'common.delete': 'తొలగించండి',
    'common.edit': 'సవరించండి',
    'common.close': 'మూసివేయండి',
    'common.back': 'వెనుకకు',
    'common.next': 'తదుపరి',
    'common.previous': 'మునుపటి',
    'common.yes': 'అవును',
    'common.no': 'కాదు',
    'common.ok': 'సరే',
    
    // Language
    'language.select': 'భాషను ఎంచుకోండి',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  ta: {
    // App
    'app.title': 'டைட்வைஸ் 2.0',
    'app.subtitle': 'மீனவர்கள் மற்றும் கடலோர அதிகாரிகளுக்கான கடல் பாதுகாப்பு & முன்னறிவிப்பு டாஷ்போர்டு',
    'app.footer': 'கடலோர பாதுகாப்புக்காக கட்டப்பட்டது • நேரடி கண்காணிப்பு • குரல்-இயக்கப்பட்ட எச்சரிக்கைகள்',
    
    // Navigation
    'nav.fisherman': 'மீனவர்',
    'nav.authority': 'அதிகாரி',
    'nav.login': 'உள்நுழைவு',
    'nav.logout': 'வெளியேறு',
    'nav.dashboard': 'டாஷ்போர்டு',
    
    // Roles
    'role.select': 'உங்கள் பாத்திரத்தைத் தேர்ந்தெடுக்கவும்',
    'role.fisherman': 'மீனவர்',
    'role.authority': 'அதிகாரி',
    'role.fisherman.desc': 'நேரடி எச்சரிக்கைகள், பாதுகாப்பான பாதைகள் மற்றும் அவசர SOS அணுகல்',
    'role.authority.desc': 'படகுகளை கண்காணிக்கவும், எச்சரிக்கைகளை நிர்வகிக்கவும் மற்றும் பதில்களை ஒருங்கிணைக்கவும்',
    
    // Features
    'feature.navigation': 'நேரடி வழிசெலுத்தல்',
    'feature.navigation.desc': 'நேரடி வானிலை மற்றும் அலை புதுப்பிப்புகள்',
    'feature.sos': 'அவசர SOS',
    'feature.sos.desc': 'உடனடி எச்சரிக்கை அமைப்பு',
    'feature.forecasts': 'கடல் முன்னறிவிப்புகள்',
    'feature.forecasts.desc': 'துல்லியமான அலை கணிப்புகள்',
    
    // Login
    'login.title': 'உள்நுழைவு',
    'login.email': 'மின்னஞ்சல்',
    'login.password': 'கடவுச்சொல்',
    'login.role': 'பாத்திரம்',
    'login.submit': 'உள்நுழைவு',
    'login.error': 'தவறான அங்கீகாரங்கள். மீண்டும் முயற்சிக்கவும்.',
    'login.loading': 'உள்நுழைகிறது...',
    'login.demo': 'டெமோ அங்கீகாரங்கள்',
    'login.fisherman': 'மீனவர்: fisherman@tidewise.com / fisherman123',
    'login.authority': 'அதிகாரி: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'டாஷ்போர்டுக்கு அணுகல்',
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'பிழை',
    'common.success': 'வெற்றி',
    'common.cancel': 'ரத்து செய்',
    'common.save': 'சேமி',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.close': 'மூடு',
    'common.back': 'பின்',
    'common.next': 'அடுத்து',
    'common.previous': 'முந்தைய',
    'common.yes': 'ஆம்',
    'common.no': 'இல்லை',
    'common.ok': 'சரி',
    
    // Language
    'language.select': 'மொழியைத் தேர்ந்தெடுக்கவும்',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  bn: {
    // App
    'app.title': 'টাইডওয়াইজ 2.0',
    'app.subtitle': 'মৎস্যজীবী এবং উপকূলীয় কর্তৃপক্ষের জন্য সামুদ্রিক নিরাপত্তা ও পূর্বাভাস ড্যাশবোর্ড',
    'app.footer': 'উপকূলীয় নিরাপত্তার জন্য নির্মিত • রিয়েল-টাইম মনিটরিং • ভয়েস-সক্রিয় সতর্কতা',
    
    // Navigation
    'nav.fisherman': 'মৎস্যজীবী',
    'nav.authority': 'কর্তৃপক্ষ',
    'nav.login': 'লগইন',
    'nav.logout': 'লগআউট',
    'nav.dashboard': 'ড্যাশবোর্ড',
    
    // Roles
    'role.select': 'আপনার ভূমিকা নির্বাচন করুন',
    'role.fisherman': 'মৎস্যজীবী',
    'role.authority': 'কর্তৃপক্ষ',
    'role.fisherman.desc': 'রিয়েল-টাইম সতর্কতা, নিরাপদ রুট এবং জরুরি SOS অ্যাক্সেস',
    'role.authority.desc': 'নৌকা মনিটরিং, সতর্কতা ব্যবস্থাপনা এবং প্রতিক্রিয়া সমন্বয়',
    
    // Features
    'feature.navigation': 'রিয়েল-টাইম নেভিগেশন',
    'feature.navigation.desc': 'লাইভ আবহাওয়া এবং জোয়ার আপডেট',
    'feature.sos': 'জরুরি SOS',
    'feature.sos.desc': 'তাত্ক্ষণিক সতর্কতা সিস্টেম',
    'feature.forecasts': 'সামুদ্রিক পূর্বাভাস',
    'feature.forecasts.desc': 'সঠিক জোয়ার পূর্বাভাস',
    
    // Login
    'login.title': 'লগইন',
    'login.email': 'ইমেইল',
    'login.password': 'পাসওয়ার্ড',
    'login.role': 'ভূমিকা',
    'login.submit': 'লগইন',
    'login.error': 'অবৈধ শংসাপত্র। আবার চেষ্টা করুন।',
    'login.loading': 'লগইন হচ্ছে...',
    'login.demo': 'ডেমো শংসাপত্র',
    'login.fisherman': 'মৎস্যজীবী: fisherman@tidewise.com / fisherman123',
    'login.authority': 'কর্তৃপক্ষ: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'ড্যাশবোর্ড অ্যাক্সেস',
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'ত্রুটি',
    'common.success': 'সফলতা',
    'common.cancel': 'বাতিল',
    'common.save': 'সংরক্ষণ',
    'common.delete': 'মুছে ফেলুন',
    'common.edit': 'সম্পাদনা',
    'common.close': 'বন্ধ',
    'common.back': 'ফিরে যান',
    'common.next': 'পরবর্তী',
    'common.previous': 'পূর্ববর্তী',
    'common.yes': 'হ্যাঁ',
    'common.no': 'না',
    'common.ok': 'ঠিক আছে',
    
    // Language
    'language.select': 'ভাষা নির্বাচন করুন',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  gu: {
    // App
    'app.title': 'ટાઇડવાઇઝ 2.0',
    'app.subtitle': 'માછીમારો અને કિનારા સત્તાઓ માટે સમુદ્રી સુરક્ષા અને આગાહી ડેશબોર્ડ',
    'app.footer': 'કિનારા સુરક્ષા માટે બનાવેલ • રિયલ-ટાઇમ મોનિટરિંગ • વૉઇસ-સક્ષમ ચેતવણીઓ',
    
    // Navigation
    'nav.fisherman': 'માછીમાર',
    'nav.authority': 'સત્તા',
    'nav.login': 'લોગિન',
    'nav.logout': 'લોગઆઉટ',
    'nav.dashboard': 'ડેશબોર્ડ',
    
    // Roles
    'role.select': 'તમારી ભૂમિકા પસંદ કરો',
    'role.fisherman': 'માછીમાર',
    'role.authority': 'સત્તા',
    'role.fisherman.desc': 'રિયલ-ટાઇમ ચેતવણીઓ, સુરક્ષિત માર્ગો અને આપત્તિ SOS પ્રવેશ',
    'role.authority.desc': 'નૌકાઓનું મોનિટરિંગ, ચેતવણી વ્યવસ્થાપન અને પ્રતિભાવ સંકલન',
    
    // Features
    'feature.navigation': 'રિયલ-ટાઇમ નેવિગેશન',
    'feature.navigation.desc': 'લાઇવ હવામાન અને ભરતી અપડેટ્સ',
    'feature.sos': 'આપત્તિ SOS',
    'feature.sos.desc': 'તાત્કાલિક ચેતવણી સિસ્ટમ',
    'feature.forecasts': 'સમુદ્રી આગાહીઓ',
    'feature.forecasts.desc': 'ચોક્કસ ભરતી આગાહીઓ',
    
    // Login
    'login.title': 'લોગિન',
    'login.email': 'ઇમેઇલ',
    'login.password': 'પાસવર્ડ',
    'login.role': 'ભૂમિકા',
    'login.submit': 'લોગિન',
    'login.error': 'અમાન્ય પ્રમાણપત્રો. કૃપા કરીને ફરીથી પ્રયાસ કરો.',
    'login.loading': 'લોગિન થઈ રહ્યું છે...',
    'login.demo': 'ડેમો પ્રમાણપત્રો',
    'login.fisherman': 'માછીમાર: fisherman@tidewise.com / fisherman123',
    'login.authority': 'સત્તા: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'ડેશબોર્ડ પ્રવેશ',
    'common.loading': 'લોડ થઈ રહ્યું છે...',
    'common.error': 'ભૂલ',
    'common.success': 'સફળતા',
    'common.cancel': 'રદ કરો',
    'common.save': 'સેવ કરો',
    'common.delete': 'કાઢી નાખો',
    'common.edit': 'સંપાદન કરો',
    'common.close': 'બંધ કરો',
    'common.back': 'પાછળ',
    'common.next': 'આગળ',
    'common.previous': 'પહેલાનું',
    'common.yes': 'હા',
    'common.no': 'ના',
    'common.ok': 'બરાબર',
    
    // Language
    'language.select': 'ભાષા પસંદ કરો',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  mr: {
    // App
    'app.title': 'टाइडवाइज 2.0',
    'app.subtitle': 'मासेमारे आणि किनारपट्टी अधिकाऱ्यांसाठी समुद्री सुरक्षा आणि अंदाज डॅशबोर्ड',
    'app.footer': 'किनारपट्टी सुरक्षेसाठी बांधले • रिअल-टाइम मॉनिटरिंग • व्हॉइस-सक्षम सतर्कता',
    
    // Navigation
    'nav.fisherman': 'मासेमार',
    'nav.authority': 'अधिकारी',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.dashboard': 'डॅशबोर्ड',
    
    // Roles
    'role.select': 'तुमची भूमिका निवडा',
    'role.fisherman': 'मासेमार',
    'role.authority': 'अधिकारी',
    'role.fisherman.desc': 'रिअल-टाइम सतर्कता, सुरक्षित मार्ग आणि आपत्कालीन SOS प्रवेश',
    'role.authority.desc': 'बोटींचे मॉनिटरिंग, सतर्कता व्यवस्थापन आणि प्रतिक्रिया समन्वय',
    
    // Features
    'feature.navigation': 'रिअल-टाइम नेव्हिगेशन',
    'feature.navigation.desc': 'लाइव्ह हवामान आणि भरती अपडेट्स',
    'feature.sos': 'आपत्कालीन SOS',
    'feature.sos.desc': 'तत्काळ सतर्कता प्रणाली',
    'feature.forecasts': 'समुद्री अंदाज',
    'feature.forecasts.desc': 'अचूक भरती अंदाज',
    
    // Login
    'login.title': 'लॉगिन',
    'login.email': 'ईमेल',
    'login.password': 'पासवर्ड',
    'login.role': 'भूमिका',
    'login.submit': 'लॉगिन',
    'login.error': 'अवैध क्रेडेन्शियल्स. कृपया पुन्हा प्रयत्न करा.',
    'login.loading': 'लॉगिन होत आहे...',
    'login.demo': 'डेमो क्रेडेन्शियल्स',
    'login.fisherman': 'मासेमार: fisherman@tidewise.com / fisherman123',
    'login.authority': 'अधिकारी: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'डॅशबोर्ड प्रवेश',
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी',
    'common.success': 'यश',
    'common.cancel': 'रद्द करा',
    'common.save': 'जतन करा',
    'common.delete': 'हटवा',
    'common.edit': 'संपादन करा',
    'common.close': 'बंद करा',
    'common.back': 'मागे',
    'common.next': 'पुढे',
    'common.previous': 'मागील',
    'common.yes': 'होय',
    'common.no': 'नाही',
    'common.ok': 'ठीक आहे',
    
    // Language
    'language.select': 'भाषा निवडा',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  or: {
    // App
    'app.title': 'ଟାଇଡ୍ୱାଇଜ୍ 2.0',
    'app.subtitle': 'ମାଛୁଆମାନେ ଏବଂ ଉପକୂଳ ଅଧିକାରୀମାନଙ୍କ ପାଇଁ ସାମୁଦ୍ରିକ ସୁରକ୍ଷା ଏବଂ ପୂର୍ବାନୁମାନ ଡ୍ୟାସବୋର୍ଡ',
    'app.footer': 'ଉପକୂଳ ସୁରକ୍ଷା ପାଇଁ ନିର୍ମିତ • ରିଆଲ-ଟାଇମ୍ ମନିଟରିଂ • ଭଏସ୍-ସକ୍ଷମ ସତର୍କତା',
    
    // Navigation
    'nav.fisherman': 'ମାଛୁଆ',
    'nav.authority': 'ଅଧିକାରୀ',
    'nav.login': 'ଲଗଇନ୍',
    'nav.logout': 'ଲଗଆଉଟ୍',
    'nav.dashboard': 'ଡ୍ୟାସବୋର୍ଡ',
    
    // Roles
    'role.select': 'ତୁମର ଭୂମିକା ବାଛ',
    'role.fisherman': 'ମାଛୁଆ',
    'role.authority': 'ଅଧିକାରୀ',
    'role.fisherman.desc': 'ରିଆଲ-ଟାଇମ୍ ସତର୍କତା, ସୁରକ୍ଷିତ ରୁଟ୍ ଏବଂ ଜରୁରୀ SOS ପ୍ରବେଶ',
    'role.authority.desc': 'ନୌକା ମନିଟରିଂ, ସତର୍କତା ପରିଚାଳନା ଏବଂ ପ୍ରତିକ୍ରିୟା ସମନ୍ୱୟ',
    
    // Features
    'feature.navigation': 'ରିଆଲ-ଟାଇମ୍ ନେଭିଗେସନ୍',
    'feature.navigation.desc': 'ଲାଇଭ୍ ପାଣିପାଗ ଏବଂ ଜୁଆର ଅପଡେଟ୍',
    'feature.sos': 'ଜରୁରୀ SOS',
    'feature.sos.desc': 'ତତ୍କ୍ଷଣାତ୍ ସତର୍କତା ସିଷ୍ଟମ୍',
    'feature.forecasts': 'ସାମୁଦ୍ରିକ ପୂର୍ବାନୁମାନ',
    'feature.forecasts.desc': 'ସଠିକ୍ ଜୁଆର ପୂର୍ବାନୁମାନ',
    
    // Login
    'login.title': 'ଲଗଇନ୍',
    'login.email': 'ଇମେଲ୍',
    'login.password': 'ପାସୱାର୍ଡ',
    'login.role': 'ଭୂମିକା',
    'login.submit': 'ଲଗଇନ୍',
    'login.error': 'ଅବୈଧ କ୍ରେଡେନ୍ସିଆଲ୍। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।',
    'login.loading': 'ଲଗଇନ୍ ହେଉଛି...',
    'login.demo': 'ଡେମୋ କ୍ରେଡେନ୍ସିଆଲ୍',
    'login.fisherman': 'ମାଛୁଆ: fisherman@tidewise.com / fisherman123',
    'login.authority': 'ଅଧିକାରୀ: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'ଡ୍ୟାସବୋର୍ଡ ପ୍ରବେଶ',
    'common.loading': 'ଲୋଡ୍ ହେଉଛି...',
    'common.error': 'ତ୍ରୁଟି',
    'common.success': 'ସଫଳତା',
    'common.cancel': 'ବାତିଲ୍ କର',
    'common.save': 'ସେଭ୍ କର',
    'common.delete': 'ଡିଲିଟ୍ କର',
    'common.edit': 'ଏଡିଟ୍ କର',
    'common.close': 'ବନ୍ଦ କର',
    'common.back': 'ପଛକୁ',
    'common.next': 'ପରବର୍ତ୍ତୀ',
    'common.previous': 'ପୂର୍ବବର୍ତ୍ତୀ',
    'common.yes': 'ହଁ',
    'common.no': 'ନା',
    'common.ok': 'ଠିକ୍',
    
    // Language
    'language.select': 'ଭାଷା ବାଛ',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  pa: {
    // App
    'app.title': 'ਟਾਈਡਵਾਈਜ਼ 2.0',
    'app.subtitle': 'ਮੱਛੀਆਂ ਫੜਨ ਵਾਲਿਆਂ ਅਤੇ ਤਟੀ ਇਲਾਕੇ ਦੇ ਅਧਿਕਾਰੀਆਂ ਲਈ ਸਮੁੰਦਰੀ ਸੁਰੱਖਿਆ ਅਤੇ ਪੂਰਵਾਨੁਮਾਨ ਡੈਸ਼ਬੋਰਡ',
    'app.footer': 'ਤਟੀ ਸੁਰੱਖਿਆ ਲਈ ਬਣਾਇਆ ਗਿਆ • ਰੀਅਲ-ਟਾਈਮ ਮਾਨੀਟਰਿੰਗ • ਵੌਇਸ-ਸਮਰੱਥ ਚੇਤਾਵਨੀਆਂ',
    
    // Navigation
    'nav.fisherman': 'ਮੱਛੀਆਂ ਫੜਨ ਵਾਲਾ',
    'nav.authority': 'ਅਧਿਕਾਰੀ',
    'nav.login': 'ਲੌਗਇਨ',
    'nav.logout': 'ਲੌਗਆਉਟ',
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    
    // Roles
    'role.select': 'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ',
    'role.fisherman': 'ਮੱਛੀਆਂ ਫੜਨ ਵਾਲਾ',
    'role.authority': 'ਅਧਿਕਾਰੀ',
    'role.fisherman.desc': 'ਰੀਅਲ-ਟਾਈਮ ਚੇਤਾਵਨੀਆਂ, ਸੁਰੱਖਿਤ ਰਸਤੇ ਅਤੇ ਐਮਰਜੈਂਸੀ SOS ਪਹੁੰਚ',
    'role.authority.desc': 'ਕਿਸ਼ਤੀਆਂ ਦੀ ਨਿਗਰਾਨੀ, ਚੇਤਾਵਨੀ ਪ੍ਰਬੰਧਨ ਅਤੇ ਜਵਾਬ ਸਮਣਵਯ',
    
    // Features
    'feature.navigation': 'ਰੀਅਲ-ਟਾਈਮ ਨੈਵੀਗੇਸ਼ਨ',
    'feature.navigation.desc': 'ਲਾਈਵ ਮੌਸਮ ਅਤੇ ਭਰਤੀ ਅਪਡੇਟਸ',
    'feature.sos': 'ਐਮਰਜੈਂਸੀ SOS',
    'feature.sos.desc': 'ਤੁਰੰਤ ਚੇਤਾਵਨੀ ਸਿਸਟਮ',
    'feature.forecasts': 'ਸਮੁੰਦਰੀ ਪੂਰਵਾਨੁਮਾਨ',
    'feature.forecasts.desc': 'ਸਹੀ ਭਰਤੀ ਪੂਰਵਾਨੁਮਾਨ',
    
    // Login
    'login.title': 'ਲੌਗਇਨ',
    'login.email': 'ਈਮੇਲ',
    'login.password': 'ਪਾਸਵਰਡ',
    'login.role': 'ਭੂਮਿਕਾ',
    'login.submit': 'ਲੌਗਇਨ',
    'login.error': 'ਗਲਤ ਕ੍ਰੈਡੈਂਸ਼ੀਅਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    'login.loading': 'ਲੌਗਇਨ ਹੋ ਰਿਹਾ ਹੈ...',
    'login.demo': 'ਡੈਮੋ ਕ੍ਰੈਡੈਂਸ਼ੀਅਲ',
    'login.fisherman': 'ਮੱਛੀਆਂ ਫੜਨ ਵਾਲਾ: fisherman@tidewise.com / fisherman123',
    'login.authority': 'ਅਧਿਕਾਰੀ: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'ਡੈਸ਼ਬੋਰਡ ਪਹੁੰਚ',
    'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    'common.error': 'ਗਲਤੀ',
    'common.success': 'ਸਫਲਤਾ',
    'common.cancel': 'ਰੱਦ ਕਰੋ',
    'common.save': 'ਸੇਵ ਕਰੋ',
    'common.delete': 'ਮਿਟਾਓ',
    'common.edit': 'ਸੰਪਾਦਨ ਕਰੋ',
    'common.close': 'ਬੰਦ ਕਰੋ',
    'common.back': 'ਵਾਪਸ',
    'common.next': 'ਅਗਲਾ',
    'common.previous': 'ਪਿਛਲਾ',
    'common.yes': 'ਹਾਂ',
    'common.no': 'ਨਹੀਂ',
    'common.ok': 'ਠੀਕ ਹੈ',
    
    // Language
    'language.select': 'ਭਾਸ਼ਾ ਚੁਣੋ',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  },
  ur: {
    // App
    'app.title': 'ٹائیڈوائز 2.0',
    'app.subtitle': 'ماہی گیروں اور ساحلی حکام کے لیے سمندری حفاظت اور پیشن گوئی ڈیش بورڈ',
    'app.footer': 'ساحلی حفاظت کے لیے بنایا گیا • ریئل ٹائم مانیٹرنگ • آواز سے چلنے والے الرٹس',
    
    // Navigation
    'nav.fisherman': 'ماہی گیر',
    'nav.authority': 'حکام',
    'nav.login': 'لاگ ان',
    'nav.logout': 'لاگ آؤٹ',
    'nav.dashboard': 'ڈیش بورڈ',
    
    // Roles
    'role.select': 'اپنا کردار منتخب کریں',
    'role.fisherman': 'ماہی گیر',
    'role.authority': 'حکام',
    'role.fisherman.desc': 'ریئل ٹائم الرٹس، محفوظ راستے اور ایمرجنسی SOS تک رسائی',
    'role.authority.desc': 'کشتیوں کی نگرانی، الرٹس کا انتظام اور ردعمل کا ہم آہنگی',
    
    // Features
    'feature.navigation': 'ریئل ٹائم نیویگیشن',
    'feature.navigation.desc': 'لائیو موسم اور جوار کے اپڈیٹس',
    'feature.sos': 'ایمرجنسی SOS',
    'feature.sos.desc': 'فوری الرٹ سسٹم',
    'feature.forecasts': 'سمندری پیشن گوئیاں',
    'feature.forecasts.desc': 'درست جوار کی پیشن گوئیاں',
    
    // Login
    'login.title': 'لاگ ان',
    'login.email': 'ای میل',
    'login.password': 'پاس ورڈ',
    'login.role': 'کردار',
    'login.submit': 'لاگ ان',
    'login.error': 'غلط کریڈنشلز۔ برائے کرم دوبارہ کوشش کریں۔',
    'login.loading': 'لاگ ان ہو رہا ہے...',
    'login.demo': 'ڈیمو کریڈنشلز',
    'login.fisherman': 'ماہی گیر: fisherman@tidewise.com / fisherman123',
    'login.authority': 'حکام: authority@tidewise.com / authority123',
    
    // Common
    'common.access': 'ڈیش بورڈ تک رسائی',
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.error': 'خرابی',
    'common.success': 'کامیابی',
    'common.cancel': 'منسوخ',
    'common.save': 'محفوظ',
    'common.delete': 'حذف',
    'common.edit': 'ترمیم',
    'common.close': 'بند',
    'common.back': 'واپس',
    'common.next': 'اگلا',
    'common.previous': 'پچھلا',
    'common.yes': 'ہاں',
    'common.no': 'نہیں',
    'common.ok': 'ٹھیک',
    
    // Language
    'language.select': 'زبان منتخب کریں',
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.telugu': 'తెలుగు',
    'language.tamil': 'தமிழ்',
    'language.bengali': 'বাংলা',
    'language.gujarati': 'ગુજરાતી',
    'language.marathi': 'मराठी',
    'language.odia': 'ଓଡ଼ିଆ',
    'language.punjabi': 'ਪੰਜਾਬੀ',
    'language.urdu': 'اردو'
  }
};

const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te' as Language, name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta' as Language, name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'bn' as Language, name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu' as Language, name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr' as Language, name: 'Marathi', nativeName: 'मराठी' },
  { code: 'or' as Language, name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa' as Language, name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur' as Language, name: 'Urdu', nativeName: 'اردو' }
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Check for stored language preference
    const storedLanguage = localStorage.getItem('tidewise_language') as Language;
    if (storedLanguage && availableLanguages.some(lang => lang.code === storedLanguage)) {
      setLanguage(storedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('tidewise_language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    availableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
