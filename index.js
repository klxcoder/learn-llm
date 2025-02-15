// Train frequency models for unigrams, bigrams, and trigrams.
function trainModels(text) {
  const words = text.split(/\s+/);
  const unigrams = {};
  const bigrams = {};
  const trigrams = {};

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    unigrams[word] = (unigrams[word] || 0) + 1;

    if (i < words.length - 1) {
      const next = words[i + 1];
      if (!bigrams[word]) bigrams[word] = {};
      bigrams[word][next] = (bigrams[word][next] || 0) + 1;
    }

    if (i < words.length - 2) {
      const key = words[i] + " " + words[i + 1];
      const next = words[i + 2];
      if (!trigrams[key]) trigrams[key] = {};
      trigrams[key][next] = (trigrams[key][next] || 0) + 1;
    }
  }
  return { unigrams, bigrams, trigrams };
}

// Weighted random choice with temperature and optional topK filtering.
function weightedRandomChoice(freqMap, temperature = 1, topK = null) {
  let entries = Object.entries(freqMap);
  // Optional topK filtering: only consider the topK most frequent words.
  if (topK && topK < entries.length) {
    entries.sort((a, b) => b[1] - a[1]);
    entries = entries.slice(0, topK);
  }
  // Adjust frequencies by temperature: lower temperature sharpens distribution.
  let total = 0;
  const adjusted = entries.map(([word, count]) => {
    const adj = Math.pow(count, 1 / temperature); // equivalent to count^(1/T)
    total += adj;
    return [word, adj];
  });
  let rand = Math.random() * total;
  for (const [word, value] of adjusted) {
    rand -= value;
    if (rand < 0) return word;
  }
  return null;
}

// Generate text using backoff: trigram -> bigram -> unigram.
function generateText(models, startWords, numWords = 50, options = {}) {
  const { temperature = 1, topK = null } = options;
  const words = startWords.split(" ");

  while (words.length < numWords) {
    let nextWord = null;

    if (words.length >= 2) {
      const key = words.slice(-2).join(" ");
      if (models.trigrams[key]) {
        nextWord = weightedRandomChoice(models.trigrams[key], temperature, topK);
      }
    }
    if (!nextWord && words.length >= 1) {
      const lastWord = words[words.length - 1];
      if (models.bigrams[lastWord]) {
        nextWord = weightedRandomChoice(models.bigrams[lastWord], temperature, topK);
      }
    }
    if (!nextWord) {
      nextWord = weightedRandomChoice(models.unigrams, temperature, topK);
    }

    words.push(nextWord);
  }
  return words.join(" ");
}

// Example training text.
const trainingText = "The dog likes eating food. The dog likes eating fish. The cat likes eating food. The cat likes eating fish. The dog is friendly and playful. The cat is graceful and curious. The fish is swimming in clear water. The fish is colorful and lively. The food is delicious and nutritious. The food is served with care. The fish like to swim together in a school. The fish like to explore their surroundings.";

const models = trainModels(trainingText);
const generatedText = generateText(models, "The dog", 30, { temperature: 0.8, topK: 3 });
console.log(generatedText);

/*
In this version, the sampling is controlled by:
  + Temperature: Lower values (<1) make the model pick higher‑frequency words more deterministically.
  + topK: Limits choices to the top‑k candidates, reducing noise.

This adds a bit more sophistication while still keeping the overall algorithm understandable.
*/