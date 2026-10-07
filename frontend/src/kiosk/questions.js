// Deterministic Clinical History Questions for Kiosk Intake
// Supports English, Hindi, Bengali translations for questions & choices

export const KIOSK_QUESTIONS = [
  // SECTION 1: CHIEF COMPLAINT
  {
    id: 'chief_complaint_primary',
    section: 'chief_complaint',
    type: 'single_choice',
    icon: 'medical_services',
    text: {
      en: 'What brings you to the hospital today?',
      hi: 'आज आप अस्पताल क्यों आए हैं?',
      bn: 'আজ আপনি কেন হাসপাতালে এসেছেন?'
    },
    subtitle: {
      en: 'Select the main problem you are experiencing',
      hi: 'अपनी मुख्य समस्या चुनें',
      bn: 'আপনার প্রধান সমস্যা নির্বাচন করুন'
    },
    options: [
      { id: 'pain', label: { en: 'Pain / Ache', hi: 'दर्द / पीड़ा', bn: 'ব্যথা / বেদনা' }, icon: 'sentiment_extremely_dissatisfied' },
      { id: 'fever', label: { en: 'Fever / Chills', hi: 'बुखार / सर्दी', bn: 'জ্বর / ঠাণ্ডা' }, icon: 'thermostat' },
      { id: 'cough', label: { en: 'Cough / Cold', hi: 'खांसी / जुकाम', bn: 'কাশি / সর্দি' }, icon: 'air' },
      { id: 'breathing', label: { en: 'Breathing Problem', hi: 'सांस लेने में तकलीफ', bn: 'শ্বাসকষ্ট' }, icon: 'lungs' },
      { id: 'weakness', label: { en: 'Weakness / Fatigue', hi: 'कमजोरी / थकान', bn: 'দুর্বলতা / ক্লান্তি' }, icon: 'battery_alert' },
      { id: 'vomiting', label: { en: 'Nausea / Vomiting', hi: 'उल्टी / जी मिचलाना', bn: 'বমি / বমি ভাব' }, icon: 'sick' },
      { id: 'injury', label: { en: 'Injury / Wound', hi: 'चोट / घाव', bn: 'আঘাত / ক্ষত' }, icon: 'healing' },
      { id: 'other', label: { en: 'Other Symptom', hi: 'अन्य समस्या', bn: 'অন্যান্য উপসর্গ' }, icon: 'more_horiz' }
    ]
  },

  // SECTION 2: HISTORY OF PRESENT ILLNESS (HPI)
  {
    id: 'hpi_duration',
    section: 'hpi',
    type: 'duration_picker',
    icon: 'schedule',
    text: {
      en: 'How long have you had this problem?',
      hi: 'यह समस्या कितने समय से है?',
      bn: 'এই সমস্যাটি কতদিন ধরে আছে?'
    },
    subtitle: {
      en: 'Choose days, weeks, months, or years',
      hi: 'दिन, सप्ताह, महीने या वर्ष चुनें',
      bn: 'দিন, সপ্তাহ, মাস বা বছর নির্বাচন করুন'
    }
  },
  {
    id: 'hpi_severity',
    section: 'hpi',
    type: 'severity_scale',
    icon: 'speed',
    text: {
      en: 'How severe is your discomfort?',
      hi: 'आपकी तकलीफ कितनी तेज है?',
      bn: 'আপনার শারীরিক কষ্ট কতটা তীব্র?'
    },
    subtitle: {
      en: 'Rate from 1 (Mild) to 10 (Severe)',
      hi: '1 (हल्का) से 10 (बहुत तेज) तक चुनें',
      bn: '১ (মৃদু) থেকে ১০ (খুব তীব্র) বেছে নিন'
    }
  },
  {
    id: 'hpi_body_location',
    section: 'hpi',
    type: 'body_location',
    icon: 'accessibility_new',
    text: {
      en: 'Where in your body do you feel the problem?',
      hi: 'शरीर के किस हिस्से में तकलीफ है?',
      bn: 'শরীরের কোন অংশে সমস্যা অনুভব করছেন?'
    },
    options: [
      { id: 'head_neck', label: { en: 'Head / Neck', hi: 'सिर / गर्दन', bn: 'মাথা / ঘাড়' } },
      { id: 'chest', label: { en: 'Chest', hi: 'छाती', bn: 'বুক' } },
      { id: 'stomach', label: { en: 'Stomach / Abdomen', hi: 'पेट', bn: 'পেট' } },
      { id: 'back', label: { en: 'Back', hi: 'पीठ / कमर', bn: 'পিঠ / কোমর' } },
      { id: 'limbs', label: { en: 'Arms / Legs / Joints', hi: 'हाथ / पैर / जोड़', bn: 'হাত / পা / জয়েন্ট' } },
      { id: 'whole_body', label: { en: 'Whole Body', hi: 'पूरा शरीर', bn: 'সম্পূর্ণ শরীর' } }
    ]
  },

  // SECTION 3: PAST MEDICAL HISTORY
  {
    id: 'past_medical_conditions',
    section: 'past_medical',
    type: 'multiple_choice',
    icon: 'clinical_notes',
    text: {
      en: 'Do you have any of these existing health conditions?',
      hi: 'क्या आपको इनमें से कोई पुरानी बीमारी है?',
      bn: 'আপনার কি আগে থেকে এই রোগগুলির কোনোটি আছে?'
    },
    options: [
      { id: 'diabetes', label: { en: 'Diabetes (Sugar)', hi: 'डायबिटीज (शुगर)', bn: 'ডায়াবেটিস (সুগার)' }, icon: 'bloodtype' },
      { id: 'hypertension', label: { en: 'High Blood Pressure', hi: 'हाई ब्लड प्रेशर (बीपी)', bn: 'উচ্চ রক্তচাপ (বিপি)' }, icon: 'favorite' },
      { id: 'asthma', label: { en: 'Asthma / Breathing issue', hi: 'अस्थमा / दमा', bn: 'অ্যাজমা / হাঁপানি' }, icon: 'air' },
      { id: 'heart_disease', label: { en: 'Heart Disease', hi: 'दिल की बीमारी', bn: 'হৃদরোগ' }, icon: 'ecg_heart' },
      { id: 'thyroid', label: { en: 'Thyroid Problem', hi: 'थायराइड', bn: 'থাইরয়েড' }, icon: 'vital_signs' },
      { id: 'none', label: { en: 'None of the above', hi: 'इनमें से कोई नहीं', bn: 'উপরের কোনটিই নয়' }, icon: 'check_circle' }
    ]
  },

  // SECTION 4: PAST SURGICAL HISTORY
  {
    id: 'past_surgeries',
    section: 'past_surgical',
    type: 'yes_no_with_text',
    icon: 'medical_services',
    text: {
      en: 'Have you had any surgeries or hospital operations in the past?',
      hi: 'क्या आपकी पहले कोई सर्जरी या ऑपरेशन हुआ है?',
      bn: 'আপনার কি অতীতে কোনো সার্জারি বা অপারেশন হয়েছে?'
    },
    placeholder: {
      en: 'If yes, write surgical details (e.g. Appendectomy 2021)',
      hi: 'यदि हाँ, तो ऑपरेशन का नाम लिखें (जैसे 2021 में पथरी ऑपरेशन)',
      bn: 'হ্যাঁ হলে বিস্তারিত লিখুন (যেমন ২০২১ সালে অপারেশন)'
    }
  },

  // SECTION 5: CURRENT MEDICATIONS
  {
    id: 'current_medications_check',
    section: 'current_meds',
    type: 'yes_no_with_text',
    icon: 'medication',
    text: {
      en: 'Are you currently taking any daily medicines?',
      hi: 'क्या आप अभी कोई दैनिक दवाइयां ले रहे हैं?',
      bn: 'আপনি কি বর্তমানে কোনো দৈনন্দিন ওষুধ খাচ্ছেন?'
    },
    placeholder: {
      en: 'Write medicine names (e.g. Paracetamol, Metformin)',
      hi: 'दवाइयों के नाम लिखें (जैसे पैरासिटामोल, मेटफॉर्मिन)',
      bn: 'ওষুধের নাম লিখুন (যেমন প্যারাসিটামল, মেটফর্মিন)'
    }
  },

  // SECTION 6: DRUG ALLERGIES
  {
    id: 'drug_allergies_check',
    section: 'drug_allergies',
    type: 'yes_no_with_text',
    icon: 'warning',
    text: {
      en: 'Do you have any allergies to medicines or foods?',
      hi: 'क्या आपको किसी दवा या भोजन से एलर्जी है?',
      bn: 'আপনার কি কোনো ওষুধ বা খাবারে অ্যালার্জি আছে?'
    },
    placeholder: {
      en: 'Write allergy details (e.g. Penicillin, Peanuts)',
      hi: 'एलर्जी का विवरण लिखें (जैसे पेनिसिलिन, मूंगफली)',
      bn: 'অ্যালার্জির বিস্তারিত লিখুন (যেমন পেনিসিলিন, পিনাট)'
    }
  },

  // SECTION 7: FAMILY HISTORY
  {
    id: 'family_history_check',
    section: 'family_history',
    type: 'multiple_choice',
    icon: 'family_restroom',
    text: {
      en: 'Does anyone in your family have a history of major illness?',
      hi: 'क्या आपके परिवार में किसी को बड़ी बीमारी का इतिहास है?',
      bn: 'আপনার পরিবারে কারোর কি কোনো প্রধান রোগের ইতিহাস আছে?'
    },
    options: [
      { id: 'family_diabetes', label: { en: 'Family Diabetes', hi: 'परिवार में शुगर', bn: 'পরিবারে ডায়াবেটিস' }, icon: 'bloodtype' },
      { id: 'family_bp', label: { en: 'Family High BP', hi: 'परिवार में हाई बीपी', bn: 'পরিবারে উচ্চ রক্তচাপ' }, icon: 'favorite' },
      { id: 'family_heart', label: { en: 'Family Heart Disease', hi: 'परिवार में दिल की बीमारी', bn: 'পরিবারে হৃদরোগ' }, icon: 'ecg_heart' },
      { id: 'family_cancer', label: { en: 'Family Cancer', hi: 'परिवार में कैंसर', bn: 'পরিবারে ক্যান্সার' }, icon: 'health_metrics' },
      { id: 'family_none', label: { en: 'No Family History', hi: 'कोई पारिवारिक बीमारी नहीं', bn: 'কোনো পারিবারিক ইতিহাস নেই' }, icon: 'check_circle' }
    ]
  },

  // SECTION 8: PERSONAL & LIFESTYLE HISTORY
  {
    id: 'personal_diet',
    section: 'personal_history',
    type: 'single_choice',
    icon: 'restaurant',
    text: {
      en: 'What type of diet do you follow?',
      hi: 'आपका मुख्य भोजन क्या है?',
      bn: 'আপনার প্রধান খাদ্য কী ধরনের?'
    },
    options: [
      { id: 'veg', label: { en: 'Vegetarian', hi: 'शाकाहारी', bn: 'নিরামিষ' }, icon: 'eco' },
      { id: 'non_veg', label: { en: 'Non-Vegetarian', hi: 'मांसाहारी', bn: 'আমিষ' }, icon: 'set_meal' },
      { id: 'eggetarian', label: { en: 'Eggetarian', hi: 'अंडााहारी', bn: 'ডিম সহ' }, icon: 'egg' }
    ]
  },
  {
    id: 'personal_sleep',
    section: 'personal_history',
    type: 'single_choice',
    icon: 'bedtime',
    text: {
      en: 'How many hours of sleep do you get per night?',
      hi: 'आप रात में कितने घंटे सोते हैं?',
      bn: 'আপনি রাতে কত ঘণ্টা ঘুমান?'
    },
    options: [
      { id: 'less_5', label: { en: 'Less than 5 hours', hi: '5 घंटे से कम', bn: '৫ ঘণ্টার কম' }, icon: 'bedtime_off' },
      { id: '6_8', label: { en: '6 - 8 hours (Normal)', hi: '6 - 8 घंटे (सामान्य)', bn: '৬ - ৮ ঘণ্টা (স্বাভাবিক)' }, icon: 'bedtime' },
      { id: 'more_8', label: { en: 'More than 8 hours', hi: '8 घंटे से अधिक', bn: '৮ ঘণ্টার বেশি' }, icon: 'hotel' }
    ]
  },

  // SECTION 9: REVIEW OF SYSTEMS (ROS)
  {
    id: 'ros_symptoms',
    section: 'ros',
    type: 'multiple_choice',
    icon: 'checklist',
    text: {
      en: 'Are you currently experiencing any of these other symptoms?',
      hi: 'क्या आपको अभी इनमें से कोई अन्य लक्षण महसूस हो रहा है?',
      bn: 'আপনি কি বর্তমানে নিচের কোনো উপসর্গে ভুগছেন?'
    },
    options: [
      { id: 'ros_fever', label: { en: 'Fever or Chills', hi: 'बुखार या ठंड लगना', bn: 'জ্বর বা ঠাণ্ডা লাগা' }, icon: 'thermostat' },
      { id: 'ros_fatigue', label: { en: 'Extreme Fatigue', hi: 'अत्यधिक थकान', bn: 'অতিরিক্ত ক্লান্তি' }, icon: 'battery_0_bar' },
      { id: 'ros_breathless', label: { en: 'Shortness of Breath', hi: 'सांस फूलना', bn: 'হাঁপানো / শ্বাসকষ্ট' }, icon: 'lungs' },
      { id: 'ros_dizziness', label: { en: 'Dizziness or Fainting', hi: 'चक्कर आना या बेहोशी', bn: 'মাথা ঘোরা বা জ্ঞান হারানো' }, icon: 'sync' },
      { id: 'ros_nausea', label: { en: 'Nausea or Stomach Upset', hi: 'जी मिचलाना या पेट खराब', bn: 'বমি ভাব বা পেট খারাপ' }, icon: 'sick' },
      { id: 'ros_joint_pain', label: { en: 'Joint Pain or Stiffness', hi: 'जोड़ों में दर्द या अकड़न', bn: 'জয়েন্টে ব্যথা বা অনমনীয়তা' }, icon: 'front_hand' },
      { id: 'ros_skin_rash', label: { en: 'Skin Rash or Itching', hi: 'त्वचा पर चकत्ते या खुजली', bn: 'চামড়ায় ফুসকুড়ি বা চুলকানি' }, icon: 'dermatology' },
      { id: 'ros_none', label: { en: 'None of these', hi: 'इनमें से कोई नहीं', bn: 'এর কোনটিই নয়' }, icon: 'check_circle' }
    ]
  }
];
