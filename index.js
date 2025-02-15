// Train models: unigrams, bigrams, and trigrams
function trainModels(text) {
  const words = text.split(/\s+/);
  const unigrams = {}, bigrams = {}, trigrams = {};

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    unigrams[word] = (unigrams[word] || 0) + 1;

    if (i < words.length - 1) {
      const next = words[i + 1];
      bigrams[word] = bigrams[word] || {};
      bigrams[word][next] = (bigrams[word][next] || 0) + 1;
    }

    if (i < words.length - 2) {
      const key = words[i] + " " + words[i + 1];
      const next = words[i + 2];
      trigrams[key] = trigrams[key] || {};
      trigrams[key][next] = (trigrams[key][next] || 0) + 1;
    }
  }

  return { unigrams, bigrams, trigrams };
}

// Choose a word based on weighted frequencies
function weightedRandomChoice(freqMap) {
  let total = 0;
  for (let word in freqMap) total += freqMap[word];
  let rand = Math.random() * total;
  for (let word in freqMap) {
    rand -= freqMap[word];
    if (rand < 0) return word;
  }
  return null;
}

// Generate text with backoff: trigram > bigram > unigram
function generateText(models, startWords, numWords = 50) {
  const result = startWords.split(" ");
  while (result.length < numWords) {
    let nextWord = null;

    if (result.length >= 2) {
      const key = result.slice(-2).join(" ");
      if (models.trigrams[key]) {
        nextWord = weightedRandomChoice(models.trigrams[key]);
      }
    }

    if (!nextWord && result.length >= 1) {
      const lastWord = result[result.length - 1];
      if (models.bigrams[lastWord]) {
        nextWord = weightedRandomChoice(models.bigrams[lastWord]);
      }
    }

    if (!nextWord) {
      nextWord = weightedRandomChoice(models.unigrams);
    }

    result.push(nextWord);
  }
  return result.join(" ");
}

// Example training text with varied phrases
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";

const models = trainModels(trainingText);

console.log(models)

const generatedText = generateText(models, "The dog", 30);
console.log(generatedText);
