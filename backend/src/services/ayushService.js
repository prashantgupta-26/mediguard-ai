const AyushHistory = require('../models/AyushHistory');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Standard Dashavidha Pariksha questions in patient-friendly terms (en, hi, bn)
const AYUSH_QUESTIONS = [
  {
    id: 'prakriti',
    category: 'Prakriti (Body Constitution)',
    question: {
      en: 'What is your primary body tendency or constitution?',
      hi: 'आपकी शारीरिक प्रकृति क्या है?',
      bn: 'আপনার শারীরিক প্রকৃতি কী?'
    },
    options: [
      { id: 'vata', label: { en: 'Vata (Dry skin, active, sensitive to cold)', hi: 'वात (रूखी त्वचा, फुर्तीले, ठंड संवेदनशील)', bn: 'বাত (শুষ্ক ত্বক, চটপটে, ঠান্ডায় সংবেদনশীল)' } },
      { id: 'pitta', label: { en: 'Pitta (Warm, intense, medium build)', hi: 'पित्त (गर्म महसूस होना, मध्यम शरीर, तेज पाचन)', bn: 'পিত্ত (উষ্ণ বোধ, মাঝারি গঠন, তীব্র ক্ষুধা)' } },
      { id: 'kapha', label: { en: 'Kapha (Heavy, calm, solid build, cool skin)', hi: 'कफ (शांत, मजबूत शरीर, ठंडी त्वचा)', bn: 'কফ (শান্ত, দৃঢ় গঠন, ঠান্ডা ত্বক)' } },
      { id: 'dvandvaja', label: { en: 'Combination (Dual Dosha / Mixed)', hi: 'मिश्रित प्रकृति (द्वंद्वज)', bn: 'মিশ্র প্রকৃতি' } },
      { id: 'unknown', label: { en: 'Not Sure / Not Assessed', hi: 'पता नहीं', bn: 'জানা নেই' } }
    ]
  },
  {
    id: 'vikriti',
    category: 'Vikriti (Current Imbalance)',
    question: {
      en: 'What current health discomforts or imbalances are you feeling?',
      hi: 'वर्तमान में आपको क्या शारीरिक असंतुलन या असुविधा महसूस हो रही है?',
      bn: 'বর্তমানে আপনার কী শারীরিক অস্বস্তি বোধ হচ্ছে?'
    },
    options: [
      { id: 'vata_imbalance', label: { en: 'Vata Imbalance (Gas, bloating, joint pain, dryness, anxiety)', hi: 'वात वृद्धि (गैस, जोड़ों का दर्द, रूखापन, घबराहट)', bn: 'বাত বৃদ্ধি (গ্যাস, গাঁটে ব্যথা, শুষ্কতা)' } },
      { id: 'pitta_imbalance', label: { en: 'Pitta Imbalance (Hyperacidity, skin rashes, fever, excess heat)', hi: 'पित्त वृद्धि (एसिडिटी, त्वचा पर चकत्ते, अत्यधिक गर्मी)', bn: 'পিত্ত বৃদ্ধি (অ্যাসিডিটি, র‍্যাশ, তীব্র গরম)' } },
      { id: 'kapha_imbalance', label: { en: 'Kapha Imbalance (Heaviness, mucus, lethargy, congestion)', hi: 'कफ वृद्धि (भारीपन, कफ, सुस्ती, जकड़न)', bn: 'কফ বৃদ্ধি (ভারী ভাব, কফ, অলসতা)' } },
      { id: 'none', label: { en: 'No obvious imbalance', hi: 'कोई विशेष असंतुलन नहीं', bn: 'কোনো বিশেষ সমস্যা নেই' } }
    ]
  },
  {
    id: 'sara',
    category: 'Sara (Tissue Quality)',
    question: {
      en: 'How would you describe your overall vitality, skin, and muscle tone?',
      hi: 'आपकी त्वचा, मांसपेशियों और शारीरिक सारता कैसी है?',
      bn: 'আপনার ত্বক, মাংসপেশি ও শারীরিক শক্তি কেমন?'
    },
    options: [
      { id: 'tvak_sara', label: { en: 'Excellent skin clarity and tone (Tvak Sara)', hi: 'उत्तम त्वचा कांति', bn: 'উত্তম ত্বকের ঔজ্জ্বল্য' } },
      { id: 'mamsa_sara', label: { en: 'Strong muscular firmness (Mamsa Sara)', hi: 'मजबूत मांसपेशियां', bn: 'দৃঢ় পেশি' } },
      { id: 'asthi_sara', label: { en: 'Strong bone structure (Asthi Sara)', hi: 'मजबूत हड्डियां', bn: 'দৃঢ় হাড়ের গঠন' } },
      { id: 'satmya_sara', label: { en: 'Moderate balanced tissue quality', hi: 'सामान्य संतुलित', bn: 'সাধারণ ভারসাম্যপূর্ণ' } }
    ]
  },
  {
    id: 'samhanana',
    category: 'Samhanana (Body Compactness)',
    question: {
      en: 'How compact and firm is your body frame?',
      hi: 'आपका शरीर गठन कितना संहत या सुगठित है?',
      bn: 'আপনার শরীরের গঠন কতটা সুসংহত?'
    },
    options: [
      { id: 'compact', label: { en: 'Compact and firm frame (Su-samhanana)', hi: 'सुगठित एवं सुदृढ़', bn: 'সুসংহত ও দৃঢ়' } },
      { id: 'medium', label: { en: 'Medium frame (Madhya samhanana)', hi: 'मध्यम गठन', bn: 'মাঝারি গঠন' } },
      { id: 'loose', label: { en: 'Slender or loose frame (Alpa samhanana)', hi: 'हल्का या ढीला गठन', bn: 'হালকা বা শিথিল গঠন' } }
    ]
  },
  {
    id: 'pramana',
    category: 'Pramana (Body Anthropometry)',
    question: {
      en: 'What is your body proportion compared to standard height/weight?',
      hi: 'आपकी ऊंचाई और वजन का अनुपात कैसा है?',
      bn: 'আপনার উচ্চতা ও ওজনের অনুপাত কেমন?'
    },
    options: [
      { id: 'proportionate', label: { en: 'Proportionate height and weight', hi: 'समानुपातिक', bn: 'সমানুপাতিক' } },
      { id: 'underweight', label: { en: 'Below average / Thin build', hi: 'दुबला / कम वजन', bn: 'রোগা / কম ওজন' } },
      { id: 'overweight', label: { en: 'Above average / Heavy build', hi: 'भारी / अधिक वजन', bn: 'ভারী / বেশি ওজন' } }
    ]
  },
  {
    id: 'satmya',
    category: 'Satmya (Adaptability / Tolerance)',
    question: {
      en: 'What foods or environments suit your body best?',
      hi: 'कौन सा आहार या वातावरण आपके शरीर के अनुकूल रहता है?',
      bn: 'কোন ধরণের খাবার বা আবহাওয়া আপনার শরীরে সবচেয়ে ভালো সহ্য হয়?'
    },
    options: [
      { id: 'all_habits', label: { en: 'Easily adapts to all foods and climates (Sarva-satmya)', hi: 'सभी आहार-विहार अनुकूल (सर्व सात्म्य)', bn: 'সব খাবার ও আবহাওয়া সহনশীল' } },
      { id: 'moderate', label: { en: 'Adapts to moderate balanced foods (Madhya-satmya)', hi: 'मध्यम सात्म्य', bn: 'মাঝারি সহনশীল' } },
      { id: 'restricted', label: { en: 'Sensitive / Easily disturbed by unusual food (Eka-satmya)', hi: 'संवेदनशील / एक सात्म्य', bn: 'সংবেদনশীল / এক সাথম্য' } }
    ]
  },
  {
    id: 'sattva',
    category: 'Sattva (Mental Strength)',
    question: {
      en: 'How do you handle stress, pain, or illness emotionally?',
      hi: 'आप तनाव, दर्द या बीमारी का मानसिक सामना कैसे करते हैं?',
      bn: 'আপনি মানসিক চাপ, যন্ত্রণা বা অসুস্থতা কীভাবে সহ্য করেন?'
    },
    options: [
      { id: 'pravara', label: { en: 'Strong mental endurance & calm focus (Pravara Sattva)', hi: 'प्रवर सत्व (मजबूत मानसिक बल)', bn: 'প্রবর সত্ত্ব (দৃঢ় মানসিক বল)' } },
      { id: 'madhya', label: { en: 'Moderate emotional endurance (Madhya Sattva)', hi: 'मध्यम सत्व', bn: 'মাঝারি সত্ত্ব' } },
      { id: 'avara', label: { en: 'Easily overwhelmed or anxious during illness (Avara Sattva)', hi: 'अवर सत्व (अत्यधिक चिंता संवेदनशील)', bn: 'অবর সত্ত্ব (সংবেদনশীল বা উদ্বিগ্ন)' } }
    ]
  },
  {
    id: 'aharaShakti',
    category: 'Ahara Shakti (Digestive & Assimilation Capacity)',
    question: {
      en: 'How is your appetite and digestion capacity?',
      hi: 'आपकी भूख और पाचन शक्ति (अग्नि) कैसी है?',
      bn: 'আপনার ক্ষুধা ও হজম ক্ষমতা (অগ্নি) কেমন?'
    },
    options: [
      { id: 'sama_agni', label: { en: 'Balanced digestion & regular appetite (Sama Agni)', hi: 'सम अग्नि (संतुलित पाचन)', bn: 'সম অগ্নি (ভারসাম্যপূর্ণ হজম)' } },
      { id: 'tikshna_agni', label: { en: 'Strong appetite, gets hungry quickly (Tikshna Agni)', hi: 'तीक्ष्ण अग्नि (तेज भूख)', bn: 'তীক্ষ্ণ অগ্নি (তীব্র ক্ষুধা)' } },
      { id: 'manda_agni', label: { en: 'Slow digestion, heavy feeling after meals (Manda Agni)', hi: 'मंद अग्नि (धीमा पाचन)', bn: 'মন্দ অগ্নি (ধীর হজম)' } },
      { id: 'vishama_agni', label: { en: 'Irregular / Irritable digestion (Vishama Agni)', hi: 'विषम अग्नि (अनियमित पाचन)', bn: 'বিষম অগ্নি (অনিয়মিত হজম)' } }
    ]
  },
  {
    id: 'vyayamaShakti',
    category: 'Vyayama Shakti (Physical Capacity)',
    question: {
      en: 'What is your physical endurance and capacity for exercise?',
      hi: 'आपकी व्यायाम और शारीरिक परिश्रम की क्षमता कैसी है?',
      bn: 'আপনার পরিশ্রম ও ব্যায়ামের ক্ষমতা কেমন?'
    },
    options: [
      { id: 'high', label: { en: 'High endurance (Pravara Vyayama Shakti)', hi: 'उच्च कार्यक्षमता', bn: 'উচ্চ ক্ষমতা' } },
      { id: 'moderate', label: { en: 'Moderate endurance (Madhya Vyayama Shakti)', hi: 'मध्यम क्षमता', bn: 'মাঝারি ক্ষমতা' } },
      { id: 'low', label: { en: 'Tires quickly / Low endurance (Alpa Vyayama Shakti)', hi: 'कम क्षमता / जल्दी थकान', bn: 'কম ক্ষমতা / দ্রুত ক্লান্তি' } }
    ]
  },
  {
    id: 'vaya',
    category: 'Vaya (Age Stage)',
    question: {
      en: 'Which age category best describes your current life stage?',
      hi: 'आप जीवन के किस वय (आयु) चरण में हैं?',
      bn: 'আপনি জীবনের কোন বয়সে রয়েছেন?'
    },
    options: [
      { id: 'balya', label: { en: 'Balya (Childhood / Growth stage - up to 16 yrs)', hi: 'बाल्यावस्था (16 वर्ष तक)', bn: 'বাল্যাবস্থা (১৬ বছর পর্যন্ত)' } },
      { id: 'madhyama', label: { en: 'Madhyama (Youth / Adult stage - 16 to 60 yrs)', hi: 'मध्यमावस्था (16-60 वर्ष)', bn: 'মধ্যমাবস্থা (১৬-৬০ বছর)' } },
      { id: 'vrdhha', label: { en: 'Vardhakya (Elderly stage - above 60 yrs)', hi: 'वृद्धावस्था (60 वर्ष से अधिक)', bn: 'বৃদ্ধাবস্থা (৬০ বছরের ঊর্ধ্বে)' } }
    ]
  }
];

class AyushService {
  /**
   * Get AYUSH questions list
   */
  getQuestions() {
    return AYUSH_QUESTIONS;
  }

  /**
   * Process & Save AYUSH intake for session
   */
  async saveAyushIntake({ patientId, clinicalSessionId, answers, language = 'en' }) {
    let ayushDoc = await AyushHistory.findOne({ clinicalSessionId });

    if (!ayushDoc) {
      ayushDoc = new AyushHistory({
        patientId,
        clinicalSessionId,
        rawAnswers: []
      });
    }

    // Map provided answers to Dashavidha Pariksha schema
    const rawAnswersList = Array.isArray(answers) ? answers : Object.entries(answers || {}).map(([questionId, val]) => ({ questionId, answer: val }));
    ayushDoc.rawAnswers = rawAnswersList;

    const answerMap = {};
    rawAnswersList.forEach((item) => {
      answerMap[item.questionId] = item.answer;
    });

    // Populate schema fields cleanly
    if (answerMap.prakriti) {
      const option = AYUSH_QUESTIONS[0].options.find((o) => o.id === answerMap.prakriti || o.label.en === answerMap.prakriti);
      ayushDoc.prakriti = {
        value: option ? option.label.en : String(answerMap.prakriti),
        doshaDominance: String(answerMap.prakriti),
        confidence: 'patient_reported',
        source: 'patient_reported'
      };
    }

    if (answerMap.vikriti) {
      const option = AYUSH_QUESTIONS[1].options.find((o) => o.id === answerMap.vikriti || o.label.en === answerMap.vikriti);
      ayushDoc.vikriti = {
        value: option ? option.label.en : String(answerMap.vikriti),
        source: 'patient_reported'
      };
    }

    if (answerMap.sara) {
      const option = AYUSH_QUESTIONS[2].options.find((o) => o.id === answerMap.sara);
      ayushDoc.sara = { value: option ? option.label.en : String(answerMap.sara), source: 'patient_reported' };
    }

    if (answerMap.samhanana) {
      const option = AYUSH_QUESTIONS[3].options.find((o) => o.id === answerMap.samhanana);
      ayushDoc.samhanana = { value: option ? option.label.en : String(answerMap.samhanana), source: 'patient_reported' };
    }

    if (answerMap.pramana) {
      const option = AYUSH_QUESTIONS[4].options.find((o) => o.id === answerMap.pramana);
      ayushDoc.pramana = { value: option ? option.label.en : String(answerMap.pramana), source: 'patient_reported' };
    }

    if (answerMap.satmya) {
      const option = AYUSH_QUESTIONS[5].options.find((o) => o.id === answerMap.satmya);
      ayushDoc.satmya = { value: option ? option.label.en : String(answerMap.satmya), source: 'patient_reported' };
    }

    if (answerMap.sattva) {
      const option = AYUSH_QUESTIONS[6].options.find((o) => o.id === answerMap.sattva);
      ayushDoc.sattva = { value: option ? option.label.en : String(answerMap.sattva), source: 'patient_reported' };
    }

    if (answerMap.aharaShakti) {
      const option = AYUSH_QUESTIONS[7].options.find((o) => o.id === answerMap.aharaShakti);
      ayushDoc.aharaShakti = { value: option ? option.label.en : String(answerMap.aharaShakti), source: 'patient_reported' };
    }

    if (answerMap.vyayamaShakti) {
      const option = AYUSH_QUESTIONS[8].options.find((o) => o.id === answerMap.vyayamaShakti);
      ayushDoc.vyayamaShakti = { value: option ? option.label.en : String(answerMap.vyayamaShakti), source: 'patient_reported' };
    }

    if (answerMap.vaya) {
      const option = AYUSH_QUESTIONS[9].options.find((o) => o.id === answerMap.vaya);
      ayushDoc.vaya = { value: option ? option.label.en : String(answerMap.vaya), source: 'patient_reported' };
    }

    // Lifestyle Ahara / Vihara if provided
    if (answerMap.ahara) {
      ayushDoc.ahara = typeof answerMap.ahara === 'object' ? answerMap.ahara : { dietaryHabits: String(answerMap.ahara) };
    }
    if (answerMap.vihara) {
      ayushDoc.vihara = typeof answerMap.vihara === 'object' ? answerMap.vihara : { dailyRoutine: String(answerMap.vihara) };
    }

    // Build human readable summary
    ayushDoc.summaryText = this.generateSummaryText(ayushDoc);
    await ayushDoc.save();

    return ayushDoc;
  }

  /**
   * Helper to format human-readable AYUSH section summary
   */
  generateSummaryText(ayushDoc) {
    const parts = [];
    if (ayushDoc.prakriti?.value && ayushDoc.prakriti.value !== 'Not assessed') {
      parts.push(`Prakriti: ${ayushDoc.prakriti.value}`);
    }
    if (ayushDoc.vikriti?.value && ayushDoc.vikriti.value !== 'Not assessed') {
      parts.push(`Vikriti: ${ayushDoc.vikriti.value}`);
    }
    if (ayushDoc.aharaShakti?.value && ayushDoc.aharaShakti.value !== 'Not assessed') {
      parts.push(`Ahara Shakti (Digestive Agni): ${ayushDoc.aharaShakti.value}`);
    }
    if (ayushDoc.sattva?.value && ayushDoc.sattva.value !== 'Not assessed') {
      parts.push(`Sattva (Mental Strength): ${ayushDoc.sattva.value}`);
    }
    if (ayushDoc.vyayamaShakti?.value && ayushDoc.vyayamaShakti.value !== 'Not assessed') {
      parts.push(`Vyayama Shakti (Endurance): ${ayushDoc.vyayamaShakti.value}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'AYUSH Dashavidha Pariksha: Not assessed';
  }

  /**
   * Retrieve AYUSH record for session
   */
  async getAyushBySession(clinicalSessionId) {
    return await AyushHistory.findOne({ clinicalSessionId });
  }
}

module.exports = new AyushService();
