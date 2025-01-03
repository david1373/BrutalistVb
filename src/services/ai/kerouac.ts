// Kerouac-style writing patterns and phrases
const KEROUAC_PATTERNS = {
  intros: [
    "Dig this wild scene, man - ",
    "And I'm telling you straight, like a midnight jazz riff - ",
    "Now dig the crazy rhythm of this - ",
    "Listen up, cats and kittens - ",
  ],
  transitions: [
    "and yeah baby, ",
    "and man oh man, ",
    "like some wild bebop solo, ",
    "just like the road stretching endless, ",
  ],
  closings: [
    "and that's the real gone truth of it all.",
    "and ain't that just the sweetest melody you ever heard?",
    "and that's how it goes, rolling like a cosmic wheel.",
    "and that's the beat, straight from the street.",
  ]
};

function getRandomPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function rewriteInKerouacStyle(content: string): string {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((para, i) => {
    if (i === 0) {
      return getRandomPhrase(KEROUAC_PATTERNS.intros) + para;
    }
    
    if (i === paragraphs.length - 1) {
      return getRandomPhrase(KEROUAC_PATTERNS.transitions) + para + " " + 
             getRandomPhrase(KEROUAC_PATTERNS.closings);
    }
    
    return getRandomPhrase(KEROUAC_PATTERNS.transitions) + para;
  }).join('\n\n');
}