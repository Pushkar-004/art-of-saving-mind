import { quickActionsEn } from './en'

export const mr = {
  assistantName: 'Art of Saving Mind सहाय्यक',
  headerSubtitle: 'मी मदतीसाठी येथे आहे',
  welcome:
    '👋 नमस्कार!\n\nArt of Saving Mind मध्ये आपले स्वागत आहे.\n\nमी तुमची आभासी सहाय्यक आहे.\n\nमी तुम्हाला समुपदेशन सेवा, अपॉइंटमेंट, संपर्क माहिती, संसाधने आणि वारंवार विचारले जाणारे प्रश्न याबाबत मदत करू शकते.\n\nमी तुम्हाला कशी मदत करू शकते?',
  quickActionsLabel: 'त्वरित पर्याय',
  inputPlaceholder: 'तुमचा संदेश टाइप करा…',
  send: 'पाठवा',
  openChat: 'आमच्याशी बोला',
  closeChat: 'चॅट बंद करा',
  typing: 'टाइप करत आहे…',
  fallback:
    'क्षमस्व, माझ्याकडे या प्रश्नाचे उत्तर उपलब्ध नाही.\n\nकृपया संपर्क पृष्ठाला भेट द्या किंवा Miss. Pooja Sunil Ghadge यांच्याशी थेट संपर्क साधा. त्या तुम्हाला वैयक्तिकरित्या मदत करण्यास आनंदी असतील.',
  fallbackButton: 'संपर्क पृष्ठ उघडा',
  crisisTitle: 'तुम्ही एकटे नाही आहात',
  crisisBody: 'सध्या परिस्थिती खूप कठीण वाटत असेल. जर तुम्ही तातडीच्या धोक्यात असाल, तर कृपया लगेच मदत घ्या.',
  crisisHelplineLabel: 'राष्ट्रीय आपत्कालीन हेल्पलाइन',
  crisisContactButton: 'पूजा मॅडमशी संपर्क साधा',
  crisisDisclaimer: 'हा सहाय्यक वैद्यकीय सल्ला देऊ शकत नाही — कृपया एखाद्या तज्ज्ञाशी किंवा विश्वासू व्यक्तीशी संपर्क साधा.',
  footerDisclaimer: 'स्थिर सहाय्यक · केवळ सामान्य माहितीसाठी',
} as const

// Reuses the same FAQ ids as the English quick actions — only the
// display label differs per language.
export const quickActionsMr = quickActionsEn
