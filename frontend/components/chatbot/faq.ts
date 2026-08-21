// Static knowledge base for the virtual assistant.
//
// IMPORTANT: This file contains 100% predefined content. There is no
// AI/LLM call, no external chatbot API, and no backend request involved.
// Matching is done with simple keyword lookups against the text below.

import type { ChatLanguage, FaqEntry } from './types'

export const CONTACT_EMAIL = 'poojaghadge77@gmail.com'
export const CONTACT_PHONE_DISPLAY = '8766804788'
export const EMERGENCY_HELPLINE_NUMBER = '112'

export const faqEntries: FaqEntry[] = [
  {
    id: 'about-pooja',
    keywordsEn: ['who is pooja', 'pooja ghadge', 'ghadge', 'therapist', 'counsellor', 'counselor', 'about pooja', 'who are you', 'who is she'],
    keywordsMr: ['पूजा', 'घाडगे', 'थेरपिस्ट', 'समुपदेशक', 'कोण आहे'],
    answerEn:
      "Miss. Pooja Sunil Ghadge is a Clinical Psychologist (M.A. Clinical Psychology) trained in cognitive-behavioral therapy, systemic therapy, and mindfulness-based approaches. She specializes in individual, child, career, marital, and relationship counselling, offering a safe, confidential, and non-judgmental space for healing and growth.",
    answerMr:
      'मिस. पूजा सुनील घाडगे या क्लिनिकल सायकॉलॉजिस्ट (एम.ए. क्लिनिकल सायकॉलॉजी) असून त्यांना कॉग्निटिव्ह-बिहेवियरल थेरपी, सिस्टेमिक थेरपी आणि माइंडफुलनेस-आधारित पद्धतींचे प्रशिक्षण आहे. त्या वैयक्तिक, बाल, करिअर, वैवाहिक आणि नातेसंबंध समुपदेशनात तज्ज्ञ असून सुरक्षित, गोपनीय आणि निर्णयविरहित वातावरण देतात.',
    action: { labelEn: 'Learn More About Her', labelMr: 'अधिक जाणून घ्या', href: '/about' },
  },
  {
    id: 'qualifications',
    keywordsEn: ['qualification', 'qualifications', 'degree', 'education', 'credential', 'experience'],
    keywordsMr: ['पात्रता', 'शिक्षण', 'पदवी', 'अनुभव'],
    answerEn:
      'Her qualifications include an M.A. in Clinical Psychology, a B.A. in Psychology, a Certification in Cognitive Behavioral Therapy, and Advanced Training in Family Therapy — combining academic depth with specialized clinical skills.',
    answerMr:
      'तिच्या पात्रतांमध्ये एम.ए. क्लिनिकल सायकॉलॉजी, बी.ए. सायकॉलॉजी, कॉग्निटिव्ह बिहेवियरल थेरपीचे प्रमाणपत्र आणि फॅमिली थेरपीचे प्रगत प्रशिक्षण यांचा समावेश आहे.',
    action: { labelEn: 'View Full Background', labelMr: 'संपूर्ण माहिती पहा', href: '/about' },
  },
  {
    id: 'about-brand',
    keywordsEn: ['art of saving mind', 'about the website', 'about this site', 'what is this website'],
    keywordsMr: ['आर्ट ऑफ सेव्हिंग माइंड', 'वेबसाइट बद्दल', 'ही वेबसाइट काय आहे'],
    answerEn:
      "Art of Saving Mind is Miss. Pooja Sunil Ghadge's counselling practice, offering compassionate, confidential therapy — both online and in-person — to help individuals, couples, and families navigate life's challenges and grow.",
    answerMr:
      'आर्ट ऑफ सेव्हिंग माइंड ही मिस. पूजा सुनील घाडगे यांची समुपदेशन प्रॅक्टिस आहे, जी व्यक्ती, जोडपी आणि कुटुंबांना जीवनातील आव्हानांना सामोरे जाण्यासाठी ऑनलाइन व प्रत्यक्ष, दयाळू आणि गोपनीय थेरपी पुरवते.',
  },
  {
    id: 'service-counselling',
    keywordsEn: ['counselling & therapy', 'counselling and therapy', 'therapy', 'counselling', 'counseling'],
    keywordsMr: ['समुपदेशन आणि थेरपी', 'समुपदेशन', 'थेरपी'],
    answerEn:
      'Counselling & Therapy sessions offer a safe, confidential space to work through emotional challenges, resolve inner conflicts, and support personal growth using evidence-based approaches.',
    answerMr:
      'समुपदेशन आणि थेरपी सत्रे भावनिक आव्हानांवर काम करण्यासाठी, अंतर्गत संघर्ष सोडवण्यासाठी आणि वैयक्तिक वाढीसाठी सुरक्षित, गोपनीय व पुराव्यावर आधारित दृष्टिकोन देतात.',
    action: { labelEn: 'View Services', labelMr: 'सेवा पहा', href: '/services' },
  },
  {
    id: 'service-child',
    keywordsEn: ['child counselling', 'children', 'kids counselling', 'child therapy'],
    keywordsMr: ['बाल समुपदेशन', 'मुलांचे समुपदेशन', 'मुलं'],
    answerEn:
      'Child Counselling supports children facing anxiety, behavioral challenges, or emotional difficulties, using age-appropriate techniques to build confidence, resilience, and healthy coping skills.',
    answerMr:
      'बाल समुपदेशनामध्ये चिंता, वर्तणूक समस्या किंवा भावनिक अडचणी असलेल्या मुलांना वयानुरूप तंत्रांद्वारे आत्मविश्वास, लवचिकता आणि निरोगी सामना करण्याची कौशल्ये विकसित करण्यास मदत केली जाते.',
    action: { labelEn: 'View Services', labelMr: 'सेवा पहा', href: '/services' },
  },
  {
    id: 'service-career',
    keywordsEn: ['career guidance', 'career counselling', 'career', 'job', 'profession'],
    keywordsMr: ['करिअर मार्गदर्शन', 'करिअर', 'नोकरी', 'व्यवसाय'],
    answerEn:
      'Career Guidance helps you explore career options, navigate professional transitions, and overcome workplace challenges with clarity — aligning your career with your values and strengths.',
    answerMr:
      'करिअर मार्गदर्शनामुळे तुम्हाला करिअरचे पर्याय शोधण्यास, व्यावसायिक स्थित्यंतरांना सामोरे जाण्यास आणि कामाच्या ठिकाणच्या आव्हानांवर स्पष्टतेने मात करण्यास मदत होते.',
    action: { labelEn: 'View Services', labelMr: 'सेवा पहा', href: '/services' },
  },
  {
    id: 'service-marital',
    keywordsEn: ['marital counselling', 'marriage counselling', 'marriage', 'spouse'],
    keywordsMr: ['वैवाहिक समुपदेशन', 'लग्न', 'जोडीदार'],
    answerEn:
      'Marital Counselling helps couples improve communication, resolve recurring conflicts, and rebuild trust — strengthening their bond and creating a healthier, more fulfilling marriage.',
    answerMr:
      'वैवाहिक समुपदेशनामुळे जोडप्यांना संवाद सुधारण्यास, वारंवार होणारे मतभेद सोडवण्यास आणि विश्वास पुन्हा निर्माण करण्यास मदत होते, ज्यामुळे नाते अधिक दृढ व समाधानी बनते.',
    action: { labelEn: 'View Services', labelMr: 'सेवा पहा', href: '/services' },
  },
  {
    id: 'service-relationship',
    keywordsEn: ['relationship counselling', 'relationship', 'partner', 'dating'],
    keywordsMr: ['नातेसंबंध समुपदेशन', 'नातेसंबंध', 'नाते'],
    answerEn:
      'Relationship Counselling helps individuals and couples improve communication, set healthy boundaries, and deepen emotional connection — building stronger, healthier relationships.',
    answerMr:
      'नातेसंबंध समुपदेशन व्यक्ती आणि जोडप्यांना संवाद सुधारण्यास, निरोगी सीमा निश्चित करण्यास आणि भावनिक जवळीक वाढवण्यास मदत करते.',
    action: { labelEn: 'View Services', labelMr: 'सेवा पहा', href: '/services' },
  },
  {
    id: 'booking',
    keywordsEn: ['book', 'appointment', 'booking', 'schedule', 'book a session', 'book appointment'],
    keywordsMr: ['अपॉइंटमेंट', 'बुकिंग', 'सत्र बुक', 'अपॉईंटमेंट'],
    answerEn:
      'You can book an appointment through our Appointment Booking page — choose a service and pick a convenient time slot. You can also reach out via the Contact page and the team will help you schedule a session.',
    answerMr:
      'तुम्ही आमच्या अपॉइंटमेंट बुकिंग पृष्ठावरून सेवा निवडून आणि सोयीची वेळ निवडून अपॉइंटमेंट बुक करू शकता. तुम्ही संपर्क पृष्ठाद्वारेही संपर्क साधू शकता आणि टीम तुम्हाला सत्र नियोजित करण्यात मदत करेल.',
    action: { labelEn: 'Book Appointment', labelMr: 'अपॉइंटमेंट बुक करा', href: '/appointment-booking' },
  },
  {
    id: 'contact',
    keywordsEn: ['contact', 'phone', 'email', 'reach', 'call'],
    keywordsMr: ['संपर्क', 'फोन', 'ईमेल', 'व्हॉट्सअॅप'],
    answerEn: `You can reach Miss. Pooja Sunil Ghadge at ${CONTACT_EMAIL} or ${CONTACT_PHONE_DISPLAY}. Please use the contact details above.`,
    answerMr: `तुम्ही मिस. पूजा सुनील घाडगे यांच्याशी ${CONTACT_EMAIL} या ईमेलवर किंवा ${CONTACT_PHONE_DISPLAY} या फोन क्रमांकावर संपर्क साधू शकता.`,
    action: { labelEn: 'Go to Contact Page', labelMr: 'संपर्क पृष्ठ उघडा', href: '/contact' },
  },
  {
    id: 'location-hours',
    keywordsEn: ['location', 'address', 'working hours', 'timing', 'office hours', 'where are you'],
    keywordsMr: ['पत्ता', 'ठिकाण', 'कामाचे तास', 'वेळ'],
    answerEn:
      'Sessions are available both online and in-person, based on availability. For exact scheduling and location details, please check the Appointment Booking page or reach out through Contact.',
    answerMr:
      'सत्रे ऑनलाइन आणि प्रत्यक्ष अशा दोन्ही प्रकारे, उपलब्धतेनुसार घेतली जातात. अचूक वेळ आणि ठिकाणाच्या माहितीसाठी कृपया अपॉइंटमेंट बुकिंग पृष्ठ पहा किंवा संपर्क साधा.',
    action: { labelEn: 'Go to Contact Page', labelMr: 'संपर्क पृष्ठ उघडा', href: '/contact' },
  },
  {
    id: 'resources',
    keywordsEn: ['resources', 'articles', 'blog', 'materials', 'self help', 'reading'],
    keywordsMr: ['संसाधने', 'लेख', 'साहित्य'],
    answerEn:
      'Our Resources section offers helpful articles and materials on mental wellness, coping strategies, and self-care to support your journey between sessions.',
    answerMr:
      'आमच्या संसाधने विभागात मानसिक आरोग्य, सामना करण्याच्या रणनीती आणि आत्म-काळजी याबद्दल उपयुक्त लेख व साहित्य उपलब्ध आहे.',
    action: { labelEn: 'Explore Resources', labelMr: 'संसाधने पहा', href: '/resources' },
  },
  {
    id: 'emergency',
    keywordsEn: ['emergency', 'urgent help', 'crisis', 'danger', 'emergency help'],
    keywordsMr: ['आपत्कालीन', 'तातडीची मदत', 'संकट', 'धोका'],
    answerEn: `If you are in immediate danger, please contact the National Emergency Helpline at ${EMERGENCY_HELPLINE_NUMBER} right away. For confidential counselling support, please reach out through the Contact page or contact the helpline options listed on the site.`,
    answerMr: `जर तुम्ही तातडीच्या धोक्यात असाल, तर कृपया लगेच राष्ट्रीय आपत्कालीन हेल्पलाइन ${EMERGENCY_HELPLINE_NUMBER} वर संपर्क साधा. गोपनीय समुपदेशन मदतीसाठी कृपया संपर्क पृष्ठावर दिलेल्या माहितीमधून किंवा साइटवरील हेल्पलाइन पर्यायांमधून संपर्क साधा.`,
    action: { labelEn: 'Go to Contact Page', labelMr: 'संपर्क पृष्ठ उघडा', href: '/contact' },
    isEmergency: true,
  },
]

/** Words that should immediately surface the priority crisis-support card. */
export const crisisKeywordsEn = [
  'suicide',
  'suicidal',
  'self harm',
  'self-harm',
  'depression',
  'hopeless',
  'emergency',
  'kill myself',
  'end my life',
  "can't go on",
  'want to die',
]

export const crisisKeywordsMr = ['आत्महत्या', 'आत्महत्येचे विचार', 'नैराश्य', 'संकट', 'मदत']

function normalize(input: string): string {
  return input.toLowerCase().trim()
}

/** Checks user input against both language crisis-keyword lists, regardless of active UI language. */
export function detectCrisis(input: string): boolean {
  const normalized = normalize(input)
  const enHit = crisisKeywordsEn.some((word) => normalized.includes(word))
  const mrHit = crisisKeywordsMr.some((word) => input.includes(word))
  return enHit || mrHit
}

/**
 * Finds the best-matching FAQ entry for the given input using simple
 * keyword scoring (number of matched keywords) — no AI involved.
 */
export function matchFaq(input: string, lang: ChatLanguage): FaqEntry | undefined {
  const normalized = normalize(input)
  let best: { entry: FaqEntry; score: number } | undefined

  for (const entry of faqEntries) {
    const keywords = lang === 'mr' ? entry.keywordsMr : entry.keywordsEn
    const score = keywords.reduce((count, keyword) => {
      const haystack = lang === 'mr' ? input : normalized
      const needle = lang === 'mr' ? keyword : keyword.toLowerCase()
      return haystack.includes(needle) ? count + 1 : count
    }, 0)

    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }

  return best?.entry
}

export function getFaqById(id: string): FaqEntry | undefined {
  return faqEntries.find((entry) => entry.id === id)
}
